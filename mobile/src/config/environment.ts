/**
 * =============================================================================
 * FILE INFO
 * =============================================================================
 * Percorso: src/config/environment.ts
 * Creato: 2025-12-30
 * Descrizione: Configurazione ambiente per API e servizi
 *
 * Dipendenze:
 * - react-native-config (variabili .env)
 *
 * Utilizzato da:
 * - src/api/client.ts
 * - src/api/*.ts (tutti i moduli API)
 * =============================================================================
 */

import { Platform } from 'react-native';

// Conditional import for react-native-config (not available on web)
let Config: any = {};
if (Platform.OS !== 'web') {
  try {
    Config = require('react-native-config').default;
  } catch (e) {
    console.log('[Config] react-native-config not available');
  }
}

export interface Environment {
  apiBaseUrl: string;
  wsBaseUrl: string;
  frontendUrl: string;
  env: 'development' | 'staging' | 'production';
}

// Fallback per development se Config non carica
const getDeviceApiUrl = (): string => {
  // Web usa Railway backend direttamente
  if (Platform.OS === 'web') {
    return 'https://backend-production-70dd0.up.railway.app/api';
  }
  // Android Emulator usa 10.0.2.2 per localhost
  // iOS Simulator puo' usare localhost direttamente
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3001/api/v1';
  }
  return 'http://localhost:3001/api/v1';
};

const getDeviceWsUrl = (): string => {
  if (Platform.OS === 'web') {
    return 'wss://backend-production-70dd0.up.railway.app';
  }
  if (Platform.OS === 'android') {
    return 'ws://10.0.2.2:3001';
  }
  return 'ws://localhost:3001';
};

export const environment: Environment = {
  apiBaseUrl: Config?.API_BASE_URL || getDeviceApiUrl(),
  wsBaseUrl: Config?.WS_BASE_URL || getDeviceWsUrl(),
  frontendUrl: Config?.FRONTEND_URL || 'http://localhost:3000',
  env: (Config?.ENV as Environment['env']) || 'development',
};

// Helpers
export const isDevelopment = environment.env === 'development';
export const isProduction = environment.env === 'production';

// Log config in development
if (isDevelopment) {
  console.log('[Config] Environment:', environment);
}

export default environment;
