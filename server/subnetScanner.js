import http from 'http';
import { getPrimaryLocalIP } from './networkUtils.js';

export class SubnetScanner {
  constructor(myId, serverPort = 53316, onPeerFound = () => {}, onStatusChange = () => {}) {
    this.myId = myId;
    this.serverPort = serverPort;
    this.onPeerFound = onPeerFound;
    this.onStatusChange = onStatusChange;
    this.isScanning = false;
  }

  /**
   * Scans a single IP for FileFly instance
   */
  async probeIP(ip) {
    return new Promise((resolve) => {
      const req = http.get(
        `http://${ip}:${this.serverPort}/api/info`,
        { timeout: 550 },
        (res) => {
          if (res.statusCode !== 200) {
            res.resume();
            return resolve(null);
          }

          let rawData = '';
          res.setEncoding('utf8');
          res.on('data', (chunk) => {
            rawData += chunk;
          });
          res.on('end', () => {
            try {
              const data = JSON.parse(rawData);
              if (data && data.id && data.id !== this.myId && data.visible) {
                const peer = {
                  id: data.id,
                  name: data.name,
                  ip: ip,
                  port: data.port || this.serverPort,
                  os: data.os || 'unknown',
                  visible: true,
                  lastSeen: Date.now(),
                };
                resolve(peer);
              } else {
                resolve(null);
              }
            } catch (e) {
              resolve(null);
            }
          });
        }
      );

      req.on('error', () => resolve(null));
      req.on('timeout', () => {
        req.destroy();
        resolve(null);
      });
    });
  }

  /**
   * Scans entire /24 subnet in concurrent batches
   */
  async scanSubnet() {
    if (this.isScanning) return;
    this.isScanning = true;
    this.onStatusChange({ scanning: true });

    try {
      const myIP = getPrimaryLocalIP();
      if (!myIP || myIP === '127.0.0.1') {
        this.isScanning = false;
        this.onStatusChange({ scanning: false });
        return;
      }

      const parts = myIP.split('.');
      if (parts.length !== 4) {
        this.isScanning = false;
        this.onStatusChange({ scanning: false });
        return;
      }

      const subnetPrefix = `${parts[0]}.${parts[1]}.${parts[2]}.`;
      const allIPs = [];

      for (let i = 1; i <= 254; i++) {
        const ip = `${subnetPrefix}${i}`;
        if (ip !== myIP) {
          allIPs.push(ip);
        }
      }

      // Concurrency batch size
      const BATCH_SIZE = 35;
      for (let i = 0; i < allIPs.length; i += BATCH_SIZE) {
        const batch = allIPs.slice(i, i + BATCH_SIZE);
        const results = await Promise.all(batch.map((ip) => this.probeIP(ip)));

        results.forEach((peer) => {
          if (peer) {
            this.onPeerFound(peer);
          }
        });
      }
    } catch (err) {
      console.error('[SubnetScanner] Error during subnet scan:', err);
    } finally {
      this.isScanning = false;
      this.onStatusChange({ scanning: false });
    }
  }
}
