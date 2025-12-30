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
import { LogBox, View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Ignora warning non critici in development
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

// Versione semplificata per test iniziale
const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <Text style={styles.title}>TournamentMaster</Text>
        <Text style={styles.subtitle}>App Mobile per Tornei di Pesca</Text>
        <Text style={styles.status}>Connesso a: localhost:3001</Text>
        <Text style={styles.info}>Versione: 1.0.0</Text>
      </View>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0066CC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 30,
  },
  status: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.7,
    marginBottom: 5,
  },
  info: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.5,
  },
});

export default App;
