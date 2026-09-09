import dgram from 'dgram';
import { getPrimaryLocalIP, getDeviceOS, getBroadcastAddresses, saveDeviceConfig } from './networkUtils.js';
const DISCOVERY_PORT = 53317;
const BROADCAST_INTERVAL_MS = 2500;
const PEER_TIMEOUT_MS = 25000;

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
    this.isHostUIActive = false; // Only true when host machine browser/app UI is actively open
    this.isRadarEnabled = true;
  }

  start() {
    this.isSocketBound = false;
    this.socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

    this.socket.on('error', (err) => {
      console.error('[Discovery] Socket error:', err.message);
      this.isSocketBound = false;
    });

    this.socket.on('message', (msg, rinfo) => {
      this.handleIncomingMessage(msg, rinfo);
    });

    this.socket.on('listening', () => {
      this.isSocketBound = true;
      try {
        this.socket.setBroadcast(true);
      } catch (e) {}

      console.log(`[Discovery] UDP listener running on port ${DISCOVERY_PORT}`);

      // Start periodic UDP broadcasting
      this.startBroadcasting();

      // Start peer cleanup timer
      this.startCleanupTimer();

    });

    try {
      this.socket.bind(DISCOVERY_PORT);
    } catch (e) {
      console.error('[Discovery] Failed to bind socket:', e.message);
    }
  }

  stop() {
    this.isSocketBound = false;
    if (this.broadcastTimer) clearInterval(this.broadcastTimer);
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);

    if (this.config.visible) {
      try {
        this.announce('LEAVE');
      } catch (e) {}
    }

    if (this.socket) {
      try {
        this.socket.close();
      } catch (e) {}
      this.socket = null;
    }
  }

  setHostUIActive(active) {
    const next = Boolean(active);
    if (this.isHostUIActive !== next) {
      this.isHostUIActive = next;
      this.notifyPeersChanged();
    }
  }

  setRadarActive(active) {
    this.isRadarEnabled = Boolean(active);
    if (this.isRadarEnabled) {
      this.announce('ANNOUNCE');
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
    if (!this.socket || !this.isSocketBound) return;

    try {
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
        try {
          if (this.socket && this.isSocketBound) {
            this.socket.send(message, 0, message.length, DISCOVERY_PORT, targetIP, () => {});
          }
        } catch (err) {}
      });
    } catch (e) {}
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
      const hostIP = getPrimaryLocalIP();
      let changed = false;

      // If computer has no active Wi-Fi/LAN (only 127.0.0.1), immediately clear all remote peers!
      if (hostIP === '127.0.0.1') {
        if (this.peers.size > 0) {
          this.peers.clear();
          this.notifyPeersChanged();
          return;
        }
      }

      for (const [id, peer] of this.peers.entries()) {
        // Web clients are managed directly via WebSocket lifecycle (ws.on('close')), not UDP discovery timeout
        if (peer.isWebClient) continue;

        if (now - (peer.lastSeen || 0) > PEER_TIMEOUT_MS) {
          this.peers.delete(id);
          changed = true;
        }
      }

      if (changed) {
        this.notifyPeersChanged();
      }
    }, 2000);
  }

  addOrUpdatePeer(peer) {
    if (!peer || !peer.id || peer.id === this.config.id) return;
    const hostIP = getPrimaryLocalIP();
    if (peer.ip === hostIP || peer.ip === '127.0.0.1') return;

    if (peer.visible === false) {
      this.removePeer(peer.id, peer.ip);
      return;
    }

    // IP-level deduplication: If a peer with this SAME IP exists under a different ID
    // (e.g. user opened PWA alongside browser or refreshed tab), remove the older ID!
    for (const [existingId, existingPeer] of this.peers.entries()) {
      if (existingPeer.ip === peer.ip && existingId !== peer.id) {
        this.peers.delete(existingId);
      }
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

    // If host machine has active Wi-Fi/LAN, include remote peers
    if (hostIP !== '127.0.0.1') {
      const ipMap = new Map();
      for (const p of this.peers.values()) {
        if (p.visible !== false && p.id !== this.config.id && p.ip !== hostIP && p.ip !== '127.0.0.1') {
          const existing = ipMap.get(p.ip);
          if (!existing || (p.lastSeen || 0) >= (existing.lastSeen || 0)) {
            ipMap.set(p.ip, p);
          }
        }
      }

      for (const p of ipMap.values()) {
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

    // 2. Add the host machine only if visible AND its UI is actively open on the laptop
    if (this.config.visible && this.isHostUIActive) {
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
