/**
 * Voice service: Natural Studio Speech & Speech Recognition with Instant Barge-In Interruption
 */

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export class VoiceService {
  private recognition: any = null;
  private isRecognizing: boolean = false;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private dataArray: Uint8Array | null = null;
  private voices: SpeechSynthesisVoice[] = [];

  // Audio Playback for Natural Studio Voice
  private currentAudioElement: HTMLAudioElement | null = null;
  private audioSourceNode: MediaElementAudioSourceNode | null = null;
  private isPlayingNaturalVoice: boolean = false;
  private onSpeakingEndCallback: (() => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionClass =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (SpeechRecognitionClass) {
        this.recognition = new SpeechRecognitionClass();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
      }

      this.loadVoices();
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = () => {
          this.loadVoices();
        };
      }
    }
  }

  public isRecognitionSupported(): boolean {
    return !!this.recognition;
  }

  public isSynthesisSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  private loadVoices() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      this.voices = window.speechSynthesis.getVoices();
    }
  }

  public getVoices(): SpeechSynthesisVoice[] {
    if (this.voices.length === 0) {
      this.loadVoices();
    }
    return this.voices;
  }

  private getOrCreateAudioContext(): AudioContext | null {
    if (!this.audioContext && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
      }
    }
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }
    return this.audioContext;
  }

  /**
   * Plays a lightweight, instantaneous acoustic chime for user cues.
   * Zero network latency, synthesized via Web Audio API.
   */
  public playAudioChime(type: 'cue' | 'mic_open' | 'mic_close' | 'tool_end' | 'answer' = 'cue'): void {
    try {
      const ctx = this.getOrCreateAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'cue') {
        // High-tech subtle dual-tone chime: 587.33Hz (D5) -> 880Hz (A5)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'mic_open') {
        // Rising notification tone
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.08);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'mic_close') {
        // Falling confirmation tone
        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.08);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
        osc.start(now);
        osc.stop(now + 0.11);
      } else if (type === 'tool_end') {
        // Soft positive blip
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.07);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        osc.start(now);
        osc.stop(now + 0.14);
      } else if (type === 'answer') {
        // Subtle arrival tone
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.06);
        osc.frequency.setValueAtTime(783.99, now + 0.12);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      }
    } catch {
      // Ignore audio context errors before user interaction
    }
  }

  /**
   * Play natural spoken cue audio or pleasant acoustic chime.
   * Completely avoids robotic browser synthesis so the voice is 100% natural and consistent.
   */
  public playSpokenCue(cueAudioBase64?: string, rate: number = 1.05): void {
    if (cueAudioBase64) {
      this.playNaturalVoice(cueAudioBase64, { rate });
    } else {
      this.playAudioChime('cue');
    }
  }

  /**
   * Starts microphone input frequency analysis for the visualizer orb.
   */
  public async startAudioAnalysis(onVolumeChange?: (volume: number) => void): Promise<void> {
    try {
      const ctx = this.getOrCreateAudioContext();
      if (!this.mediaStream) {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      }

      if (ctx && this.mediaStream) {
        const source = ctx.createMediaStreamSource(this.mediaStream);
        this.analyser = ctx.createAnalyser();
        this.analyser.fftSize = 64;
        source.connect(this.analyser);

        const bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(bufferLength);

        if (onVolumeChange) {
          const updateVolume = () => {
            if (!this.analyser || !this.dataArray || !this.isRecognizing) return;
            this.analyser.getByteFrequencyData(this.dataArray);
            let sum = 0;
            for (let i = 0; i < this.dataArray.length; i++) {
              sum += this.dataArray[i];
            }
            const average = sum / this.dataArray.length;
            const normalized = Math.min(100, Math.round((average / 128) * 100));
            onVolumeChange(normalized);
            requestAnimationFrame(updateVolume);
          };
          requestAnimationFrame(updateVolume);
        }
      }
    } catch (err) {
      console.warn('Microphone audio analysis fallback to simulated pulse:', err);
    }
  }

  public stopAudioAnalysis() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
    this.analyser = null;
  }

  /**
   * Play studio-quality Natural Voice audio (base64 WAV).
   * Fully interruptible instantly on any user sound or tap.
   */
  public playNaturalVoice(
    audioBase64: string,
    options: {
      rate?: number;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
      onVolumeChange?: (volume: number) => void;
    } = {}
  ): void {
    // Stop any existing voice immediately
    this.stopSpeaking();

    try {
      const audioUrl = `data:audio/wav;base64,${audioBase64}`;
      const audio = new Audio(audioUrl);
      this.currentAudioElement = audio;
      this.isPlayingNaturalVoice = true;
      this.onSpeakingEndCallback = options.onEnd || null;

      if (options.rate && options.rate > 0) {
        audio.playbackRate = options.rate;
      }

      // Connect to Web Audio Analyser so the visualizer pulses with the assistant's voice
      const ctx = this.getOrCreateAudioContext();
      if (ctx && options.onVolumeChange) {
        try {
          const source = ctx.createMediaElementSource(audio);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);
          analyser.connect(ctx.destination);

          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);

          const checkAudioWave = () => {
            if (!this.isPlayingNaturalVoice || audio.paused) return;
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
            const avg = sum / dataArray.length;
            const normalized = Math.min(100, Math.round((avg / 128) * 100));
            options.onVolumeChange?.(normalized);
            requestAnimationFrame(checkAudioWave);
          };

          audio.onplay = () => {
            requestAnimationFrame(checkAudioWave);
          };
        } catch {
          // Cross-origin / media element reuse fallback
        }
      }

      audio.onplay = () => {
        options.onStart?.();
      };

      audio.onended = () => {
        this.isPlayingNaturalVoice = false;
        this.currentAudioElement = null;
        options.onEnd?.();
      };

      audio.onerror = (e) => {
        console.warn('Natural voice playback error, falling back:', e);
        this.isPlayingNaturalVoice = false;
        this.currentAudioElement = null;
        options.onError?.(e);
        options.onEnd?.();
      };

      audio.play().catch((err) => {
        console.warn('Audio play request interrupted or prevented:', err);
        this.isPlayingNaturalVoice = false;
        this.currentAudioElement = null;
        options.onEnd?.();
      });
    } catch (err) {
      console.warn('Natural voice error:', err);
      options.onError?.(err);
      options.onEnd?.();
    }
  }

  /**
   * Speak using browser speech synthesis (fallback or alternative)
   */
  public speakFallback(
    text: string,
    options: {
      rate?: number;
      voiceName?: string;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
    } = {}
  ): void {
    if (!this.isSynthesisSupported() || !text || text.trim().length === 0) {
      options.onEnd?.();
      return;
    }

    this.stopSpeaking();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = (options.rate || 1.0) * 1.05; // Slightly swifter for nimble delivery
    utterance.pitch = 1.02; // Warm, friendly inflection

    const voices = this.getVoices();
    if (options.voiceName) {
      const matched = voices.find((v) => v.name === options.voiceName);
      if (matched) utterance.voice = matched;
    } else {
      // Pick the most natural, human-sounding English voice
      const preferred = voices.find(
        (v) =>
          (v.name.includes('Natural') ||
            v.name.includes('Google') ||
            v.name.includes('Samantha') ||
            v.name.includes('Daniel') ||
            v.name.includes('Karen') ||
            v.name.includes('Jenny')) &&
          v.lang.startsWith('en')
      );
      if (preferred) {
        utterance.voice = preferred;
      }
    }

    utterance.onstart = () => {
      options.onStart?.();
    };

    utterance.onend = () => {
      options.onEnd?.();
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis notice:', e);
      options.onError?.(e);
      options.onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
  }

  /**
   * Instant interruption: immediately halts playback or synthesis
   */
  public stopSpeaking(): void {
    // Stop HTML Audio element immediately
    if (this.currentAudioElement) {
      try {
        this.currentAudioElement.pause();
        this.currentAudioElement.currentTime = 0;
        this.currentAudioElement.src = '';
      } catch {}
      this.currentAudioElement = null;
    }
    this.isPlayingNaturalVoice = false;

    // Stop Web Speech Synthesis
    if (this.isSynthesisSupported()) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }

    if (this.onSpeakingEndCallback) {
      const cb = this.onSpeakingEndCallback;
      this.onSpeakingEndCallback = null;
      cb();
    }
  }

  public isSpeaking(): boolean {
    const isAudioPlaying = this.isPlayingNaturalVoice && !!this.currentAudioElement && !this.currentAudioElement.paused;
    const isSynthSpeaking = typeof window !== 'undefined' && 'speechSynthesis' in window
      ? window.speechSynthesis.speaking
      : false;
    return isAudioPlaying || isSynthSpeaking;
  }

  /**
   * Start microphone listening with instant barge-in trigger.
   */
  public startListening(callbacks: {
    onInterim?: (text: string) => void;
    onFinal?: (text: string) => void;
    onError?: (err: string) => void;
    onEnd?: () => void;
  }): void {
    if (!this.recognition) {
      callbacks.onError?.('Speech recognition is not supported in this browser. Please use Chrome, Edge, or text input.');
      return;
    }

    if (this.isRecognizing) {
      try {
        this.recognition.stop();
      } catch {}
    }

    // Instant interruption of any ongoing agent speech
    this.stopSpeaking();

    let finalTranscript = '';
    let silenceTimer: any = null;

    this.recognition.onresult = (event: any) => {
      // If user starts speaking while assistant was somehow uttering, interrupt immediately!
      this.stopSpeaking();

      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      const currentText = (finalTranscript + interimTranscript).trim();
      if (currentText) {
        callbacks.onInterim?.(currentText);

        // Reset silence detection timer: 850ms of silence triggers instant sending (fast & nimble)
        if (silenceTimer) clearTimeout(silenceTimer);
        silenceTimer = setTimeout(() => {
          if (currentText.length > 0 && this.isRecognizing) {
            this.stopListening();
            this.playAudioChime('mic_close');
            callbacks.onFinal?.(currentText);
          }
        }, 850);
      }
    };

    this.recognition.onerror = (event: any) => {
      if (silenceTimer) clearTimeout(silenceTimer);
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        callbacks.onError?.(`Speech recognition error: ${event.error}`);
      }
    };

    this.recognition.onend = () => {
      if (silenceTimer) clearTimeout(silenceTimer);
      this.isRecognizing = false;
      callbacks.onEnd?.();
    };

    try {
      this.isRecognizing = true;
      this.playAudioChime('mic_open');
      this.recognition.start();
    } catch (e: any) {
      this.isRecognizing = false;
      callbacks.onError?.(e.message || 'Could not start microphone');
    }
  }

  public stopListening(): void {
    if (this.recognition && this.isRecognizing) {
      try {
        this.recognition.stop();
      } catch {}
    }
    this.isRecognizing = false;
    this.stopAudioAnalysis();
  }
}

export const voiceService = new VoiceService();
