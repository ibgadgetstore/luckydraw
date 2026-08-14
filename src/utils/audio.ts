// High-compatibility synthesized Web Audio Engine with auto-unlock for all devices (iOS, Android, Desktop)

class SoundManager {
  private ctx: AudioContext | null = null;
  public soundEnabled: boolean = true;
  private isUnlocked: boolean = false;

  constructor() {
    this.setupAutoUnlock();
  }

  // Set up touch / click listeners to unlock AudioContext on iOS Safari / Android Chrome on first interaction
  private setupAutoUnlock() {
    if (typeof window === 'undefined') return;

    const unlock = () => {
      this.initCtx();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().then(() => {
          this.isUnlocked = true;
        }).catch(() => {});
      } else if (this.ctx && this.ctx.state === 'running') {
        this.isUnlocked = true;
      }
    };

    const events = ['touchstart', 'touchend', 'pointerdown', 'click', 'keydown'];
    const handler = () => {
      unlock();
      events.forEach((evt) => {
        window.removeEventListener(evt, handler);
        document.removeEventListener(evt, handler);
      });
    };

    events.forEach((evt) => {
      window.addEventListener(evt, handler, { passive: true, capture: true });
      document.addEventListener(evt, handler, { passive: true, capture: true });
    });
  }

  public initCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    try {
      if (!this.ctx || this.ctx.state === 'closed') {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }

      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    } catch (e) {
      console.warn('AudioContext init error:', e);
    }

    return this.ctx;
  }

  public playClick() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.initCtx();
      if (!ctx || ctx.state !== 'running') return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {
      // ignore audio errors
    }
  }

  public playTick(pitchMultiplier = 1) {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.initCtx();
      if (!ctx || ctx.state !== 'running') return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const baseFreq = Math.max(120, Math.min(1600, 520 * pitchMultiplier));
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(Math.max(80, baseFreq * 0.4), ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch {
      // ignore
    }
  }

  public playMysteryShaking() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.initCtx();
      if (!ctx || ctx.state !== 'running') return;

      for (let i = 0; i < 4; i++) {
        const time = ctx.currentTime + i * 0.08;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(240 + i * 40, time);

        gain.gain.setValueAtTime(0.12, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(time);
        osc.stop(time + 0.06);
      }
    } catch {
      // ignore
    }
  }

  public playWinFanfare() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.initCtx();
      if (!ctx) return;

      if (ctx.state === 'suspended') {
        ctx.resume().then(() => this.playWinFanfare()).catch(() => {});
        return;
      }

      // Joyful 5-note fanfare (A4, C#5, E5, A5, C#6)
      const notes = [440, 554.37, 659.25, 880, 1108.73];
      const now = ctx.currentTime;

      notes.forEach((freq, index) => {
        if (!ctx) return;
        const startTime = now + index * 0.12;
        const duration = index === notes.length - 1 ? 0.9 : 0.22;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = index === notes.length - 1 ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.3, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);
      });
    } catch {
      // ignore
    }
  }

  public playCelebration() {
    this.playWinFanfare();
  }
}

export const sounds = new SoundManager();
