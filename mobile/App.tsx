/**
 * TournamentMaster - App Mobile per Tornei di Pesca
 * React Native + Expo SDK 54
 */

import React, { useState, useEffect, createContext, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';

// Offline Sync
import { useOfflineSync, usePendingCount } from './src/hooks/useOfflineSync';

// ============================================================================
// CONFIG
// ============================================================================
const API_URL = 'http://192.168.1.74:3001'; // Cambia con URL Railway per produzione

// ============================================================================
// AUTH CONTEXT
// ============================================================================
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// ============================================================================
// SCREENS
// ============================================================================

// LOGIN SCREEN
function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Inserisci email e password');
      return;
    }
    setLoading(true);
    setError('');
    const success = await login(email, password);
    if (!success) {
      setError('Credenziali non valide');
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.loginContainer}>
        <Text style={styles.logo}>🎣</Text>
        <Text style={styles.title}>TournamentMaster</Text>
        <Text style={styles.subtitle}>Accedi al tuo account</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Accedi</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.demoText}>
          Demo: admin@ischiafishing.it / demo123
        </Text>
      </View>
    </SafeAreaView>
  );
}

// DASHBOARD SCREEN
function DashboardScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalCatches: 0,
    pendingCatches: 0,
    approvedCatches: 0,
    activeTournaments: 0,
  });

  useEffect(() => {
    // Mock data - sostituire con API reale
    setStats({
      totalCatches: 12,
      pendingCatches: 3,
      approvedCatches: 8,
      activeTournaments: 2,
    });
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Ciao, {user?.firstName}! 👋</Text>
          <Text style={styles.roleText}>{user?.role}</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#3B82F6' }]}>
            <Text style={styles.statNumber}>{stats.totalCatches}</Text>
            <Text style={styles.statLabel}>Catture Totali</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#F59E0B' }]}>
            <Text style={styles.statNumber}>{stats.pendingCatches}</Text>
            <Text style={styles.statLabel}>In Attesa</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#10B981' }]}>
            <Text style={styles.statNumber}>{stats.approvedCatches}</Text>
            <Text style={styles.statLabel}>Approvate</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#8B5CF6' }]}>
            <Text style={styles.statNumber}>{stats.activeTournaments}</Text>
            <Text style={styles.statLabel}>Tornei Attivi</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Attivita Recente</Text>
          <View style={styles.activityItem}>
            <Text style={styles.activityIcon}>✅</Text>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Cattura approvata</Text>
              <Text style={styles.activitySubtitle}>Tonno rosso - 85.5 kg</Text>
            </View>
            <Text style={styles.activityTime}>2h fa</Text>
          </View>
          <View style={styles.activityItem}>
            <Text style={styles.activityIcon}>🏆</Text>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Iscrizione confermata</Text>
              <Text style={styles.activitySubtitle}>Gran Premio Estate 2025</Text>
            </View>
            <Text style={styles.activityTime}>1g fa</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// TOURNAMENTS SCREEN
function TournamentsScreen() {
  const { token } = useAuth();
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const res = await fetch(`${API_URL}/api/tournaments`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        // Mappo i dati dal backend al formato dell'app
        const mapped = data.data.map((t: any) => ({
          id: t.id,
          name: t.name,
          date: t.startDate?.split('T')[0] || '',
          location: t.location,
          participants: t._count?.registrations || 0,
          status: t.status === 'ONGOING' ? 'active' :
                  t.status === 'PUBLISHED' ? 'upcoming' :
                  t.status === 'COMPLETED' ? 'completed' : 'draft',
          discipline: t.discipline,
        }));
        setTournaments(mapped);
      }
    } catch (e) {
      console.error('Error fetching tournaments:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'upcoming': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'In Corso';
      case 'upcoming': return 'In Arrivo';
      default: return status;
    }
  };

  const showTournamentDetails = (tournament: any) => {
    Alert.alert(
      tournament.name,
      `📍 Luogo: ${tournament.location}\n` +
      `📅 Data: ${tournament.date}\n` +
      `🎣 Disciplina: ${tournament.discipline || 'N/A'}\n` +
      `👥 Partecipanti: ${tournament.participants}\n` +
      `📊 Stato: ${getStatusText(tournament.status)}`,
      [{ text: 'Chiudi', style: 'cancel' }]
    );
  };

  const renderTournament = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.tournamentCard} onPress={() => showTournamentDetails(item)}>
      <View style={styles.tournamentHeader}>
        <Text style={styles.tournamentName}>{item.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>
      <View style={styles.tournamentInfo}>
        <Text style={styles.tournamentDetail}>📍 {item.location}</Text>
        <Text style={styles.tournamentDetail}>📅 {item.date}</Text>
        <Text style={styles.tournamentDetail}>👥 {item.participants} partecipanti</Text>
      </View>
      <TouchableOpacity style={styles.joinButton} onPress={() => showTournamentDetails(item)}>
        <Text style={styles.joinButtonText}>Dettagli</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>Tornei</Text>
      </View>
      <FlatList
        data={tournaments}
        renderItem={renderTournament}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchTournaments(); }} />
        }
      />
    </SafeAreaView>
  );
}

// CATCH SCREEN (Camera + GPS + Video)
function CatchScreen() {
  const { token } = useAuth();
  const [photo, setPhoto] = useState<string | null>(null);
  const [video, setVideo] = useState<string | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [species, setSpecies] = useState('');
  const [weight, setWeight] = useState('');
  const [selectedTournament, setSelectedTournament] = useState<string | null>(null);
  const [tournaments, setTournaments] = useState<any[]>([]);

  // Carica tornei attivi per la selezione
  useEffect(() => {
    fetchActiveTournaments();
  }, []);

  const fetchActiveTournaments = async () => {
    try {
      const res = await fetch(`${API_URL}/api/tournaments?status=ONGOING`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        const active = data.data.filter((t: any) => t.status === 'ONGOING');
        setTournaments(active);
        if (active.length > 0) setSelectedTournament(active[0].id);
      }
    } catch (e) {
      console.error('Error fetching tournaments:', e);
    }
  };

  const takePhoto = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();

    if (cameraStatus !== 'granted' || locationStatus !== 'granted') {
      Alert.alert('Permessi richiesti', 'Servono i permessi per camera e GPS');
      return;
    }

    setLoading(true);
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocation(loc);

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.9,
      });

      if (!result.canceled && result.assets[0]) {
        setPhoto(result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert('Errore', 'Impossibile scattare la foto');
    } finally {
      setLoading(false);
    }
  };

  const recordVideo = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();

    if (cameraStatus !== 'granted' || locationStatus !== 'granted') {
      Alert.alert('Permessi richiesti', 'Servono i permessi per camera e GPS');
      return;
    }

    setLoading(true);
    try {
      if (!location) {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        setLocation(loc);
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 0.7,
        videoMaxDuration: 30, // Max 30 secondi
      });

      if (!result.canceled && result.assets[0]) {
        setVideo(result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert('Errore', 'Impossibile registrare il video');
    } finally {
      setLoading(false);
    }
  };

  const submitCatch = async () => {
    if (!photo || !species || !weight || !selectedTournament) {
      Alert.alert('Dati mancanti', 'Inserisci tutti i dati della cattura e seleziona un torneo');
      return;
    }

    if (!location) {
      Alert.alert('GPS mancante', 'Posizione GPS non disponibile');
      return;
    }

    setSubmitting(true);
    try {
      const catchData = {
        tournamentId: selectedTournament,
        weight: parseFloat(weight),
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        gpsAccuracy: location.coords.accuracy,
        photoPath: photo, // In produzione: upload a Cloudinary prima
        videoPath: video || undefined,
        caughtAt: new Date().toISOString(),
        notes: `Specie: ${species}`,
      };

      const res = await fetch(`${API_URL}/api/catches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(catchData),
      });

      if (res.ok) {
        const data = await res.json();
        Alert.alert(
          'Cattura registrata!',
          `${species} - ${weight} kg\nStato: In attesa di validazione`,
          [{ text: 'OK', onPress: resetForm }]
        );
      } else {
        const error = await res.json();
        Alert.alert('Errore', error.message || 'Impossibile registrare la cattura');
      }
    } catch (e) {
      Alert.alert('Errore di rete', 'Verifica la connessione e riprova');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setPhoto(null);
    setVideo(null);
    setSpecies('');
    setWeight('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.screenHeader}>
          <Text style={styles.screenTitle}>Registra Cattura</Text>
        </View>

        {/* Selezione Torneo */}
        {tournaments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Torneo Attivo</Text>
            {tournaments.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={[styles.tournamentSelectItem, selectedTournament === t.id && styles.tournamentSelectItemActive]}
                onPress={() => setSelectedTournament(t.id)}
              >
                <Text style={[styles.tournamentSelectText, selectedTournament === t.id && styles.tournamentSelectTextActive]}>
                  {t.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {!photo ? (
          <View style={styles.cameraPlaceholder}>
            <Text style={styles.cameraIcon}>📷</Text>
            <Text style={styles.cameraText}>Posiziona il pesce al centro</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={takePhoto} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Foto</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.buttonVideo, loading && styles.buttonDisabled]} onPress={recordVideo} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Video</Text>}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.catchForm}>
            <Image source={{ uri: photo }} style={styles.photoPreview} />
            {video && (
              <View style={styles.videoBadge}>
                <Text style={styles.videoText}>🎬 Video allegato (30s max)</Text>
              </View>
            )}
            {location && (
              <View style={styles.locationBadge}>
                <Text style={styles.locationText}>📍 {location.coords.latitude.toFixed(4)}, {location.coords.longitude.toFixed(4)}</Text>
              </View>
            )}
            <TextInput style={styles.input} placeholder="Specie (es. Tonno rosso)" placeholderTextColor="#999" value={species} onChangeText={setSpecies} />
            <TextInput style={styles.input} placeholder="Peso (kg)" placeholderTextColor="#999" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" />

            {/* Pulsante video aggiuntivo se non registrato */}
            {!video && (
              <TouchableOpacity style={[styles.button, styles.buttonVideo, { marginBottom: 16 }]} onPress={recordVideo}>
                <Text style={styles.buttonText}>Aggiungi Video (opzionale)</Text>
              </TouchableOpacity>
            )}

            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={resetForm}>
                <Text style={styles.buttonTextSecondary}>Riprova</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, submitting && styles.buttonDisabled]} onPress={submitCatch} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Invia</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ADMIN SCREEN (Solo per TENANT_ADMIN e SUPER_ADMIN)
function AdminScreen() {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'tournaments'>('users');
  const [loading, setLoading] = useState(false);

  // Form Utente
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userFirstName, setUserFirstName] = useState('');
  const [userLastName, setUserLastName] = useState('');
  const [userPhone, setUserPhone] = useState('');

  // Form Torneo
  const [tournamentName, setTournamentName] = useState('');
  const [tournamentLocation, setTournamentLocation] = useState('');
  const [tournamentStartDate, setTournamentStartDate] = useState('');
  const [tournamentEndDate, setTournamentEndDate] = useState('');
  const [tournamentDiscipline, setTournamentDiscipline] = useState('BIG_GAME');
  const [tournamentMaxParticipants, setTournamentMaxParticipants] = useState('50');

  const createUser = async () => {
    if (!userEmail || !userPassword || !userFirstName || !userLastName) {
      Alert.alert('Errore', 'Compila tutti i campi obbligatori');
      return;
    }
    if (userPassword.length < 8) {
      Alert.alert('Errore', 'La password deve avere almeno 8 caratteri');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: userEmail,
          password: userPassword,
          firstName: userFirstName,
          lastName: userLastName,
          phone: userPhone || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        Alert.alert('Successo', `Utente ${userFirstName} ${userLastName} creato!`);
        setUserEmail('');
        setUserPassword('');
        setUserFirstName('');
        setUserLastName('');
        setUserPhone('');
      } else {
        Alert.alert('Errore', data.message || 'Impossibile creare utente');
      }
    } catch (e) {
      Alert.alert('Errore di rete', 'Verifica la connessione');
    } finally {
      setLoading(false);
    }
  };

  const createTournament = async () => {
    if (!tournamentName || !tournamentLocation || !tournamentStartDate || !tournamentEndDate) {
      Alert.alert('Errore', 'Compila tutti i campi obbligatori');
      return;
    }

    setLoading(true);
    try {
      // Calcola date di registrazione (1 settimana prima dell'inizio)
      const startDate = new Date(tournamentStartDate);
      const regOpens = new Date(startDate);
      regOpens.setDate(regOpens.getDate() - 14);
      const regCloses = new Date(startDate);
      regCloses.setDate(regCloses.getDate() - 1);

      const res = await fetch(`${API_URL}/api/tournaments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: tournamentName,
          location: tournamentLocation,
          startDate: tournamentStartDate,
          endDate: tournamentEndDate,
          registrationOpens: regOpens.toISOString().split('T')[0],
          registrationCloses: regCloses.toISOString().split('T')[0],
          discipline: tournamentDiscipline,
          maxParticipants: parseInt(tournamentMaxParticipants) || 50,
          description: `Torneo di pesca ${tournamentDiscipline} a ${tournamentLocation}`,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        Alert.alert('Successo', `Torneo "${tournamentName}" creato!`);
        setTournamentName('');
        setTournamentLocation('');
        setTournamentStartDate('');
        setTournamentEndDate('');
        setTournamentMaxParticipants('50');
      } else {
        Alert.alert('Errore', data.message || 'Impossibile creare torneo');
      }
    } catch (e) {
      Alert.alert('Errore di rete', 'Verifica la connessione');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.screenHeader}>
          <Text style={styles.screenTitle}>Admin Panel</Text>
          <Text style={styles.adminSubtitle}>Gestione {user?.role}</Text>
        </View>

        {/* Tab Selector */}
        <View style={styles.adminTabs}>
          <TouchableOpacity
            style={[styles.adminTab, activeTab === 'users' && styles.adminTabActive]}
            onPress={() => setActiveTab('users')}
          >
            <Text style={[styles.adminTabText, activeTab === 'users' && styles.adminTabTextActive]}>
              Nuovo Utente
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.adminTab, activeTab === 'tournaments' && styles.adminTabActive]}
            onPress={() => setActiveTab('tournaments')}
          >
            <Text style={[styles.adminTabText, activeTab === 'tournaments' && styles.adminTabTextActive]}>
              Nuovo Torneo
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form Utente */}
        {activeTab === 'users' && (
          <View style={styles.adminForm}>
            <Text style={styles.formTitle}>Crea Nuovo Utente</Text>

            <TextInput
              style={styles.input}
              placeholder="Nome *"
              placeholderTextColor="#999"
              value={userFirstName}
              onChangeText={setUserFirstName}
            />
            <TextInput
              style={styles.input}
              placeholder="Cognome *"
              placeholderTextColor="#999"
              value={userLastName}
              onChangeText={setUserLastName}
            />
            <TextInput
              style={styles.input}
              placeholder="Email *"
              placeholderTextColor="#999"
              value={userEmail}
              onChangeText={setUserEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Password * (min 8 caratteri)"
              placeholderTextColor="#999"
              value={userPassword}
              onChangeText={setUserPassword}
              secureTextEntry
            />
            <TextInput
              style={styles.input}
              placeholder="Telefono (opzionale)"
              placeholderTextColor="#999"
              value={userPhone}
              onChangeText={setUserPhone}
              keyboardType="phone-pad"
            />

            <TouchableOpacity
              style={[styles.button, styles.adminButton, loading && styles.buttonDisabled]}
              onPress={createUser}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Crea Utente</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Form Torneo */}
        {activeTab === 'tournaments' && (
          <View style={styles.adminForm}>
            <Text style={styles.formTitle}>Crea Nuovo Torneo</Text>

            <TextInput
              style={styles.input}
              placeholder="Nome Torneo *"
              placeholderTextColor="#999"
              value={tournamentName}
              onChangeText={setTournamentName}
            />
            <TextInput
              style={styles.input}
              placeholder="Luogo *"
              placeholderTextColor="#999"
              value={tournamentLocation}
              onChangeText={setTournamentLocation}
            />
            <TextInput
              style={styles.input}
              placeholder="Data Inizio * (YYYY-MM-DD)"
              placeholderTextColor="#999"
              value={tournamentStartDate}
              onChangeText={setTournamentStartDate}
            />
            <TextInput
              style={styles.input}
              placeholder="Data Fine * (YYYY-MM-DD)"
              placeholderTextColor="#999"
              value={tournamentEndDate}
              onChangeText={setTournamentEndDate}
            />

            {/* Discipline Selector */}
            <Text style={styles.fieldLabel}>Disciplina:</Text>
            <View style={styles.disciplineSelector}>
              {['BIG_GAME', 'DRIFTING', 'TRAINA_COSTIERA', 'BOLENTINO', 'EGING', 'VERTICAL_JIGGING', 'SHORE', 'SOCIAL'].map((disc) => (
                <TouchableOpacity
                  key={disc}
                  style={[styles.disciplineOption, tournamentDiscipline === disc && styles.disciplineOptionActive]}
                  onPress={() => setTournamentDiscipline(disc)}
                >
                  <Text style={[styles.disciplineText, tournamentDiscipline === disc && styles.disciplineTextActive]}>
                    {disc}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.input}
              placeholder="Max Partecipanti"
              placeholderTextColor="#999"
              value={tournamentMaxParticipants}
              onChangeText={setTournamentMaxParticipants}
              keyboardType="number-pad"
            />

            <TouchableOpacity
              style={[styles.button, styles.adminButton, loading && styles.buttonDisabled]}
              onPress={createTournament}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Crea Torneo</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// PROFILE SCREEN
function ProfileScreen() {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.firstName?.[0]}{user?.lastName?.[0]}</Text>
          </View>
          <Text style={styles.profileName}>{user?.firstName} {user?.lastName}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{user?.role}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistiche</Text>
          <View style={styles.profileStat}>
            <Text style={styles.profileStatLabel}>Tornei Partecipati</Text>
            <Text style={styles.profileStatValue}>15</Text>
          </View>
          <View style={styles.profileStat}>
            <Text style={styles.profileStatLabel}>Catture Totali</Text>
            <Text style={styles.profileStatValue}>127</Text>
          </View>
          <View style={styles.profileStat}>
            <Text style={styles.profileStatLabel}>Miglior Posizione</Text>
            <Text style={styles.profileStatValue}>🥇 1°</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutButtonText}>Esci</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================================
// OFFLINE SYNC WRAPPER
// ============================================================================
function OfflineSyncManager({ children }: { children: React.ReactNode }) {
  const { isOnline, isSyncing, pendingCount, lastSyncAt } = useOfflineSync();

  // Log stato sync (utile per debug)
  useEffect(() => {
    console.log(`[OfflineSync] Online: ${isOnline}, Syncing: ${isSyncing}, Pending: ${pendingCount}`);
  }, [isOnline, isSyncing, pendingCount]);

  return <>{children}</>;
}

// ============================================================================
// NAVIGATION
// ============================================================================
const Tab = createBottomTabNavigator();

function MainTabs() {
  const { user } = useAuth();
  const pendingCount = usePendingCount();
  const isAdmin = user?.role === 'TENANT_ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'ORGANIZER';

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#0066CC',
        tabBarInactiveTintColor: '#6B7280',
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: 'Home', tabBarIcon: () => <Text style={{ fontSize: 24 }}>🏠</Text> }} />
      <Tab.Screen name="Tournaments" component={TournamentsScreen} options={{ tabBarLabel: 'Tornei', tabBarIcon: () => <Text style={{ fontSize: 24 }}>🏆</Text> }} />
      <Tab.Screen
        name="Catch"
        component={CatchScreen}
        options={{
          tabBarLabel: 'Cattura',
          tabBarIcon: () => <Text style={{ fontSize: 24 }}>📷</Text>,
          tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
          tabBarBadgeStyle: { backgroundColor: '#F59E0B', fontSize: 10 },
        }}
      />
      {isAdmin && (
        <Tab.Screen name="Admin" component={AdminScreen} options={{ tabBarLabel: 'Admin', tabBarIcon: () => <Text style={{ fontSize: 24 }}>⚙️</Text> }} />
      )}
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profilo', tabBarIcon: () => <Text style={{ fontSize: 24 }}>👤</Text> }} />
    </Tab.Navigator>
  );
}

// ============================================================================
// APP
// ============================================================================
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error('Error loading auth:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        const { accessToken, user: userData } = data.data;
        await AsyncStorage.setItem('token', accessToken);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        setToken(accessToken);
        setUser(userData);
        return true;
      }
    } catch (e) {
      console.log('API not available, using demo mode');
    }

    // Demo fallback (credenziali reali dal database)
    if (email === 'admin@ischiafishing.it' && password === 'demo123') {
      const demoUser: User = { id: 'demo-1', email: 'admin@ischiafishing.it', firstName: 'Mario', lastName: 'Rossi', role: 'TENANT_ADMIN' };
      await AsyncStorage.setItem('token', 'demo-token');
      await AsyncStorage.setItem('user', JSON.stringify(demoUser));
      setToken('demo-token');
      setUser(demoUser);
      return true;
    }
    return false;
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  if (isLoading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#0066CC" /></View>;
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      <SafeAreaProvider>
        <NavigationContainer>
          {user ? (
            <OfflineSyncManager>
              <MainTabs />
            </OfflineSyncManager>
          ) : (
            <LoginScreen />
          )}
        </NavigationContainer>
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </AuthContext.Provider>
  );
}

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' },
  scrollView: { flex: 1 },
  loginContainer: { flex: 1, justifyContent: 'center', padding: 24 },
  logo: { fontSize: 64, textAlign: 'center', marginBottom: 16 },
  title: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', color: '#0066CC', marginBottom: 8 },
  subtitle: { fontSize: 16, textAlign: 'center', color: '#6B7280', marginBottom: 32 },
  input: { backgroundColor: '#fff', borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  button: { backgroundColor: '#0066CC', borderRadius: 12, padding: 16, alignItems: 'center', flex: 1 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  buttonSecondary: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#0066CC' },
  buttonTextSecondary: { color: '#0066CC', fontSize: 16, fontWeight: '600' },
  buttonRow: { flexDirection: 'row', gap: 12 },
  error: { color: '#EF4444', textAlign: 'center', marginBottom: 16 },
  demoText: { textAlign: 'center', color: '#9CA3AF', marginTop: 24, fontSize: 12 },
  header: { padding: 20, backgroundColor: '#0066CC' },
  screenHeader: { padding: 20 },
  screenTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  roleText: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 12 },
  statCard: { width: '47%', borderRadius: 16, padding: 20 },
  statNumber: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  statLabel: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 4 },
  section: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 16 },
  activityItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  activityIcon: { fontSize: 24, marginRight: 12 },
  activityContent: { flex: 1 },
  activityTitle: { fontSize: 16, fontWeight: '500', color: '#111827' },
  activitySubtitle: { fontSize: 14, color: '#6B7280' },
  activityTime: { fontSize: 12, color: '#9CA3AF' },
  listContainer: { padding: 16 },
  tournamentCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  tournamentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  tournamentName: { fontSize: 18, fontWeight: '600', color: '#111827', flex: 1 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  tournamentInfo: { marginBottom: 16 },
  tournamentDetail: { fontSize: 14, color: '#6B7280', marginBottom: 4 },
  joinButton: { backgroundColor: '#0066CC', borderRadius: 8, padding: 12, alignItems: 'center' },
  joinButtonText: { color: '#fff', fontWeight: '600' },
  cameraPlaceholder: { margin: 20, backgroundColor: '#E5E7EB', borderRadius: 16, padding: 40, alignItems: 'center', borderWidth: 2, borderStyle: 'dashed', borderColor: '#9CA3AF' },
  cameraIcon: { fontSize: 64, marginBottom: 16 },
  cameraText: { fontSize: 16, color: '#6B7280', textAlign: 'center', marginBottom: 24 },
  catchForm: { padding: 20 },
  photoPreview: { width: '100%', height: 300, borderRadius: 16, marginBottom: 16 },
  locationBadge: { backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 8, padding: 8, marginBottom: 16, alignSelf: 'flex-start' },
  locationText: { color: '#fff', fontSize: 12 },
  profileHeader: { alignItems: 'center', padding: 32, backgroundColor: '#0066CC' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  avatarText: { fontSize: 28, fontWeight: 'bold', color: '#0066CC' },
  profileName: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  profileEmail: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  roleBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16, marginTop: 12 },
  roleBadgeText: { color: '#fff', fontWeight: '600' },
  profileStat: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12 },
  profileStatLabel: { fontSize: 16, color: '#6B7280' },
  profileStatValue: { fontSize: 16, fontWeight: '600', color: '#111827' },
  logoutButton: { margin: 20, backgroundColor: '#EF4444', borderRadius: 12, padding: 16, alignItems: 'center' },
  logoutButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  tabBar: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingBottom: 8, paddingTop: 8, height: 70 },
  // Stili per video e selezione torneo
  buttonVideo: { backgroundColor: '#8B5CF6' },
  videoBadge: { backgroundColor: '#8B5CF6', borderRadius: 8, padding: 8, marginBottom: 16, alignSelf: 'flex-start' },
  videoText: { color: '#fff', fontSize: 12 },
  tournamentSelectItem: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 8, borderWidth: 2, borderColor: '#E5E7EB' },
  tournamentSelectItemActive: { borderColor: '#0066CC', backgroundColor: '#EBF5FF' },
  tournamentSelectText: { fontSize: 16, color: '#6B7280' },
  tournamentSelectTextActive: { color: '#0066CC', fontWeight: '600' },
  // Stili Admin Panel
  adminSubtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  adminTabs: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 20, backgroundColor: '#E5E7EB', borderRadius: 12, padding: 4 },
  adminTab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
  adminTabActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  adminTabText: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  adminTabTextActive: { color: '#0066CC', fontWeight: '600' },
  adminForm: { backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 16, padding: 20, marginBottom: 20 },
  formTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 20, textAlign: 'center' },
  adminButton: { backgroundColor: '#10B981', marginTop: 8 },
  fieldLabel: { fontSize: 14, color: '#374151', marginBottom: 8, marginTop: 8, fontWeight: '500' },
  disciplineSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  disciplineOption: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  disciplineOptionActive: { backgroundColor: '#0066CC', borderColor: '#0066CC' },
  disciplineText: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  disciplineTextActive: { color: '#fff' },
});
