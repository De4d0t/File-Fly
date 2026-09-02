/**
 * Synthesizes rich, delightful procedural sound effects using Web Audio API
 * Works 100% offline with zero external audio assets
 */

let audioCtx = null;

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

// Global user-gesture audio unlocker for mobile & desktop browsers (specifically iOS Safari)
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

      // Play 1-frame silent buffer to permanently unlock iOS WebAudio hardware
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);

      isUnlocked = true;
    } catch (e) {}
  };

  window.addEventListener('pointerdown', unlockAudio, { passive: true, capture: true });
  window.addEventListener('touchstart', unlockAudio, { passive: true, capture: true });
  window.addEventListener('touchend', unlockAudio, { passive: true, capture: true });
  window.addEventListener('click', unlockAudio, { passive: true, capture: true });
  window.addEventListener('keydown', unlockAudio, { passive: true, capture: true });
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
          silent: true, // We trigger custom procedural Web Audio chime
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
 * Plays a single rich bell tone with fundamental + harmonic bell overtones
 */
function playBellTone(ctx, freq, startTime, duration = 0.5, volume = 0.25) {
  // Fundamental sine tone
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(freq, startTime);

  gain1.gain.setValueAtTime(0, startTime);
  gain1.gain.linearRampToValueAtTime(volume, startTime + 0.015);
  gain1.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(startTime);
  osc1.stop(startTime + duration + 0.05);

  // Metallic shimmer overtone (2.76x fundamental)
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(freq * 2.76, startTime);

  gain2.gain.setValueAtTime(0, startTime);
  gain2.gain.linearRampToValueAtTime(volume * 0.25, startTime + 0.01);
  gain2.gain.exponentialRampToValueAtTime(0.0001, startTime + duration * 0.6);

  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(startTime);
  osc2.stop(startTime + duration * 0.65);
}

/**
 * High-profile crystal notification chime when receiving a new transfer request
 * Inspired by premium AirDrop chime with rich resonant acoustics
 */
export async function playTransferRequestSound() {
  try {
    // Vibrate phone if supported
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([160, 80, 160, 80, 240]);
    }

    const ctx = await ensureAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime + 0.02;

    // Phrase 1: G#5 (830.6Hz) & B5 (987.7Hz)
    playBellTone(ctx, 830.61, now, 0.45, 0.28);
    playBellTone(ctx, 987.77, now + 0.08, 0.5, 0.32);

    // Phrase 2: E6 (1318.5Hz) & G#6 (1661.2Hz) - Bright resolution
    playBellTone(ctx, 1318.51, now + 0.22, 0.65, 0.38);
    playBellTone(ctx, 1661.22, now + 0.34, 0.85, 0.42);

    // Subtle warm low-frequency body pad
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(140, now);
    subOsc.frequency.exponentialRampToValueAtTime(90, now + 0.4);

    subGain.gain.setValueAtTime(0, now);
    subGain.gain.linearRampToValueAtTime(0.12, now + 0.03);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    subOsc.connect(subGain);
    subGain.connect(ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 0.5);
  } catch (e) {
    console.warn('[Audio] Failed to play transfer alert:', e);
  }
}

/**
 * Crisp sparkle sound when a transfer request is accepted & starts
 */
export async function playTransferAcceptedSound() {
  try {
    const ctx = await ensureAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime + 0.01;
    // Rapid ascending sparkle: C6 (1046Hz) -> E6 (1318Hz) -> G6 (1567Hz)
    const tones = [1046.50, 1318.51, 1567.98];
    tones.forEach((freq, idx) => {
      playBellTone(ctx, freq, now + idx * 0.06, 0.3, 0.25);
    });
  } catch (e) {}
}

/**
 * Uplifting celebration fanfare chime when file transfer completes successfully
 */
export async function playSuccessSound() {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([100, 50, 150]);
    }

    const ctx = await ensureAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime + 0.02;
    // F Major Chord Arpeggio with high resolution: F5 -> A5 -> C6 -> F6
    const chords = [
      { freq: 698.46, delay: 0.00, duration: 0.4, vol: 0.25 },
      { freq: 880.00, delay: 0.08, duration: 0.45, vol: 0.30 },
      { freq: 1046.50, delay: 0.16, duration: 0.55, vol: 0.35 },
      { freq: 1396.91, delay: 0.25, duration: 0.95, vol: 0.42 },
    ];

    chords.forEach(({ freq, delay, duration, vol }) => {
      playBellTone(ctx, freq, now + delay, duration, vol);
    });
  } catch (e) {}
}

/**
 * Soft low-frequency feedback tone when a transfer is declined or cancelled
 */
export async function playDeclinedSound() {
  try {
    const ctx = await ensureAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime + 0.01;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(392.00, now); // G4
    osc.frequency.exponentialRampToValueAtTime(220.00, now + 0.25); // Drops to A3

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.16, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  } catch (e) {}
}

/**
 * Subtle microscopic haptic click for UI button taps
 */
export async function playButtonClickSound() {
  try {
    const ctx = await ensureAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.04);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  } catch (e) {}
}
