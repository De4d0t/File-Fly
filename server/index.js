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

// Setup WebSocket broadcaster
const clients = new Set();

function broadcastToClients(type, payload) {
  const message = JSON.stringify({ type, payload });
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

// Initialize transfer engine
const transferEngine = new TransferEngine(config, (event) => {
  broadcastToClients(event.type, event.payload);
});

// Initialize peer discovery
const discovery = new PeerDiscovery(
  config,
  PORT,
  (peersList) => {
    broadcastToClients('PEERS_UPDATE', peersList);
  },
  (status) => {
    broadcastToClients('SCAN_STATUS', status);
  }
);

// Setup Express Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api', createRouter(config, discovery, transferEngine, PORT));

// Serve Frontend (Vite build output when available)
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Map of web client sockets: clientId -> WebSocket
const webClients = new Map();

// WebSocket Connection Handling
wss.on('connection', (ws, req) => {
  clients.add(ws);
  let currentClientId = null;
  const clientIP = req.socket.remoteAddress?.replace(/^::ffff:/, '') || req.headers['x-forwarded-for'] || '127.0.0.1';

  // Send initial state to newly connected client
  ws.send(
    JSON.stringify({
      type: 'INIT_STATE',
      payload: {
        hostDevice: {
          id: config.id,
          name: config.name,
          visible: config.visible,
          os: getDeviceOS(),
          ip: getPrimaryLocalIP(),
          port: PORT,
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
        currentClientId = payload.id;
        webClients.set(payload.id, ws);

        if (payload.id && payload.id !== config.id) {
          discovery.addOrUpdatePeer({
            id: payload.id,
            name: payload.name || 'حاسوب / هاتف',
            ip: clientIP,
            port: PORT,
            os: payload.os || 'windows',
            visible: true,
            lastSeen: Date.now(),
          });
          broadcastToClients('PEERS_UPDATE', discovery.getPeersList());
        }
      } else if (type === 'SET_VISIBILITY') {
        discovery.setVisibility(payload.visible);
        broadcastToClients('DEVICE_UPDATE', {
          id: config.id,
          name: config.name,
          visible: config.visible,
        });
      } else if (type === 'SET_NAME') {
        discovery.setName(payload.name);
        broadcastToClients('DEVICE_UPDATE', {
          id: config.id,
          name: config.name,
          visible: config.visible,
        });
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
    clients.delete(ws);
    if (currentClientId) {
      webClients.delete(currentClientId);
      discovery.peers.delete(currentClientId);
      broadcastToClients('PEERS_UPDATE', discovery.getPeersList());
    }
  });
});

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
