/**
 * =============================================================================
 * FILE INFO
 * =============================================================================
 * Percorso: src/screens/ProfileScreen.tsx
 * Creato: 2025-12-30
 * Descrizione: Profilo utente con statistiche
 * =============================================================================
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import { useAuth } from '@hooks/useAuth';

const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Logout', 'Sei sicuro di voler uscire?', [
      { text: 'Annulla', style: 'cancel' },
      { text: 'Esci', style: 'destructive', onPress: logout },
    ]);
  };

  if (!user) return null;

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user.firstName[0]}{user.lastName[0]}
          </Text>
        </View>
        <Text style={styles.name}>{user.firstName} {user.lastName}</Text>
        <Text style={styles.email}>{user.email}</Text>
        {user.phone && <Text style={styles.phone}>{user.phone}</Text>}
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Tornei</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Catture</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Vittorie</Text>
        </View>
      </View>

      {/* Menu Items */}
      <View style={styles.menu}>
        <TouchableOpacity style={styles.menuItem}>
          <Icon name="fish-outline" size={24} color="#0066CC" />
          <Text style={styles.menuText}>Le Mie Catture</Text>
          <Icon name="chevron-forward" size={20} color="#C7C7CC" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Icon name="trophy-outline" size={24} color="#0066CC" />
          <Text style={styles.menuText}>I Miei Tornei</Text>
          <Icon name="chevron-forward" size={20} color="#C7C7CC" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Icon name="document-text-outline" size={24} color="#0066CC" />
          <Text style={styles.menuText}>Documenti</Text>
          <Icon name="chevron-forward" size={20} color="#C7C7CC" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Icon name="settings-outline" size={24} color="#0066CC" />
          <Text style={styles.menuText}>Impostazioni</Text>
          <Icon name="chevron-forward" size={20} color="#C7C7CC" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Icon name="notifications-outline" size={24} color="#0066CC" />
          <Text style={styles.menuText}>Notifiche</Text>
          <Icon name="chevron-forward" size={20} color="#C7C7CC" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Icon name="help-circle-outline" size={24} color="#0066CC" />
          <Text style={styles.menuText}>Aiuto</Text>
          <Icon name="chevron-forward" size={20} color="#C7C7CC" />
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Icon name="log-out-outline" size={24} color="#FF3B30" />
        <Text style={styles.logoutText}>Esci</Text>
      </TouchableOpacity>

      {/* Version */}
      <Text style={styles.version}>TournamentMaster v1.0.0</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { alignItems: 'center', padding: 24, backgroundColor: '#fff' },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0066CC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 28, fontWeight: '600', color: '#fff' },
  name: { fontSize: 22, fontWeight: '600', color: '#1C1C1E', marginTop: 12 },
  email: { fontSize: 15, color: '#8E8E93', marginTop: 4 },
  phone: { fontSize: 15, color: '#8E8E93', marginTop: 2 },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginTop: 1,
    paddingVertical: 20,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '700', color: '#0066CC' },
  statLabel: { fontSize: 13, color: '#8E8E93', marginTop: 4 },
  statDivider: { width: 1, backgroundColor: '#E5E5EA' },
  menu: { marginTop: 24, backgroundColor: '#fff' },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  menuText: { flex: 1, fontSize: 16, color: '#1C1C1E', marginLeft: 12 },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  logoutText: { fontSize: 16, fontWeight: '600', color: '#FF3B30', marginLeft: 8 },
  version: { textAlign: 'center', fontSize: 13, color: '#8E8E93', marginTop: 24, marginBottom: 32 },
});

export default ProfileScreen;
