import { VoiceIntent } from './types';
import { MusicAdapter } from './adapters/MusicAdapter';
import { NavigationAdapter } from './adapters/NavigationAdapter';
import { ScrollAdapter } from './adapters/ScrollAdapter';
import { UiAdapter } from './adapters/UiAdapter';
import { PlaylistAdapter, playlistAdapter } from './adapters/PlaylistAdapter';
import { runCommand } from './commandRunner';
import { ENHANCED_HELP_TEXT } from './nlu/intentParser.enhanced';
import { emotionAnalysisService } from '@/services/EmotionAnalysisService';

/**
 * Voice Command Runner - Orchestrates intent execution
 * Routes parsed intents to appropriate adapters
 */
export class VoiceCommandRunner {
  private lastSection: string | null = null;
  private lastQuery: string | null = null;
  private playlistAdapter: PlaylistAdapter;
  private ttsCallback: ((text: string) => Promise<void>) | null = null;

  constructor(
    private musicAdapter: MusicAdapter,
    private navigationAdapter: NavigationAdapter,
    private scrollAdapter: ScrollAdapter,
    private uiAdapter: UiAdapter,
    private ttsEnabled = false
  ) {
    this.playlistAdapter = playlistAdapter;
  }

  /**
   * Set TTS callback for speaking responses
   */
  setTtsCallback(callback: (text: string) => Promise<void>): void {
    this.ttsCallback = callback;
  }

  /**
   * Set navigation function for playlist adapter
   */
  setNavigate(navigate: (path: string) => void): void {
    this.playlistAdapter.setNavigate(navigate);
  }

  /**
   * Set playlist play function
   */
  setPlayPlaylist(fn: (playlistId: string) => Promise<void>): void {
    this.playlistAdapter.setPlayPlaylist(fn);
  }

  /**
   * Speak a message using TTS if enabled
   */
  private async speak(text: string): Promise<void> {
    if (this.ttsEnabled && this.ttsCallback) {
      await this.ttsCallback(text);
    }
  }

  /**
   * Execute a parsed voice intent
   */
  async executeIntent(intent: VoiceIntent): Promise<void> {
    console.log('[VoiceCommandRunner] 🎯 Executing intent:', intent);

    // Low confidence check
    if (intent.confidence < 0.6) {
      this.uiAdapter.showLowConfidence('Try "play the second song in global top"');
      return;
    }

    // Route to appropriate handler
    await runCommand(async () => {
      switch (intent.action) {
        // Playback controls
        case 'play':
          await this.musicAdapter.play();
          this.uiAdapter.showSuccess('Playing', !this.ttsEnabled);
          break;

        case 'pause':
          await this.musicAdapter.pause();
          this.uiAdapter.showSuccess('Paused', !this.ttsEnabled);
          break;

        case 'resume':
          await this.musicAdapter.resume();
          this.uiAdapter.showSuccess('Resumed', !this.ttsEnabled);
          break;

        case 'next':
          await this.musicAdapter.next();
          this.uiAdapter.showSuccess('Next track', !this.ttsEnabled);
          break;

        case 'previous':
          await this.musicAdapter.previous();
          this.uiAdapter.showSuccess('Previous track', !this.ttsEnabled);
          break;

        // Play by index
        case 'play_nth_track':
          if (intent.slots.trackNumber) {
            await this.musicAdapter.playAtIndex(intent.slots.trackNumber);
            this.uiAdapter.showSuccess(`Playing track ${intent.slots.trackNumber}`, !this.ttsEnabled);
            this.uiAdapter.pulseMiniPlayer();
          }
          break;

        // Play item in specific section
        case 'play_item_in_section':
          await this.handlePlayItemInSection(
            intent.slots.sectionId!,
            intent.slots.trackNumber!
          );
          break;

        // Open section and play item
        case 'open_and_play':
          await this.handleOpenAndPlay(
            intent.slots.sectionId!,
            intent.slots.trackNumber!
          );
          break;

        // Playlists and mood
        case 'play_playlist':
          await this.musicAdapter.playPlaylist(intent.slots.playlistName!);
          this.uiAdapter.showSuccess(`Playing ${intent.slots.playlistName}`, !this.ttsEnabled);
          break;

        case 'play_liked_songs':
          await this.musicAdapter.playLikedSongs();
          this.uiAdapter.showSuccess('Playing liked songs', !this.ttsEnabled);
          break;

        case 'play_mood':
          await this.musicAdapter.playMood(intent.slots.mood!);
          this.uiAdapter.showSuccess(`Playing ${intent.slots.mood} music`, !this.ttsEnabled);
          break;

        // Search
        case 'search_and_play':
          this.lastQuery = intent.slots.query!;
          await this.musicAdapter.searchAndPlay(intent.slots.query!);
          this.uiAdapter.showSuccess(`Searching for ${intent.slots.query}`, !this.ttsEnabled);
          break;

        case 'play_query':
          await this.musicAdapter.playQuery(intent.slots.query!);
          break;

        // Volume
        case 'volume_up':
          this.musicAdapter.adjustVolume(10);
          this.uiAdapter.showSuccess('Volume up', !this.ttsEnabled);
          break;

        case 'volume_down':
          this.musicAdapter.adjustVolume(-10);
          this.uiAdapter.showSuccess('Volume down', !this.ttsEnabled);
          break;

        case 'volume_set':
          this.musicAdapter.setVolume(intent.slots.volume!);
          this.uiAdapter.showSuccess(`Volume ${intent.slots.volume}%`, !this.ttsEnabled);
          break;

        // Navigation
        case 'navigate':
          this.handleNavigation(intent.slots.navigation!);
          break;

        case 'navigate_back':
          this.navigationAdapter.goBack();
          this.uiAdapter.showSuccess('Going back', !this.ttsEnabled);
          break;

        // Scrolling
        case 'scroll_down':
          this.scrollAdapter.scrollDown(intent.slots.amount as any || 'medium');
          break;

        case 'scroll_up':
          this.scrollAdapter.scrollUp(intent.slots.amount as any || 'medium');
          break;

        case 'scroll_to_section':
          const success = this.scrollAdapter.scrollToSection(intent.slots.sectionId!);
          if (success) {
            this.lastSection = intent.slots.sectionId!;
            this.uiAdapter.showSuccess(`Scrolled to ${intent.slots.sectionId}`, !this.ttsEnabled);
          } else {
            this.uiAdapter.showError(`Section ${intent.slots.sectionId} not found`);
          }
          break;

        case 'scroll_to_top':
          this.scrollAdapter.scrollToTop();
          break;

        case 'scroll_to_bottom':
          this.scrollAdapter.scrollToBottom();
          break;

        // System
        case 'help':
          this.uiAdapter.showHelp(ENHANCED_HELP_TEXT);
          break;

        case 'stop_listening':
          this.uiAdapter.showSuccess('Stopped listening', !this.ttsEnabled);
          break;

        case 'analyse_emotion':
          this.uiAdapter.showSuccess('Analysing your emotion...', !this.ttsEnabled);
          await emotionAnalysisService.startAnalysis();
          break;

        // New voice commands
        case 'create_playlist':
          await this.handleCreatePlaylist(intent.slots.playlistName!);
          break;

        case 'open_playlist':
          await this.handleOpenPlaylist(intent.slots.playlistName!);
          break;

        case 'detect_emotion':
          await this.handleDetectEmotion();
          break;

        case 'unknown':
          this.uiAdapter.showLowConfidence('Try "play", "next", or "scroll down"');
          break;

        default:
          console.warn('[VoiceCommandRunner] Unknown action:', intent.action);
      }
    });
  }

  /**
   * Handle create playlist voice command
   */
  private async handleCreatePlaylist(playlistName: string): Promise<void> {
    console.log('[VoiceCommandRunner] Creating playlist:', playlistName);
    
    const result = await this.playlistAdapter.createPlaylist(playlistName);
    
    if (result.success) {
      this.uiAdapter.showSuccess(result.message, false);
      await this.speak(result.message);
    } else {
      this.uiAdapter.showError(result.message);
      await this.speak(result.message);
    }
  }

  /**
   * Handle open playlist voice command
   */
  private async handleOpenPlaylist(playlistName: string): Promise<void> {
    console.log('[VoiceCommandRunner] Opening playlist:', playlistName);
    
    this.uiAdapter.showSuccess(`Opening playlist ${playlistName}...`, false);
    
    const result = await this.playlistAdapter.openPlaylist(playlistName);
    
    if (result.success) {
      this.uiAdapter.showSuccess(result.message, false);
      await this.speak(result.message);
    } else {
      this.uiAdapter.showError(result.message);
      await this.speak(result.message);
    }
  }

  /**
   * Handle detect emotion voice command
   */
  private async handleDetectEmotion(): Promise<void> {
    console.log('[VoiceCommandRunner] Starting emotion detection flow...');
    
    // Play earcon and show initial feedback
    this.uiAdapter.showSuccess('Analyzing emotion...', false);
    await this.speak('Analyzing emotion.');
    
    // Trigger the emotion analysis flow
    await emotionAnalysisService.startAnalysisWithVoiceFlow();
  }

  /**
   * Handle playing item in specific section
   */
  private async handlePlayItemInSection(sectionId: string, itemIndex: number): Promise<void> {
    console.log(`[VoiceCommandRunner] Playing item ${itemIndex} in section ${sectionId}`);

    // Scroll to item
    const item = this.scrollAdapter.scrollToItem(sectionId, itemIndex);
    
    if (!item) {
      this.uiAdapter.showError(`Item ${itemIndex} not found in ${sectionId}`);
      return;
    }

    // Highlight item
    this.uiAdapter.highlightElement(item);

    // Wait for scroll to complete
    await new Promise(resolve => setTimeout(resolve, 600));

    // Find and click play button
    const playButton = item.querySelector('.play-btn, [data-action="play"]') as HTMLElement;
    if (playButton) {
      playButton.click();
      this.lastSection = sectionId;
      this.uiAdapter.showSuccess(`Playing item ${itemIndex}`, !this.ttsEnabled);
      this.uiAdapter.pulseMiniPlayer();
    } else {
      // Fallback: try to get track data and play via adapter
      const title = item.querySelector('[data-title]')?.getAttribute('data-title');
      if (title) {
        await this.musicAdapter.playQuery(title);
        this.uiAdapter.showSuccess(`Playing ${title}`, !this.ttsEnabled);
      } else {
        this.uiAdapter.showError('Could not play item');
      }
    }
  }

  /**
   * Handle opening section and playing item
   */
  private async handleOpenAndPlay(sectionId: string, itemIndex: number): Promise<void> {
    // First scroll to section
    const success = this.scrollAdapter.scrollToSection(sectionId);
    if (!success) {
      this.uiAdapter.showError(`Section ${sectionId} not found`);
      return;
    }

    // Wait for scroll
    await new Promise(resolve => setTimeout(resolve, 800));

    // Then play item
    await this.handlePlayItemInSection(sectionId, itemIndex);
  }

  /**
   * Handle navigation
   */
  private handleNavigation(target: string): void {
    switch (target) {
      case 'home':
        this.navigationAdapter.openHome();
        break;
      case 'library':
        this.navigationAdapter.openLibrary();
        break;
      case 'emotions':
        this.navigationAdapter.openEmotions();
        break;
      case 'settings':
        this.navigationAdapter.openSettings();
        break;
      case 'search':
        this.navigationAdapter.openSearch();
        break;
      default:
        console.warn('[VoiceCommandRunner] Unknown navigation target:', target);
    }
    this.uiAdapter.showSuccess(`Opening ${target}`, !this.ttsEnabled);
  }

  /**
   * Get last referenced section (for context)
   */
  getLastSection(): string | null {
    return this.lastSection;
  }

  /**
   * Get last search query (for context)
   */
  getLastQuery(): string | null {
    return this.lastQuery;
  }
}
