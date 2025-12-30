/**
 * =============================================================================
 * FILE INFO
 * =============================================================================
 * Percorso: src/components/tournaments/TournamentCard.tsx
 * Creato: 2025-12-30
 * Descrizione: Card per visualizzazione torneo in lista
 * =============================================================================
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

import { Tournament } from '@/types';

interface Props {
  tournament: Tournament;
  onPress: () => void;
}

const DISCIPLINE_ICONS: Record<string, string> = {
  BIG_GAME: 'fish',
  DRIFTING: 'boat',
  TRAINA_COSTIERA: 'boat-outline',
  BOLENTINO: 'fish-outline',
  EGING: 'water',
  VERTICAL_JIGGING: 'arrow-down',
  SHORE: 'walk',
  SOCIAL: 'people',
};

const TournamentCard: React.FC<Props> = ({ tournament, onPress }) => {
  const isLive = tournament.status === 'IN_PROGRESS';
  const isOpen = tournament.status === 'REGISTRATION_OPEN';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {/* Banner */}
      {tournament.bannerImage ? (
        <Image source={{ uri: tournament.bannerImage }} style={styles.banner} />
      ) : (
        <View style={[styles.banner, styles.bannerPlaceholder]}>
          <Icon
            name={DISCIPLINE_ICONS[tournament.discipline] || 'trophy'}
            size={32}
            color="#C7C7CC"
          />
        </View>
      )}

      {/* Status Badge */}
      {isLive && (
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{tournament.name}</Text>

        <View style={styles.infoRow}>
          <Icon name="calendar-outline" size={14} color="#8E8E93" />
          <Text style={styles.infoText}>
            {format(new Date(tournament.startDate), 'd MMM', { locale: it })}
          </Text>

          {tournament.location && (
            <>
              <Icon name="location-outline" size={14} color="#8E8E93" style={styles.infoIcon} />
              <Text style={styles.infoText} numberOfLines={1}>{tournament.location}</Text>
            </>
          )}
        </View>

        <View style={styles.footer}>
          <View style={styles.participants}>
            <Icon name="people-outline" size={14} color="#8E8E93" />
            <Text style={styles.participantsText}>
              {tournament.currentParticipants}
              {tournament.maxParticipants && `/${tournament.maxParticipants}`}
            </Text>
          </View>

          {isOpen && tournament.entryFee && (
            <View style={styles.fee}>
              <Text style={styles.feeText}>
                {tournament.entryFee} {tournament.currency}
              </Text>
            </View>
          )}

          {isOpen && (
            <View style={styles.openBadge}>
              <Text style={styles.openText}>Iscrizioni aperte</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  banner: { width: '100%', height: 120 },
  bannerPlaceholder: { backgroundColor: '#F2F2F7', justifyContent: 'center', alignItems: 'center' },
  liveBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,59,48,0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff', marginRight: 4 },
  liveText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  content: { padding: 12 },
  title: { fontSize: 16, fontWeight: '600', color: '#1C1C1E', marginBottom: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoText: { fontSize: 13, color: '#8E8E93', marginLeft: 4, flex: 1 },
  infoIcon: { marginLeft: 12 },
  footer: { flexDirection: 'row', alignItems: 'center' },
  participants: { flexDirection: 'row', alignItems: 'center' },
  participantsText: { fontSize: 13, color: '#8E8E93', marginLeft: 4 },
  fee: { marginLeft: 'auto', backgroundColor: '#F2F2F7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  feeText: { fontSize: 13, fontWeight: '600', color: '#1C1C1E' },
  openBadge: { marginLeft: 8, backgroundColor: '#34C759', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  openText: { fontSize: 11, fontWeight: '600', color: '#fff' },
});

export default TournamentCard;
