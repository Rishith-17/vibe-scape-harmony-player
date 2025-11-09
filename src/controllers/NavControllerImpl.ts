import { NavControllerAdapter } from '@/voice/types';

/**
 * Adapter for navigation - delegates to react-router
 * No internal logic changes - pure delegation
 */
export class NavControllerImpl implements NavControllerAdapter {
  constructor(private navigate: (path: string) => void) {}

  openEmotionDetection(): void {
    this.navigate('/emotions');
  }

  openLibrary(): void {
    this.navigate('/library');
  }

  openSettings(): void {
    this.navigate('/profile');
  }

  openHome(): void {
    this.navigate('/home');
  }

  openSearch(): void {
    this.navigate('/search');
  }
}
