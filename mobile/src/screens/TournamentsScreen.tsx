/**
 * =============================================================================
 * FILE INFO
 * =============================================================================
 * Percorso: src/screens/TournamentsScreen.tsx
 * Creato: 2025-12-30
 * Descrizione: Lista tornei con filtri e ricerca
 * =============================================================================
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';

import { tournamentsApi, TournamentFilters } from '@api/tournaments';
import { Tournament, RootStackParamList, TournamentStatus } from '@/types';
import TournamentCard from '@components/tournaments/TournamentCard';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const STATUS_TABS: { label: string; value: TournamentStatus | 'ALL' }[] = [
  { label: 'Tutti', value: 'ALL' },
  { label: 'Live', value: 'IN_PROGRESS' },
  { label: 'Iscrizioni', value: 'REGISTRATION_OPEN' },
  { label: 'Conclusi', value: 'COMPLETED' },
];

const TournamentsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TournamentStatus | 'ALL'>('ALL');

  const loadTournaments = useCallback(async () => {
    try {
      const filters: TournamentFilters = {};
      if (activeTab !== 'ALL') filters.status = activeTab;
      if (search) filters.search = search;

      const response = await tournamentsApi.getAll(filters);
      setTournaments(response.data);
    } catch (error) {
      console.error('Error loading tournaments:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, search]);

  useEffect(() => {
    loadTournaments();
  }, [loadTournaments]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTournaments();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: Tournament }) => (
    <TournamentCard
      tournament={item}
      onPress={() => navigation.navigate('TournamentDetail', { id: item.id })}
    />
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search-outline" size={20} color="#8E8E93" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Cerca tornei..."
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          onSubmitEditing={loadTournaments}
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsContainer}>
        {STATUS_TABS.map(tab => (
          <TouchableOpacity
            key={tab.value}
            style={[styles.tab, activeTab === tab.value && styles.tabActive]}
            onPress={() => setActiveTab(tab.value)}
          >
            <Text style={[styles.tabText, activeTab === tab.value && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {loading ? (
        <ActivityIndicator size="large" color="#0066CC" style={styles.loader} />
      ) : (
        <FlatList
          data={tournaments}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Icon name="trophy-outline" size={64} color="#C7C7CC" />
              <Text style={styles.emptyText}>Nessun torneo trovato</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 16 },
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8, backgroundColor: '#E5E5EA' },
  tabActive: { backgroundColor: '#0066CC' },
  tabText: { fontSize: 14, color: '#1C1C1E', fontWeight: '500' },
  tabTextActive: { color: '#fff' },
  list: { padding: 16, paddingTop: 8 },
  loader: { flex: 1, justifyContent: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 64 },
  emptyText: { marginTop: 16, fontSize: 16, color: '#8E8E93' },
});

export default TournamentsScreen;
