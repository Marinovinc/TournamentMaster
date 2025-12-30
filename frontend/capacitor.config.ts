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
  // Nessun server.url = usa file statici dalla cartella 'out'
  android: {
    allowMixedContent: false,
    webContentsDebuggingEnabled: false
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile'
  }
};

export default config;
