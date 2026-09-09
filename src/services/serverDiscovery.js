/**
 * Server Discovery & Dynamic Connection Service
 * Handles finding the FileFly backend server when laptop IP changes across networks
 */

const STORAGE_KEY = 'filefly_custom_server';
export const DEFAULT_PORT = 53316;

/**
 * Formats and normalizes a host or full URL to a clean base URL: http://host:port
 */
export function normalizeServerUrl(rawInput) {
  if (!rawInput || typeof rawInput !== 'string') return null;
  let clean = rawInput.trim();
  if (!clean) return null;

  // Remove any trailing slashes or api endpoints
  clean = clean.replace(/\/api.*$/i, '').replace(/\/+$/, '');

  // Add http protocol if missing
  if (!/^https?:\/\//i.test(clean)) {
    clean = `http://${clean}`;
  }

  try {
    const parsed = new URL(clean);
    const port = parsed.port || DEFAULT_PORT;
    return `${parsed.protocol}//${parsed.hostname}:${port}`;
  } catch (e) {
    return null;
  }
}

/**
 * Returns the currently active server base URL (e.g. http://192.168.1.10:53316)
 */
export function getServerBaseUrl() {
  if (typeof window === 'undefined') return `http://127.0.0.1:${DEFAULT_PORT}`;

  const host = window.location.hostname;
  const currentPort = window.location.port;

  // If the page is loaded directly from a live FileFly server (not Vite port 5173)
  if (host && currentPort !== '5173') {
    const port = currentPort || DEFAULT_PORT;
    return `${window.location.protocol}//${host}:${port}`;
  }

  // If running on Vite dev server (5173) or offline PWA, check saved custom server
  const custom = localStorage.getItem(STORAGE_KEY);
  if (custom) {
    const normalized = normalizeServerUrl(custom);
    if (normalized) return normalized;
  }

  // Fallback to current host with DEFAULT_PORT
  const fallbackHost = host || 'localhost';
  return `http://${fallbackHost}:${DEFAULT_PORT}`;
}

/**
 * Returns WebSocket URL for the active server
 */
export function getSocketUrl() {
  const base = getServerBaseUrl();
  try {
    const url = new URL(base);
    const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${url.host}`;
  } catch (_) {
    return `ws://localhost:${DEFAULT_PORT}`;
  }
}

/**
 * Saves a new active server base URL to localStorage
 */
export function setServerBaseUrl(url) {
  const normalized = normalizeServerUrl(url);
  if (normalized && typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, normalized);
    return normalized;
  }
  return null;
}

/**
 * Clears custom saved server URL
 */
export function clearServerBaseUrl() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}

/**
 * Probes a specific URL to see if FileFly server is responding with valid health status
 */
export async function checkServerHealth(targetUrl, timeoutMs = 800) {
  const base = normalizeServerUrl(targetUrl);
  if (!base) return { ok: false };

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(`${base}/api/health?_t=${Date.now()}`, {
      method: 'GET',
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      if (data && data.status === 'ok') {
        return {
          ok: true,
          url: base,
          data,
          name: data.name || data.id,
        };
      }
    }
  } catch (_) {
    // Timeout or network error
  }
  return { ok: false };
}

/**
 * Checks if a string is a valid IPv4 address
 */
function isIPv4(ip) {
  return /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/.test(ip);
}

/**
 * Extracts subnet prefix from an IPv4 (e.g. "192.168.1.45" -> "192.168.1")
 */
function getSubnetPrefix(ip) {
  if (!isIPv4(ip)) return null;
  const parts = ip.split('.');
  return `${parts[0]}.${parts[1]}.${parts[2]}`;
}

/**
 * Detects phone/client's actual local Wi-Fi IP address via WebRTC ICE candidate
 */
export async function detectLocalDeviceIP() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof RTCPeerConnection === 'undefined') {
      return resolve(null);
    }
    try {
      const pc = new RTCPeerConnection({ iceServers: [] });
      pc.createDataChannel('');
      pc.createOffer().then((offer) => pc.setLocalDescription(offer)).catch(() => resolve(null));

      const timer = setTimeout(() => {
        try { pc.close(); } catch (_) {}
        resolve(null);
      }, 1000);

      pc.onicecandidate = (event) => {
        if (!event || !event.candidate || !event.candidate.candidate) return;
        const candidate = event.candidate.candidate;
        const match = candidate.match(/([0-9]{1,3}(\.[0-9]{1,3}){3})/);
        if (match && match[1] && !match[1].startsWith('127.')) {
          clearTimeout(timer);
          try { pc.close(); } catch (_) {}
          resolve(match[1]);
        }
      };
    } catch (_) {
      resolve(null);
    }
  });
}

/**
 * Scans local network candidates continuously in the background
 * Resolves with the found server { ok: true, url, data } or null if aborted/none found
 */
export async function scanLocalNetworkForServer(onProgress = () => {}, abortSignal = null) {
  // 1. Try local hostname first (Fast mDNS resolution for iOS / Mac / Windows)
  // and common default hotspot gateways
  const candidates = [
    'fly.local',
    '192.168.137.1', // Windows Mobile Hotspot default
    '172.20.10.1',   // iOS Hotspot default
    '192.168.43.1',  // Android Hotspot default
  ];

  // Try current browser hostname if present and not localhost
  if (typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    candidates.unshift(window.location.hostname);
  }

  // Try saved server in localStorage
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const norm = normalizeServerUrl(saved);
      if (norm) {
        try {
          const host = new URL(norm).hostname;
          if (host && !candidates.includes(host)) candidates.unshift(host);
        } catch (_) {}
      }
    }
  }

  // Fast check across candidates
  for (const host of candidates) {
    if (abortSignal?.aborted) return null;
    onProgress({ status: 'checking_host', target: host });

    const result = await checkServerHealth(`http://${host}:${DEFAULT_PORT}`, 600);
    if (result && result.ok) {
      return result;
    }
  }

  // If client Wi-Fi IP detected via WebRTC, check common router / gateway IPs on that subnet
  try {
    const clientIP = await detectLocalDeviceIP();
    if (clientIP) {
      const subnet = getSubnetPrefix(clientIP);
      if (subnet) {
        const gatewayCandidates = [`${subnet}.1`, `${subnet}.254`, `${subnet}.100`, `${subnet}.2`];
        for (const gw of gatewayCandidates) {
          if (abortSignal?.aborted) return null;
          onProgress({ status: 'checking_host', target: gw });
          const res = await checkServerHealth(`http://${gw}:${DEFAULT_PORT}`, 400);
          if (res && res.ok) {
            return res;
          }
        }
      }
    }
  } catch (_) {}

  return null;
}
