/**
 * =============================================================================
 * FILE INFO
 * =============================================================================
 * Percorso: src/hooks/useGPS.ts
 * Creato: 2025-12-30
 * Descrizione: Hook per gestione GPS e validazione zone
 * =============================================================================
 */

import { useState, useEffect, useCallback } from 'react';
import Geolocation from '@react-native-community/geolocation';
import { Platform, PermissionsAndroid } from 'react-native';

import { GPSPosition } from '@/types';

interface UseGPSReturn {
  position: GPSPosition | null;
  error: string | null;
  loading: boolean;
  requestLocation: () => void;
  watchPosition: () => () => void;
}

export const useGPS = (): UseGPSReturn => {
  const [position, setPosition] = useState<GPSPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const requestPermissions = async (): Promise<boolean> => {
    if (Platform.OS === 'ios') {
      return true; // iOS handles permissions via Info.plist prompts
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Permesso Posizione',
          message: 'TournamentMaster ha bisogno della tua posizione per validare le catture.',
          buttonNeutral: 'Chiedi dopo',
          buttonNegative: 'Annulla',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.error('Permission error:', err);
      return false;
    }
  };

  const requestLocation = useCallback(async () => {
    setLoading(true);
    setError(null);

    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      setError('Permesso posizione negato');
      setLoading(false);
      return;
    }

    Geolocation.getCurrentPosition(
      (pos) => {
        setPosition({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy || 0,
          altitude: pos.coords.altitude || undefined,
          heading: pos.coords.heading || undefined,
          speed: pos.coords.speed || undefined,
          timestamp: pos.timestamp,
        });
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0,
      }
    );
  }, []);

  const watchPosition = useCallback(() => {
    const watchId = Geolocation.watchPosition(
      (pos) => {
        setPosition({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy || 0,
          altitude: pos.coords.altitude || undefined,
          heading: pos.coords.heading || undefined,
          speed: pos.coords.speed || undefined,
          timestamp: pos.timestamp,
        });
      },
      (err) => setError(err.message),
      {
        enableHighAccuracy: true,
        distanceFilter: 10, // Update every 10 meters
        interval: 5000, // Android: every 5 seconds
        fastestInterval: 2000,
      }
    );

    return () => Geolocation.clearWatch(watchId);
  }, []);

  return { position, error, loading, requestLocation, watchPosition };
};

export default useGPS;
