/**
 * Vosk Web Worker (offline ASR fallback)
 * STUB - To be implemented with Vosk WASM
 * 
 * Implementation requires:
 * 1. Vosk WASM files (vosk.js, vosk.wasm)
 * 2. Model files (small model ~50MB)
 * 3. Audio processing pipeline
 */

self.onmessage = async (event: MessageEvent) => {
  const { type, data } = event.data;

  switch (type) {
    case 'init':
      // TODO: Initialize Vosk WASM
      self.postMessage({ type: 'ready' });
      break;

    case 'start':
      // TODO: Start recognition
      self.postMessage({ type: 'started' });
      break;

    case 'audio':
      // TODO: Process audio data
      // Convert PCM audio to Vosk format
      // Get recognition results
      break;

    case 'stop':
      // TODO: Stop recognition
      self.postMessage({ type: 'stopped' });
      break;

    default:
      console.warn('Unknown message type:', type);
  }
};

export {};
