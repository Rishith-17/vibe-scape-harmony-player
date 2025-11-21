/**
 * Scroll Adapter - Handles scrolling and view navigation
 */
export class ScrollAdapter {
  /**
   * Scroll down by specified amount
   */
  scrollDown(amount: 'small' | 'medium' | 'large' | 'page' = 'medium'): void {
    const scrollAmounts = {
      small: window.innerHeight * 0.25,
      medium: window.innerHeight * 0.5,
      large: window.innerHeight * 0.75,
      page: window.innerHeight,
    };

    window.scrollBy({
      top: scrollAmounts[amount],
      behavior: 'smooth',
    });
  }

  /**
   * Scroll up by specified amount
   */
  scrollUp(amount: 'small' | 'medium' | 'large' | 'page' = 'medium'): void {
    const scrollAmounts = {
      small: window.innerHeight * 0.25,
      medium: window.innerHeight * 0.5,
      large: window.innerHeight * 0.75,
      page: window.innerHeight,
    };

    window.scrollBy({
      top: -scrollAmounts[amount],
      behavior: 'smooth',
    });
  }

  /**
   * Scroll to specific section by ID or data-section attribute
   */
  scrollToSection(sectionId: string): boolean {
    // Try data-section attribute first
    let element = document.querySelector(`[data-section="${sectionId}"]`);
    
    // Fallback to ID
    if (!element) {
      element = document.getElementById(sectionId);
    }

    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
      return true;
    }

    console.warn(`[ScrollAdapter] Section not found: ${sectionId}`);
    return false;
  }

  /**
   * Scroll to top of page
   */
  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  /**
   * Scroll to bottom of page
   */
  scrollToBottom(): void {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth',
    });
  }

  /**
   * Bring specific item in section into view
   */
  scrollToItem(sectionId: string, itemIndex: number): HTMLElement | null {
    const section = document.querySelector(`[data-section="${sectionId}"]`);
    if (!section) {
      console.warn(`[ScrollAdapter] Section not found: ${sectionId}`);
      return null;
    }

    const items = section.querySelectorAll('.card, [data-card], [data-item]');
    const item = items[itemIndex - 1] as HTMLElement; // Convert to 0-indexed

    if (item) {
      item.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
      return item;
    }

    console.warn(`[ScrollAdapter] Item ${itemIndex} not found in section ${sectionId}`);
    return null;
  }
}
