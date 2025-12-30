/**
 * =============================================================================
 * FILE INFO
 * =============================================================================
 * Percorso: src/hooks/useAuth.ts
 * Creato: 2025-12-30
 * Descrizione: Hook per gestione autenticazione con Zustand
 * =============================================================================
 */

import { create } from 'zustand';
import { authApi } from '@api/auth';
import { User, LoginCredentials, RegisterData } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  initialize: async () => {
    try {
      set({ isLoading: true });
      const isAuth = await authApi.isAuthenticated();
      if (isAuth) {
        const user = await authApi.getStoredUser();
        set({ user, isAuthenticated: true });
      }
    } catch (error) {
      console.error('Auth init error:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (credentials: LoginCredentials) => {
    try {
      set({ isLoading: true, error: null });
      const response = await authApi.login(credentials);
      set({ user: response.user, isAuthenticated: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Login fallito';
      set({ error: message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (data: RegisterData) => {
    try {
      set({ isLoading: true, error: null });
      const response = await authApi.register(data);
      set({ user: response.user, isAuthenticated: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Registrazione fallita';
      set({ error: message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } finally {
      set({ user: null, isAuthenticated: false });
    }
  },

  clearError: () => set({ error: null }),
}));

export default useAuth;
