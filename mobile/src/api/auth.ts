/**
 * =============================================================================
 * FILE INFO
 * =============================================================================
 * Percorso: src/api/auth.ts
 * Creato: 2025-12-30
 * Descrizione: API per autenticazione (login, register, logout)
 *
 * Dipendenze:
 * - @api/client
 * - @types (User, AuthResponse)
 *
 * Utilizzato da:
 * - src/screens/LoginScreen.tsx
 * - src/screens/RegisterScreen.tsx
 * - src/hooks/useAuth.ts
 * =============================================================================
 */

import apiClient, { STORAGE_KEYS } from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthResponse, LoginCredentials, RegisterData } from '@/types';

export const authApi = {
  /**
   * Login con email e password
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<{ success: boolean; data: AuthResponse }>('/auth/login', credentials);

    // Backend wraps response in { success, data }
    const authData = response.data.data;

    // Salva tokens
    await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, authData.accessToken);
    await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, authData.refreshToken);
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(authData.user));

    return authData;
  },

  /**
   * Registrazione nuovo utente
   */
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await apiClient.post<{ success: boolean; data: AuthResponse }>('/auth/register', data);

    // Backend wraps response in { success, data }
    const authData = response.data.data;

    await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, authData.accessToken);
    await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, authData.refreshToken);
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(authData.user));

    return authData;
  },

  /**
   * Logout - cancella tokens locali e invalida sul server
   */
  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER,
      ]);
    }
  },

  /**
   * Recupera utente corrente dal server
   */
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<User>('/users/me');
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.data));
    return response.data;
  },

  /**
   * Verifica se l'utente e' autenticato (token valido in storage)
   */
  isAuthenticated: async (): Promise<boolean> => {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    return !!token;
  },

  /**
   * Recupera utente da storage locale (senza API call)
   */
  getStoredUser: async (): Promise<User | null> => {
    const userJson = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    return userJson ? JSON.parse(userJson) : null;
  },
};

export default authApi;
