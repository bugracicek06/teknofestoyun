import { GameStore } from '../state/GameStore.ts';

export const NARRATION_DUCK_LEVEL = 0.35;

// Web Audio API synthesizer for offline game sound effects
class SoundSynth {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  private get outputDestination(): AudioNode {
    if (this.masterGain) return this.masterGain;
    return this.ctx ? this.ctx.destination : (window as unknown as { destination: AudioNode }).destination;
  }

  private initCtx() {
    if (GameStore.getState().isAudioMuted) return;

    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        try {
          this.ctx = new AudioCtxClass();
          this.masterGain = this.ctx.createGain();
          this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
          this.masterGain.connect(this.ctx.destination);
        } catch {
          this.ctx = null;
          this.masterGain = null;
        }
      }
    } else if (!this.masterGain && this.ctx) {
      try {
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      } catch {
        this.masterGain = null;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public duck(level: number = NARRATION_DUCK_LEVEL, rampDuration = 0.2): void {
    try {
      this.initCtx();
      if (!this.ctx || !this.masterGain) return;
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(level, now + rampDuration);
    } catch {
      // Safe fallback
    }
  }

  public unduck(rampDuration = 0.3): void {
    try {
      this.initCtx();
      if (!this.ctx || !this.masterGain) return;
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(1.0, now + rampDuration);
    } catch {
      // Safe fallback
    }
  }

  public resetGain(): void {
    try {
      if (this.ctx && this.masterGain) {
        this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
        this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
      }
    } catch {
      // Safe fallback
    }
  }

  public playClickTone() {
    try {
      this.initCtx();
      if (!this.ctx || GameStore.getState().isAudioMuted) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.outputDestination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {
      // Ignore audio policy error
    }
  }

  public playSuccessTone() {
    try {
      this.initCtx();
      if (!this.ctx || GameStore.getState().isAudioMuted) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, this.ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, this.ctx.currentTime + 0.15); // G5

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(this.outputDestination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch {
      // Ignore audio policy error gracefully
    }
  }

  /**
   * Gentle incorrect placement thud/wiggle sound
   */
  public playErrorTone() {
    try {
      this.initCtx();
      if (!this.ctx || GameStore.getState().isAudioMuted) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, this.ctx.currentTime); // A3
      osc.frequency.exponentialRampToValueAtTime(140, this.ctx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(this.outputDestination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch {
      // Ignore audio policy error
    }
  }

  /**
   * Fanfare victory melody
   */
  public playVictoryFanfare() {
    try {
      this.initCtx();
      if (!this.ctx || GameStore.getState().isAudioMuted) return;

      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, index) => {
        if (!this.ctx || GameStore.getState().isAudioMuted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        const startTime = this.ctx.currentTime + index * 0.12;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.2, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

        osc.connect(gain);
        gain.connect(this.outputDestination);

        osc.start(startTime);
        osc.stop(startTime + 0.3);
      });
    } catch {
      // Ignore audio policy error
    }
  }
  /**
   * Metallic gear snap/lock sound
   */
  public playGearSnap() {
    try {
      this.initCtx();
      if (!this.ctx || GameStore.getState().isAudioMuted) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.18);

      osc.connect(gain);
      gain.connect(this.outputDestination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.18);
    } catch {
      // Ignore audio policy error
    }
  }

  /**
   * Heavy mechanical lever pull sound
   */
  public playLeverPull() {
    try {
      this.initCtx();
      if (!this.ctx || GameStore.getState().isAudioMuted) return;

      // Two sequential mechanical clicks
      [0, 0.09].forEach((delay, idx) => {
        if (!this.ctx || GameStore.getState().isAudioMuted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        const t = this.ctx.currentTime + delay;
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(idx === 0 ? 180 : 360, t);
        osc.frequency.exponentialRampToValueAtTime(idx === 0 ? 100 : 520, t + 0.07);

        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

        osc.connect(gain);
        gain.connect(this.outputDestination);

        osc.start(t);
        osc.stop(t + 0.1);
      });
    } catch {
      // Ignore audio policy error
    }
  }

  /**
   * High-tech payload mechanical locking sound
   */
  public playLockSound() {
    try {
      this.initCtx();
      if (!this.ctx || GameStore.getState().isAudioMuted) return;

      const t = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();

      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(350, t);
      osc1.frequency.exponentialRampToValueAtTime(1100, t + 0.08);

      gain1.gain.setValueAtTime(0.3, t);
      gain1.gain.exponentialRampToValueAtTime(0.01, t + 0.14);

      osc1.connect(gain1);
      gain1.connect(this.outputDestination);

      osc1.start(t);
      osc1.stop(t + 0.14);
    } catch {
      // Ignore audio policy error
    }
  }

  /**
   * Futuristic digital telemetry blip
   */
  public playTelemetryBeep() {
    try {
      this.initCtx();
      if (!this.ctx || GameStore.getState().isAudioMuted) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, this.ctx.currentTime + 0.06);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.outputDestination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch {
      // Ignore audio policy error
    }
  }

  /**
   * High-frequency radar scanning sweep ping
   */
  public playRadarPing() {
    try {
      this.initCtx();
      if (!this.ctx || GameStore.getState().isAudioMuted) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, this.ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.45);

      osc.connect(gain);
      gain.connect(this.outputDestination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.45);
    } catch {
      // Ignore audio policy error
    }
  }

  /**
   * Jet/Propeller UAV engine flight hum
   */
  public playDroneHum() {
    try {
      this.initCtx();
      if (!this.ctx || GameStore.getState().isAudioMuted) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(260, this.ctx.currentTime + 0.8);

      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(this.outputDestination);

      osc.start();
      osc.stop(this.ctx.currentTime + 1.2);
    } catch {
      // Ignore audio policy error
    }
  }

  /**
   * Spinning gears accelerating hum
   */
  public playGearSpin() {
    try {
      this.initCtx();
      if (!this.ctx || GameStore.getState().isAudioMuted) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, this.ctx.currentTime + 1.2);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 2.2);

      osc.connect(gain);
      gain.connect(this.outputDestination);

      osc.start();
      osc.stop(this.ctx.currentTime + 2.2);
    } catch {
      // Ignore audio policy error
    }
  }

  /**
   * Countdown tick beep (3, 2, 1)
   */
  public playCountdownBeep(isFinal: boolean = false) {
    try {
      this.initCtx();
      if (!this.ctx || GameStore.getState().isAudioMuted) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      const freq = isFinal ? 1760 : 880;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + (isFinal ? 0.35 : 0.15));

      osc.connect(gain);
      gain.connect(this.outputDestination);

      osc.start();
      osc.stop(this.ctx.currentTime + (isFinal ? 0.35 : 0.15));
    } catch {
      // Ignore audio policy error
    }
  }

  /**
   * Deep rocket thruster blast & ignition roar
   */
  public playRocketBlast() {
    try {
      this.initCtx();
      if (!this.ctx || GameStore.getState().isAudioMuted) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(280, this.ctx.currentTime + 1.5);

      gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 2.5);

      osc.connect(gain);
      gain.connect(this.outputDestination);

      osc.start();
      osc.stop(this.ctx.currentTime + 2.5);
    } catch {
      // Ignore audio policy error
    }
  }

  /**
   * Ethereal cosmic orbital arpeggio chime
   */
  public playSpaceChime() {
    try {
      this.initCtx();
      if (!this.ctx || GameStore.getState().isAudioMuted) return;

      const notes = [659.25, 783.99, 987.77, 1318.51]; // E5, G5, B5, E6
      notes.forEach((freq, idx) => {
        if (!this.ctx || GameStore.getState().isAudioMuted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const st = this.ctx.currentTime + idx * 0.15;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, st);

        gain.gain.setValueAtTime(0.2, st);
        gain.gain.exponentialRampToValueAtTime(0.001, st + 0.6);

        osc.connect(gain);
        gain.connect(this.outputDestination);

        osc.start(st);
        osc.stop(st + 0.6);
      });
    } catch {
      // Ignore audio policy error
    }
  }

  /**
   * Deep mystical ancient desert wind & ambient drone (Disabled per requirements)
   */
  public startAncientAmbient() {
    // Ambient noise completely disabled to keep the audio clean and focus on tactile interaction SFX
  }

  /**
   * Stop ancient ambient drone smoothly
   */
  public stopAncientAmbient() {
    // Ambient noise completely disabled
  }

  /**
   * Heavy stone thud landing sound
   */
  public playHeavyStoneThud() {
    try {
      this.initCtx();
      if (!this.ctx || GameStore.getState().isAudioMuted) return;

      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, t);
      osc.frequency.exponentialRampToValueAtTime(32, t + 0.22);

      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      osc.connect(gain);
      gain.connect(this.outputDestination);

      osc.start(t);
      osc.stop(t + 0.25);
    } catch {
      // Ignore audio policy error
    }
  }

  /**
   * Stone friction / scraping dust sound
   */
  public playStoneDrag() {
    try {
      this.initCtx();
      if (!this.ctx || GameStore.getState().isAudioMuted) return;

      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.linearRampToValueAtTime(90, t + 0.08);

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      osc.connect(gain);
      gain.connect(this.outputDestination);

      osc.start(t);
      osc.stop(t + 0.08);
    } catch {
      // Ignore audio policy error
    }
  }

  /**
   * Soft sand slide whoosh on returning piece
   */
  public playSandSlide() {
    try {
      this.initCtx();
      if (!this.ctx || GameStore.getState().isAudioMuted) return;

      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260, t);
      osc.frequency.exponentialRampToValueAtTime(80, t + 0.22);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      osc.connect(gain);
      gain.connect(this.outputDestination);

      osc.start(t);
      osc.stop(t + 0.22);
    } catch {
      // Ignore audio policy error
    }
  }

  /**
   * Ancient chisel / stone carving strike sound
   */
  public playChiselStrike() {
    try {
      this.initCtx();
      if (!this.ctx || GameStore.getState().isAudioMuted) return;

      const t = this.ctx.currentTime;
      // High transient metal click
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();

      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(2400, t);
      osc1.frequency.exponentialRampToValueAtTime(800, t + 0.04);

      gain1.gain.setValueAtTime(0.3, t);
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

      osc1.connect(gain1);
      gain1.connect(this.outputDestination);

      osc1.start(t);
      osc1.stop(t + 0.06);

      // Resonant stone ring
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1180, t);
      osc2.frequency.exponentialRampToValueAtTime(440, t + 0.12);

      gain2.gain.setValueAtTime(0.2, t);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

      osc2.connect(gain2);
      gain2.connect(this.outputDestination);

      osc2.start(t);
      osc2.stop(t + 0.12);
    } catch {
      // Ignore audio policy error
    }
  }

  /**
   * Leather bellows air blow & furnace flame rush
   */
  public playBellowsBlow() {
    try {
      this.initCtx();
      if (!this.ctx || GameStore.getState().isAudioMuted) return;

      const t = this.ctx.currentTime;
      // Air rush noise simulation
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(180, t);
      osc1.frequency.exponentialRampToValueAtTime(60, t + 0.35);

      gain1.gain.setValueAtTime(0.28, t);
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.38);

      osc1.connect(gain1);
      gain1.connect(this.outputDestination);

      osc1.start(t);
      osc1.stop(t + 0.38);

      // Low gust whoosh
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(90, t);
      osc2.frequency.linearRampToValueAtTime(160, t + 0.18);
      osc2.frequency.exponentialRampToValueAtTime(40, t + 0.4);

      gain2.gain.setValueAtTime(0.35, t);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

      osc2.connect(gain2);
      gain2.connect(this.outputDestination);

      osc2.start(t);
      osc2.stop(t + 0.4);
    } catch {
      // Ignore audio policy error
    }
  }

  /**
   * Dynamic blacksmith bellows compression: leather creak and resonant air jet
   */
  public playBellowsPump(intensity = 1.0) {
    try {
      this.initCtx();
      if (!this.ctx || GameStore.getState().isAudioMuted) return;

      const t = this.ctx.currentTime;
      const clampedInt = Math.max(0.3, Math.min(intensity, 2.0));

      // 1. Leather strain & friction creak
      const oscCreak = this.ctx.createOscillator();
      const gainCreak = this.ctx.createGain();
      oscCreak.type = 'sawtooth';
      oscCreak.frequency.setValueAtTime(140 * clampedInt, t);
      oscCreak.frequency.exponentialRampToValueAtTime(80, t + 0.12);
      gainCreak.gain.setValueAtTime(0.18 * clampedInt, t);
      gainCreak.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      oscCreak.connect(gainCreak);
      gainCreak.connect(this.outputDestination);
      oscCreak.start(t);
      oscCreak.stop(t + 0.14);

      // 2. Powerful air exhaust blast into furnace
      const oscAir = this.ctx.createOscillator();
      const gainAir = this.ctx.createGain();
      oscAir.type = 'triangle';
      oscAir.frequency.setValueAtTime(120 + 80 * clampedInt, t);
      oscAir.frequency.exponentialRampToValueAtTime(45, t + 0.32);
      gainAir.gain.setValueAtTime(0.32 * clampedInt, t);
      gainAir.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      oscAir.connect(gainAir);
      gainAir.connect(this.outputDestination);
      oscAir.start(t);
      oscAir.stop(t + 0.35);
    } catch {
      // Ignore audio policy error
    }
  }

  /**
   * Furnace roaring fire surge when pumped
   */
  public playFireRoar(heat = 50) {
    try {
      this.initCtx();
      if (!this.ctx || GameStore.getState().isAudioMuted) return;

      const t = this.ctx.currentTime;
      const factor = Math.max(0.2, Math.min(heat / 100, 1.2));

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(85 * factor, t);
      osc.frequency.linearRampToValueAtTime(140 * factor, t + 0.18);
      osc.frequency.exponentialRampToValueAtTime(55, t + 0.45);

      gain.gain.setValueAtTime(0.25 * factor, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

      osc.connect(gain);
      gain.connect(this.outputDestination);
      osc.start(t);
      osc.stop(t + 0.45);
    } catch {
      // Ignore audio policy error
    }
  }

  /**
   * Crackling embers and spark pops
   */
  public playSparkCrackles() {
    try {
      this.initCtx();
      if (!this.ctx || GameStore.getState().isAudioMuted) return;

      const t = this.ctx.currentTime;
      // 3 rapid micro spark pops
      [0, 0.03, 0.07].forEach((delay, idx) => {
        if (!this.ctx || GameStore.getState().isAudioMuted) return;
        const st = t + delay;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(2400 + idx * 600, st);
        osc.frequency.exponentialRampToValueAtTime(400, st + 0.03);

        gain.gain.setValueAtTime(0.12, st);
        gain.gain.exponentialRampToValueAtTime(0.001, st + 0.035);

        osc.connect(gain);
        gain.connect(this.outputDestination);
        osc.start(st);
        osc.stop(st + 0.035);
      });
    } catch {
      // Ignore audio policy error
    }
  }

  /**
   * Gentle warning when furnace is cooling down too low
   */
  public playHeatWarningLow() {
    try {
      this.initCtx();
      if (!this.ctx || GameStore.getState().isAudioMuted) return;

      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, t);
      osc.frequency.exponentialRampToValueAtTime(180, t + 0.22);

      gain.gain.setValueAtTime(0.14, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      osc.connect(gain);
      gain.connect(this.outputDestination);
      osc.start(t);
      osc.stop(t + 0.22);
    } catch {
      // Ignore audio policy error
    }
  }

  /**
   * Harmonic resonance hum when staying in ideal heat zone
   */
  public playIdealHeatHum() {
    try {
      this.initCtx();
      if (!this.ctx || GameStore.getState().isAudioMuted) return;

      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, t); // D5
      osc.frequency.linearRampToValueAtTime(880, t + 0.15); // A5

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

      osc.connect(gain);
      gain.connect(this.outputDestination);
      osc.start(t);
      osc.stop(t + 0.28);
    } catch {
      // Ignore audio policy error
    }
  }

  /**
   * Heavy hammer metallic strike on iron anvil with ringing resonance
   */
  public playAnvilHit() {
    try {
      this.initCtx();
      if (!this.ctx || GameStore.getState().isAudioMuted) return;

      const t = this.ctx.currentTime;
      // 1. High transient hammer impact
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();

      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(3200, t);
      osc1.frequency.exponentialRampToValueAtTime(1200, t + 0.05);

      gain1.gain.setValueAtTime(0.45, t);
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      osc1.connect(gain1);
      gain1.connect(this.outputDestination);

      osc1.start(t);
      osc1.stop(t + 0.08);

      // 2. Clear metallic anvil harmonic ring
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1760, t);
      osc2.frequency.exponentialRampToValueAtTime(880, t + 0.35);

      gain2.gain.setValueAtTime(0.35, t);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

      osc2.connect(gain2);
      gain2.connect(this.outputDestination);

      osc2.start(t);
      osc2.stop(t + 0.45);

      // 3. Heavy steel base thud
      const osc3 = this.ctx.createOscillator();
      const gain3 = this.ctx.createGain();

      osc3.type = 'sawtooth';
      osc3.frequency.setValueAtTime(220, t);
      osc3.frequency.exponentialRampToValueAtTime(50, t + 0.15);

      gain3.gain.setValueAtTime(0.3, t);
      gain3.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      osc3.connect(gain3);
      gain3.connect(this.outputDestination);

      osc3.start(t);
      osc3.stop(t + 0.18);
    } catch {
      // Ignore audio policy error
    }
  }

  /**
   * Red-hot iron water quenching steam hiss
   */
  public playWaterQuench() {
    try {
      this.initCtx();
      if (!this.ctx || GameStore.getState().isAudioMuted) return;

      const t = this.ctx.currentTime;
      // High-frequency steam hiss
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(3600, t);
      osc1.frequency.exponentialRampToValueAtTime(1400, t + 0.7);

      gain1.gain.setValueAtTime(0.32, t);
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.85);

      osc1.connect(gain1);
      gain1.connect(this.outputDestination);

      osc1.start(t);
      osc1.stop(t + 0.85);

      // Water bubble splash & thermal simmer
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(450, t);
      osc2.frequency.linearRampToValueAtTime(750, t + 0.4);
      osc2.frequency.exponentialRampToValueAtTime(120, t + 0.9);

      gain2.gain.setValueAtTime(0.25, t);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.9);

      osc2.connect(gain2);
      gain2.connect(this.outputDestination);

      osc2.start(t);
      osc2.stop(t + 0.9);
    } catch {
      // Ignore audio policy error
    }
  }

  /**
   * Crisp steel master stamp punch strike sound
   */
  public playStampEngrave() {
    try {
      this.initCtx();
      if (!this.ctx || GameStore.getState().isAudioMuted) return;

      const t = this.ctx.currentTime;
      // High transient metal click
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();

      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(4200, t);
      osc1.frequency.exponentialRampToValueAtTime(1600, t + 0.04);

      gain1.gain.setValueAtTime(0.4, t);
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

      osc1.connect(gain1);
      gain1.connect(this.outputDestination);

      osc1.start(t);
      osc1.stop(t + 0.06);

      // Resonant harmonic ring
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(2400, t);
      osc2.frequency.exponentialRampToValueAtTime(1200, t + 0.3);

      gain2.gain.setValueAtTime(0.3, t);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc2.connect(gain2);
      gain2.connect(this.outputDestination);

      osc2.start(t);
      osc2.stop(t + 0.35);
    } catch {
      // Ignore audio policy error
    }
  }

  /**
   * Rich leather sheath slide & firm mechanical blade lock
   */
  public playSwordSheath() {
    try {
      this.initCtx();
      if (!this.ctx || GameStore.getState().isAudioMuted) return;

      const t = this.ctx.currentTime;
      // 1. Blade sliding friction whoosh
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(400, t);
      osc1.frequency.exponentialRampToValueAtTime(150, t + 0.25);

      gain1.gain.setValueAtTime(0.18, t);
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

      osc1.connect(gain1);
      gain1.connect(this.outputDestination);

      osc1.start(t);
      osc1.stop(t + 0.28);

      // 2. Firm snap lock click at t + 0.22
      const lockT = t + 0.22;
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(950, lockT);
      osc2.frequency.exponentialRampToValueAtTime(180, lockT + 0.1);

      gain2.gain.setValueAtTime(0.45, lockT);
      gain2.gain.exponentialRampToValueAtTime(0.001, lockT + 0.12);

      osc2.connect(gain2);
      gain2.connect(this.outputDestination);

      osc2.start(lockT);
      osc2.stop(lockT + 0.12);
    } catch {
      // Ignore audio policy error
    }
  }
}

export const SoundFx = new SoundSynth();
