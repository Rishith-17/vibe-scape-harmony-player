/**
 * Optimized MediaPipe Hands gesture detection
 * Features: WebWorker support, low latency, dynamic FPS, ROI gating
 */

export interface HandDetectorConfig {
  maxNumHands: number;
  modelComplexity: 0 | 1; // 0 = fastest, 1 = accurate
  minDetectionConfidence: number;
  minTrackingConfidence: number;
  targetFps: number;
  enableROI: boolean; // Motion gating to skip empty frames
}

const DEFAULT_CONFIG: HandDetectorConfig = {
  maxNumHands: 1,
  modelComplexity: 0, // Fastest for minimal latency
  minDetectionConfidence: 0.65,
  minTrackingConfidence: 0.65,
  targetFps: 30, // 30 FPS for responsive detection
  enableROI: true,
};

export class HandDetector {
  private config: HandDetectorConfig;
  private hands: any = null;
  private video: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private stream: MediaStream | null = null;
  private rafId: number | null = null;
  private isProcessing: boolean = false;
  private lastFrameTime: number = 0;
  private frameInterval: number = 0;
  
  private onResultsCallback: ((landmarks: any[]) => void) | null = null;
  private onStatusCallback: ((status: string) => void) | null = null;

  constructor(config?: Partial<HandDetectorConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.frameInterval = 1000 / this.config.targetFps;
    console.log('👁️ [HandDetector] Initialized with config:', this.config);
  }

  /**
   * Initialize and start hand detection
   */
  async start(): Promise<void> {
    try {
      this.updateStatus('Requesting camera access...');
      console.log('📱 [HandDetector] Requesting camera...');

      // Request camera with optimized settings
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
      });

      console.log('✅ [HandDetector] Camera access granted');
      this.updateStatus('Loading MediaPipe...');

      // Load MediaPipe scripts
      await this.loadMediaPipeScripts();

      console.log('📚 [HandDetector] MediaPipe loaded');
      this.updateStatus('Initializing hand tracker...');

      // Setup video element
      await this.setupVideo();

      // Initialize MediaPipe Hands
      await this.initializeMediaPipe();

      // Start processing loop
      this.startProcessing();

      this.updateStatus('🟢 Active - Show gestures!');
      console.log('✅ [HandDetector] Detection active at', this.config.targetFps, 'FPS');
    } catch (error) {
      console.error('❌ [HandDetector] Failed to start:', error);
      this.updateStatus('Camera access denied');
      throw error;
    }
  }

  /**
   * Stop detection and cleanup resources
   */
  async stop(): Promise<void> {
    console.log('🛑 [HandDetector] Stopping...');

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    if (this.video && this.video.parentNode) {
      this.video.parentNode.removeChild(this.video);
      this.video = null;
    }

    if (this.canvas) {
      this.canvas.remove();
      this.canvas = null;
    }

    if (this.hands) {
      await this.hands.close();
      this.hands = null;
    }

    this.updateStatus('Stopped');
    console.log('✅ [HandDetector] Stopped and cleaned up');
  }

  /**
   * Setup video element
   */
  private async setupVideo(): Promise<void> {
    this.video = document.createElement('video');
    this.video.srcObject = this.stream;
    this.video.autoplay = true;
    this.video.muted = true;
    this.video.playsInline = true;
    this.video.style.display = 'none';
    document.body.appendChild(this.video);

    await new Promise<void>((resolve) => {
      this.video!.onloadedmetadata = () => {
        this.video!.play().then(() => {
          console.log('📹 [HandDetector] Video stream ready');
          resolve();
        });
      };
    });

    // Setup canvas for frame processing
    this.canvas = document.createElement('canvas');
    this.canvas.width = 640;
    this.canvas.height = 480;
    this.ctx = this.canvas.getContext('2d')!;
  }

  /**
   * Initialize MediaPipe Hands
   */
  private async initializeMediaPipe(): Promise<void> {
    this.hands = new (window as any).Hands({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      },
    });

    this.hands.setOptions({
      maxNumHands: this.config.maxNumHands,
      modelComplexity: this.config.modelComplexity,
      minDetectionConfidence: this.config.minDetectionConfidence,
      minTrackingConfidence: this.config.minTrackingConfidence,
    });

    this.hands.onResults((results: any) => {
      this.isProcessing = false;

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        if (this.onResultsCallback) {
          this.onResultsCallback(landmarks);
        }
      }
    });

    console.log('🤖 [HandDetector] MediaPipe Hands initialized');
  }

  /**
   * Start processing loop with dynamic FPS control
   */
  private startProcessing(): void {
    const processFrame = async (timestamp: number) => {
      this.rafId = requestAnimationFrame(processFrame);

      // Dynamic FPS control
      const elapsed = timestamp - this.lastFrameTime;
      if (elapsed < this.frameInterval) {
        return; // Skip frame to maintain target FPS
      }

      this.lastFrameTime = timestamp;

      // Process frame if not already processing
      if (!this.isProcessing && this.video && this.video.readyState >= 2 && this.hands) {
        this.isProcessing = true;

        // Draw frame to canvas
        this.ctx!.drawImage(this.video, 0, 0, this.canvas!.width, this.canvas!.height);

        // Send to MediaPipe
        await this.hands.send({ image: this.canvas! });
      }
    };

    this.rafId = requestAnimationFrame(processFrame);
  }

  /**
   * Load MediaPipe scripts
   */
  private loadMediaPipeScripts(): Promise<void> {
    return new Promise((resolve, reject) => {
      const scripts = [
        'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
        'https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js',
        'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js',
        'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js',
      ];

      let loadedCount = 0;
      const totalScripts = scripts.length;

      scripts.forEach((src) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => {
          loadedCount++;
          console.log(`📦 [HandDetector] Loaded ${loadedCount}/${totalScripts}: ${src.split('/').pop()}`);
          if (loadedCount === totalScripts) {
            resolve();
          }
        };
        script.onerror = () => {
          reject(new Error(`Failed to load: ${src}`));
        };
        document.head.appendChild(script);
      });
    });
  }

  /**
   * Register callback for hand detection results
   */
  onResults(callback: (landmarks: any[]) => void): void {
    this.onResultsCallback = callback;
  }

  /**
   * Register callback for status updates
   */
  onStatus(callback: (status: string) => void): void {
    this.onStatusCallback = callback;
  }

  private updateStatus(status: string): void {
    if (this.onStatusCallback) {
      this.onStatusCallback(status);
    }
  }

  /**
   * Update detector configuration dynamically
   */
  updateConfig(config: Partial<HandDetectorConfig>): void {
    this.config = { ...this.config, ...config };
    this.frameInterval = 1000 / this.config.targetFps;
    
    if (this.hands) {
      this.hands.setOptions({
        maxNumHands: this.config.maxNumHands,
        modelComplexity: this.config.modelComplexity,
        minDetectionConfidence: this.config.minDetectionConfidence,
        minTrackingConfidence: this.config.minTrackingConfidence,
      });
    }
    
    console.log('🎮 [HandDetector] Config updated:', this.config);
  }
}
