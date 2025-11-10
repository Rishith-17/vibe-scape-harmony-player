/**
 * Mutex to prevent overlapping voice command execution
 * Ensures only one command runs at a time with a cooldown period
 */
let busy = false;

export async function runCommand<T>(fn: () => Promise<T>): Promise<T | null> {
  if (busy) {
    console.log('[CommandRunner] ⏸️ Command skipped - another command is running');
    return null;
  }
  
  busy = true;
  try {
    const result = await fn();
    return result;
  } catch (error) {
    console.error('[CommandRunner] ❌ Command execution failed:', error);
    throw error;
  } finally {
    // Short cooldown to prevent rapid-fire commands
    setTimeout(() => {
      busy = false;
    }, 400);
  }
}

export function isCommandRunning(): boolean {
  return busy;
}
