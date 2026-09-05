import { dotDurationMs } from '../features/morse/morse-core.js';

export class AudioEngine {
  private context: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gain: GainNode | null = null;

  private ensureContext(): AudioContext {
    if (!this.context) this.context = new AudioContext();
    if (this.context.state === 'suspended') void this.context.resume();
    return this.context;
  }

  startTone(frequency: number, volume: number): void {
    if (this.oscillator) return;
    const context = this.ensureContext();
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = 'sine';
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), context.currentTime + 0.008);
    osc.connect(gain).connect(context.destination);
    osc.start();
    this.oscillator = osc;
    this.gain = gain;
  }

  stopTone(): void {
    if (!this.oscillator || !this.gain || !this.context) return;
    const osc = this.oscillator;
    const gain = this.gain;
    const now = this.context.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value), now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);
    osc.stop(now + 0.02);
    this.oscillator = null;
    this.gain = null;
  }

  async playElement(symbol: '.' | '-', wpm: number, frequency: number, volume: number): Promise<void> {
    const unit = dotDurationMs(wpm);
    this.startTone(frequency, volume);
    await delay(symbol === '.' ? unit : unit * 3);
    this.stopTone();
  }

  async playMorse(sequence: string, wpm: number, frequency: number, volume: number): Promise<void> {
    const unit = dotDurationMs(wpm);
    for (let i = 0; i < sequence.length; i += 1) {
      const symbol = sequence[i] as '.' | '-';
      this.startTone(frequency, volume);
      await delay(symbol === '.' ? unit : unit * 3);
      this.stopTone();
      if (i < sequence.length - 1) await delay(unit);
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => window.setTimeout(resolve, ms));
}
