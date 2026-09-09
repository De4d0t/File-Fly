/**
 * Sound Effects & Alert Service for FileFly
 * Features strict per-sound debouncing to guarantee that every action
 * (Request, Accept, Decline, Complete) produces strictly ONE single clean sound.
 */

const SOUND_FILES = {
  request: '/sounds/request.wav',
  accepted: '/sounds/accepted.wav',
  success: '/sounds/success.wav',
  declined: '/sounds/declined.wav',
  click: '/sounds/click.wav',
};

const audioCache = new Map();
const lastSoundTimes = new Map();
let audioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// Automatically unlock AudioContext on any user interaction with the page
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    window.removeEventListener('pointerdown', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
    window.removeEventListener('click', unlockAudio);
  };
  window.addEventListener('pointerdown', unlockAudio, { passive: true });
  window.addEventListener('keydown', unlockAudio, { passive: true });
  window.addEventListener('click', unlockAudio, { passive: true });
}

// Pre-instantiate and preload audio files for zero-latency, glitch-free playback
if (typeof window !== 'undefined') {
  Object.entries(SOUND_FILES).forEach(([key, src]) => {
    try {
      const audio = new Audio(src);
      audio.preload = 'auto';
      audioCache.set(key, audio);
    } catch (_) {}
  });
}

let lastAnySoundTime = 0;

/**
 * Strict per-sound cooldown timer to prevent duplicate triggers
 */
function canPlaySound(key, cooldownMs = 1800) {
  const now = Date.now();
  const last = lastSoundTimes.get(key) || 0;
  if (now - last < cooldownMs) {
    return false;
  }
  // Prevent two alert sounds from colliding within 600ms
  if (key !== 'click' && now - lastAnySoundTime < 600) {
    return false;
  }
  lastSoundTimes.set(key, now);
  if (key !== 'click') {
    lastAnySoundTime = now;
  }
  return true;
}

/**
 * Fallback synthesizer chime ONLY if audio file playback is blocked by browser autoplay policy
 */
function playFallbackChime(notes = [{ freq: 659.25, dur: 0.2 }, { freq: 880.0, dur: 0.35 }], volume = 0.45) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    let offset = 0;
    notes.forEach(({ freq, dur }) => {
      const startTime = ctx.currentTime + offset;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(volume, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + dur + 0.05);

      offset += dur * 0.75;
    });
  } catch (_) {}
}

/**
 * Plays strictly a single sound. Guaranteed never to duplicate.
 */
function playSingleSound(key, volume = 0.5, fallbackNotes = null) {
  if (typeof window === 'undefined') return;

  // Strict debounce: ignore any duplicate call within cooldown
  if (!canPlaySound(key)) return;

  try {
    let audio = audioCache.get(key);
    if (!audio) {
      audio = new Audio(SOUND_FILES[key] || SOUND_FILES.click);
      audioCache.set(key, audio);
    }
    audio.currentTime = 0;
    audio.volume = Math.max(0, Math.min(1, volume));
    const playPromise = audio.play();

    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        // ONLY fallback if explicitly blocked by browser Autoplay policy (NotAllowedError)
        // Never fallback on AbortError or normal interruptions
        if (err && err.name === 'NotAllowedError' && fallbackNotes) {
          playFallbackChime(fallbackNotes, volume * 0.8);
        }
      });
    }
  } catch (_) {}
}

/**
 * Audible single notification when someone sends a file (Arrival Alert)
 */
export function playTransferRequestSound() {
  playSingleSound('request', 0.85, [
    { freq: 659.25, dur: 0.2 },
    { freq: 880.00, dur: 0.35 },
  ]);
}

/**
 * Audible single notification when transfer is accepted
 */
export function playTransferAcceptedSound() {
  playSingleSound('accepted', 0.7, [
    { freq: 523.25, dur: 0.15 },
    { freq: 659.25, dur: 0.25 },
  ]);
}

/**
 * Audible single notification when transfer completes
 */
export function playSuccessSound() {
  playSingleSound('success', 0.8, [
    { freq: 523.25, dur: 0.12 },
    { freq: 659.25, dur: 0.14 },
    { freq: 783.99, dur: 0.16 },
    { freq: 1046.50, dur: 0.35 },
  ]);
}

/**
 * Audible single notification when transfer is declined or cancelled
 */
export function playDeclinedSound() {
  playSingleSound('declined', 0.65, [
    { freq: 440, dur: 0.15 },
    { freq: 349.23, dur: 0.25 },
  ]);
}

/**
 * Button click sound
 */
export function playButtonClickSound() {
  playSingleSound('click', 0.4);
}

/**
 * Request system notification permission
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
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      const notif = new Notification(title, {
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        silent: false,
        ...options,
      });

      notif.onclick = () => {
        window.focus();
        notif.close();
      };

      return notif;
    } catch (_) {}
  }
  return null;
}
