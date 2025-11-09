/**
 * Earcon player for audio feedback
 * Uses HTMLAudioElement for simple sound playback
 */
export type EarconType = 'wake' | 'listen' | 'success' | 'error';

export class EarconPlayer {
  private audioContext: AudioContext | null = null;
  private buffers: Map<EarconType, AudioBuffer> = new Map();

  async initialize(): Promise<void> {
    // Use simple beep tones generated via Web Audio API
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Generate simple tone buffers
    await this.generateTones();
  }

  private async generateTones(): Promise<void> {
    if (!this.audioContext) return;

    const sampleRate = this.audioContext.sampleRate;
    
    // Wake: Rising tone
    this.buffers.set('wake', this.createTone(sampleRate, 440, 0.1));
    
    // Listen: Short beep
    this.buffers.set('listen', this.createTone(sampleRate, 880, 0.05));
    
    // Success: Two quick beeps
    this.buffers.set('success', this.createTone(sampleRate, 660, 0.08));
    
    // Error: Lower tone
    this.buffers.set('error', this.createTone(sampleRate, 220, 0.15));
  }

  private createTone(sampleRate: number, frequency: number, duration: number): AudioBuffer {
    const buffer = this.audioContext!.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      data[i] = Math.sin(2 * Math.PI * frequency * t) * Math.exp(-t * 5);
    }
    
    return buffer;
  }

  play(type: EarconType): void {
    if (!this.audioContext || !this.buffers.has(type)) return;

    const source = this.audioContext.createBufferSource();
    source.buffer = this.buffers.get(type)!;
    source.connect(this.audioContext.destination);
    source.start(0);
  }

  destroy(): void {
    this.audioContext?.close();
    this.audioContext = null;
    this.buffers.clear();
  }
}
