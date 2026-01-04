/**
 * =============================================================================
 * FILE INFO
 * =============================================================================
 * Percorso: src/screens/SubmitCatchScreen.tsx
 * Creato: 2025-12-30
 * Aggiornato: 2026-01-02 - Supporto offline-first
 * Descrizione: Schermata invio cattura con foto, GPS e supporto offline
 * =============================================================================
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { launchCamera, CameraOptions } from 'react-native-image-picker';

import { catchesApi } from '@api/catches';
import { useGPS } from '@hooks/useGPS';
import { useNetwork } from '@hooks/useNetwork';
import { RootStackParamList, Species, MediaFile, GPSPosition } from '@/types';

type RouteProps = RouteProp<RootStackParamList, 'SubmitCatch'>;

const SubmitCatchScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation();
  const { position, error: gpsError, loading: gpsLoading, requestLocation } = useGPS();
  const { isOnline, isConnected } = useNetwork();

  const [species, setSpecies] = useState<Species[]>([]);
  const [selectedSpecies, setSelectedSpecies] = useState<string>('');
  const [weight, setWeight] = useState('');
  const [length, setLength] = useState('');
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<MediaFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [speciesLoading, setSpeciesLoading] = useState(true);

  useEffect(() => {
    loadSpecies();
    requestLocation();
  }, []);

  const loadSpecies = async () => {
    setSpeciesLoading(true);
    try {
      const data = await catchesApi.getSpecies(route.params.tournamentId);
      setSpecies(data);
    } catch (error) {
      console.error('Error loading species:', error);
      // In offline mode, mostro messaggio ma permetto comunque cattura
      if (!isOnline) {
        Alert.alert(
          'Modalita Offline',
          'Non e\' possibile caricare le specie. Potrai selezionarla dopo la sincronizzazione.'
        );
      }
    } finally {
      setSpeciesLoading(false);
    }
  };

  const handleTakePhoto = async () => {
    const options: CameraOptions = {
      mediaType: 'photo',
      quality: 0.85,
      saveToPhotos: true,
      includeExtra: true,
    };

    const result = await launchCamera(options);
    if (result.assets && result.assets[0]) {
      const asset = result.assets[0];
      setPhotos(prev => [...prev, {
        uri: asset.uri!,
        type: asset.type,
        name: asset.fileName,
      }]);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // Validazione
    if (photos.length === 0) {
      Alert.alert('Errore', 'Scatta almeno una foto della cattura');
      return;
    }
    if (!selectedSpecies && species.length > 0) {
      Alert.alert('Errore', 'Seleziona la specie');
      return;
    }
    if (!weight || parseFloat(weight) <= 0) {
      Alert.alert('Errore', 'Inserisci il peso');
      return;
    }
    if (!position) {
      Alert.alert('Errore', 'Posizione GPS non disponibile. Riprova.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await catchesApi.submit({
        tournamentId: route.params.tournamentId,
        speciesId: selectedSpecies || 'unknown', // In offline potrebbe essere vuoto
        weight: parseFloat(weight),
        length: length ? parseFloat(length) : undefined,
        notes: notes || undefined,
        gps: {
          latitude: position.latitude,
          longitude: position.longitude,
          accuracy: position.accuracy,
        },
        capturedAt: new Date(),
        photos,
      });

      if (result.savedOffline) {
        // Salvato offline - mostro messaggio appropriato
        Alert.alert(
          'Cattura Salvata',
          isOnline
            ? 'Cattura salvata. Verra\' sincronizzata a breve.'
            : 'Cattura salvata in modalita offline.\n\nVerra\' sincronizzata automaticamente quando tornerai online.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        // Inviato con successo online
        Alert.alert('Successo', 'Cattura inviata! In attesa di validazione.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert(
        'Errore',
        'Impossibile salvare la cattura. Verifica lo spazio disponibile e riprova.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Offline Banner */}
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Icon name="cloud-offline" size={20} color="#fff" />
          <Text style={styles.offlineBannerText}>
            Modalita Offline - Le catture verranno sincronizzate quando tornerai online
          </Text>
        </View>
      )}

      {/* GPS Status */}
      <View style={styles.gpsSection}>
        <Icon
          name={position ? 'location' : 'location-outline'}
          size={24}
          color={position ? '#34C759' : '#FF9500'}
        />
        <View style={styles.gpsInfo}>
          {gpsLoading ? (
            <Text style={styles.gpsText}>Acquisizione GPS...</Text>
          ) : position ? (
            <>
              <Text style={styles.gpsText}>
                {position.latitude.toFixed(5)}, {position.longitude.toFixed(5)}
              </Text>
              <Text style={styles.gpsAccuracy}>Precisione: {position.accuracy.toFixed(0)}m</Text>
            </>
          ) : (
            <Text style={styles.gpsError}>{gpsError || 'GPS non disponibile'}</Text>
          )}
        </View>
        <TouchableOpacity onPress={requestLocation}>
          <Icon name="refresh" size={24} color="#0066CC" />
        </TouchableOpacity>
      </View>

      {/* Photo Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Foto Cattura *</Text>
        <View style={styles.photosGrid}>
          {photos.map((photo, index) => (
            <View key={index} style={styles.photoContainer}>
              <Image source={{ uri: photo.uri }} style={styles.photo} />
              <TouchableOpacity
                style={styles.removePhoto}
                onPress={() => handleRemovePhoto(index)}
              >
                <Icon name="close-circle" size={24} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          ))}
          {photos.length < 3 && (
            <TouchableOpacity style={styles.addPhoto} onPress={handleTakePhoto}>
              <Icon name="camera" size={32} color="#0066CC" />
              <Text style={styles.addPhotoText}>Scatta Foto</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Species */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Specie *</Text>
        {speciesLoading ? (
          <ActivityIndicator size="small" color="#0066CC" />
        ) : species.length > 0 ? (
          <View style={styles.speciesGrid}>
            {species.map(s => (
              <TouchableOpacity
                key={s.id}
                style={[styles.speciesChip, selectedSpecies === s.id && styles.speciesChipSelected]}
                onPress={() => setSelectedSpecies(s.id)}
              >
                <Text style={[styles.speciesText, selectedSpecies === s.id && styles.speciesTextSelected]}>
                  {s.commonName}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.speciesOffline}>
            <Icon name="fish-outline" size={24} color="#8E8E93" />
            <Text style={styles.speciesOfflineText}>
              Specie non disponibili offline.{'\n'}La cattura verra' registrata comunque.
            </Text>
          </View>
        )}
      </View>

      {/* Weight & Length */}
      <View style={styles.row}>
        <View style={[styles.section, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.sectionTitle}>Peso (kg) *</Text>
          <TextInput
            style={styles.input}
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
            placeholder="0.0"
          />
        </View>
        <View style={[styles.section, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.sectionTitle}>Lunghezza (cm)</Text>
          <TextInput
            style={styles.input}
            value={length}
            onChangeText={setLength}
            keyboardType="decimal-pad"
            placeholder="0"
          />
        </View>
      </View>

      {/* Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Note</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          placeholder="Note aggiuntive..."
        />
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Icon name={isOnline ? 'fish' : 'save'} size={24} color="#fff" />
            <Text style={styles.submitButtonText}>
              {isOnline ? 'Invia Cattura' : 'Salva Offline'}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Offline Explanation */}
      {!isOnline && (
        <Text style={styles.offlineNote}>
          La cattura sara salvata sul dispositivo e sincronizzata automaticamente quando avrai connessione internet.
        </Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7', padding: 16 },

  // Offline Banner
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF9500',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  offlineBannerText: {
    flex: 1,
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },

  // GPS Section
  gpsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
  },
  gpsInfo: { flex: 1, marginLeft: 12 },
  gpsText: { fontSize: 14, fontWeight: '500', color: '#1C1C1E' },
  gpsAccuracy: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  gpsError: { fontSize: 14, color: '#FF3B30' },

  // Sections
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 8 },

  // Photos
  photosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoContainer: { position: 'relative' },
  photo: { width: 100, height: 100, borderRadius: 8 },
  removePhoto: { position: 'absolute', top: -8, right: -8 },
  addPhoto: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#0066CC',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoText: { fontSize: 12, color: '#0066CC', marginTop: 4 },

  // Species
  speciesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  speciesChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#E5E5EA' },
  speciesChipSelected: { backgroundColor: '#0066CC' },
  speciesText: { fontSize: 14, color: '#1C1C1E' },
  speciesTextSelected: { color: '#fff', fontWeight: '600' },
  speciesOffline: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    gap: 12,
  },
  speciesOfflineText: { flex: 1, fontSize: 13, color: '#8E8E93' },

  // Input
  row: { flexDirection: 'row' },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  textArea: { height: 80, textAlignVertical: 'top' },

  // Submit
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0066CC',
    padding: 16,
    borderRadius: 10,
    marginTop: 16,
    marginBottom: 8,
    gap: 8,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { fontSize: 18, fontWeight: '600', color: '#fff' },

  // Offline note
  offlineNote: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 32,
  },
});

export default SubmitCatchScreen;
