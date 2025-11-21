import { toast } from 'sonner';

/**
 * UI Adapter - Handles UI feedback and interactions
 */
export class UiAdapter {
  /**
   * Show success toast (silent by default unless settings enabled)
   */
  showSuccess(message: string, silent = true): void {
    if (!silent) {
      toast.success(message);
    }
    console.debug(`[UiAdapter] ✅ ${message}`);
  }

  /**
   * Show error toast
   */
  showError(message: string): void {
    toast.error(message);
    console.error(`[UiAdapter] ❌ ${message}`);
  }

  /**
   * Show info message
   */
  showInfo(message: string): void {
    toast.info(message, {
      duration: 2000,
    });
  }

  /**
   * Show voice command help
   */
  showHelp(helpText: string): void {
    toast.info('Voice Commands', {
      description: 'Check console for full list',
      duration: 3000,
    });
    console.info(helpText);
  }

  /**
   * Highlight element briefly
   */
  highlightElement(element: HTMLElement): void {
    element.classList.add('voice-highlight');
    setTimeout(() => {
      element.classList.remove('voice-highlight');
    }, 1000);
  }

  /**
   * Show disambiguation prompt
   */
  showDisambiguation(options: string[]): void {
    toast.info('Multiple matches found', {
      description: options.slice(0, 3).join(', '),
      duration: 3000,
    });
  }

  /**
   * Show low confidence warning
   */
  showLowConfidence(suggestion: string): void {
    toast.info("I didn't understand", {
      description: `Try: "${suggestion}"`,
      duration: 3000,
    });
  }

  /**
   * Pulse mini player briefly
   */
  pulseMiniPlayer(): void {
    const miniPlayer = document.querySelector('[data-component="mini-player"]');
    if (miniPlayer) {
      miniPlayer.classList.add('voice-pulse');
      setTimeout(() => {
        miniPlayer.classList.remove('voice-pulse');
      }, 800);
    }
  }
}
