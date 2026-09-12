/**
 * Ambient Background Music Engine
 * Generates an ethereal, calming, lo-fi studio ambient soundscape using Web Audio API.
 * 100% client-side, zero external network assets, zero latency.
 * Features automatic audio ducking when agent or user speaks.
 */

type Listener = (isPlaying: boolean, volume: number) => void;

class AmbientMusicService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private duckGain: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  // Check localStorage for user preference; default to true (music ON)
  private isPlayingState: boolean = (() => {
    try {
      const saved = localStorage.getItem('actwise_ambient_music');
      if (saved !== null) return saved === 'true';
    } catch {}
    return true; // Default to music ON
  })();
  private isDuckedState: boolean = false;
  private volumeLevel: number = (() => {
    try {
      const saved = localStorage.getItem('actwise_ambient_volume');
      if (saved) {
        const v = parseFloat(saved);
        if (!isNaN(v) && v > 0 && v <= 1) return v;
      }
    } catch {}
    return 0.22; // Pleasant default ambient volume
  })();
  private listeners: Set<Listener> = new Set();
  private userInteracted: boolean = false;

  private chordTimer: any = null;
  private bellTimer: any = null;
  private activeOscillators: OscillatorNode[] = [];

  // Calming jazz/ambient chord voicings in Hz (root, 3rd, 5th, 7th/9th)
  private chords: number[][] = [
    // Fmaj9: F3, A3, C4, E4, G4
    [174.61, 220.0, 261.63, 329.63, 392.0],
    // Dm9: D3, F3, A3, C4, E4
    [146.83, 174.61, 220.0, 261.63, 329.63],
    // Bbmaj7#11: Bb2, D3, F3, A3, E4
    [116.54, 146.83, 174.61, 220.0, 329.63],
    // Am7: A2, C3, E3, G3, B3
    [110.0, 130.81, 164.81, 196.0, 246.94],
    // Cmaj9: C3, E3, G3, B3, D4
    [130.81, 164.81, 196.0, 246.94, 293.66],
    // Gm9: G2, Bb2, D3, F3, A3
    [98.0, 116.54, 146.83, 174.61, 220.0],
  ];
  private currentChordIndex = 0;

  // Pentatonic sparkle frequencies (high register soft bells)
  private pentatonicNotes = [
    523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51,
  ];

  private initAudio() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (!this.masterGain && this.ctx) {
      this.masterGain = this.ctx.createGain();
      this.duckGain = this.ctx.createGain();
      this.filterNode = this.ctx.createBiquadFilter();

      // Warm analog lowpass filter
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.setValueAtTime(680, this.ctx.currentTime);
      this.filterNode.Q.setValueAtTime(1.5, this.ctx.currentTime);

      this.masterGain.gain.setValueAtTime(this.volumeLevel, this.ctx.currentTime);
      this.duckGain.gain.setValueAtTime(1.0, this.ctx.currentTime);

      // Chain: Synth -> Filter -> DuckGain -> MasterGain -> Destination
      this.filterNode.connect(this.duckGain);
      this.duckGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    }
  }

  public isPlaying(): boolean {
    return this.isPlayingState;
  }

  public getVolume(): number {
    return this.volumeLevel;
  }

  public addListener(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify() {
    this.listeners.forEach((fn) => fn(this.isPlayingState, this.volumeLevel));
  }

  public start(): void {
    if (this.isPlayingState && this.ctx && this.ctx.state === 'running' && this.chordTimer) return;

    try {
      this.initAudio();
      if (!this.ctx) return;

      this.isPlayingState = true;
      try {
        localStorage.setItem('actwise_ambient_music', 'true');
      } catch {}
      this.notify();

      // Fade in master gain smoothly
      const now = this.ctx.currentTime;
      this.masterGain?.gain.cancelScheduledValues(now);
      this.masterGain?.gain.setValueAtTime(0.001, now);
      this.masterGain?.gain.linearRampToValueAtTime(this.volumeLevel, now + 1.5);

      // Start looping chords if not already running
      if (!this.chordTimer) {
        this.playNextChord();
        this.chordTimer = setInterval(() => {
          if (this.isPlayingState) {
            this.playNextChord();
          }
        }, 5500);
      }

      // Start gentle ambient chimes / sparkles
      if (!this.bellTimer) {
        this.scheduleNextBell();
      }
    } catch (e) {
      console.warn('Could not start ambient music:', e);
    }
  }

  public stop(): void {
    this.isPlayingState = false;
    try {
      localStorage.setItem('actwise_ambient_music', 'false');
    } catch {}

    if (this.chordTimer) {
      clearInterval(this.chordTimer);
      this.chordTimer = null;
    }

    if (this.bellTimer) {
      clearTimeout(this.bellTimer);
      this.bellTimer = null;
    }

    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(0.0001, now + 0.8);

      setTimeout(() => {
        this.stopAllOscillators();
        this.notify();
      }, 850);
    } else {
      this.notify();
    }
  }

  public toggle(): boolean {
    if (this.isPlayingState) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }

  public setVolume(vol: number): void {
    this.volumeLevel = Math.max(0, Math.min(1, vol));
    try {
      localStorage.setItem('actwise_ambient_volume', this.volumeLevel.toString());
    } catch {}
    if (this.ctx && this.masterGain && !this.isDuckedState) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.setTargetAtTime(this.volumeLevel, now, 0.1);
    }
    this.notify();
  }

  /**
   * Smoothly duck music volume when assistant or user is speaking
   */
  public setDuck(duck: boolean): void {
    if (this.isDuckedState === duck || !this.ctx || !this.duckGain) return;
    this.isDuckedState = duck;

    const now = this.ctx.currentTime;
    // Duck to 20% of current volume smoothly
    const targetGain = duck ? 0.2 : 1.0;
    this.duckGain.gain.cancelScheduledValues(now);
    this.duckGain.gain.setTargetAtTime(targetGain, now, 0.25);
  }

  private playNextChord(): void {
    if (!this.ctx || !this.filterNode || !this.isPlayingState) return;

    const chord = this.chords[this.currentChordIndex];
    this.currentChordIndex = (this.currentChordIndex + 1) % this.chords.length;

    const now = this.ctx.currentTime;
    const duration = 6.2; // Overlaps nicely into the next chord

    // Play 3 to 4 frequencies in the chord
    chord.forEach((freq, idx) => {
      if (!this.ctx || !this.filterNode) return;

      const osc = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();

      // Alternate between warm sine and soft triangle
      osc.type = idx === 0 ? 'sine' : idx % 2 === 0 ? 'triangle' : 'sine';
      // Subtle organic detuning for lush analog shimmer
      const detune = (idx - 2) * 4;
      osc.frequency.setValueAtTime(freq, now);
      osc.detune.setValueAtTime(detune, now);

      // Volume envelope: slow attack (1.6s) -> sustain -> slow release (2.2s)
      const baseGain = (idx === 0 ? 0.08 : 0.04) * (1 - idx * 0.1);
      noteGain.gain.setValueAtTime(0.0001, now);
      noteGain.gain.linearRampToValueAtTime(baseGain, now + 1.8);
      noteGain.gain.setValueAtTime(baseGain, now + duration - 2.2);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(noteGain);
      noteGain.connect(this.filterNode);

      osc.start(now);
      osc.stop(now + duration + 0.1);

      this.activeOscillators.push(osc);
      osc.onended = () => {
        const i = this.activeOscillators.indexOf(osc);
        if (i !== -1) this.activeOscillators.splice(i, 1);
      };
    });
  }

  private scheduleNextBell(): void {
    if (!this.isPlayingState) return;

    const delay = 2200 + Math.random() * 3000;
    this.bellTimer = setTimeout(() => {
      if (this.isPlayingState) {
        this.playSoftBell();
        this.scheduleNextBell();
      }
    }, delay);
  }

  private playSoftBell(): void {
    if (!this.ctx || !this.filterNode || !this.isPlayingState) return;

    const note = this.pentatonicNotes[Math.floor(Math.random() * this.pentatonicNotes.length)];
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const bellGain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(note, now);

    // Delicate chime envelope
    bellGain.gain.setValueAtTime(0.0001, now);
    bellGain.gain.linearRampToValueAtTime(0.025, now + 0.04);
    bellGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);

    osc.connect(bellGain);
    bellGain.connect(this.filterNode);

    osc.start(now);
    osc.stop(now + 2.5);

    this.activeOscillators.push(osc);
    osc.onended = () => {
      const i = this.activeOscillators.indexOf(osc);
      if (i !== -1) this.activeOscillators.splice(i, 1);
    };
  }

  private stopAllOscillators(): void {
    for (const osc of this.activeOscillators) {
      try {
        osc.stop();
        osc.disconnect();
      } catch {}
    }
    this.activeOscillators = [];
  }
}

export const ambientMusicService = new AmbientMusicService();
