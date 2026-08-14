// Synthesized Audio Effects using Web Audio API

class SoundManager {
  private ctx: AudioContext | null = null;
  public soundEnabled: boolean = true;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public playClick() {
    if (!this.soundEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {
      // ignore audio errors
    }
  }

  public playTick(pitchMultiplier = 1) {
    if (!this.soundEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      const baseFreq = 520 * pitchMultiplier;
      osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.035);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.035);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.035);
    } catch {
      // ignore
    }
  }

  public playMysteryShaking() {
    if (!this.soundEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      for (let i = 0; i < 4; i++) {
        const time = this.ctx.currentTime + i * 0.08;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(240 + i * 40, time);

        gain.gain.setValueAtTime(0.1, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

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
      this.initCtx();
      if (!this.ctx) return;

      // Joyful 5-note fanfare
      const notes = [440, 554.37, 659.25, 880, 1108.73]; // A4, C#5, E5, A5, C#6
      const now = this.ctx.currentTime;

      notes.forEach((freq, index) => {
        if (!this.ctx) return;
        const startTime = now + index * 0.12;
        const duration = index === notes.length - 1 ? 0.8 : 0.2;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.25, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

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
