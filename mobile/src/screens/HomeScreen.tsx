/**
 * =============================================================================
 * FILE INFO
 * =============================================================================
 * Percorso: src/screens/HomeScreen.tsx
 * Creato: 2025-12-30
 * Descrizione: Home screen con tornei live e prossimi
 * =============================================================================
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';

import { tournamentsApi } from '@api/tournaments';
import { Tournament, RootStackParamList } from '@/types';
import TournamentCard from '@components/tournaments/TournamentCard';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [liveTournaments, setLiveTournaments] = useState<Tournament[]>([]);
  const [upcomingTournaments, setUpcomingTournaments] = useState<Tournament[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [live, upcoming] = await Promise.all([
        tournamentsApi.getLive(),
        tournamentsApi.getAll({ status: 'REGISTRATION_OPEN', limit: 5 }),
      ]);
      setLiveTournaments(live);
      setUpcomingTournaments(upcoming.data);
    } catch (error) {
      console.error('Error loading home data:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Live Section */}
      {liveTournaments.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>
          {liveTournaments.map(tournament => (
            <TournamentCard
              key={tournament.id}
              tournament={tournament}
              onPress={() => navigation.navigate('TournamentDetail', { id: tournament.id })}
            />
          ))}
        </View>
      )}

      {/* Upcoming Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Prossimi Tornei</Text>
          <TouchableOpacity onPress={() => navigation.navigate('MainTabs')}>
            <Text style={styles.seeAll}>Vedi tutti</Text>
          </TouchableOpacity>
        </View>
        {upcomingTournaments.length > 0 ? (
          upcomingTournaments.map(tournament => (
            <TournamentCard
              key={tournament.id}
              tournament={tournament}
              onPress={() => navigation.navigate('TournamentDetail', { id: tournament.id })}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Icon name="calendar-outline" size={48} color="#C7C7CC" />
            <Text style={styles.emptyText}>Nessun torneo in programma</Text>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Azioni Rapide</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard}>
            <Icon name="fish-outline" size={32} color="#0066CC" />
            <Text style={styles.actionText}>Le Mie Catture</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <Icon name="trophy-outline" size={32} color="#0066CC" />
            <Text style={styles.actionText}>I Miei Tornei</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  section: { padding: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 20, fontWeight: '600', color: '#1C1C1E' },
  seeAll: { fontSize: 14, color: '#0066CC', fontWeight: '500' },
  liveIndicator: { flexDirection: 'row', alignItems: 'center' },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF3B30', marginRight: 6 },
  liveText: { fontSize: 14, fontWeight: '700', color: '#FF3B30' },
  emptyState: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { marginTop: 12, fontSize: 16, color: '#8E8E93' },
  actionsGrid: { flexDirection: 'row', gap: 12 },
  actionCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionText: { marginTop: 8, fontSize: 14, fontWeight: '500', color: '#1C1C1E' },
});

export default HomeScreen;
