/**
 * Narrator Audio Engine for "طريق الغيوم"
 * Provides atmospheric voice-over narration for poetic memories, story moments,
 * and level transitions.
 *
 * Employs a robust multi-layered audio pipeline:
 * 1. Primary: High-fidelity Arabic neural audio streamed from /api/tts decoded directly
 *    into Web Audio API buffers for zero-latency, cross-platform audio that works in all
 *    browsers, OSes, and iframes without needing local OS voice packs.
 * 2. Secondary fallback: HTML5 Audio streaming.
 * 3. Offline fallback: Native Browser SpeechSynthesis API with Chromium race-condition fixes.
 * 4. Ambient accompaniment: Ethereal harmonic aura from soundEngine.
 */

import { soundEngine } from './soundEngine';

export type NarratorListener = (state: { isSpeaking: boolean; currentText: string | null }) => void;

const getRuntimeTtsBase = (): string => {
  const globalConfig = (globalThis as typeof globalThis & {
    GAME_CONFIG?: { ttsBaseUrl?: string };
  }).GAME_CONFIG;

  const viteEnv = (import.meta as ImportMeta & {
    env?: { VITE_TTS_BASE_URL?: string };
  }).env;

  const configuredBase = globalConfig?.ttsBaseUrl ?? viteEnv?.VITE_TTS_BASE_URL ?? '';
  if (!configuredBase) return '';
  return configuredBase.replace(/\/+$/, '');
};

const buildTtsUrl = (cleanText: string): string => {
  const textParam = encodeURIComponent(cleanText);
  const base = getRuntimeTtsBase();

  if (!base) {
    return '';
  }

  if (base.endsWith('/api/tts')) {
    return `${base}?v=shakir-sole&text=${textParam}`;
  }

  if (base.endsWith('/api')) {
    return `${base}/tts?v=shakir-sole&text=${textParam}`;
  }

  return `${base}/api/tts?v=shakir-sole&text=${textParam}`;
};

class NarratorEngine {
  private isMuted: boolean = false;
  private volume: number = 0.9;
  private isSpeaking: boolean = false;
  private currentText: string | null = null;
  private listeners: Set<NarratorListener> = new Set();

  // Web Audio & Stream playback state
  private activeSource: AudioBufferSourceNode | null = null;
  private activeHtmlAudio: HTMLAudioElement | null = null;
  private audioBufferCache: Map<string, AudioBuffer> = new Map();
  private narratorGainNode: GainNode | null = null;
  private abortController: AbortController | null = null;

  // SpeechSynthesis fallback state
  private activeUtterances: Set<SpeechSynthesisUtterance> = new Set();
  private cachedVoice: SpeechSynthesisVoice | null = null;
  private keepAliveTimer: number | null = null;
  private isUnlocked: boolean = false;

  // Queue system for sequential story pacing
  private queue: Array<{
    text: string;
    options?: {
      rate?: number;
      pitch?: number;
      onStart?: () => void;
      onEnd?: () => void;
      skipHarmonic?: boolean;
      enqueue?: boolean;
    };
    resolve: (val: boolean) => void;
  }> = [];
  private queueTimer: number | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      // Auto unlock speech synthesis and audio context on first user interaction
      const unlockHandler = () => {
        this.unlock();
        window.removeEventListener('pointerdown', unlockHandler);
        window.removeEventListener('keydown', unlockHandler);
        window.removeEventListener('touchstart', unlockHandler);
      };
      window.addEventListener('pointerdown', unlockHandler, { passive: true });
      window.addEventListener('keydown', unlockHandler, { passive: true });
      window.addEventListener('touchstart', unlockHandler, { passive: true });

      if ('speechSynthesis' in window) {
        this.loadSpeechSynthesisVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
          window.speechSynthesis.onvoiceschanged = () => {
            this.loadSpeechSynthesisVoices();
          };
        }
      }

      // Prewarm the story intro audio immediately in the background
      this.preload(
        'في يومٍ صيفي باغتته الرياح، انفلت من يد صاحبه، ليمضي في رحلة عبور ملحمية بين الآفاق وتيارات السحاب. رافق الخيط في مساره، واجمع قبسات الذكرى المضيئة، ليعود إلى حيث بدأ'
      );
    }
  }

  /**
   * Pre-fetches audio from TTS endpoint into memory cache
   */
  public async preload(text: string) {
    const cleanText = this.sanitizeText(text);
    if (!cleanText || this.audioBufferCache.has(cleanText)) return;

    const url = buildTtsUrl(cleanText);
    if (!url) return;

    try {
      const res = await fetch(url);
      if (!res.ok) return;
      const arrayBuf = await res.arrayBuffer();
      const ctx = soundEngine.getContext();
      if (ctx) {
        const bufferCopy = arrayBuf.slice(0);
        ctx.decodeAudioData(
          bufferCopy,
          (buf) => {
            this.audioBufferCache.set(cleanText, buf);
          },
          () => {}
        );
      }
    } catch {
      // Ignore background preload errors
    }
  }

  /**
   * Unlocks both the Web Audio API context and browser speech synthesis engine
   */
  public unlock() {
    this.isUnlocked = true;

    // Unlock Web Audio Context
    soundEngine.init();
    soundEngine.resume();

    // Unlock SpeechSynthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        this.loadSpeechSynthesisVoices();
      } catch (e) {
        console.warn('Could not unlock speech synthesis', e);
      }
    }
  }

  private getNarratorGain(): GainNode | null {
    const ctx = soundEngine.getContext();
    const master = soundEngine.getMasterGain();
    if (!ctx || !master) return null;

    if (!this.narratorGainNode) {
      this.narratorGainNode = ctx.createGain();
      this.narratorGainNode.gain.setValueAtTime(this.isMuted ? 0 : this.volume, ctx.currentTime);
      this.narratorGainNode.connect(master);
    }
    return this.narratorGainNode;
  }

  public subscribe(listener: NarratorListener): () => void {
    this.listeners.add(listener);
    listener({ isSpeaking: this.isSpeaking, currentText: this.currentText });
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener({ isSpeaking: this.isSpeaking, currentText: this.currentText });
      } catch (e) {
        console.error('Error notifying narrator listener', e);
      }
    });
  }

  /**
   * Cleans text for seamless natural voice cadence
   */
  private sanitizeText(rawText: string): string {
    let clean = rawText
      .replace(/^[\s.•\-–—"“'«»\d]+/, '')
      .replace(/[\s.•\-–—"“'«»]+$/, '')
      .replace(/\.{2,}/g, '، ')
      .replace(/[•«»"“”*]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!clean.endsWith('.') && !clean.endsWith('!') && !clean.endsWith('؟') && !clean.endsWith('،')) {
      clean += '.';
    }
    return clean;
  }

  /**
   * Narrates a given text using high-fidelity Arabic voice streaming
   * with automatic fallback to SpeechSynthesis.
   * If already speaking and enqueue is not false, peacefully queues the text
   * so the current sentence is NEVER cut off.
   */
  public async speak(
    text: string,
    options?: {
      rate?: number;
      pitch?: number;
      onStart?: () => void;
      onEnd?: () => void;
      skipHarmonic?: boolean;
      enqueue?: boolean;
    }
  ): Promise<boolean> {
    if (this.isMuted) return false;

    this.unlock();

    // If already speaking, queue it so current sentence finishes completely
    if (this.isSpeaking && options?.enqueue !== false) {
      return new Promise<boolean>((resolve) => {
        this.queue.push({ text, options, resolve });
      });
    }

    // Direct immediate playback: stop previous and speak now
    this.stop();
    return this.playImmediate(text, options);
  }

  /**
   * Internal player for immediate text narration
   */
  private async playImmediate(
    text: string,
    options?: {
      rate?: number;
      pitch?: number;
      onStart?: () => void;
      onEnd?: () => void;
      skipHarmonic?: boolean;
      enqueue?: boolean;
    }
  ): Promise<boolean> {
    const cleanText = this.sanitizeText(text);
    if (!cleanText) return false;

    // Abort controller for network requests
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    // Step 1: Try high-quality streaming audio from /api/tts via Web Audio
    try {
      const playedViaAudioApi = await this.playViaWebAudio(cleanText, signal, options);
      if (playedViaAudioApi) {
        return true;
      }
    } catch {
      // Ignore and proceed to next fallback
    }

    if (signal.aborted) return false;

    // Step 2: Try HTML5 Audio fallback
    try {
      const playedViaHtml = await this.playViaHtmlAudio(cleanText, signal, options);
      if (playedViaHtml) {
        return true;
      }
    } catch {
      // Ignore and proceed to SpeechSynthesis
    }

    if (signal.aborted) return false;

    // Step 3: Offline fallback via browser SpeechSynthesis
    const playedViaSynth = await this.speakViaSpeechSynthesis(cleanText, text, options);
    if (playedViaSynth) {
      return true;
    }

    // If all audio playback methods failed (e.g. browser autoplay restriction)
    this.isSpeaking = false;
    this.currentText = null;
    this.notify();
    return false;
  }

  /**
   * Handles natural completion of a narration and advances the queue after a contemplative pause
   */
  private handleNarrationFinish(options?: { onStart?: () => void; onEnd?: () => void }) {
    this.isSpeaking = false;
    this.currentText = null;
    this.notify();

    try {
      options?.onEnd?.();
    } catch (e) {
      console.warn('onEnd callback error:', e);
    }

    if (this.queueTimer) {
      window.clearTimeout(this.queueTimer);
      this.queueTimer = null;
    }

    // Peaceful 1.0s breath pause before starting next queued sentence
    if (this.queue.length > 0 && !this.isMuted) {
      this.queueTimer = window.setTimeout(() => {
        this.queueTimer = null;
        const next = this.queue.shift();
        if (next && !this.isMuted) {
          next.options?.onStart?.();
          this.playImmediate(next.text, next.options).then(next.resolve);
        }
      }, 1000);
    }
  }

  /**
   * Plays speech using Web Audio API buffer (crystal clear, low-latency, works in iframes)
   */
  private async playViaWebAudio(
    cleanText: string,
    signal: AbortSignal,
    options?: { onEnd?: () => void; skipHarmonic?: boolean }
  ): Promise<boolean> {
    const ctx = soundEngine.getContext();
    if (!ctx) return false;

    // Ensure audio context is resumed
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch {
        // Blocked by browser autoplay policy
      }
    }

    if (ctx.state !== 'running') {
      // AudioContext is not running yet (needs user gesture)
      return false;
    }

    let audioBuffer = this.audioBufferCache.get(cleanText);

    const ttsUrl = buildTtsUrl(cleanText);
    if (!audioBuffer && ttsUrl) {
      try {
        const res = await fetch(ttsUrl, { signal });
        if (!res.ok) return false;

        const arrayBuf = await res.arrayBuffer();
        if (signal.aborted) return false;

        const bufferCopy = arrayBuf.slice(0);
        audioBuffer = await new Promise<AudioBuffer>((resolve, reject) => {
          ctx.decodeAudioData(bufferCopy, resolve, (err) => {
            reject(err || new Error('Audio decoding failed'));
          });
        });
        this.audioBufferCache.set(cleanText, audioBuffer);
      } catch {
        return false;
      }
    }

    if (!audioBuffer) {
      return false;
    }

    if (signal.aborted) return false;

    // Connect through warm acoustic filter for rich masculine tone
    const lowShelf = ctx.createBiquadFilter();
    lowShelf.type = 'lowshelf';
    lowShelf.frequency.setValueAtTime(200, ctx.currentTime);
    lowShelf.gain.setValueAtTime(1.8, ctx.currentTime); // Warm male chest resonance

    const highShelf = ctx.createBiquadFilter();
    highShelf.type = 'highshelf';
    highShelf.frequency.setValueAtTime(7000, ctx.currentTime);
    highShelf.gain.setValueAtTime(-1.0, ctx.currentTime); // Smooth poetic roll-off

    const gainNode = this.getNarratorGain();
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;

    source.connect(lowShelf);
    lowShelf.connect(highShelf);
    highShelf.connect(gainNode || ctx.destination);

    this.activeSource = source;
    this.isSpeaking = true;
    this.currentText = cleanText;
    this.notify();

    if (!options?.skipHarmonic) {
      soundEngine.playNarratorAura();
    }

    source.onended = () => {
      if (this.activeSource === source) {
        this.activeSource = null;
        this.handleNarrationFinish(options);
      }
    };

    source.start(0);
    return true;
  }

  /**
   * Plays speech using standard HTML5 Audio element
   */
  private playViaHtmlAudio(
    cleanText: string,
    signal: AbortSignal,
    options?: { onStart?: () => void; onEnd?: () => void; skipHarmonic?: boolean }
  ): Promise<boolean> {
    return new Promise((resolve) => {
      if (signal.aborted) {
        resolve(false);
        return;
      }

      const ttsUrl = buildTtsUrl(cleanText);
      if (!ttsUrl) {
        resolve(false);
        return;
      }

      const audio = new Audio(ttsUrl);
      this.activeHtmlAudio = audio;

      let hasStarted = false;

      const onDone = (success: boolean) => {
        if (this.activeHtmlAudio === audio) {
          this.activeHtmlAudio = null;
          this.handleNarrationFinish(options);
        }
        if (!hasStarted) {
          resolve(success);
        }
      };

      audio.onended = () => onDone(true);
      audio.onerror = () => onDone(false);

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            hasStarted = true;
            this.isSpeaking = true;
            this.currentText = cleanText;
            this.notify();
            if (!options?.skipHarmonic) {
              soundEngine.playNarratorAura();
            }
            resolve(true);
          })
          .catch(() => {
            onDone(false);
          });
      } else {
        hasStarted = true;
        this.isSpeaking = true;
        this.currentText = cleanText;
        this.notify();
        resolve(true);
      }
    });
  }

  /**
   * Browser SpeechSynthesis fallback with Chromium race-condition fixes
   */
  private speakViaSpeechSynthesis(
    cleanText: string,
    rawText: string,
    options?: { rate?: number; pitch?: number; onEnd?: () => void }
  ): Promise<boolean> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        resolve(false);
        return;
      }

      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }

        const utterance = new SpeechSynthesisUtterance(cleanText);
        if (!this.cachedVoice) {
          this.loadSpeechSynthesisVoices();
        }

        if (this.cachedVoice) {
          utterance.voice = this.cachedVoice;
          utterance.lang = this.cachedVoice.lang || 'ar-SA';
        } else {
          utterance.lang = 'ar-SA';
        }

        const isRecognizedMale = Boolean(
          this.cachedVoice &&
            /hamed|حامد|maged|ماجد|tarik|طارق|shakir|شاكر|naayf|نايف|zayd|زيد|bassam|بسام|bilal|بلال|male|man/i.test(
              this.cachedVoice.name
            )
        );

        // Calm, reflective storytelling pace with masculine pitch
        utterance.rate = options?.rate ?? 0.88;
        utterance.pitch = options?.pitch ?? (isRecognizedMale ? 0.85 : 0.62);
        utterance.volume = 1.0;

        this.activeUtterances.add(utterance);

        let hasStarted = false;

        const cleanup = () => {
          this.activeUtterances.delete(utterance);
          if (this.keepAliveTimer) {
            window.clearInterval(this.keepAliveTimer);
            this.keepAliveTimer = null;
          }
          this.handleNarrationFinish(options);
        };

        utterance.onstart = () => {
          hasStarted = true;
          this.isSpeaking = true;
          this.currentText = rawText;
          this.notify();
          resolve(true);

          this.keepAliveTimer = window.setInterval(() => {
            if (this.isSpeaking && typeof window !== 'undefined' && 'speechSynthesis' in window) {
              try {
                window.speechSynthesis.pause();
                window.speechSynthesis.resume();
              } catch {}
            } else if (this.keepAliveTimer) {
              window.clearInterval(this.keepAliveTimer);
              this.keepAliveTimer = null;
            }
          }, 10000);
        };

        utterance.onend = () => {
          cleanup();
        };

        utterance.onerror = (e) => {
          if (e.error !== 'interrupted' && e.error !== 'canceled') {
            console.warn('SpeechSynthesis fallback error:', e);
          }
          cleanup();
          if (!hasStarted) {
            resolve(false);
          }
        };

        window.speechSynthesis.speak(utterance);

        // Safety timeout if speech synthesis doesn't trigger start
        setTimeout(() => {
          if (!hasStarted && !this.isSpeaking) {
            resolve(false);
          }
        }, 400);
      } catch (err) {
        console.warn('SpeechSynthesis failed:', err);
        resolve(false);
      }
    });
  }

  private loadSpeechSynthesisVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const arabicVoices = voices.filter(
          (v) => v.lang && v.lang.toLowerCase().replace('_', '-').startsWith('ar')
        );
        if (arabicVoices.length > 0) {
          // Prioritize distinguished Arabic male voices
          const maleVoice = arabicVoices.find((v) => {
            const name = (v.name || '').toLowerCase();
            return (
              name.includes('hamed') ||
              name.includes('حامد') ||
              name.includes('maged') ||
              name.includes('ماجد') ||
              name.includes('tarik') ||
              name.includes('طارق') ||
              name.includes('shakir') ||
              name.includes('شاكر') ||
              name.includes('naayf') ||
              name.includes('نايف') ||
              name.includes('zayd') ||
              name.includes('زيد') ||
              name.includes('bassam') ||
              name.includes('بسام') ||
              name.includes('bilal') ||
              name.includes('بلال') ||
              name.includes('male') ||
              name.includes('man')
            );
          });
          this.cachedVoice = maleVoice || arabicVoices[0];
        }
      }
    } catch {
      // Ignore
    }
  }

  /**
   * Stops any currently playing narration immediately and clears pending queue
   */
  public stop() {
    if (this.queueTimer) {
      window.clearTimeout(this.queueTimer);
      this.queueTimer = null;
    }

    // Resolve any remaining items in queue to false
    while (this.queue.length > 0) {
      const item = this.queue.shift();
      item?.resolve(false);
    }

    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    if (this.activeSource) {
      try {
        this.activeSource.stop();
        this.activeSource.disconnect();
      } catch {
        // Ignore if already stopped
      }
      this.activeSource = null;
    }

    if (this.activeHtmlAudio) {
      try {
        this.activeHtmlAudio.pause();
        this.activeHtmlAudio.currentTime = 0;
      } catch {
        // Ignore
      }
      this.activeHtmlAudio = null;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore
      }
    }

    if (this.keepAliveTimer) {
      window.clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }

    this.activeUtterances.clear();
    this.isSpeaking = false;
    this.currentText = null;
    this.notify();
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stop();
    }
    if (this.narratorGainNode && soundEngine.getContext()) {
      this.narratorGainNode.gain.setValueAtTime(
        this.isMuted ? 0 : this.volume,
        soundEngine.getContext()!.currentTime
      );
    }
    return this.isMuted;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.isMuted) {
      this.stop();
    }
    if (this.narratorGainNode && soundEngine.getContext()) {
      this.narratorGainNode.gain.setValueAtTime(
        this.isMuted ? 0 : this.volume,
        soundEngine.getContext()!.currentTime
      );
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.narratorGainNode && soundEngine.getContext()) {
      this.narratorGainNode.gain.setValueAtTime(
        this.isMuted ? 0 : this.volume,
        soundEngine.getContext()!.currentTime
      );
    }
    if (this.activeHtmlAudio) {
      this.activeHtmlAudio.volume = this.volume;
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  public getQueueLength(): number {
    return this.queue.length;
  }

  public getCurrentText(): string | null {
    return this.currentText;
  }
}

export const narrator = new NarratorEngine();
