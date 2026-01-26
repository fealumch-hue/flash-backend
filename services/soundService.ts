
export type SoundType = 'action' | 'success' | 'error' | 'switch';

let audioCtx: AudioContext | null = null;

const getCtx = () => {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  return audioCtx;
};

export const playUISound = (type: SoundType) => {
  try {
    const saved = localStorage.getItem('flash-settings');
    const settings = saved ? JSON.parse(saved) : null;
    
    if (settings && settings.soundEffects === false) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches && (!settings || settings.soundEffects !== true)) {
      return;
    }

    const ctx = getCtx();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    switch (type) {
      case 'action':
      case 'switch':
        // Soft, minimalist subtle click
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.015);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);
        osc.start(now);
        osc.stop(now + 0.015);
        break;
      case 'success':
        // Slightly deeper, authoritative confirmation
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(140, now + 0.08);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
        break;
      case 'error':
        // Muted, low-end feedback
        osc.type = 'sine';
        osc.frequency.setValueAtTime(110, now);
        osc.frequency.linearRampToValueAtTime(80, now + 0.1);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
    }
  } catch (e) {
    // Silence is preferred over failing loud
  }
};
