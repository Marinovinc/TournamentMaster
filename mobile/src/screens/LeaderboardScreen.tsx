/**
 * =============================================================================
 * FILE INFO
 * =============================================================================
 * Percorso: src/screens/LeaderboardScreen.tsx
 * Creato: 2025-12-30
 * Descrizione: Classifica live torneo
 * =============================================================================
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import { tournamentsApi } from '@api/tournaments';
import { LeaderboardEntry, Tournament } from '@/types';

const LeaderboardScreen: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadLiveTournaments();
  }, []);

  useEffect(() => {
    if (selectedTournament) {
      loadLeaderboard(selectedTournament);
    }
  }, [selectedTournament]);

  const loadLiveTournaments = async () => {
    try {
      const live = await tournamentsApi.getLive();
      setTournaments(live);
      if (live.length > 0 && !selectedTournament) {
        setSelectedTournament(live[0].id);
      }
    } catch (error) {
      console.error('Error loading live tournaments:', error);
    }
  };

  const loadLeaderboard = async (tournamentId: string) => {
    try {
      const data = await tournamentsApi.getLeaderboard(tournamentId);
      setLeaderboard(data);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (selectedTournament) {
      await loadLeaderboard(selectedTournament);
    }
    setRefreshing(false);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return { name: 'medal', color: '#FFD700' };
      case 2: return { name: 'medal', color: '#C0C0C0' };
      case 3: return { name: 'medal', color: '#CD7F32' };
      default: return null;
    }
  };

  const renderItem = ({ item }: { item: LeaderboardEntry }) => {
    const rankIcon = getRankIcon(item.rank);

    return (
      <View style={styles.row}>
        <View style={styles.rankContainer}>
          {rankIcon ? (
            <Icon name={rankIcon.name} size={24} color={rankIcon.color} />
          ) : (
            <Text style={styles.rankText}>{item.rank}</Text>
          )}
        </View>
        <View style={styles.participantInfo}>
          <Text style={styles.participantName}>{item.participantName}</Text>
          {item.teamName && <Text style={styles.teamName}>{item.teamName}</Text>}
        </View>
        <View style={styles.stats}>
          <Text style={styles.statValue}>{item.totalCatches}</Text>
          <Text style={styles.statLabel}>catture</Text>
        </View>
        <View style={styles.stats}>
          <Text style={styles.statValue}>{item.totalWeight.toFixed(1)}</Text>
          <Text style={styles.statLabel}>kg</Text>
        </View>
        <View style={[styles.stats, styles.points]}>
          <Text style={styles.pointsValue}>{item.totalPoints}</Text>
          <Text style={styles.statLabel}>punti</Text>
        </View>
      </View>
    );
  };

  if (tournaments.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="podium-outline" size={64} color="#C7C7CC" />
        <Text style={styles.emptyText}>Nessun torneo live</Text>
        <Text style={styles.emptySubtext}>La classifica sara disponibile durante i tornei</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tournament Selector - TODO: add picker if multiple live tournaments */}
      {tournaments.length > 0 && (
        <View style={styles.header}>
          <Text style={styles.tournamentName}>{tournaments[0]?.name}</Text>
        </View>
      )}

      <FlatList
        data={leaderboard}
        renderItem={renderItem}
        keyExtractor={item => item.participantId}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyList}>
            <Text style={styles.emptyListText}>Nessuna cattura ancora registrata</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { backgroundColor: '#fff', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  tournamentName: { fontSize: 18, fontWeight: '600', color: '#1C1C1E' },
  list: { padding: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  rankContainer: { width: 40, alignItems: 'center' },
  rankText: { fontSize: 18, fontWeight: '700', color: '#8E8E93' },
  participantInfo: { flex: 1, marginLeft: 8 },
  participantName: { fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
  teamName: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  stats: { alignItems: 'center', marginHorizontal: 8 },
  statValue: { fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
  statLabel: { fontSize: 11, color: '#8E8E93' },
  points: { backgroundColor: '#0066CC', borderRadius: 8, padding: 8, marginLeft: 8 },
  pointsValue: { fontSize: 16, fontWeight: '700', color: '#fff' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#1C1C1E', marginTop: 16 },
  emptySubtext: { fontSize: 14, color: '#8E8E93', marginTop: 8, textAlign: 'center' },
  emptyList: { alignItems: 'center', paddingVertical: 32 },
  emptyListText: { fontSize: 16, color: '#8E8E93' },
});

export default LeaderboardScreen;
