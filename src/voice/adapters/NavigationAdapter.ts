import { NavControllerAdapter } from '@/voice/types';

/**
 * Navigation Adapter - Maps voice navigation intents to router actions
 */
export class NavigationAdapter {
  constructor(private navController: NavControllerAdapter) {}

  openHome(): void {
    this.navController.openHome();
  }

  openLibrary(): void {
    this.navController.openLibrary();
  }

  openEmotions(): void {
    this.navController.openEmotionDetection();
  }

  openSettings(): void {
    this.navController.openSettings();
  }

  openSearch(query?: string): void {
    this.navController.openSearch(query);
  }

  goBack(): void {
    window.history.back();
  }
}
