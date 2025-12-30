/**
 * =============================================================================
 * FILE INFO
 * =============================================================================
 * Percorso: src/screens/TournamentDetailScreen.tsx
 * Creato: 2025-12-30
 * Descrizione: Dettaglio singolo torneo
 * =============================================================================
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

import { tournamentsApi } from '@api/tournaments';
import { TournamentDetail, RootStackParamList } from '@/types';

type RouteProps = RouteProp<RootStackParamList, 'TournamentDetail'>;
type NavProps = NativeStackNavigationProp<RootStackParamList>;

const DISCIPLINE_LABELS: Record<string, string> = {
  BIG_GAME: 'Big Game',
  DRIFTING: 'Drifting',
  TRAINA_COSTIERA: 'Traina Costiera',
  BOLENTINO: 'Bolentino',
  EGING: 'Eging',
  VERTICAL_JIGGING: 'Vertical Jigging',
  SHORE: 'Shore Fishing',
  SOCIAL: 'Social',
};

const TournamentDetailScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavProps>();
  const [tournament, setTournament] = useState<TournamentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTournament();
  }, []);

  const loadTournament = async () => {
    try {
      const data = await tournamentsApi.getById(route.params.id);
      setTournament(data);
    } catch (error) {
      Alert.alert('Errore', 'Impossibile caricare il torneo');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  if (loading || !tournament) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#0066CC" />
      </View>
    );
  }

  const isLive = tournament.status === 'IN_PROGRESS';
  const canRegister = tournament.status === 'REGISTRATION_OPEN' && !tournament.isRegistered;
  const canSubmitCatch = isLive && tournament.isRegistered;

  return (
    <ScrollView style={styles.container}>
      {/* Banner */}
      {tournament.bannerImage ? (
        <Image source={{ uri: tournament.bannerImage }} style={styles.banner} />
      ) : (
        <View style={[styles.banner, styles.bannerPlaceholder]}>
          <Icon name="trophy" size={64} color="#C7C7CC" />
        </View>
      )}

      {/* Status Badge */}
      {isLive && (
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      )}

      {/* Info */}
      <View style={styles.content}>
        <Text style={styles.title}>{tournament.name}</Text>
        <Text style={styles.discipline}>{DISCIPLINE_LABELS[tournament.discipline]}</Text>

        {/* Date & Location */}
        <View style={styles.infoRow}>
          <Icon name="calendar-outline" size={20} color="#666" />
          <Text style={styles.infoText}>
            {format(new Date(tournament.startDate), 'd MMM yyyy', { locale: it })} -{' '}
            {format(new Date(tournament.endDate), 'd MMM yyyy', { locale: it })}
          </Text>
        </View>

        {tournament.location && (
          <View style={styles.infoRow}>
            <Icon name="location-outline" size={20} color="#666" />
            <Text style={styles.infoText}>{tournament.location}</Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <Icon name="people-outline" size={20} color="#666" />
          <Text style={styles.infoText}>
            {tournament.currentParticipants}
            {tournament.maxParticipants && ` / ${tournament.maxParticipants}`} partecipanti
          </Text>
        </View>

        {tournament.entryFee && (
          <View style={styles.infoRow}>
            <Icon name="card-outline" size={20} color="#666" />
            <Text style={styles.infoText}>
              {tournament.entryFee} {tournament.currency} iscrizione
            </Text>
          </View>
        )}

        {/* Description */}
        {tournament.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Descrizione</Text>
            <Text style={styles.description}>{tournament.description}</Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('TournamentLeaderboard', { id: tournament.id })}
          >
            <Icon name="podium-outline" size={24} color="#0066CC" />
            <Text style={styles.actionButtonText}>Classifica</Text>
          </TouchableOpacity>

          {canSubmitCatch && (
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonPrimary]}
              onPress={() => navigation.navigate('SubmitCatch', { tournamentId: tournament.id })}
            >
              <Icon name="fish-outline" size={24} color="#fff" />
              <Text style={[styles.actionButtonText, { color: '#fff' }]}>Invia Cattura</Text>
            </TouchableOpacity>
          )}

          {canRegister && (
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonPrimary]}
              onPress={() => Alert.alert('Iscrizione', 'Funzionalita in sviluppo')}
            >
              <Icon name="add-circle-outline" size={24} color="#fff" />
              <Text style={[styles.actionButtonText, { color: '#fff' }]}>Iscriviti</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  banner: { width: '100%', height: 200 },
  bannerPlaceholder: { backgroundColor: '#F2F2F7', justifyContent: 'center', alignItems: 'center' },
  liveBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,59,48,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff', marginRight: 6 },
  liveText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  content: { padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1C1C1E' },
  discipline: { fontSize: 16, color: '#0066CC', fontWeight: '500', marginTop: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  infoText: { marginLeft: 8, fontSize: 15, color: '#666' },
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1C1C1E', marginBottom: 8 },
  description: { fontSize: 15, color: '#666', lineHeight: 22 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 24, marginBottom: 32 },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
    gap: 8,
  },
  actionButtonPrimary: { backgroundColor: '#0066CC' },
  actionButtonText: { fontSize: 16, fontWeight: '600', color: '#0066CC' },
});

export default TournamentDetailScreen;
