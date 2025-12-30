/**
 * =============================================================================
 * FILE INFO
 * =============================================================================
 * Percorso: src/screens/RegisterScreen.tsx
 * Creato: 2025-12-30
 * Descrizione: Schermata registrazione nuovo utente
 * =============================================================================
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useAuth } from '@hooks/useAuth';

const RegisterScreen: React.FC = () => {
  const navigation = useNavigation();
  const { register, isLoading } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegister = async () => {
    const { firstName, lastName, email, password, confirmPassword } = formData;

    if (!firstName || !lastName || !email || !password) {
      Alert.alert('Errore', 'Compila tutti i campi obbligatori');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Errore', 'Le password non coincidono');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Errore', 'La password deve avere almeno 8 caratteri');
      return;
    }

    try {
      await register({
        firstName,
        lastName,
        email,
        password,
        phone: formData.phone || undefined,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Errore durante la registrazione';
      Alert.alert('Errore', message);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Crea Account</Text>
      <Text style={styles.subtitle}>Registrati per partecipare ai tornei</Text>

      <TextInput
        style={styles.input}
        placeholder="Nome *"
        value={formData.firstName}
        onChangeText={v => updateField('firstName', v)}
      />

      <TextInput
        style={styles.input}
        placeholder="Cognome *"
        value={formData.lastName}
        onChangeText={v => updateField('lastName', v)}
      />

      <TextInput
        style={styles.input}
        placeholder="Email *"
        value={formData.email}
        onChangeText={v => updateField('email', v)}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Telefono"
        value={formData.phone}
        onChangeText={v => updateField('phone', v)}
        keyboardType="phone-pad"
      />

      <TextInput
        style={styles.input}
        placeholder="Password *"
        value={formData.password}
        onChangeText={v => updateField('password', v)}
        secureTextEntry
      />

      <TextInput
        style={styles.input}
        placeholder="Conferma Password *"
        value={formData.confirmPassword}
        onChangeText={v => updateField('confirmPassword', v)}
        secureTextEntry
      />

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleRegister}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Registrati</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.linkButton} onPress={() => navigation.goBack()}>
        <Text style={styles.linkText}>
          Hai gia un account? <Text style={styles.linkTextBold}>Accedi</Text>
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#0066CC', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 8, marginBottom: 32 },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#F9F9F9',
  },
  button: {
    backgroundColor: '#0066CC',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  linkButton: { marginTop: 24, alignItems: 'center', marginBottom: 40 },
  linkText: { color: '#666', fontSize: 14 },
  linkTextBold: { color: '#0066CC', fontWeight: '600' },
});

export default RegisterScreen;
