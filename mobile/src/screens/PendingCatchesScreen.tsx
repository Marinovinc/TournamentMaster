/**
 * =============================================================================
 * FILE INFO
 * =============================================================================
 * Percorso: src/screens/PendingCatchesScreen.tsx
 * Creato: 2026-01-02
 * Descrizione: Schermata per visualizzare catture in attesa di sincronizzazione
 * =============================================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

import { catchesApi } from '@api/catches';
import { useNetwork } from '@hooks/useNetwork';
import { syncService, SyncProgress } from '@services/offline';
import { PendingCatch, SyncStatus } from '@services/offline/OfflineStorage';

const PendingCatchesScreen: React.FC = () => {
  const navigation = useNavigation();
  const { isOnline } = useNetwork();

  const [pendingCatches, setPendingCatches] = useState<PendingCatch[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);

  // Carica catture pendenti al focus
  useFocusEffect(
    useCallback(() => {
      loadPendingCatches();
    }, [])
  );

  // Sottoscrivi a progressi sync
  useEffect(() => {
    const unsubscribe = syncService.onProgress((progress) => {
      setSyncProgress(progress);
    });
    return unsubscribe;
  }, []);

  const loadPendingCatches = async () => {
    try {
      const pending = await catchesApi.getPendingCatches();
      setPendingCatches(pending);
    } catch (error) {
      console.error('Error loading pending catches:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPendingCatches();
    setRefreshing(false);
  };

  const handleSyncNow = async () => {
    if (!isOnline) {
      Alert.alert(
        'Offline',
        'Non sei connesso a internet. La sincronizzazione avverra automaticamente quando tornerai online.'
      );
      return;
    }

    setSyncing(true);
    try {
      const result = await catchesApi.forceSync();

      if (result.syncedCount > 0) {
        Alert.alert(
          'Sincronizzazione Completata',
          `${result.syncedCount} catture sincronizzate con successo.`
        );
      } else if (result.failedCount > 0) {
        Alert.alert(
          'Errore Sincronizzazione',
          `${result.failedCount} catture non sincronizzate. Riprova piu tardi.`
        );
      } else {
        Alert.alert('Nessuna Cattura', 'Non ci sono catture da sincronizzare.');
      }

      await loadPendingCatches();
    } catch (error) {
      Alert.alert('Errore', 'Impossibile sincronizzare. Riprova.');
    } finally {
      setSyncing(false);
      setSyncProgress(null);
    }
  };

  const getStatusIcon = (status: SyncStatus) => {
    switch (status) {
      case 'pending':
        return { name: 'time-outline', color: '#FF9500' };
      case 'syncing':
        return { name: 'sync', color: '#007AFF' };
      case 'synced':
        return { name: 'checkmark-circle', color: '#34C759' };
      case 'failed':
        return { name: 'alert-circle', color: '#FF3B30' };
    }
  };

  const getStatusText = (status: SyncStatus) => {
    switch (status) {
      case 'pending':
        return 'In attesa';
      case 'syncing':
        return 'Sincronizzazione...';
      case 'synced':
        return 'Sincronizzato';
      case 'failed':
        return 'Errore';
    }
  };

  const renderCatchItem = ({ item }: { item: PendingCatch }) => {
    const statusIcon = getStatusIcon(item.syncStatus);
    const capturedDate = new Date(item.capturedAt);

    return (
      <View style={styles.catchCard}>
        {/* Thumbnail */}
        <View style={styles.thumbnailContainer}>
          {item.localPhotoPaths.length > 0 ? (
            <Image
              source={{ uri: item.localPhotoPaths[0] }}
              style={styles.thumbnail}
            />
          ) : (
            <View style={[styles.thumbnail, styles.noImage]}>
              <Icon name="fish-outline" size={24} color="#8E8E93" />
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.catchInfo}>
          <Text style={styles.catchWeight}>{item.weight} kg</Text>
          {item.length && (
            <Text style={styles.catchLength}>{item.length} cm</Text>
          )}
          <Text style={styles.catchDate}>
            {format(capturedDate, 'dd MMM yyyy HH:mm', { locale: it })}
          </Text>
          <View style={styles.gpsRow}>
            <Icon name="location-outline" size={12} color="#8E8E93" />
            <Text style={styles.gpsText}>
              {item.gps.latitude.toFixed(4)}, {item.gps.longitude.toFixed(4)}
            </Text>
          </View>
        </View>

        {/* Status */}
        <View style={styles.statusContainer}>
          <Icon name={statusIcon.name} size={24} color={statusIcon.color} />
          <Text style={[styles.statusText, { color: statusIcon.color }]}>
            {getStatusText(item.syncStatus)}
          </Text>
          {item.syncStatus === 'failed' && item.syncAttempts > 0 && (
            <Text style={styles.retryText}>
              Tentativi: {item.syncAttempts}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="cloud-done-outline" size={64} color="#34C759" />
      <Text style={styles.emptyTitle}>Tutto Sincronizzato!</Text>
      <Text style={styles.emptySubtitle}>
        Non ci sono catture in attesa di sincronizzazione.
      </Text>
    </View>
  );

  const pendingCount = pendingCatches.filter(
    c => c.syncStatus === 'pending' || c.syncStatus === 'failed'
  ).length;

  return (
    <View style={styles.container}>
      {/* Header Status */}
      <View style={styles.header}>
        <View style={styles.connectionStatus}>
          <Icon
            name={isOnline ? 'wifi' : 'wifi-outline'}
            size={20}
            color={isOnline ? '#34C759' : '#FF3B30'}
          />
          <Text style={[styles.connectionText, { color: isOnline ? '#34C759' : '#FF3B30' }]}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
        </View>

        {pendingCount > 0 && (
          <TouchableOpacity
            style={[styles.syncButton, syncing && styles.syncButtonDisabled]}
            onPress={handleSyncNow}
            disabled={syncing || !isOnline}
          >
            <Icon
              name={syncing ? 'sync' : 'cloud-upload'}
              size={18}
              color="#fff"
            />
            <Text style={styles.syncButtonText}>
              {syncing ? 'Sincronizzando...' : `Sincronizza (${pendingCount})`}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Sync Progress */}
      {syncProgress && syncing && (
        <View style={styles.progressBar}>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${(syncProgress.completed / syncProgress.total) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {syncProgress.completed}/{syncProgress.total} catture
          </Text>
        </View>
      )}

      {/* Lista */}
      <FlatList
        data={pendingCatches}
        renderItem={renderCatchItem}
        keyExtractor={(item) => item.localId}
        contentContainerStyle={pendingCatches.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  connectionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0066CC',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  syncButtonDisabled: {
    opacity: 0.6,
  },
  syncButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },

  // Progress
  progressBar: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0066CC',
  },
  progressText: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 6,
    textAlign: 'center',
  },

  // List
  listContent: {
    padding: 16,
  },

  // Catch Card
  catchCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  thumbnailContainer: {
    marginRight: 12,
  },
  thumbnail: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
  noImage: {
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  catchInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  catchWeight: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  catchLength: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  catchDate: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  gpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  gpsText: {
    fontSize: 10,
    color: '#8E8E93',
  },

  // Status
  statusContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
  retryText: {
    fontSize: 9,
    color: '#8E8E93',
    marginTop: 2,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default PendingCatchesScreen;
