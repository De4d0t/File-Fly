import { getSocketUrl, getServerBaseUrl, setServerBaseUrl } from './serverDiscovery.js';

/**
 * WebSocket client for real-time events & signaling
 */

class SocketClient {
  constructor() {
    this.ws = null;
    this.listeners = new Map(); // eventType -> Set of callbacks
    this.reconnectTimer = null;
    this.isConnected = false;
    this.listenVisibilityAndNetwork();
  }

  listenVisibilityAndNetwork() {
    if (typeof window === 'undefined') return;

    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.lastPong = Date.now();
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
          this.connect();
        } else {
          try {
            this.ws.send(JSON.stringify({ type: 'PING' }));
          } catch (_) {}
        }
      }
    });

    window.addEventListener('online', () => {
      this.reconnectNow();
    });

    window.addEventListener('offline', () => {
      this.stopHeartbeat();
      this.isConnected = false;
      this.emit('connection_change', false);
      try {
        if (this.ws) this.ws.close();
      } catch (_) {}
      this.scheduleReconnect();
    });
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    // Determine host dynamically (supports desktop localhost, mobile device IP, or newly discovered server)
    const wsUrl = getSocketUrl();

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.lastPong = Date.now();
        this.reconnectAttempts = 0;
        this.emit('connection_change', true);
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.type === 'PONG') {
            this.lastPong = Date.now();
            return;
          }
          if (data && data.type) {
            this.emit(data.type, data.payload);
          }
        } catch (e) {
          console.error('[SocketClient] Parse error:', e);
        }
      };

      this.ws.onclose = () => {
        this.stopHeartbeat();
        this.isConnected = false;
        this.emit('connection_change', false);
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.stopHeartbeat();
        this.isConnected = false;
        this.emit('connection_change', false);
        this.scheduleReconnect();
      };
    } catch (err) {
      this.scheduleReconnect();
    }
  }

  startHeartbeat() {
    this.stopHeartbeat();
    this.lastPong = Date.now();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        // Only check dead connection if page is visible (background tabs are throttled by mobile OS)
        const isVisible = typeof document === 'undefined' || document.visibilityState === 'visible';
        if (isVisible && Date.now() - this.lastPong > 10000) {
          this.stopHeartbeat();
          this.isConnected = false;
          this.emit('connection_change', false);
          try {
            this.ws.close();
          } catch (_) {}
          this.scheduleReconnect();
          return;
        }

        try {
          this.ws.send(JSON.stringify({ type: 'PING' }));
        } catch (_) {}
      } else {
        this.stopHeartbeat();
        this.isConnected = false;
        this.emit('connection_change', false);
        this.scheduleReconnect();
      }
    }, 2000);
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  async probeServerHealth() {
    try {
      const base = getServerBaseUrl();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);

      const res = await fetch(`${base}/api/health?_t=${Date.now()}`, {
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && data.status === 'ok') {
          this.reconnectNow();
          return data;
        }
      }
    } catch (_) {}
    return null;
  }

  scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectAttempts = (this.reconnectAttempts || 0) + 1;
    const delay = Math.min(1000 + (this.reconnectAttempts * 400), 3500);

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      const alive = await this.probeServerHealth();
      if (!alive) {
        this.connect();
      }
    }, delay);
  }

  reconnectNow() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      try {
        this.ws.close();
      } catch (_) {}
      this.ws = null;
    }
    this.connect();
  }

  reconnectTo(newServerUrl) {
    setServerBaseUrl(newServerUrl);
    this.reconnectAttempts = 0;
    this.reconnectNow();
  }

  disconnect() {
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      try {
        this.ws.close();
      } catch (_) {}
      this.ws = null;
    }
    this.isConnected = false;
    this.emit('connection_change', false);
  }

  send(type, payload = {}) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }

  on(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType).add(callback);

    // Return unsubscribe function
    return () => {
      const set = this.listeners.get(eventType);
      if (set) set.delete(callback);
    };
  }

  emit(eventType, payload) {
    const set = this.listeners.get(eventType);
    if (set) {
      set.forEach((cb) => {
        try {
          cb(payload);
        } catch (e) {
          console.error(`Error in listener for ${eventType}:`, e);
        }
      });
    }
  }
}

export const socketService = new SocketClient();
