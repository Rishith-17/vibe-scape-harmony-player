
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.5b24701357054da4a18e0c5af1e2f706',
  appName: 'vibe-scape-harmony-player',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    BackgroundMode: {
      enabled: true,
      title: 'Music Player',
      text: 'Playing music in background',
      silent: false
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#488AFF",
      sound: "beep.wav",
    },
    MusicControls: {
      enabled: true
    }
  },
  android: {
    allowMixedContent: true
  },
  ios: {
    scheme: 'App'
  }
};

export default config;
