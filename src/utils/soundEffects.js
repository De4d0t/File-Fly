/**
 * Authentic Windows Sound Effects Engine for FileFly
 * Uses genuine Windows system sounds with zero-latency Web Audio buffer caching,
 * with graceful procedural synthesis fallback.
 */

let audioCtx = null;
const audioBuffers = new Map();
const pendingLoads = new Map();

export function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
}

export async function ensureAudioContext() {
  const ctx = getAudioContext();
  if (!ctx) return null;
  if (ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch (e) {}
  }
  return ctx;
}

// Sound file mappings (located in public/sounds/)
const SOUND_FILES = {
  request: '/sounds/request.wav',
  accepted: '/sounds/accepted.wav',
  success: '/sounds/success.wav',
  declined: '/sounds/declined.wav',
  click: '/sounds/click.wav',
};

async function loadSoundBuffer(key) {
  if (audioBuffers.has(key)) return audioBuffers.get(key);
  if (pendingLoads.has(key)) return pendingLoads.get(key);

  const loadPromise = (async () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return null;
      const res = await fetch(SOUND_FILES[key]);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const arrayBuffer = await res.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      audioBuffers.set(key, audioBuffer);
      return audioBuffer;
    } catch (err) {
      return null;
    } finally {
      pendingLoads.delete(key);
    }
  })();

  pendingLoads.set(key, loadPromise);
  return loadPromise;
}

export function preloadAllSounds() {
  if (typeof window === 'undefined') return;
  Object.keys(SOUND_FILES).forEach((key) => {
    loadSoundBuffer(key).catch(() => {});
  });
}

// Global user-gesture audio unlocker for mobile & desktop browsers (specifically iOS Safari & Chrome)
if (typeof window !== 'undefined') {
  let isUnlocked = false;

  const unlockAudio = async () => {
    if (isUnlocked) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      // Play 1-frame silent buffer to permanently unlock audio hardware
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);

      isUnlocked = true;
      preloadAllSounds();
    } catch (e) {}
  };

  window.addEventListener('pointerdown', unlockAudio, { passive: true, capture: true });
  window.addEventListener('touchstart', unlockAudio, { passive: true, capture: true });
  window.addEventListener('touchend', unlockAudio, { passive: true, capture: true });
  window.addEventListener('click', unlockAudio, { passive: true, capture: true });
  window.addEventListener('keydown', unlockAudio, { passive: true, capture: true });

  // Preload shortly after initial load
  setTimeout(preloadAllSounds, 600);
}

/**
 * Plays a preloaded audio buffer with zero latency and volume control
 */
async function playBufferSound(key, volume = 0.5) {
  try {
    const ctx = await ensureAudioContext();
    if (!ctx) return false;

    let buffer = audioBuffers.get(key);
    if (!buffer) {
      buffer = await loadSoundBuffer(key);
    }

    if (buffer) {
      const source = ctx.createBufferSource();
      const gainNode = ctx.createGain();
      source.buffer = buffer;
      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      source.connect(gainNode);
      gainNode.connect(ctx.destination);
      source.start(0);
      return true;
    }

    // HTML5 Audio element fallback
    const audio = new Audio(SOUND_FILES[key]);
    audio.volume = Math.min(1, Math.max(0, volume));
    await audio.play();
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Request system notification permission with fallback
 */
export async function requestNotificationPermission() {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'default') {
      try {
        return await Notification.requestPermission();
      } catch (e) {
        return 'denied';
      }
    }
    return Notification.permission;
  }
  return 'unsupported';
}

/**
 * Trigger system notification banner on Windows, Mac, or Android
 */
export function showSystemNotification(title, options = {}) {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      try {
        const notif = new Notification(title, {
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          silent: true,
          ...options,
        });

        notif.onclick = () => {
          window.focus();
          notif.close();
        };

        return notif;
      } catch (e) {}
    }
  }
}

/**
 * Windows Notification chime when receiving a new transfer request
 * (Genuine Windows Notify.wav)
 */
export async function playTransferRequestSound() {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([160, 80, 160, 80, 240]);
    }

    const played = await playBufferSound('request', 0.65);
    if (played) return;

    // Fallback: procedural Windows Notification simulation
    const ctx = await ensureAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [
      { freq: 830.6, delay: 0.0, dur: 0.35, vol: 0.3 },
      { freq: 1108.7, delay: 0.12, dur: 0.55, vol: 0.35 },
    ].forEach(({ freq, delay, dur, vol }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delay);
      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(vol, now + delay + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + dur + 0.05);
    });
  } catch (e) {}
}

/**
 * Windows Hardware Insert chime when a transfer is accepted & starts
 * (Genuine Windows Hardware Insert.wav)
 */
export async function playTransferAcceptedSound() {
  try {
    const played = await playBufferSound('accepted', 0.6);
    if (played) return;

    // Fallback: procedural Hardware Insert simulation
    const ctx = await ensureAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [
      { freq: 523.25, delay: 0.00, dur: 0.18, vol: 0.28 },
      { freq: 659.25, delay: 0.08, dur: 0.18, vol: 0.32 },
      { freq: 783.99, delay: 0.16, dur: 0.35, vol: 0.38 },
    ].forEach(({ freq, delay, dur, vol }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delay);
      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(vol, now + delay + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + dur + 0.05);
    });
  } catch (e) {}
}

/**
 * Windows Print Complete fanfare chime when file transfer finishes successfully
 * (Genuine Windows Print complete.wav)
 */
export async function playSuccessSound() {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([100, 50, 150]);
    }

    const played = await playBufferSound('success', 0.6);
    if (played) return;

    // Fallback: procedural Windows success simulation
    const ctx = await ensureAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [
      { freq: 659.25, delay: 0.00, dur: 0.3, vol: 0.25 },
      { freq: 783.99, delay: 0.10, dur: 0.35, vol: 0.30 },
      { freq: 1046.50, delay: 0.20, dur: 0.55, vol: 0.38 },
    ].forEach(({ freq, delay, dur, vol }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delay);
      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(vol, now + delay + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + dur + 0.05);
    });
  } catch (e) {}
}

/**
 * Windows Hardware Remove sound when a transfer is declined, cancelled, or fails
 * (Genuine Windows Hardware Remove.wav)
 */
export async function playDeclinedSound() {
  try {
    const played = await playBufferSound('declined', 0.55);
    if (played) return;

    // Fallback: procedural Hardware Remove simulation
    const ctx = await ensureAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [
      { freq: 783.99, delay: 0.00, dur: 0.18, vol: 0.32 },
      { freq: 523.25, delay: 0.10, dur: 0.35, vol: 0.28 },
    ].forEach(({ freq, delay, dur, vol }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delay);
      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(vol, now + delay + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + dur + 0.05);
    });
  } catch (e) {}
}

/**
 * Windows Navigation Start sound for UI clicks
 * (Genuine Windows Navigation Start.wav)
 */
export async function playButtonClickSound() {
  try {
    const played = await playBufferSound('click', 0.45);
    if (played) return;

    // Fallback: procedural click
    const ctx = await ensureAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.03);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.04);
  } catch (e) {}
}
