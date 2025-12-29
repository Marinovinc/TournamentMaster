import type { CapacitorConfig } from '@capacitor/cli';

const isDev = process.env.NODE_ENV === 'development';
const devServerUrl = process.env.DEV_SERVER_URL || 'http://192.168.1.74:3000';
const prodServerUrl = process.env.PROD_SERVER_URL || 'https://tournamentmaster.app';

const config: CapacitorConfig = {
  appId: 'app.tournamentmaster.www',
  appName: 'TournamentMaster',
  webDir: 'out',
  plugins: {
    Camera: {
      quality: 90,
      allowEditing: false,
      resultType: 'uri'
    },
    Geolocation: {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    },
    CapacitorHttp: {
      enabled: true
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0ea5e9',
      showSpinner: true,
      spinnerColor: '#ffffff'
    }
  },
  server: {
    // L'app punta al server web (non usa file statici)
    url: isDev ? devServerUrl : prodServerUrl,
    cleartext: isDev // Solo in dev permetti HTTP non sicuro
  },
  android: {
    allowMixedContent: isDev, // Solo in dev
    webContentsDebuggingEnabled: isDev
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile'
  }
};

export default config;
