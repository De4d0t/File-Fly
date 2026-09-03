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
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
          this.connect();
        }
      }
    });

    window.addEventListener('online', () => {
      this.connect();
    });
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    // Determine host dynamically (supports desktop localhost as well as mobile device IP)
    const host = window.location.hostname || 'localhost';
    const port = window.location.port === '5173' ? '53316' : (window.location.port || '53316');
    const wsUrl = `ws://${host}:${port}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emit('connection_change', true);
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.type) {
            this.emit(data.type, data.payload);
          }
        } catch (e) {
          console.error('[SocketClient] Parse error:', e);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.emit('connection_change', false);
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.isConnected = false;
      };
    } catch (err) {
      this.scheduleReconnect();
    }
  }

  async probeServerHealth() {
    try {
      const host = window.location.hostname || 'localhost';
      const port = window.location.port === '5173' ? '53316' : (window.location.port || '53316');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);

      const res = await fetch(`http://${host}:${port}/api/health?_t=${Date.now()}`, {
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
