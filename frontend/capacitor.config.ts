import type { CapacitorConfig } from '@capacitor/cli';

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
    // Connetti al server locale del PC (frontend Next.js)
    url: 'http://192.168.1.74:3000',
    cleartext: true // Permetti HTTP (non HTTPS) per dev locale
  },
  android: {
    allowMixedContent: true, // Permetti contenuti misti per dev
    webContentsDebuggingEnabled: true // Debug Chrome DevTools
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile'
  }
};

export default config;
