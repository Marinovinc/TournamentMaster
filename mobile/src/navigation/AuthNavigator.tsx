/**
 * =============================================================================
 * FILE INFO
 * =============================================================================
 * Percorso: src/navigation/AuthNavigator.tsx
 * Creato: 2025-12-30
 * Descrizione: Stack navigator per schermate autenticazione
 *
 * Dipendenze:
 * - @react-navigation/native-stack
 *
 * Utilizzato da:
 * - src/navigation/AppNavigator.tsx
 * =============================================================================
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '@screens/LoginScreen';
import RegisterScreen from '@screens/RegisterScreen';

type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#fff' },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
