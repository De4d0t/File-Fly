import dgram from 'dgram';
import { getPrimaryLocalIP, getDeviceOS, getBroadcastAddresses } from './networkUtils.js';
import { SubnetScanner } from './subnetScanner.js';

const DISCOVERY_PORT = 53317;
const BROADCAST_INTERVAL_MS = 2500;
const PEER_TIMEOUT_MS = 12000;
const SUBNET_SCAN_INTERVAL_MS = 30000; // Auto-scan whole subnet every 30s

export class PeerDiscovery {
  constructor(config, serverPort = 53316, onPeersChange = () => {}, onScanStatus = () => {}) {
    this.config = config;
    this.serverPort = serverPort;
    this.onPeersChange = onPeersChange;
    this.onScanStatus = onScanStatus;
    this.peers = new Map(); // id -> peer data
    this.socket = null;
    this.broadcastTimer = null;
    this.cleanupTimer = null;
    this.subnetTimer = null;
    this.isRunning = false;

    // Subnet Scanner for 100% reliable discovery across all routers
    this.scanner = new SubnetScanner(
      this.config.id,
      this.serverPort,
      (peer) => this.addOrUpdatePeer(peer),
      (status) => this.onScanStatus(status)
    );
  }

  /**
   * Initializes UDP socket and starts listening & announcing
   */
  start() {
    if (this.isRunning) return;

    this.socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

    this.socket.on('error', (err) => {
      console.error('[Discovery] Socket error:', err.message);
      try {
        this.socket.close();
      } catch (e) {}
    });

    this.socket.on('message', (msg, rinfo) => {
      this.handleIncomingMessage(msg, rinfo);
    });

    this.socket.on('listening', () => {
      try {
        this.socket.setBroadcast(true);
        console.log(`[Discovery] UDP listener running on port ${DISCOVERY_PORT}`);
      } catch (e) {
        console.error('[Discovery] Error enabling broadcast:', e.message);
      }
    });

    try {
      this.socket.bind(DISCOVERY_PORT, '0.0.0.0', () => {
        this.isRunning = true;
        this.startBroadcasting();
        this.startCleanupTimer();

        // Initial fast subnet sweep after 1.5s
        setTimeout(() => {
          if (this.isRunning) this.scanner.scanSubnet();
        }, 1500);

        // Recurring subnet sweep
        this.subnetTimer = setInterval(() => {
          if (this.isRunning) this.scanner.scanSubnet();
        }, SUBNET_SCAN_INTERVAL_MS);
      });
    } catch (e) {
      console.error('[Discovery] Failed to bind port:', e);
    }
  }

  /**
   * Processes discovery UDP packets
   */
  handleIncomingMessage(msgBuffer, rinfo) {
    try {
      const payload = JSON.parse(msgBuffer.toString('utf8'));
      if (!payload || payload.protocol !== 'FILEFLY_V1') return;

      // Ignore our own broadcast packets
      if (payload.id === this.config.id) return;

      // If peer is leaving or went invisible, remove from peer list
      if (payload.action === 'LEAVING' || payload.visible === false) {
        if (this.peers.has(payload.id)) {
          this.peers.delete(payload.id);
          this.notifyPeersChanged();
        }
        return;
      }

      // If peer is announcing presence
      if (payload.action === 'ANNOUNCE') {
        const peerData = {
          id: payload.id,
          name: payload.name || 'Unknown Device',
          ip: payload.ip || rinfo.address,
          port: payload.port || 53316,
          os: payload.os || 'unknown',
          visible: payload.visible,
          lastSeen: Date.now(),
        };

        const existing = this.peers.get(payload.id);
        const isNew = !existing;
        const hasChanged = existing && (existing.name !== peerData.name || existing.ip !== peerData.ip);

        this.peers.set(payload.id, peerData);

        if (isNew || hasChanged) {
          this.notifyPeersChanged();
        }
      }
    } catch (err) {
      // Ignore malformed packets
    }
  }

  /**
   * Sends a UDP broadcast announcement
   */
  announce(action = 'ANNOUNCE') {
    if (!this.socket || !this.isRunning) return;

    // If invisible and not leaving, do not announce
    if (!this.config.visible && action !== 'LEAVING') return;

    const payload = JSON.stringify({
      protocol: 'FILEFLY_V1',
      action: action,
      id: this.config.id,
      name: this.config.name,
      ip: getPrimaryLocalIP(),
      port: this.serverPort,
      os: getDeviceOS(),
      visible: this.config.visible,
      timestamp: Date.now(),
    });

    const message = Buffer.from(payload, 'utf8');
    const targets = getBroadcastAddresses();

    // Broadcast to all active subnet interfaces & 255.255.255.255
    targets.forEach((targetIP) => {
      this.socket.send(message, 0, message.length, DISCOVERY_PORT, targetIP, (err) => {
        if (err && err.code !== 'ENETUNREACH') {
          // Silent catch
        }
      });
    });
  }

  startBroadcasting() {
    this.announce('ANNOUNCE');
    this.broadcastTimer = setInterval(() => {
      this.announce('ANNOUNCE');
    }, BROADCAST_INTERVAL_MS);
  }

  startCleanupTimer() {
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      let changed = false;

      for (const [id, peer] of this.peers.entries()) {
        if (now - peer.lastSeen > PEER_TIMEOUT_MS) {
          this.peers.delete(id);
          changed = true;
        }
      }

      if (changed) {
        this.notifyPeersChanged();
      }
    }, 2000);
  }

  /**
   * Updates device visibility and announces changes
   */
  setVisibility(isVisible) {
    const wasVisible = this.config.visible;
    this.config.visible = Boolean(isVisible);

    if (wasVisible && !this.config.visible) {
      // Send leaving packet so other peers immediately hide us
      this.announce('LEAVING');
    } else if (!wasVisible && this.config.visible) {
      // Immediately announce our reappearance
      this.announce('ANNOUNCE');
    }
  }

  /**
   * Updates device name
   */
  setName(newName) {
    if (!newName || !newName.trim()) return;
    this.config.name = newName.trim();
    if (this.config.visible) {
      this.announce('ANNOUNCE');
    }
  }

  /**
   * Add a peer manually (e.g., when scanned via QR code or HTTP handshake)
   */
  addOrUpdatePeer(peer) {
    if (!peer || !peer.id || peer.id === this.config.id) return;
    peer.lastSeen = Date.now();
    this.peers.set(peer.id, peer);
    this.notifyPeersChanged();
  }

  getPeersList() {
    return Array.from(this.peers.values()).map((p) => ({
      id: p.id,
      name: p.name,
      ip: p.ip,
      port: p.port,
      os: p.os,
      lastSeen: p.lastSeen,
    }));
  }

  notifyPeersChanged() {
    if (typeof this.onPeersChange === 'function') {
      this.onPeersChange(this.getPeersList());
    }
  }

  stop() {
    this.isRunning = false;
    if (this.config.visible) {
      this.announce('LEAVING');
    }
    if (this.broadcastTimer) clearInterval(this.broadcastTimer);
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
    if (this.subnetTimer) clearInterval(this.subnetTimer);
    if (this.socket) {
      try {
        this.socket.close();
      } catch (e) {}
    }
  }
}
