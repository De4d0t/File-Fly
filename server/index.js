import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { getDeviceConfig, getPrimaryLocalIP, getLocalIPAddresses, getDeviceOS } from './networkUtils.js';
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
const mdnsResponder = new MdnsResponder(['fly.local'], PORT);

// Connected clients registry: ws -> { id, name, visible, os, ip, isLocalHost }
const socketClientMap = new Map();

let hostUIDisconnectTimer = null;

/**
 * Tracks whether the laptop's browser page or app is actively open and updates peers
 */
function updateHostUIStatus() {
  const hasLocal = Array.from(socketClientMap.values()).some((c) => c.isLocalHost);
  if (hasLocal) {
    if (hostUIDisconnectTimer) {
      clearTimeout(hostUIDisconnectTimer);
      hostUIDisconnectTimer = null;
    }
    discovery.setHostUIActive(true);
    dispatchEvent('PEERS_UPDATE', discovery.getPeersList(), null);
  } else {
    // 1.5s grace period so a page refresh (F5) doesn't cause peer flicker on other devices
    if (!hostUIDisconnectTimer) {
      hostUIDisconnectTimer = setTimeout(() => {
        hostUIDisconnectTimer = null;
        const stillHasLocal = Array.from(socketClientMap.values()).some((c) => c.isLocalHost);
        if (!stillHasLocal) {
          discovery.setHostUIActive(false);
          dispatchEvent('PEERS_UPDATE', discovery.getPeersList(), null);
        }
      }, 1500);
    }
  }
}

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
const apiRouter = createRouter(config, discovery, transferEngine, PORT);
app.use('/api', apiRouter);
app.use('/transfer', apiRouter);

// Serve Static Assets & Frontend (Vite build output & public)
const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath));

const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html') || filePath.endsWith('sw.js')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));

// Fallback for SPA routing or dev mode redirect to Vite
app.get('*', (req, res) => {
  const indexHtml = path.join(distPath, 'index.html');
  if (fs.existsSync(indexHtml)) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    return res.sendFile(indexHtml);
  }
  // In dev mode if dist hasn't been built, redirect to Vite dev server
  const host = (req.headers.host || '').split(':')[0] || 'localhost';
  res.redirect(`http://${host}:5173${req.url}`);
});

// WebSocket Connection Handling
wss.on('connection', (ws, req) => {
  const rawClientIP = req.socket.remoteAddress?.replace(/^::ffff:/, '') || req.headers['x-forwarded-for'] || '127.0.0.1';
  const primaryHostIP = getPrimaryLocalIP();
  const localIPs = getLocalIPAddresses().map((a) => a.address);
  const isLocalHost = rawClientIP === '127.0.0.1' || rawClientIP === '::1' || rawClientIP === primaryHostIP || rawClientIP === 'localhost' || localIPs.includes(rawClientIP);

  // Initial client meta
  socketClientMap.set(ws, {
    id: isLocalHost ? config.id : null,
    name: isLocalHost ? config.name : 'Unknown Device',
    visible: isLocalHost ? config.visible : true,
    os: getDeviceOS(),
    ip: rawClientIP,
    isLocalHost,
    lastSeen: Date.now(),
  });

  if (isLocalHost) {
    updateHostUIStatus();
  }

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
        history: isLocalHost ? transferEngine.getHistory() : [],
      },
    })
  );

  ws.on('pong', () => {
    const clientMeta = socketClientMap.get(ws);
    if (clientMeta) {
      clientMeta.lastSeen = Date.now();
      if (clientMeta.id && discovery.peers.has(clientMeta.id)) {
        discovery.peers.get(clientMeta.id).lastSeen = Date.now();
      }
    }
  });

  ws.on('message', (messageBuffer) => {
    try {
      const { type, payload } = JSON.parse(messageBuffer.toString('utf8'));
      const clientMeta = socketClientMap.get(ws);
      if (clientMeta) {
        clientMeta.lastSeen = Date.now();
        if (clientMeta.id && discovery.peers.has(clientMeta.id)) {
          discovery.peers.get(clientMeta.id).lastSeen = Date.now();
        }
      }

      if (type === 'PING') {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'PONG' }));
        }
        return;
      }

      if (type === 'UNREGISTER_PEER') {
        const clientMeta = socketClientMap.get(ws);
        const clientId = payload.id || clientMeta?.id;
        if (clientId) {
          const hasOtherSockets = Array.from(socketClientMap.values()).some(
            (c) => c !== clientMeta && ((c.id && c.id === clientId) || (c.ip && c.ip === rawClientIP))
          );
          if (!hasOtherSockets) {
            discovery.removePeer(clientId, rawClientIP);
            dispatchEvent('PEERS_UPDATE', discovery.getPeersList(), null);
          }
        }
        return;
      }

      if (type === 'CLIENT_VISIBILITY') {
        const clientMeta = socketClientMap.get(ws);
        const clientId = payload.id || clientMeta?.id;
        const inBackground = Boolean(payload.inBackground);

        if (clientMeta) {
          clientMeta.inBackground = inBackground;
          clientMeta.lastSeen = Date.now();
        }

        // Keep peer active even when running in background!
        // Peer will only be removed when the user actually closes/deletes the tab/window (ws close or UNREGISTER_PEER).
        if (clientId && clientId !== config.id && !clientMeta?.isLocalHost) {
          discovery.addOrUpdatePeer({
            id: clientId,
            name: clientMeta?.name || 'Device',
            ip: rawClientIP,
            port: PORT,
            os: clientMeta?.os || 'windows',
            visible: true,
            isWebClient: true,
            lastSeen: Date.now(),
          });
          dispatchEvent('PEERS_UPDATE', discovery.getPeersList(), null);
        }
        return;
      }

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

          // Send transfers relevant to this specific client so remote device history is never empty
          if (!clientMeta?.isLocalHost) {
            const clientHistory = transferEngine.getHistory().filter((h) =>
              (h.senderId && h.senderId === clientId) ||
              (h.recipientId && h.recipientId === clientId)
            );
            if (clientHistory.length > 0 && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'CLIENT_HISTORY', payload: clientHistory }));
            }
          }
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
            senderId: transfer.sender.id,
            recipientId: transfer.recipient.id,
            bytesTransferred: transfer.bytesTransferred,
            totalBytes: transfer.totalBytes,
            speedBps: transfer.speedBps,
            percentage: payload.percentage !== undefined ? payload.percentage : (transfer.totalBytes > 0 ? Math.round((transfer.bytesTransferred / transfer.totalBytes) * 100) : 0),
          };

          const targetIds = [transfer.sender.id, transfer.recipient.id];
          if (transfer.recipient.id === config.id || transfer.recipient.id === 'host') {
            targetIds.push(config.id, 'host');
          }

          // Dispatch progress strictly to recipient and sender
          dispatchEvent('TRANSFER_PROGRESS', progressData, targetIds);
        }
      } else if (type === 'CLIENT_TRANSFER_COMPLETED') {
        const transferId = payload.id || payload.transferId;
        if (transferId) {
          transferEngine.completeTransfer(transferId);
        }
      } else if (type === 'CANCEL_TRANSFER') {
        const transferId = payload.transferId || payload.id;
        if (transferId) {
          transferEngine.cancelTransfer(transferId, payload.reason || 'User cancelled');
        }
      } else if (type === 'REMOVE_FILE_FROM_TRANSFER') {
        const transferId = payload.transferId || payload.id;
        const fileName = payload.fileName || payload.name;
        if (transferId && fileName) {
          transferEngine.removeFileFromTransfer(transferId, fileName);
        }
      } else if (type === 'SET_RADAR') {
        const active = Boolean(payload.active);
        discovery.setRadarActive(active);
      } else if (type === 'REFRESH_PEERS' || type === 'SCAN_SUBNET') {
        discovery.announce('ANNOUNCE');
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
      const hasOtherSockets = Array.from(socketClientMap.values()).some(
        (c) => (c.id && c.id === clientMeta.id) || (c.ip && c.ip === clientMeta.ip)
      );
      if (!hasOtherSockets) {
        discovery.removePeer(clientMeta.id, clientMeta.ip);
        dispatchEvent('PEERS_UPDATE', discovery.getPeersList(), null);
      }
    }

    if (clientMeta?.isLocalHost) {
      updateHostUIStatus();
    }
  });
});

let lastKnownHostIP = getPrimaryLocalIP();

// Periodic remote socket liveness monitor & network adapter watcher
setInterval(() => {
  const now = Date.now();
  const hostIP = getPrimaryLocalIP();
  let changed = false;

  // Check if laptop's Wi-Fi / IP changed (e.g. Wi-Fi turned back on)
  if (hostIP !== lastKnownHostIP) {
    console.log(`[FileFly Network] Host IP changed: ${lastKnownHostIP} -> ${hostIP}`);
    lastKnownHostIP = hostIP;

    const hostInfo = {
      id: config.id,
      name: config.name,
      visible: config.visible,
      os: getDeviceOS(),
      ip: hostIP,
      port: PORT,
      isHost: true,
    };
    dispatchEvent('HOST_UPDATE', hostInfo, null);
    changed = true;
  }

  for (const [socket, meta] of socketClientMap.entries()) {
    if (!meta.isLocalHost) {
      if (hostIP === '127.0.0.1' || (meta.lastSeen && now - meta.lastSeen > 60000)) {
        try {
          socket.terminate();
        } catch (_) {}
        socketClientMap.delete(socket);
        if (meta.id) {
          discovery.removePeer(meta.id, meta.ip);
          changed = true;
        }
      } else if (socket.readyState === WebSocket.OPEN) {
        try {
          socket.ping();
        } catch (_) {}
      }
    }
  }

  if (changed) {
    dispatchEvent('PEERS_UPDATE', discovery.getPeersList(), null);
  }
}, 1500);

// Start Server
server.listen(PORT, '0.0.0.0', () => {
  const localIP = getPrimaryLocalIP();
  console.log(`\n🚀 [FileFly Server] Running on:`);
  console.log(`   ➜ Local:   http://localhost:${PORT}`);
  console.log(`   ➜ Domain:  http://fly.local:${PORT}`);
  console.log(`   ➜ Network: http://${localIP}:${PORT}\n`);
  discovery.start();
  mdnsResponder.start();
});

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
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  discovery.stop();
  mdnsResponder.stop();
  server.close(() => {
    process.exit(0);
  });
});
