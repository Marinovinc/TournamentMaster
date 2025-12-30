/**
 * =============================================================================
 * FILE INFO
 * =============================================================================
 * Percorso: App.tsx
 * Creato: 2025-12-30
 * Descrizione: Entry point principale TournamentMaster Mobile App
 * =============================================================================
 */

import React, { useEffect } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppNavigator } from '@/navigation';
import { useAuth } from '@/hooks';

// Ignora warning non critici in development
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

const App: React.FC = () => {
  const { initialize } = useAuth();

  useEffect(() => {
    // Inizializza stato autenticazione al boot
    initialize();
  }, [initialize]);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;
