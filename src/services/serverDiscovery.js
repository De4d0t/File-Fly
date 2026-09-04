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

  const custom = localStorage.getItem(STORAGE_KEY);
  if (custom) {
    const normalized = normalizeServerUrl(custom);
    if (normalized) return normalized;
  }

  // Fallback to current browser location host & port
  const host = window.location.hostname || 'localhost';
  const port = window.location.port === '5173' ? DEFAULT_PORT : (window.location.port || DEFAULT_PORT);
  return `http://${host}:${port}`;
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
 * Scans local network candidates continuously in the background
 * Resolves with the found server { ok: true, url, data } or null if aborted/none found
 */
export async function scanLocalNetworkForServer(onProgress = () => {}, abortSignal = null) {
  // 1. Try local hostnames first (Fast mDNS resolution)
  const quickHosts = [
    'fly.local',
    'filefly.local',
    '192.168.137.1', // Windows Mobile Hotspot default
    '172.20.10.1',   // iOS Hotspot default
    '192.168.43.1',  // Android Hotspot default
  ];

  for (const host of quickHosts) {
    if (abortSignal?.aborted) return null;
    onProgress({ status: 'checking_host', target: host });

    const result = await checkServerHealth(`http://${host}:${DEFAULT_PORT}`, 600);
    if (result.ok) {
      return result;
    }
  }

  // 2. Determine Subnets to scan
  const subnetsToScan = new Set();

  // Try current browser hostname if it's an IP
  const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
  const currentSubnet = getSubnetPrefix(currentHost);
  if (currentSubnet) {
    subnetsToScan.add(currentSubnet);
  }

  // Common home & office subnets
  subnetsToScan.add('192.168.1');
  subnetsToScan.add('192.168.0');

  // 3. Scan subnets in parallel batches of 20 with short timeouts
  const BATCH_SIZE = 20;

  for (const subnet of subnetsToScan) {
    if (abortSignal?.aborted) return null;

    onProgress({ status: 'scanning_subnet', subnet, current: 0, total: 254 });

    // Generate IP list 1-254
    const ips = Array.from({ length: 254 }, (_, i) => `${subnet}.${i + 1}`);

    for (let i = 0; i < ips.length; i += BATCH_SIZE) {
      if (abortSignal?.aborted) return null;

      const chunk = ips.slice(i, i + BATCH_SIZE);
      onProgress({ 
        status: 'scanning_subnet', 
        subnet, 
        current: Math.min(i + BATCH_SIZE, 254), 
        total: 254,
        activeChunk: chunk[0]
      });

      // Run chunk concurrently
      const promises = chunk.map(ip => checkServerHealth(`http://${ip}:${DEFAULT_PORT}`, 450));
      const results = await Promise.all(promises);

      for (const res of results) {
        if (res && res.ok) {
          return res;
        }
      }
    }
  }

  return null;
}
