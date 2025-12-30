/**
 * =============================================================================
 * FILE INFO
 * =============================================================================
 * Percorso: src/navigation/AppNavigator.tsx
 * Creato: 2025-12-30
 * Descrizione: Root navigator con gestione auth state
 *
 * Dipendenze:
 * - @react-navigation/native
 * - @react-navigation/native-stack
 * - @hooks/useAuth
 *
 * Utilizzato da:
 * - App.tsx
 * =============================================================================
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

import { useAuth } from '@hooks/useAuth';
import { RootStackParamList } from '@/types';

// Navigators
import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';

// Screens (importati direttamente per stack principale)
import TournamentDetailScreen from '@screens/TournamentDetailScreen';
import TournamentLeaderboardScreen from '@screens/TournamentLeaderboardScreen';
import SubmitCatchScreen from '@screens/SubmitCatchScreen';
import CatchDetailScreen from '@screens/CatchDetailScreen';
import MyCatchesScreen from '@screens/MyCatchesScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          // Auth screens
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          // Main app screens
          <>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            <Stack.Screen
              name="TournamentDetail"
              component={TournamentDetailScreen}
              options={{ headerShown: true, title: 'Dettaglio Torneo' }}
            />
            <Stack.Screen
              name="TournamentLeaderboard"
              component={TournamentLeaderboardScreen}
              options={{ headerShown: true, title: 'Classifica' }}
            />
            <Stack.Screen
              name="SubmitCatch"
              component={SubmitCatchScreen}
              options={{ headerShown: true, title: 'Nuova Cattura' }}
            />
            <Stack.Screen
              name="CatchDetail"
              component={CatchDetailScreen}
              options={{ headerShown: true, title: 'Dettaglio Cattura' }}
            />
            <Stack.Screen
              name="MyCatches"
              component={MyCatchesScreen}
              options={{ headerShown: true, title: 'Le Mie Catture' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

export default AppNavigator;
