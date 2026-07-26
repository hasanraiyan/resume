export class AudioAnalyser {
  public context: AudioContext;
  public analyser: AnalyserNode;
  private source: MediaElementAudioSourceNode | null = null;
  private dataArray: Uint8Array;
  public audioElements: HTMLAudioElement[] = [];
  public sensitivity: number = 1.0;

  constructor() {
    this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 512;
    this.analyser.smoothingTimeConstant = 0.8;

    const bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(bufferLength);
  }

  public async loadAudio(file: File): Promise<HTMLAudioElement> {
    if (this.context.state === 'suspended') {
      await this.context.resume();
    }

    // Clean up previous source
    this.cleanup();

    const audioUrl = URL.createObjectURL(file);
    const audio = new Audio();
    audio.src = audioUrl;
    audio.crossOrigin = "anonymous";

    this.source = this.context.createMediaElementSource(audio);
    this.source.connect(this.analyser);
    this.analyser.connect(this.context.destination);

    this.audioElements.push(audio);
    return audio;
  }

  public getFrequencyData(): Uint8Array {
    this.analyser.getByteFrequencyData(this.dataArray as any);
    if (this.sensitivity !== 1.0) {
      // Scale data
      for (let i = 0; i < this.dataArray.length; i++) {
        this.dataArray[i] = Math.min(255, this.dataArray[i] * this.sensitivity);
      }
    }
    return this.dataArray;
  }

  public setSensitivity(value: number) {
     this.sensitivity = value;
  }

  public cleanup() {
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    this.audioElements.forEach(audio => {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    });
    this.audioElements = [];
  }
}
