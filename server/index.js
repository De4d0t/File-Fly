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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 53316;

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Load configuration
const config = getDeviceConfig();

// Connected clients registry: ws -> { id, name, os, ip, isLocalHost }
const socketClientMap = new Map();

/**
 * Sends event to specific targeted client IDs, or broadcasts to all if targetIds is null
 */
function dispatchEvent(type, payload, targetIds = null) {
  const message = JSON.stringify({ type, payload });

  for (const [ws, clientMeta] of socketClientMap.entries()) {
    if (ws.readyState === WebSocket.OPEN) {
      if (targetIds === null || targetIds.includes(clientMeta.id)) {
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

// Serve Frontend (Vite build output)
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// WebSocket Connection Handling
wss.on('connection', (ws, req) => {
  const rawClientIP = req.socket.remoteAddress?.replace(/^::ffff:/, '') || req.headers['x-forwarded-for'] || '127.0.0.1';
  const primaryHostIP = getPrimaryLocalIP();
  const isLocalHost = rawClientIP === '127.0.0.1' || rawClientIP === '::1' || rawClientIP === primaryHostIP || rawClientIP === 'localhost';

  // Default client registration before client hello
  socketClientMap.set(ws, {
    id: isLocalHost ? config.id : null,
    name: isLocalHost ? config.name : 'Unknown Device',
    os: getDeviceOS(),
    ip: rawClientIP,
    isLocalHost,
  });

  // Send initial state
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
        if (clientMeta) {
          clientMeta.id = payload.id;
          clientMeta.name = payload.name;
          clientMeta.os = payload.os;
        }

        // Cancel any pending disconnect removal for this client
        if (payload.id && pendingDisconnectTimers.has(payload.id)) {
          clearTimeout(pendingDisconnectTimers.get(payload.id));
          pendingDisconnectTimers.delete(payload.id);
        }

        if (payload.id && payload.id !== config.id) {
          discovery.addOrUpdatePeer({
            id: payload.id,
            name: payload.name || 'حاسوب / هاتف',
            ip: rawClientIP,
            port: PORT,
            os: payload.os || 'windows',
            visible: true,
            isWebClient: true,
            lastSeen: Date.now(),
          });
          dispatchEvent('PEERS_UPDATE', discovery.getPeersList(), null);
        }
      } else if (type === 'SET_VISIBILITY') {
        const clientMeta = socketClientMap.get(ws);
        const targetId = payload.id || clientMeta?.id;

        if (targetId && targetId !== config.id && discovery.peers.has(targetId)) {
          const peer = discovery.peers.get(targetId);
          peer.visible = Boolean(payload.visible);
          dispatchEvent('PEERS_UPDATE', discovery.getPeersList(), null);
        } else {
          discovery.setVisibility(payload.visible);
          dispatchEvent('PEERS_UPDATE', discovery.getPeersList(), null);
        }
      } else if (type === 'SET_NAME') {
        const clientMeta = socketClientMap.get(ws);
        const targetId = payload.id || clientMeta?.id;

        if (targetId && targetId !== config.id && discovery.peers.has(targetId)) {
          const peer = discovery.peers.get(targetId);
          peer.name = payload.name;
          dispatchEvent('PEERS_UPDATE', discovery.getPeersList(), null);
        } else {
          discovery.setName(payload.name);
          dispatchEvent('PEERS_UPDATE', discovery.getPeersList(), null);
        }
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
      // Check if this client still has other open connections
      const hasOtherSockets = Array.from(socketClientMap.values()).some((c) => c.id === clientMeta.id);
      if (!hasOtherSockets) {
        // Wait 4 seconds before removing to prevent UI flickering on page refresh (F5)
        const timer = setTimeout(() => {
          pendingDisconnectTimers.delete(clientMeta.id);
          discovery.peers.delete(clientMeta.id);
          dispatchEvent('PEERS_UPDATE', discovery.getPeersList(), null);
        }, 4000);
        pendingDisconnectTimers.set(clientMeta.id, timer);
      }
    }
  });
});

// Disconnect grace timers to prevent UI flicker when a user refreshes (F5)
const pendingDisconnectTimers = new Map();

// Start Server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 [FileFly Server] Running on http://${getPrimaryLocalIP()}:${PORT}`);
  console.log(`📱 Connect phones via: http://${getPrimaryLocalIP()}:${PORT}\n`);
  discovery.start();
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[FileFly Server] Shutting down...');
  discovery.stop();
  server.close(() => {
    process.exit(0);
  });
});
