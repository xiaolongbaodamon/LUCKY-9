/**
 * Web Audio API Engine with Spatialized Sound for Lucky 9 3D Casino
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private sfxVolume: number = 0.8;
  private ambientVolume: number = 0.25;
  private spatialAudioEnabled: boolean = true;
  private ambientOscillators: { osc: OscillatorNode; gain: GainNode }[] = [];
  private ambientPlaying: boolean = false;

  constructor() {
    // Lazy init AudioContext on user interaction
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.ambientPlaying) {
      this.stopAmbient();
    }
  }

  public getMuted() {
    return this.isMuted;
  }

  public setSfxVolume(vol: number) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
  }

  public getSfxVolume() {
    return this.sfxVolume;
  }

  public setSpatialEnabled(enabled: boolean) {
    this.spatialAudioEnabled = enabled;
  }

  public isSpatialEnabled() {
    return this.spatialAudioEnabled;
  }

  /**
   * Helper to create a spatialized node (StereoPanner or 3D Panner)
   * pan: -1 (far left/player), 0 (center), +1 (far right/banker)
   */
  private createPanner(ctx: AudioContext, pan: number = 0): AudioNode {
    if (!this.spatialAudioEnabled || pan === 0) {
      const gain = ctx.createGain();
      gain.gain.value = 1;
      return gain;
    }

    if (ctx.createStereoPanner) {
      const panner = ctx.createStereoPanner();
      panner.pan.value = Math.max(-1, Math.min(1, pan));
      return panner;
    }

    const gain = ctx.createGain();
    gain.gain.value = 1;
    return gain;
  }

  /**
   * Card Slide Sound: friction swoosh as card slides out of shoe
   * pan: -0.8 (left), 0.8 (right)
   */
  public playCardSlide(pan: number = -0.3) {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;

      // Noise buffer for paper/felt friction
      const bufferSize = ctx.sampleRate * 0.18;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, now);
      filter.frequency.exponentialRampToValueAtTime(700, now + 0.16);
      filter.Q.setValueAtTime(2.2, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.35 * this.sfxVolume, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);

      const panner = this.createPanner(ctx, pan);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(panner);
      panner.connect(ctx.destination);

      noise.start(now);
      noise.stop(now + 0.18);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  /**
   * Card Flip Sound: snappy snap/flick
   */
  public playCardFlip(pan: number = 0) {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;

      // Short resonant click
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.4 * this.sfxVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      // Add high-end snap
      const snapOsc = ctx.createOscillator();
      snapOsc.type = 'triangle';
      snapOsc.frequency.setValueAtTime(1800, now);
      snapOsc.frequency.exponentialRampToValueAtTime(300, now + 0.04);

      const snapGain = ctx.createGain();
      snapGain.gain.setValueAtTime(0.3 * this.sfxVolume, now);
      snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      const panner = this.createPanner(ctx, pan);

      osc.connect(gain);
      snapOsc.connect(snapGain);
      gain.connect(panner);
      snapGain.connect(panner);
      panner.connect(ctx.destination);

      osc.start(now);
      snapOsc.start(now);
      osc.stop(now + 0.1);
      snapOsc.stop(now + 0.05);
    } catch {
      // Audio error safety
    }
  }

  /**
   * Chip Clink: ceramic collision sound with realistic pitch
   */
  public playChipClink(pan: number = 0, pitchVariation: number = 1.0) {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;

      const baseFreq = 2200 * pitchVariation;
      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(baseFreq, now);
      osc1.frequency.exponentialRampToValueAtTime(baseFreq * 0.85, now + 0.06);

      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(baseFreq * 1.58, now);
      osc2.frequency.exponentialRampToValueAtTime(baseFreq * 1.2, now + 0.05);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.25 * this.sfxVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      const panner = this.createPanner(ctx, pan);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(panner);
      panner.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.09);
      osc2.stop(now + 0.09);
    } catch {
      // Audio safety
    }
  }

  /**
   * Multiple chips stack rattle
   */
  public playChipStack(pan: number = 0) {
    this.playChipClink(pan, 1.0);
    setTimeout(() => this.playChipClink(pan, 1.15), 45);
    setTimeout(() => this.playChipClink(pan, 0.9), 90);
  }

  /**
   * Chip Toss on felt table
   */
  public playChipToss(pan: number = 0) {
    this.playCardSlide(pan * 0.5);
    setTimeout(() => this.playChipClink(pan, 1.08), 80);
  }

  /**
   * Win Chime: Harmonious celebratory fanfare
   */
  public playWinFanfare(isNatural: boolean = false) {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;

      // Chord progression: C5, E5, G5, B5, C6
      const notes = isNatural
        ? [523.25, 659.25, 783.99, 1046.5, 1318.51] // High sparkling fanfare for Natural 9
        : [440.0, 554.37, 659.25, 880.0]; // Elegant major chord

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        osc.type = isNatural ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        const gain = ctx.createGain();
        const start = now + idx * 0.08;
        gain.gain.setValueAtTime(0.01, start);
        gain.gain.linearRampToValueAtTime(0.35 * this.sfxVolume, start + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, start + (isNatural ? 0.9 : 0.6));

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 1.0);
      });
    } catch {
      // Safe fallback
    }
  }

  /**
   * Natural 9 Jackpot celebration sound
   */
  public playNatural9Celebration() {
    this.playWinFanfare(true);
    setTimeout(() => {
      try {
        const ctx = this.initContext();
        const now = ctx.currentTime;
        const shimmer = ctx.createOscillator();
        shimmer.type = 'sine';
        shimmer.frequency.setValueAtTime(1046.5, now);
        shimmer.frequency.exponentialRampToValueAtTime(2093.0, now + 0.5);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.2 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        shimmer.connect(gain);
        gain.connect(ctx.destination);

        shimmer.start(now);
        shimmer.stop(now + 0.65);
      } catch {
        // Safe
      }
    }, 200);
  }

  /**
   * Tension heart-thump: Low bass rumble when awaiting 3rd card
   */
  public playTensionPulse() {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(85, now);
      osc.frequency.exponentialRampToValueAtTime(42, now + 0.25);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.45 * this.sfxVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.32);
    } catch {
      // Safe
    }
  }

  /**
   * Loss chord
   */
  public playLossSound() {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;
      const notes = [311.13, 293.66, 261.63]; // Descending minor

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, now);

        const gain = ctx.createGain();
        const start = now + idx * 0.1;
        gain.gain.setValueAtTime(0.2 * this.sfxVolume, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.45);
      });
    } catch {
      // Safe
    }
  }

  /**
   * Subtle UI Button Click
   */
  public playButtonClick() {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1100, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.03);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.12 * this.sfxVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch {
      // Safe
    }
  }

  /**
   * Ambient Casino Lounge Atmosphere generator (smooth filtered chords)
   */
  public toggleAmbient() {
    if (this.ambientPlaying) {
      this.stopAmbient();
    } else {
      this.startAmbient();
    }
    return this.ambientPlaying;
  }

  public isAmbientActive() {
    return this.ambientPlaying;
  }

  public startAmbient() {
    if (this.isMuted || this.ambientPlaying) return;
    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;
      const freqs = [130.81, 164.81, 196.0, 246.94]; // C3, E3, G3, B3 warm drone

      this.ambientOscillators = freqs.map((freq) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(320, now);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.02 * this.ambientVolume, now + 2);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        return { osc, gain };
      });

      this.ambientPlaying = true;
    } catch {
      this.ambientPlaying = false;
    }
  }

  public stopAmbient() {
    if (!this.ambientPlaying || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      this.ambientOscillators.forEach(({ osc, gain }) => {
        gain.gain.linearRampToValueAtTime(0.0001, now + 0.8);
        osc.stop(now + 0.85);
      });
      this.ambientOscillators = [];
      this.ambientPlaying = false;
    } catch {
      this.ambientOscillators = [];
      this.ambientPlaying = false;
    }
  }
}

export const soundEngine = new SoundEngine();
