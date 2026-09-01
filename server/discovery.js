import dgram from 'dgram';
import { getPrimaryLocalIP, getDeviceOS, getBroadcastAddresses, saveDeviceConfig } from './networkUtils.js';
import { SubnetScanner } from './subnetScanner.js';

const DISCOVERY_PORT = 53317;
const BROADCAST_INTERVAL_MS = 2500;
const PEER_TIMEOUT_MS = 25000;
const SUBNET_SCAN_INTERVAL_MS = 30000;

export class PeerDiscovery {
  constructor(config, serverPort, onPeersUpdated = () => {}, onScanStatus = () => {}) {
    this.config = config;
    this.serverPort = serverPort;
    this.onPeersUpdated = onPeersUpdated;
    this.onScanStatus = onScanStatus;

    this.peers = new Map(); // id -> peer object
    this.socket = null;
    this.broadcastTimer = null;
    this.cleanupTimer = null;
    this.subnetScanTimer = null;

    // Subnet Scanner for reliable LAN auto-discovery
    this.scanner = new SubnetScanner(
      config.id,
      serverPort,
      (discoveredPeer) => {
        this.addOrUpdatePeer(discoveredPeer);
      },
      (status) => {
        const scanning = typeof status === 'boolean' ? status : Boolean(status?.scanning);
        if (typeof this.onScanStatus === 'function') {
          this.onScanStatus({ scanning });
        }
      }
    );
  }

  start() {
    this.socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

    this.socket.on('error', (err) => {
      console.error('[Discovery] Socket error:', err.message);
    });

    this.socket.on('message', (msg, rinfo) => {
      this.handleIncomingMessage(msg, rinfo);
    });

    this.socket.on('listening', () => {
      try {
        this.socket.setBroadcast(true);
      } catch (e) {}

      console.log(`[Discovery] UDP listener running on port ${DISCOVERY_PORT}`);

      // Start periodic UDP broadcasting
      this.startBroadcasting();

      // Start peer cleanup timer
      this.startCleanupTimer();

      // Initial fast subnet scan
      setTimeout(() => {
        this.scanner.scanSubnet();
      }, 1500);

      // Periodic subnet scanner
      this.subnetScanTimer = setInterval(() => {
        this.scanner.scanSubnet();
      }, SUBNET_SCAN_INTERVAL_MS);
    });

    try {
      this.socket.bind(DISCOVERY_PORT);
    } catch (e) {
      console.error('[Discovery] Failed to bind socket:', e.message);
    }
  }

  stop() {
    if (this.broadcastTimer) clearInterval(this.broadcastTimer);
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
    if (this.subnetScanTimer) clearInterval(this.subnetScanTimer);

    if (this.config.visible) {
      this.announce('LEAVE');
    }

    if (this.socket) {
      try {
        this.socket.close();
      } catch (e) {}
    }
  }

  handleIncomingMessage(msgBuffer, rinfo) {
    try {
      const data = JSON.parse(msgBuffer.toString('utf8'));

      // Ignore our own broadcast packets
      if (!data || data.id === this.config.id) return;

      const peerIP = rinfo.address || data.ip;

      if (data.type === 'ANNOUNCE') {
        if (data.visible !== false) {
          this.addOrUpdatePeer({
            id: data.id,
            name: data.name || 'جهاز غير معروف',
            ip: peerIP,
            port: data.port || this.serverPort,
            os: data.os || 'unknown',
            visible: true,
            lastSeen: Date.now(),
          });
        } else {
          this.removePeer(data.id, peerIP);
        }
      } else if (data.type === 'LEAVE') {
        this.removePeer(data.id, peerIP);
      }
    } catch (e) {}
  }

  announce(action = 'ANNOUNCE') {
    if (!this.socket) return;

    const payload = JSON.stringify({
      type: action,
      id: this.config.id,
      name: this.config.name,
      ip: getPrimaryLocalIP(),
      port: this.serverPort,
      os: getDeviceOS(),
      visible: Boolean(this.config.visible),
      timestamp: Date.now(),
    });

    const message = Buffer.from(payload, 'utf8');
    const targets = getBroadcastAddresses();

    targets.forEach((targetIP) => {
      this.socket.send(message, 0, message.length, DISCOVERY_PORT, targetIP, (err) => {});
    });
  }

  startBroadcasting() {
    if (this.config.visible) {
      this.announce('ANNOUNCE');
    }
    this.broadcastTimer = setInterval(() => {
      if (this.config.visible) {
        this.announce('ANNOUNCE');
      }
    }, BROADCAST_INTERVAL_MS);
  }

  startCleanupTimer() {
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      let changed = false;

      for (const [id, peer] of this.peers.entries()) {
        // Connected WebSocket web clients are only removed on disconnect (ws.close)
        if (peer.isWebClient) {
          continue;
        }

        if (now - peer.lastSeen > PEER_TIMEOUT_MS) {
          this.peers.delete(id);
          changed = true;
        }
      }

      if (changed) {
        this.notifyPeersChanged();
      }
    }, 4000);
  }

  addOrUpdatePeer(peer) {
    if (!peer || !peer.id || peer.id === this.config.id) return;
    const hostIP = getPrimaryLocalIP();
    if (peer.ip === hostIP || peer.ip === '127.0.0.1') return;

    if (peer.visible === false) {
      this.removePeer(peer.id, peer.ip);
      return;
    }

    const existing = this.peers.get(peer.id);
    const hasChanged = !existing || existing.name !== peer.name || existing.ip !== peer.ip;

    this.peers.set(peer.id, {
      ...existing,
      ...peer,
      visible: true,
      lastSeen: Date.now(),
    });

    if (hasChanged) {
      this.notifyPeersChanged();
    }
  }

  removePeer(peerId, peerIP = null) {
    let changed = false;
    for (const [id, peer] of this.peers.entries()) {
      if (id === peerId || (peerIP && peer.ip === peerIP)) {
        this.peers.delete(id);
        changed = true;
      }
    }
    if (changed) {
      this.notifyPeersChanged();
    }
  }

  getPeersList() {
    const map = new Map();
    const hostIP = getPrimaryLocalIP();

    // 1. Add remote peers (Strictly exclude self ID and host IP)
    for (const p of this.peers.values()) {
      if (p.visible !== false && p.id !== this.config.id && p.ip !== hostIP && p.ip !== '127.0.0.1') {
        map.set(p.id, {
          id: p.id,
          name: p.name,
          ip: p.ip,
          port: p.port,
          os: p.os,
          visible: true,
          lastSeen: p.lastSeen,
        });
      }
    }

    // 2. Add the host machine exactly once if visible
    if (this.config.visible) {
      map.set(this.config.id, {
        id: this.config.id,
        name: this.config.name,
        ip: hostIP,
        port: this.serverPort,
        os: getDeviceOS(),
        visible: true,
        lastSeen: Date.now(),
        isHost: true,
      });
    }

    return Array.from(map.values());
  }

  setVisibility(isVisible) {
    this.config.visible = Boolean(isVisible);
    saveDeviceConfig(this.config);

    if (this.config.visible) {
      this.announce('ANNOUNCE');
    } else {
      this.announce('LEAVE');
    }

    this.notifyPeersChanged();
  }

  setName(name) {
    if (!name || !name.trim()) return;
    this.config.name = name.trim();
    saveDeviceConfig(this.config);
    this.announce('ANNOUNCE');
    this.notifyPeersChanged();
  }

  notifyPeersChanged() {
    if (typeof this.onPeersUpdated === 'function') {
      this.onPeersUpdated(this.getPeersList());
    }
  }
}
