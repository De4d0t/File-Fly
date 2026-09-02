import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { getDeviceConfig, getPrimaryLocalIP, getDeviceOS } from './networkUtils.js';
import { PeerDiscovery } from './discovery.js';
import { TransferEngine } from './transferEngine.js';
import { createRouter } from './routes.js';
import { MdnsResponder } from './mdnsResponder.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 53316;

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Load configuration
const config = getDeviceConfig();

// Initialize mDNS Local Hostname Responder
const mdnsResponder = new MdnsResponder(['fly.local', 'f.local', 'filefly.local']);

// Connected clients registry: ws -> { id, name, visible, os, ip, isLocalHost }
const socketClientMap = new Map();
const pendingDisconnectTimers = new Map();

/**
 * Sends event to specific targeted client IDs, or broadcasts to all if targetIds is null
 */
function dispatchEvent(type, payload, targetIds = null) {
  const message = JSON.stringify({ type, payload });

  for (const [ws, clientMeta] of socketClientMap.entries()) {
    if (ws.readyState === WebSocket.OPEN) {
      if (
        targetIds === null || 
        targetIds.includes(clientMeta.id) ||
        (clientMeta.isLocalHost && (targetIds.includes(config.id) || targetIds.includes('host')))
      ) {
        ws.send(message);
      }
    }
  }
}

// Initialize transfer engine with targeted event dispatcher
const transferEngine = new TransferEngine(config, ({ type, payload, targetIds }) => {
  dispatchEvent(type, payload, targetIds);
});

// Initialize peer discovery
const discovery = new PeerDiscovery(
  config,
  PORT,
  (peersList) => {
    dispatchEvent('PEERS_UPDATE', peersList, null);
  },
  (status) => {
    dispatchEvent('SCAN_STATUS', status, null);
  }
);

// Setup Express Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api', createRouter(config, discovery, transferEngine, PORT));

// Serve Static Assets & Frontend (Vite build output & public)
const publicPath = path.join(__dirname, '..', 'public');
if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
}

const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// WebSocket Connection Handling
wss.on('connection', (ws, req) => {
  const rawClientIP = req.socket.remoteAddress?.replace(/^::ffff:/, '') || req.headers['x-forwarded-for'] || '127.0.0.1';
  const primaryHostIP = getPrimaryLocalIP();
  const isLocalHost = rawClientIP === '127.0.0.1' || rawClientIP === '::1' || rawClientIP === primaryHostIP || rawClientIP === 'localhost';

  // Initial client meta
  socketClientMap.set(ws, {
    id: isLocalHost ? config.id : null,
    name: isLocalHost ? config.name : 'Unknown Device',
    visible: isLocalHost ? config.visible : true,
    os: getDeviceOS(),
    ip: rawClientIP,
    isLocalHost,
  });

  // Send initial state to newly connected client
  ws.send(
    JSON.stringify({
      type: 'INIT_STATE',
      payload: {
        isLocalHost,
        clientIP: rawClientIP,
        hostDevice: {
          id: config.id,
          name: config.name,
          visible: config.visible,
          os: getDeviceOS(),
          ip: primaryHostIP,
          port: PORT,
          isHost: true,
        },
        peers: discovery.getPeersList(),
        history: transferEngine.getHistory(),
      },
    })
  );

  ws.on('message', (messageBuffer) => {
    try {
      const { type, payload } = JSON.parse(messageBuffer.toString('utf8'));

      if (type === 'REGISTER_PEER') {
        const clientMeta = socketClientMap.get(ws);
        const clientId = payload.id;
        const clientName = payload.name || 'Device';
        const isVisible = payload.visible !== false;
        const clientOS = payload.os || 'windows';

        if (clientMeta) {
          clientMeta.id = clientId;
          clientMeta.name = clientName;
          clientMeta.visible = isVisible;
          clientMeta.os = clientOS;
        }

        // Cancel any pending disconnect removal for this clientId and IP
        if (clientId && pendingDisconnectTimers.has(clientId)) {
          clearTimeout(pendingDisconnectTimers.get(clientId));
          pendingDisconnectTimers.delete(clientId);
        }

        if (clientId && clientId !== config.id) {
          // Remove any duplicate / ghost peers from the same physical IP
          for (const [existingId, p] of discovery.peers.entries()) {
            if (p.ip === rawClientIP && existingId !== clientId) {
              discovery.peers.delete(existingId);
            }
          }

          if (isVisible) {
            discovery.addOrUpdatePeer({
              id: clientId,
              name: clientName,
              ip: rawClientIP,
              port: PORT,
              os: clientOS,
              visible: true,
              isWebClient: true,
              lastSeen: Date.now(),
            });
          } else {
            discovery.removePeer(clientId, rawClientIP);
          }
          dispatchEvent('PEERS_UPDATE', discovery.getPeersList(), null);
        }
      } else if (type === 'SET_VISIBILITY') {
        const clientMeta = socketClientMap.get(ws);
        const targetId = payload.id || clientMeta?.id;
        const isVisible = Boolean(payload.visible);

        if (targetId && targetId !== config.id) {
          if (clientMeta) clientMeta.visible = isVisible;
          if (isVisible) {
            discovery.addOrUpdatePeer({
              id: targetId,
              name: clientMeta?.name || 'حاسوب / هاتف',
              ip: rawClientIP,
              port: PORT,
              os: clientMeta?.os || 'windows',
              visible: true,
              isWebClient: true,
              lastSeen: Date.now(),
            });
          } else {
            discovery.removePeer(targetId, rawClientIP);
          }
          dispatchEvent('PEERS_UPDATE', discovery.getPeersList(), null);
        } else {
          discovery.setVisibility(isVisible);
          dispatchEvent('PEERS_UPDATE', discovery.getPeersList(), null);
        }
      } else if (type === 'SET_NAME') {
        const clientMeta = socketClientMap.get(ws);
        const targetId = payload.id || clientMeta?.id;
        const newName = (payload.name || '').trim();

        if (!newName) return;

        if (targetId && targetId !== config.id) {
          if (clientMeta) clientMeta.name = newName;
          if (discovery.peers.has(targetId)) {
            const peer = discovery.peers.get(targetId);
            peer.name = newName;
          }
          dispatchEvent('PEERS_UPDATE', discovery.getPeersList(), null);
        } else {
          discovery.setName(newName);
          dispatchEvent('PEERS_UPDATE', discovery.getPeersList(), null);
        }
      } else if (type === 'CLIENT_TRANSFER_PROGRESS') {
        const transfer = transferEngine.activeTransfers.get(payload.id);
        if (transfer) {
          transfer.bytesTransferred = payload.bytesTransferred || transfer.bytesTransferred;
          transfer.totalBytes = payload.totalBytes || transfer.totalBytes;
          transfer.speedBps = payload.speedBps || transfer.speedBps;
          transfer.status = 'transferring';

          const progressData = {
            id: transfer.id,
            bytesTransferred: transfer.bytesTransferred,
            totalBytes: transfer.totalBytes,
            speedBps: transfer.speedBps,
            percentage: payload.percentage !== undefined ? payload.percentage : (transfer.totalBytes > 0 ? Math.round((transfer.bytesTransferred / transfer.totalBytes) * 100) : 0),
          };

          // Dispatch progress immediately to recipient and sender
          dispatchEvent('TRANSFER_PROGRESS', progressData, [transfer.sender.id, transfer.recipient.id, config.id, 'host']);
        }
      } else if (type === 'SET_RADAR') {
        const active = Boolean(payload.active);
        discovery.setRadarActive(active);
      } else if (type === 'REFRESH_PEERS' || type === 'SCAN_SUBNET') {
        discovery.announce('ANNOUNCE');
        if (discovery.scanner) {
          discovery.scanner.scanSubnet();
        }
        ws.send(
          JSON.stringify({
            type: 'PEERS_UPDATE',
            payload: discovery.getPeersList(),
          })
        );
      }
    } catch (e) {
      console.error('Error handling WebSocket message:', e);
    }
  });

  ws.on('close', () => {
    const clientMeta = socketClientMap.get(ws);
    socketClientMap.delete(ws);

    if (clientMeta?.id && clientMeta.id !== config.id) {
      const hasOtherSockets = Array.from(socketClientMap.values()).some((c) => c.id === clientMeta.id);
      if (!hasOtherSockets) {
        const timer = setTimeout(() => {
          pendingDisconnectTimers.delete(clientMeta.id);
          discovery.removePeer(clientMeta.id, clientMeta.ip);
        }, 4000);
        pendingDisconnectTimers.set(clientMeta.id, timer);
      }
    }
  });
});

// Start Server
server.listen(PORT, '0.0.0.0', () => {
  const localIP = getPrimaryLocalIP();
  console.log(`\n🚀 [FileFly Server] Running on http://${localIP}:${PORT}`);
  console.log(`🌐 [Quick mDNS Link] http://fly.local or http://f.local`);
  console.log(`📱 Connect phones via: http://${localIP}:${PORT}\n`);
  discovery.start();
  mdnsResponder.start();
  startRedirectServer(PORT);
});

// ── Port 80 Redirect Server ──────────────────────────────────────────────────
// Redirects http://fly.local  →  http://fly.local:PORT
// Works only when the process has permission to bind port 80.
// Fails silently if another service owns port 80.
let redirectServer = null;

function startRedirectServer(mainPort) {
  const redirectApp = express();
  redirectApp.use((req, res) => {
    const host = (req.headers.host || 'fly.local').replace(/:\d+$/, '');
    res.redirect(301, `http://${host}:${mainPort}${req.url}`);
  });

  redirectServer = http.createServer(redirectApp);

  redirectServer.on('error', (err) => {
    if (err.code === 'EACCES') {
      console.warn('[FileFly] Port 80 needs admin rights — fly.local will need :port suffix.');
    } else if (err.code !== 'EADDRINUSE') {
      console.warn('[FileFly] Port 80 redirect unavailable:', err.message);
    }
    redirectServer = null;
  });

  redirectServer.listen(80, '0.0.0.0', () => {
    console.log('[FileFly] ✅ fly.local (port 80) redirect active → fly.local:' + PORT);
  });
}

// Forward any legacy shortcuts or PWAs targeting old dev port 5173 to PORT
let legacyRedirectServer = null;
try {
  const legacyApp = express();
  legacyApp.use((req, res) => {
    res.redirect(302, `http://localhost:${PORT}${req.url}`);
  });
  legacyRedirectServer = http.createServer(legacyApp);
  legacyRedirectServer.on('error', () => {
    legacyRedirectServer = null;
  });
  legacyRedirectServer.listen(5173, '127.0.0.1', () => {
    console.log('[FileFly] 🔄 Legacy 5173 forwarder active → localhost:' + PORT);
  });
} catch (_) {}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n⚠️ المنفذ ${PORT} مستخدم بالفعل حالياً بواسطة نسخة أخرى من السيرفر.`);
  } else {
    console.error('[Server Error]:', err);
  }
});

// Prevent server from crashing on background network errors
process.on('uncaughtException', (err) => {
  console.error('[FileFly Warning] Uncaught exception (server kept alive):', err?.message || err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[FileFly Warning] Unhandled rejection (server kept alive):', reason);
});

// Graceful shutdown only when explicitly terminated (Ctrl+C)
process.on('SIGINT', () => {
  console.log('\n[FileFly Server] Shutting down...');
  discovery.stop();
  mdnsResponder.stop();
  if (redirectServer) redirectServer.close();
  if (legacyRedirectServer) legacyRedirectServer.close();
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  discovery.stop();
  mdnsResponder.stop();
  if (redirectServer) redirectServer.close();
  if (legacyRedirectServer) legacyRedirectServer.close();
  server.close(() => {
    process.exit(0);
  });
});
