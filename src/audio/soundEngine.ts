/**
 * Audio Engine for "طريق الغيوم"
 * Implements a generative piano progression, wind atmosphere, rain/storm,
 * crystal chimes, and soft collision effects using the Web Audio API.
 * Completely standalone with zero external audio assets.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isSfxMuted: boolean = false; // Unified Sound Effects & Wind / Weather Ambience
  private masterVolume: number = 0.8;
  private sfxVolume: number = 0.5; // Soft comfortable ambient default
  private masterGain: GainNode | null = null;
  private windBusGain: GainNode | null = null; // Wind & Weather Ambience bus
  private sfxGain: GainNode | null = null; // Sound effects bus

  // Wind nodes (Warm organic breeze architecture)
  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private windLowpass: BiquadFilterNode | null = null;
  private windLfo: OscillatorNode | null = null;
  private windSource: AudioNode | null = null;

  // Rain nodes
  private rainGain: GainNode | null = null;
  private rainSource: AudioNode | null = null;

  public init() {
    if (this.ctx) return;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Sub-busses for SFX and Wind/Weather Ambience (controlled together via SFX)
      this.windBusGain = this.ctx.createGain();
      this.windBusGain.gain.setValueAtTime(this.isSfxMuted ? 0 : this.sfxVolume, this.ctx.currentTime);
      this.windBusGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.isSfxMuted ? 0 : this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.setupWindGenerator();
      this.setupRainGenerator();
    } catch (e) {
      console.warn('Web Audio API not supported in this environment', e);
    }
  }

  public resume(): Promise<void> {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      return this.ctx.resume().catch(() => {});
    }
    return Promise.resolve();
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime, 0.05);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setMasterVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime, 0.05);
    }
  }

  public getMasterVolume(): number {
    return this.masterVolume;
  }

  // Unified SFX & Wind / Weather Ambience toggle
  public toggleSfx(): boolean {
    this.isSfxMuted = !this.isSfxMuted;
    this.applySfxGain();
    return this.isSfxMuted;
  }

  public setSfxMuted(muted: boolean) {
    this.isSfxMuted = muted;
    this.applySfxGain();
  }

  public getSfxMuted(): boolean {
    return this.isSfxMuted;
  }

  public setSfxVolume(vol: number) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    this.applySfxGain();
  }

  public getSfxVolume(): number {
    return this.sfxVolume;
  }

  private applySfxGain() {
    if (this.ctx) {
      const targetGain = this.isSfxMuted ? 0 : this.sfxVolume;
      if (this.sfxGain) {
        this.sfxGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
      }
      if (this.windBusGain) {
        this.windBusGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
      }
    }
  }

  // Backwards-compatible stubs
  public toggleMusic(): boolean { return true; }
  public getMusicMuted(): boolean { return true; }
  public toggleWind(): boolean { return this.toggleSfx(); }
  public getWindMuted(): boolean { return this.isSfxMuted; }
  public startAmbientMusic(): void {}
  public stopAmbientMusic(): void {}

  // --- Wind Noise Synthesis (Warm, Soft Organic Breeze - No harsh whistling or static) ---
  private setupWindGenerator() {
    if (!this.ctx || !this.masterGain) return;

    // Generate warm 3-pole Pink/Brown noise (removes harsh high-frequency static hiss completely)
    const bufferSize = this.ctx.sampleRate * 3;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Gentle 3-stage integrator for deep, velvety natural breeze
      b0 = 0.992 * b0 + white * 0.04;
      b1 = 0.96 * b1 + b0 * 0.12;
      b2 = 0.91 * b2 + b1 * 0.22;
      output[i] = b2 * 1.2;
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    // Stage 1: Warm body filter (low Q = 0.85, wide & gentle - zero tea-kettle whistling)
    const bodyFilter = this.ctx.createBiquadFilter();
    bodyFilter.type = 'bandpass';
    bodyFilter.frequency.setValueAtTime(220, this.ctx.currentTime);
    bodyFilter.Q.setValueAtTime(0.85, this.ctx.currentTime);

    // Stage 2: Ceiling lowpass filter (strictly cuts out any abrasive/treble hiss above 380Hz)
    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(360, this.ctx.currentTime);

    // Stage 3: Soft ambient gain (whisper level)
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.016, this.ctx.currentTime);

    // Stage 4: Gentle organic breathing LFO (0.15 Hz sine wave for natural rolling breeze)
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.15, this.ctx.currentTime);
    lfoGain.gain.setValueAtTime(0.004, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);

    noiseSource.connect(bodyFilter);
    bodyFilter.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(this.windBusGain || this.masterGain);

    try {
      noiseSource.start(0);
      lfo.start(0);
    } catch {
      // Ignored
    }

    this.windSource = noiseSource;
    this.windFilter = bodyFilter;
    this.windLowpass = lowpass;
    this.windLfo = lfo;
    this.windGain = gain;
  }

  // --- Rain Noise Synthesis ---
  private setupRainGenerator() {
    if (!this.ctx || !this.masterGain) return;

    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02; // Pink-ish filter
      lastOut = output[i];
      output[i] *= 3.5;
    }

    const rainSource = this.ctx.createBufferSource();
    rainSource.buffer = noiseBuffer;
    rainSource.loop = true;

    const rainFilter = this.ctx.createBiquadFilter();
    rainFilter.type = 'lowpass';
    rainFilter.frequency.setValueAtTime(1200, this.ctx.currentTime);

    const rainGain = this.ctx.createGain();
    rainGain.gain.setValueAtTime(0.0, this.ctx.currentTime); // Off by default

    rainSource.connect(rainFilter);
    rainFilter.connect(rainGain);
    rainGain.connect(this.windBusGain || this.masterGain);

    try {
      rainSource.start(0);
    } catch {
      // Ignored
    }

    this.rainSource = rainSource;
    this.rainGain = rainGain;
  }

  public setWeather(isStorm: boolean) {
    if (!this.ctx || !this.rainGain) return;
    const target = isStorm ? 0.18 : 0.0;
    this.rainGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.5);
  }

  public updateWindIntensity(velocityRatio: number, inWindZone: boolean, vy: number = 0) {
    if (!this.ctx || !this.windGain || !this.windFilter) return;

    // Gentle, soothing pitch adjustment (never shrill or whistling)
    // Upward glide gently opens air filter, downward glide softly deepens tone
    const verticalMod = -vy * 22;
    const verticalSpeedMagnitude = Math.abs(vy);

    // Warm, deep frequency clamped strictly between 130Hz and 360Hz (velvety soft air)
    const baseFreq = 175 + velocityRatio * 85 + (inWindZone ? 60 : 0) + verticalMod;
    const clampedFreq = Math.max(130, Math.min(baseFreq, 360));

    // Ceiling lowpass tracking strictly caps high-frequency hiss
    const lowpassFreq = Math.max(220, Math.min(clampedFreq * 1.45, 460));

    // Soft volume: base is whisper-quiet (0.015), swells softly in wind stream (0.035 - 0.045 max)
    const windZoneBoost = inWindZone ? 0.018 : 0;
    const speedBoost = Math.min(0.014, (velocityRatio + verticalSpeedMagnitude * 0.2) * 0.01);
    const targetVolume = Math.min(0.046, 0.015 + windZoneBoost + speedBoost);

    // Keep Q soft and wide (0.8 - 1.05) - NO tea-kettle whistling or peak resonance
    const dynamicQ = 0.85 + Math.min(0.2, verticalSpeedMagnitude * 0.04);

    const now = this.ctx.currentTime;
    this.windFilter.Q.setTargetAtTime(dynamicQ, now, 0.2);
    this.windFilter.frequency.setTargetAtTime(clampedFreq, now, 0.2);
    if (this.windLowpass) {
      this.windLowpass.frequency.setTargetAtTime(lowpassFreq, now, 0.25);
    }
    this.windGain.gain.setTargetAtTime(targetVolume, now, 0.25);
  }

  // --- Sound Effects ---

  // Memory Shard chime (Crystal bell)
  public playShardChime() {
    if (!this.ctx || !this.masterGain || this.isMuted || this.isSfxMuted) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6

    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      gain.gain.setValueAtTime(0.001, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.12, now + idx * 0.06 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 1.8);

      osc.connect(gain);
      gain.connect(this.sfxGain || this.masterGain!);

      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 1.9);
    });
  }

  // Soft checkpoint save sound (Warm gentle pulse)
  public playCheckpointSound() {
    if (!this.ctx || !this.masterGain || this.isMuted || this.isSfxMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(392, now); // G4
    osc.frequency.exponentialRampToValueAtTime(523.25, now + 0.3); // C5

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.09, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

    osc.connect(gain);
    gain.connect(this.sfxGain || this.masterGain!);

    osc.start(now);
    osc.stop(now + 0.7);
  }

  // Gentle wind gust sound on resume/retry (Soft sine swell)
  public playWindGustSound() {
    if (!this.ctx || !this.masterGain || this.isMuted || this.isSfxMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.25);
    osc.frequency.exponentialRampToValueAtTime(260, now + 0.5);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.032, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

    osc.connect(gain);
    gain.connect(this.sfxGain || this.masterGain!);

    osc.start(now);
    osc.stop(now + 0.6);
  }

  // Soft collision rewind (Gentle calming sine drop)
  public playSoftRewindSound() {
    if (!this.ctx || !this.masterGain || this.isMuted || this.isSfxMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(360, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.4);

    gain.gain.setValueAtTime(0.035, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    osc.connect(gain);
    gain.connect(this.sfxGain || this.masterGain!);

    osc.start(now);
    osc.stop(now + 0.5);
  }

  // Atmospheric gentle defeat sound (soft minor chord chime)
  public playDefeatSound() {
    if (!this.ctx || !this.masterGain || this.isMuted || this.isSfxMuted) return;
    const now = this.ctx.currentTime;

    [261.63, 220.0, 174.61].forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.06);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.94, now + 0.9);
      gain.gain.setValueAtTime(0.07, now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.0);
      osc.connect(gain);
      gain.connect(this.sfxGain || this.masterGain!);
      osc.start(now + i * 0.06);
      osc.stop(now + 1.1);
    });
  }

  // Child's distant laughter & warm music box chime (for the final reunion)
  public playReunionMelody() {
    if (!this.ctx || !this.masterGain || this.isMuted || this.isSfxMuted) return;
    const now = this.ctx.currentTime;

    // A joyful pentatonic music-box lullaby
    const melody = [
      { f: 523.25, t: 0.0 },
      { f: 659.25, t: 0.3 },
      { f: 783.99, t: 0.6 },
      { f: 1046.50, t: 0.9 },
      { f: 880.00, t: 1.4 },
      { f: 783.99, t: 1.8 },
      { f: 1046.50, t: 2.3 },
    ];

    melody.forEach(item => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(item.f, now + item.t);

      gain.gain.setValueAtTime(0.0001, now + item.t);
      gain.gain.exponentialRampToValueAtTime(0.18, now + item.t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.00001, now + item.t + 2.0);

      osc.connect(gain);
      gain.connect(this.sfxGain || this.masterGain!);

      osc.start(now + item.t);
      osc.stop(now + item.t + 2.1);
    });

    // Harmonic child-like laughter frequencies (twinkling harmonics)
    const sparkles = [1200, 1400, 1600, 1800, 1500, 1300];
    sparkles.forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + 1.2 + i * 0.08);

      gain.gain.setValueAtTime(0.001, now + 1.2 + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.04, now + 1.2 + i * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2 + i * 0.08 + 0.4);

      osc.connect(gain);
      gain.connect(this.sfxGain || this.masterGain!);

      osc.start(now + 1.2 + i * 0.08);
      osc.stop(now + 1.2 + i * 0.08 + 0.5);
    });
  }

  // Ethereal poetic voice-over accompaniment aura (warm harmonic chord pad)
  public playNarratorAura() {
    if (!this.ctx || !this.masterGain || this.isMuted || this.isSfxMuted) return;
    const now = this.ctx.currentTime;

    // Frequencies of a warm Ebmaj9 celestial chord: Eb3, G3, Bb3, D4, F4
    const auraNotes = [155.56, 196.00, 233.08, 293.66, 349.23];

    auraNotes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      // Very soft slow blooming swell and gentle release
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.025, now + 0.6 + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.00001, now + 3.8);

      osc.connect(gain);
      gain.connect(this.sfxGain || this.masterGain!);

      osc.start(now);
      osc.stop(now + 4.0);
    });
  }

  public getContext(): AudioContext | null {
    return this.ctx;
  }

  public getMasterGain(): GainNode | null {
    return this.masterGain;
  }
}

export const soundEngine = new SoundEngine();
