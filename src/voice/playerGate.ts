/**
 * Gate to ensure music player is ready before executing commands
 * Prevents "next/previous not executed" issues
 */
let ready = false;

export function setPlayerReady(isReady: boolean): void {
  ready = isReady;
  console.log('[PlayerGate]', isReady ? '✅ Player ready' : '⏸️ Player not ready');
}

export async function whenReady<T>(fn: () => Promise<T>, timeoutMs: number = 5000): Promise<T> {
  if (ready) {
    return fn();
  }

  console.log('[PlayerGate] ⏳ Waiting for player to be ready...');
  
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const checkInterval = setInterval(() => {
      if (ready) {
        clearInterval(checkInterval);
        console.log('[PlayerGate] ✅ Player ready, executing command');
        resolve(fn());
      } else if (Date.now() - startTime > timeoutMs) {
        clearInterval(checkInterval);
        reject(new Error('Player ready timeout'));
      }
    }, 50);
  });
}

export function isPlayerReady(): boolean {
  return ready;
}
