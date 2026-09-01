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
   * Ultra-fast IP prober with strict 400ms timeout
   */
  async probeIP(ip) {
    return new Promise((resolve) => {
      let isSettled = false;

      const finish = (result) => {
        if (!isSettled) {
          isSettled = true;
          resolve(result);
        }
      };

      // Hard safety timer
      const timer = setTimeout(() => {
        finish(null);
        if (req && !req.destroyed) {
          try { req.destroy(); } catch (e) {}
        }
      }, 400);

      let req;
      try {
        req = http.get(
          `http://${ip}:${this.serverPort}/api/info`,
          { timeout: 350 },
          (res) => {
            if (res.statusCode !== 200) {
              res.resume();
              clearTimeout(timer);
              return finish(null);
            }

            let rawData = '';
            res.setEncoding('utf8');
            res.on('data', (chunk) => {
              rawData += chunk;
            });
            res.on('end', () => {
              clearTimeout(timer);
              try {
                const data = JSON.parse(rawData);
                if (data && data.id && data.id !== this.myId && data.visible) {
                  finish({
                    id: data.id,
                    name: data.name,
                    ip: ip,
                    port: data.port || this.serverPort,
                    os: data.os || 'unknown',
                    visible: true,
                    lastSeen: Date.now(),
                  });
                } else {
                  finish(null);
                }
              } catch (e) {
                finish(null);
              }
            });
          }
        );

        req.on('error', () => {
          clearTimeout(timer);
          finish(null);
        });

        req.on('timeout', () => {
          clearTimeout(timer);
          if (!req.destroyed) req.destroy();
          finish(null);
        });
      } catch (err) {
        clearTimeout(timer);
        finish(null);
      }
    });
  }

  /**
   * Scans entire /24 subnet in concurrent batches in under 1.5 seconds
   */
  async scanSubnet() {
    if (this.isScanning) return;
    this.isScanning = true;
    this.onStatusChange({ scanning: true });

    try {
      const myIP = getPrimaryLocalIP();
      if (!myIP || myIP === '127.0.0.1') {
        return;
      }

      const parts = myIP.split('.');
      if (parts.length !== 4) {
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

      // Concurrency batch size of 60 for super-fast sweep
      const BATCH_SIZE = 60;
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
