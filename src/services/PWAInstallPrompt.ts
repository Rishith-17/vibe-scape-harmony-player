class PWAInstallPrompt {
  private static instance: PWAInstallPrompt;
  private deferredPrompt: any = null;
  private isInstallable = false;
  private isInstalled = false;
  
  private constructor() {
    this.setupInstallPrompt();
    this.checkIfInstalled();
  }

  static getInstance(): PWAInstallPrompt {
    if (!PWAInstallPrompt.instance) {
      PWAInstallPrompt.instance = new PWAInstallPrompt();
    }
    return PWAInstallPrompt.instance;
  }

  private setupInstallPrompt() {
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('PWA install prompt available');
      e.preventDefault();
      this.deferredPrompt = e;
      this.isInstallable = true;
      this.showInstallBanner();
    });

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      this.isInstalled = true;
      this.deferredPrompt = null;
      this.isInstallable = false;
      this.hideInstallBanner();
      this.showInstalledMessage();
    });
  }

  private checkIfInstalled() {
    // Check if running as PWA
    if (window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as any).standalone === true) {
      this.isInstalled = true;
      console.log('Running as installed PWA');
    }
  }

  async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) {
      console.log('No install prompt available');
      return false;
    }

    try {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted PWA install');
        return true;
      } else {
        console.log('User dismissed PWA install');
        return false;
      }
    } catch (error) {
      console.error('Error prompting PWA install:', error);
      return false;
    } finally {
      this.deferredPrompt = null;
      this.isInstallable = false;
    }
  }

  private showInstallBanner() {
    // Only show if not already shown recently
    const lastShown = localStorage.getItem('pwa_banner_last_shown');
    const now = Date.now();
    
    if (lastShown && now - parseInt(lastShown) < 24 * 60 * 60 * 1000) {
      return; // Don't show if shown in last 24 hours
    }

    setTimeout(() => {
      const banner = this.createInstallBanner();
      document.body.appendChild(banner);
      localStorage.setItem('pwa_banner_last_shown', now.toString());
    }, 3000); // Show after 3 seconds
  }

  private createInstallBanner(): HTMLElement {
    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      right: 20px;
      background: linear-gradient(135deg, #1e293b, #334155);
      color: white;
      padding: 16px;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.3);
      z-index: 10000;
      display: flex;
      align-items: center;
      gap: 12px;
      animation: slideUp 0.3s ease-out;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.1);
    `;

    banner.innerHTML = `
      <div style="flex: 1;">
        <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">
          🎵 Install for Spotify-like Background Playback
        </div>
        <div style="font-size: 12px; opacity: 0.8;">
          Chrome optimized: Music continues when minimized, locked, or switched tabs
        </div>
      </div>
      <button id="pwa-install-btn" style="
        background: #3b82f6;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
      ">Install</button>
      <button id="pwa-dismiss-btn" style="
        background: transparent;
        color: white;
        border: none;
        padding: 8px;
        border-radius: 6px;
        font-size: 18px;
        cursor: pointer;
        opacity: 0.6;
        transition: opacity 0.2s;
      ">×</button>
    `;

    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideUp {
        from { transform: translateY(100%); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      #pwa-install-btn:hover { background: #2563eb; }
      #pwa-dismiss-btn:hover { opacity: 1; }
    `;
    document.head.appendChild(style);

    // Add event listeners
    banner.querySelector('#pwa-install-btn')?.addEventListener('click', () => {
      this.promptInstall();
      this.hideInstallBanner();
    });

    banner.querySelector('#pwa-dismiss-btn')?.addEventListener('click', () => {
      this.hideInstallBanner();
    });

    return banner;
  }

  private hideInstallBanner() {
    const banner = document.getElementById('pwa-install-banner');
    if (banner) {
      banner.style.animation = 'slideDown 0.3s ease-in forwards';
      setTimeout(() => banner.remove(), 300);
    }
  }

  private showInstalledMessage() {
    const message = document.createElement('div');
    message.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #10b981;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      z-index: 10000;
      animation: fadeInOut 3s ease-in-out;
    `;
    message.textContent = '🎉 Vibe Scape installed! Enjoy better background playback';
    
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeInOut {
        0%, 100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
        15%, 85% { opacity: 1; transform: translateX(-50%) translateY(0); }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(message);
    setTimeout(() => message.remove(), 3000);
  }

  isAppInstallable(): boolean {
    return this.isInstallable;
  }

  isAppInstalled(): boolean {
    return this.isInstalled;
  }

  showBackgroundPlaybackTip() {
    if (this.isInstalled) return;

    const tip = document.createElement('div');
    tip.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      right: 20px;
      background: #f59e0b;
      color: white;
      padding: 12px;
      border-radius: 8px;
      font-size: 13px;
      z-index: 9999;
      animation: slideDown 0.3s ease-out;
    `;
    tip.innerHTML = `
      💡 <strong>Tip:</strong> Install this app for better background playback! 
      <button onclick="this.parentElement.remove()" style="float: right; background: none; border: none; color: white; font-size: 16px; cursor: pointer;">×</button>
    `;
    
    document.body.appendChild(tip);
    setTimeout(() => tip.remove(), 5000);
  }
}

export default PWAInstallPrompt;