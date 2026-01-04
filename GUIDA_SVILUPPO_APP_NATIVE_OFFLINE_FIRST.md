# TournamentMaster - Guida Sviluppo App Native con Supporto Offline

**Versione:** 1.0.0
**Data:** 2026-01-02
**Scopo:** Sviluppare app native Android e iOS con funzionamento offline completo per pesca d'altura

---

## INDICE

1. [Panoramica e Requisiti](#panoramica-e-requisiti)
2. [Architettura Offline-First](#architettura-offline-first)
3. [Sviluppo Android Nativo](#sviluppo-android-nativo)
4. [Sviluppo iOS Nativo](#sviluppo-ios-nativo)
5. [Sistema di Storage Locale](#sistema-di-storage-locale)
6. [Sistema di Sincronizzazione](#sistema-di-sincronizzazione)
7. [Funzionalita' da Implementare](#funzionalita-da-implementare)
8. [Pubblicazione Google Play Store](#pubblicazione-google-play-store)
9. [Pubblicazione Apple App Store](#pubblicazione-apple-app-store)
10. [Costi e Tempistiche](#costi-e-tempistiche)
11. [Checklist Pre-Lancio](#checklist-pre-lancio)

---

## PANORAMICA E REQUISITI

### Scenario d'Uso Critico

**Pesca d'altura / Traina d'altura:**
- Utente in mare aperto SENZA connessione internet
- Deve poter registrare catture (foto + video + GPS)
- Deve poter consultare regolamento torneo
- Deve poter vedere proprie statistiche cached
- Al rientro in porto (con internet), sincronizzazione automatica

### Requisiti Funzionali Offline

| Funzionalita' | Offline | Online | Priorita' |
|---------------|---------|--------|-----------|
| Login | Cache sessione | Completo | CRITICA |
| Registra cattura (foto) | SI | SI | CRITICA |
| Registra cattura (video) | SI | SI | CRITICA |
| GPS cattura | SI | SI | CRITICA |
| Lista tornei iscritto | Cache | Live | ALTA |
| Regolamento torneo | Cache | Live | ALTA |
| Statistiche personali | Cache | Live | ALTA |
| Classifica torneo | Cache | Live | MEDIA |
| Iscrizione torneo | NO | SI | BASSA |
| Pagamenti | NO | SI | BASSA |

### Requisiti Non-Funzionali

| Requisito | Specifica |
|-----------|-----------|
| Storage locale minimo | 500 MB per media offline |
| Durata sessione offline | 7 giorni senza re-auth |
| Qualita' foto offline | 90% JPEG, max 10 MB |
| Qualita' video offline | 720p, max 60 secondi, max 100 MB |
| Sync automatico | Entro 30 secondi dal recupero connessione |
| Retry sync fallita | 3 tentativi con backoff esponenziale |

---

## ARCHITETTURA OFFLINE-FIRST

### Principio Fondamentale

**"L'app deve funzionare PRIMA offline, poi sincronizzare quando possibile"**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ARCHITETTURA OFFLINE-FIRST                                │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌─────────────────┐
                              │   UI / Screens  │
                              └────────┬────────┘
                                       │
                              ┌────────▼────────┐
                              │  Repository     │
                              │  (Single Source │
                              │   of Truth)     │
                              └────────┬────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
           ┌────────▼────────┐ ┌───────▼───────┐ ┌───────▼───────┐
           │  Local Database │ │ File Storage  │ │ Remote API    │
           │  (SQLite/Room/  │ │ (Photos/Video)│ │ (when online) │
           │   Core Data)    │ │               │ │               │
           └─────────────────┘ └───────────────┘ └───────────────┘
                    │                  │                  │
                    └──────────────────┼──────────────────┘
                                       │
                              ┌────────▼────────┐
                              │  Sync Engine   │
                              │  (Background)   │
                              └─────────────────┘
```

### Flusso Dati Offline

```
1. CATTURA PESCE (Offline)
   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
   │ Scatta Foto  │────>│ Salva Locale │────>│ Coda Sync    │
   │ + Video      │     │ (SQLite +    │     │ (pending)    │
   │ + GPS        │     │  FileSystem) │     │              │
   └──────────────┘     └──────────────┘     └──────────────┘

2. RECUPERO CONNESSIONE
   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
   │ Network      │────>│ Sync Engine  │────>│ Upload API   │
   │ Available    │     │ Processa     │     │ + Cloudinary │
   │              │     │ Coda         │     │              │
   └──────────────┘     └──────────────┘     └──────────────┘

3. CONFERMA SYNC
   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
   │ Server       │────>│ Aggiorna     │────>│ Notifica     │
   │ Response OK  │     │ Stato Locale │     │ Utente       │
   │              │     │ (synced)     │     │              │
   └──────────────┘     └──────────────┘     └──────────────┘
```

### Stati di Sincronizzazione

| Stato | Descrizione | Icona UI |
|-------|-------------|----------|
| `PENDING` | In attesa di connessione | ⏳ Giallo |
| `SYNCING` | Upload in corso | 🔄 Blu |
| `SYNCED` | Sincronizzato con server | ✅ Verde |
| `FAILED` | Errore sync (retry scheduled) | ❌ Rosso |
| `CONFLICT` | Conflitto dati (richiede intervento) | ⚠️ Arancione |

---

## SVILUPPO ANDROID NATIVO

### Opzione 1: React Native con Expo (CONSIGLIATO)

**Perche':** Riutilizza codice esistente, piu' veloce, community ampia

#### Setup Progetto

```bash
# Partendo dal progetto esistente
cd C:\Users\marin\Downloads\TournamentMaster\mobile

# Installa dipendenze offline
npm install @react-native-async-storage/async-storage
npm install @react-native-community/netinfo
npm install react-native-background-fetch
npm install react-native-fs
npm install realm  # Database locale potente

# Configura EAS Build
npm install -g eas-cli
eas login
eas build:configure
```

#### eas.json (Configurazione Build)

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "production"
      }
    }
  }
}
```

#### Build APK Release

```bash
# Build APK per testing interno
eas build --platform android --profile preview

# Build AAB per Google Play
eas build --platform android --profile production

# Submit automatico a Google Play
eas submit --platform android --profile production
```

### Opzione 2: Kotlin Nativo (Performance Massima)

**Perche':** Performance native, accesso completo alle API Android

#### Struttura Progetto Android Studio

```
TournamentMasterAndroid/
├── app/
│   ├── src/main/
│   │   ├── java/com/tournamentmaster/
│   │   │   ├── data/
│   │   │   │   ├── local/
│   │   │   │   │   ├── AppDatabase.kt        # Room Database
│   │   │   │   │   ├── CatchDao.kt           # Data Access Object
│   │   │   │   │   └── entities/
│   │   │   │   │       ├── CatchEntity.kt
│   │   │   │   │       └── TournamentEntity.kt
│   │   │   │   ├── remote/
│   │   │   │   │   ├── ApiService.kt         # Retrofit
│   │   │   │   │   └── CloudinaryService.kt
│   │   │   │   └── repository/
│   │   │   │       ├── CatchRepository.kt    # Single Source of Truth
│   │   │   │       └── SyncRepository.kt
│   │   │   ├── sync/
│   │   │   │   ├── SyncWorker.kt             # WorkManager
│   │   │   │   └── SyncManager.kt
│   │   │   ├── ui/
│   │   │   │   ├── catch/
│   │   │   │   ├── tournament/
│   │   │   │   └── stats/
│   │   │   └── TournamentMasterApp.kt
│   │   ├── res/
│   │   └── AndroidManifest.xml
│   └── build.gradle.kts
├── build.gradle.kts
└── settings.gradle.kts
```

#### build.gradle.kts (App Level)

```kotlin
plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("kotlin-kapt")
    id("com.google.dagger.hilt.android")
}

android {
    namespace = "com.tournamentmaster"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.tournamentmaster.app"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            signingConfig = signingConfigs.getByName("release")
        }
    }
}

dependencies {
    // Room (Database locale)
    implementation("androidx.room:room-runtime:2.6.1")
    implementation("androidx.room:room-ktx:2.6.1")
    kapt("androidx.room:room-compiler:2.6.1")

    // WorkManager (Background sync)
    implementation("androidx.work:work-runtime-ktx:2.9.0")

    // Retrofit (API)
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-gson:2.9.0")

    // Hilt (Dependency Injection)
    implementation("com.google.dagger:hilt-android:2.48")
    kapt("com.google.dagger:hilt-compiler:2.48")

    // CameraX (Foto/Video)
    implementation("androidx.camera:camera-camera2:1.3.1")
    implementation("androidx.camera:camera-lifecycle:1.3.1")
    implementation("androidx.camera:camera-video:1.3.1")

    // Location
    implementation("com.google.android.gms:play-services-location:21.0.1")

    // Cloudinary
    implementation("com.cloudinary:cloudinary-android:2.3.1")
}
```

#### Room Database (CatchEntity.kt)

```kotlin
@Entity(tableName = "catches")
data class CatchEntity(
    @PrimaryKey
    val localId: String = UUID.randomUUID().toString(),

    val serverId: String? = null,  // null finche' non sincronizzato
    val tournamentId: String,
    val weight: Float,
    val length: Float?,
    val speciesId: String?,
    val notes: String?,

    // Media locali
    val localPhotoPath: String,
    val localVideoPath: String?,

    // Media remoti (dopo sync)
    val remotePhotoUrl: String? = null,
    val remoteVideoUrl: String? = null,

    // GPS
    val latitude: Double,
    val longitude: Double,
    val gpsAccuracy: Float,

    // Timestamps
    val catchTime: Long,
    val createdAt: Long = System.currentTimeMillis(),

    // Sync status
    @ColumnInfo(name = "sync_status")
    val syncStatus: SyncStatus = SyncStatus.PENDING,

    val lastSyncAttempt: Long? = null,
    val syncError: String? = null
)

enum class SyncStatus {
    PENDING,    // In attesa di connessione
    SYNCING,    // Upload in corso
    SYNCED,     // Completato
    FAILED      // Errore (retry)
}
```

#### SyncWorker.kt (Background Sync)

```kotlin
@HiltWorker
class SyncWorker @AssistedInject constructor(
    @Assisted context: Context,
    @Assisted workerParams: WorkerParameters,
    private val catchRepository: CatchRepository,
    private val cloudinaryService: CloudinaryService,
    private val apiService: ApiService
) : CoroutineWorker(context, workerParams) {

    override suspend fun doWork(): Result {
        return try {
            // 1. Ottieni catture pending
            val pendingCatches = catchRepository.getPendingCatches()

            if (pendingCatches.isEmpty()) {
                return Result.success()
            }

            // 2. Per ogni cattura pending
            pendingCatches.forEach { catch ->
                syncCatch(catch)
            }

            // 3. Scarica aggiornamenti dal server
            downloadUpdates()

            Result.success()
        } catch (e: Exception) {
            if (runAttemptCount < 3) {
                Result.retry()
            } else {
                Result.failure()
            }
        }
    }

    private suspend fun syncCatch(catch: CatchEntity) {
        // Aggiorna stato a SYNCING
        catchRepository.updateSyncStatus(catch.localId, SyncStatus.SYNCING)

        try {
            // 1. Upload foto a Cloudinary
            val photoUrl = cloudinaryService.uploadPhoto(
                File(catch.localPhotoPath),
                "tournamentmaster/catches/${catch.tournamentId}"
            )

            // 2. Upload video (se presente)
            val videoUrl = catch.localVideoPath?.let { path ->
                cloudinaryService.uploadVideo(
                    File(path),
                    "tournamentmaster/catches/${catch.tournamentId}"
                )
            }

            // 3. Invia dati al backend
            val response = apiService.createCatch(
                CreateCatchRequest(
                    tournamentId = catch.tournamentId,
                    weight = catch.weight,
                    length = catch.length,
                    latitude = catch.latitude,
                    longitude = catch.longitude,
                    photoPath = photoUrl,
                    videoPath = videoUrl,
                    caughtAt = Instant.ofEpochMilli(catch.catchTime).toString(),
                    speciesId = catch.speciesId,
                    notes = catch.notes
                )
            )

            // 4. Aggiorna record locale
            catchRepository.updateAfterSync(
                localId = catch.localId,
                serverId = response.data.id,
                remotePhotoUrl = photoUrl,
                remoteVideoUrl = videoUrl,
                status = SyncStatus.SYNCED
            )

        } catch (e: Exception) {
            catchRepository.updateSyncStatus(
                catch.localId,
                SyncStatus.FAILED,
                error = e.message
            )
            throw e
        }
    }

    private suspend fun downloadUpdates() {
        // Scarica classifica aggiornata
        // Scarica statistiche
        // Aggiorna cache locale
    }
}
```

#### Registrazione WorkManager (SyncManager.kt)

```kotlin
@Singleton
class SyncManager @Inject constructor(
    private val context: Context,
    private val networkMonitor: NetworkMonitor
) {
    private val workManager = WorkManager.getInstance(context)

    init {
        // Osserva stato rete
        networkMonitor.isOnline.observeForever { isOnline ->
            if (isOnline) {
                triggerSync()
            }
        }
    }

    fun triggerSync() {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()

        val syncRequest = OneTimeWorkRequestBuilder<SyncWorker>()
            .setConstraints(constraints)
            .setBackoffCriteria(
                BackoffPolicy.EXPONENTIAL,
                30, TimeUnit.SECONDS
            )
            .build()

        workManager.enqueueUniqueWork(
            "catch_sync",
            ExistingWorkPolicy.REPLACE,
            syncRequest
        )
    }

    // Sync periodico ogni 15 minuti quando online
    fun schedulePeriodicSync() {
        val periodicSync = PeriodicWorkRequestBuilder<SyncWorker>(
            15, TimeUnit.MINUTES
        )
            .setConstraints(
                Constraints.Builder()
                    .setRequiredNetworkType(NetworkType.CONNECTED)
                    .build()
            )
            .build()

        workManager.enqueueUniquePeriodicWork(
            "periodic_sync",
            ExistingPeriodicWorkPolicy.KEEP,
            periodicSync
        )
    }
}
```

---

## SVILUPPO iOS NATIVO

### Opzione 1: React Native con Expo (CONSIGLIATO)

**Stesso codice di Android** - vedi sezione precedente

#### Build iOS

```bash
# Build per TestFlight
eas build --platform ios --profile production

# Submit a App Store Connect
eas submit --platform ios --profile production
```

### Opzione 2: Swift Nativo (Performance Massima)

#### Struttura Progetto Xcode

```
TournamentMaster/
├── TournamentMaster/
│   ├── App/
│   │   └── TournamentMasterApp.swift
│   ├── Data/
│   │   ├── Local/
│   │   │   ├── CoreDataStack.swift
│   │   │   ├── CatchEntity+CoreDataClass.swift
│   │   │   └── TournamentMaster.xcdatamodeld
│   │   ├── Remote/
│   │   │   ├── APIService.swift
│   │   │   └── CloudinaryService.swift
│   │   └── Repository/
│   │       ├── CatchRepository.swift
│   │       └── SyncRepository.swift
│   ├── Sync/
│   │   ├── SyncManager.swift
│   │   └── BackgroundTaskManager.swift
│   ├── Features/
│   │   ├── Catch/
│   │   │   ├── CatchView.swift
│   │   │   └── CatchViewModel.swift
│   │   ├── Tournament/
│   │   └── Stats/
│   └── Utils/
│       ├── NetworkMonitor.swift
│       └── LocationManager.swift
├── TournamentMasterTests/
└── TournamentMaster.xcodeproj
```

#### Core Data Model (CatchEntity)

```swift
// CatchEntity+CoreDataClass.swift
import Foundation
import CoreData

@objc(CatchEntity)
public class CatchEntity: NSManagedObject {
    @NSManaged public var localId: UUID
    @NSManaged public var serverId: String?
    @NSManaged public var tournamentId: String
    @NSManaged public var weight: Float
    @NSManaged public var length: Float
    @NSManaged public var speciesId: String?
    @NSManaged public var notes: String?

    // Media locali
    @NSManaged public var localPhotoPath: String
    @NSManaged public var localVideoPath: String?

    // Media remoti
    @NSManaged public var remotePhotoUrl: String?
    @NSManaged public var remoteVideoUrl: String?

    // GPS
    @NSManaged public var latitude: Double
    @NSManaged public var longitude: Double
    @NSManaged public var gpsAccuracy: Float

    // Timestamps
    @NSManaged public var catchTime: Date
    @NSManaged public var createdAt: Date

    // Sync
    @NSManaged public var syncStatusRaw: String
    @NSManaged public var lastSyncAttempt: Date?
    @NSManaged public var syncError: String?

    var syncStatus: SyncStatus {
        get { SyncStatus(rawValue: syncStatusRaw) ?? .pending }
        set { syncStatusRaw = newValue.rawValue }
    }
}

enum SyncStatus: String {
    case pending = "PENDING"
    case syncing = "SYNCING"
    case synced = "SYNCED"
    case failed = "FAILED"
}
```

#### SyncManager.swift

```swift
import Foundation
import BackgroundTasks
import Network
import Combine

class SyncManager: ObservableObject {
    static let shared = SyncManager()

    private let catchRepository: CatchRepository
    private let cloudinaryService: CloudinaryService
    private let apiService: APIService
    private let networkMonitor = NWPathMonitor()

    @Published var isSyncing = false
    @Published var pendingCount = 0

    private var cancellables = Set<AnyCancellable>()

    init() {
        self.catchRepository = CatchRepository.shared
        self.cloudinaryService = CloudinaryService.shared
        self.apiService = APIService.shared

        setupNetworkMonitoring()
        registerBackgroundTask()
    }

    // MARK: - Network Monitoring

    private func setupNetworkMonitoring() {
        let queue = DispatchQueue(label: "NetworkMonitor")
        networkMonitor.pathUpdateHandler = { [weak self] path in
            if path.status == .satisfied {
                print("📶 Connessione disponibile - Avvio sync")
                Task {
                    await self?.performSync()
                }
            }
        }
        networkMonitor.start(queue: queue)
    }

    // MARK: - Background Task

    func registerBackgroundTask() {
        BGTaskScheduler.shared.register(
            forTaskWithIdentifier: "com.tournamentmaster.sync",
            using: nil
        ) { task in
            self.handleBackgroundSync(task: task as! BGProcessingTask)
        }
    }

    func scheduleBackgroundSync() {
        let request = BGProcessingTaskRequest(
            identifier: "com.tournamentmaster.sync"
        )
        request.requiresNetworkConnectivity = true
        request.requiresExternalPower = false

        do {
            try BGTaskScheduler.shared.submit(request)
        } catch {
            print("❌ Errore scheduling background task: \(error)")
        }
    }

    private func handleBackgroundSync(task: BGProcessingTask) {
        scheduleBackgroundSync() // Reschedule

        let syncTask = Task {
            await performSync()
        }

        task.expirationHandler = {
            syncTask.cancel()
        }

        Task {
            await syncTask.value
            task.setTaskCompleted(success: true)
        }
    }

    // MARK: - Sync Logic

    @MainActor
    func performSync() async {
        guard !isSyncing else { return }
        isSyncing = true

        defer { isSyncing = false }

        do {
            // 1. Ottieni catture pending
            let pendingCatches = try await catchRepository.getPendingCatches()
            pendingCount = pendingCatches.count

            guard !pendingCatches.isEmpty else {
                print("✅ Nessuna cattura da sincronizzare")
                return
            }

            // 2. Sincronizza ogni cattura
            for catch in pendingCatches {
                try await syncCatch(catch)
            }

            // 3. Scarica aggiornamenti
            try await downloadUpdates()

            print("✅ Sync completata: \(pendingCatches.count) catture")

        } catch {
            print("❌ Errore sync: \(error)")
        }
    }

    private func syncCatch(_ catch: CatchEntity) async throws {
        // Aggiorna stato
        try await catchRepository.updateSyncStatus(
            catch.localId,
            status: .syncing
        )

        do {
            // 1. Upload foto
            let photoData = try Data(contentsOf: URL(fileURLWithPath: catch.localPhotoPath))
            let photoUrl = try await cloudinaryService.uploadPhoto(
                photoData,
                folder: "tournamentmaster/catches/\(catch.tournamentId)"
            )

            // 2. Upload video (se presente)
            var videoUrl: String? = nil
            if let videoPath = catch.localVideoPath {
                let videoData = try Data(contentsOf: URL(fileURLWithPath: videoPath))
                videoUrl = try await cloudinaryService.uploadVideo(
                    videoData,
                    folder: "tournamentmaster/catches/\(catch.tournamentId)"
                )
            }

            // 3. Invia al backend
            let request = CreateCatchRequest(
                tournamentId: catch.tournamentId,
                weight: catch.weight,
                length: catch.length,
                latitude: catch.latitude,
                longitude: catch.longitude,
                photoPath: photoUrl,
                videoPath: videoUrl,
                caughtAt: catch.catchTime.ISO8601Format(),
                speciesId: catch.speciesId,
                notes: catch.notes
            )

            let response = try await apiService.createCatch(request)

            // 4. Aggiorna locale
            try await catchRepository.updateAfterSync(
                localId: catch.localId,
                serverId: response.id,
                remotePhotoUrl: photoUrl,
                remoteVideoUrl: videoUrl
            )

        } catch {
            try await catchRepository.updateSyncStatus(
                catch.localId,
                status: .failed,
                error: error.localizedDescription
            )
            throw error
        }
    }

    private func downloadUpdates() async throws {
        // Scarica e cache:
        // - Classifica tornei attivi
        // - Statistiche personali
        // - Regolamenti tornei
    }
}
```

#### Info.plist - Permessi e Background Modes

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- Permessi Camera -->
    <key>NSCameraUsageDescription</key>
    <string>Per fotografare e registrare video delle catture durante i tornei</string>

    <!-- Permessi Location -->
    <key>NSLocationWhenInUseUsageDescription</key>
    <string>Per validare la posizione GPS delle catture</string>
    <key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
    <string>Per tracking continuo durante il torneo, anche in background</string>

    <!-- Permessi Photo Library -->
    <key>NSPhotoLibraryUsageDescription</key>
    <string>Per salvare le foto delle catture nella galleria</string>
    <key>NSPhotoLibraryAddUsageDescription</key>
    <string>Per salvare le foto delle catture</string>

    <!-- Permessi Microphone (per video) -->
    <key>NSMicrophoneUsageDescription</key>
    <string>Per registrare audio nei video delle catture</string>

    <!-- Background Modes -->
    <key>UIBackgroundModes</key>
    <array>
        <string>fetch</string>
        <string>processing</string>
        <string>location</string>
    </array>

    <!-- Background Task Identifiers -->
    <key>BGTaskSchedulerPermittedIdentifiers</key>
    <array>
        <string>com.tournamentmaster.sync</string>
    </array>
</dict>
</plist>
```

---

## SISTEMA DI STORAGE LOCALE

### Schema Database Locale Completo

```sql
-- Tabella principale catture
CREATE TABLE catches (
    local_id TEXT PRIMARY KEY,
    server_id TEXT,
    tournament_id TEXT NOT NULL,
    user_id TEXT NOT NULL,

    -- Dati cattura
    weight REAL NOT NULL,
    length REAL,
    species_id TEXT,
    notes TEXT,

    -- Media locali (path su filesystem)
    local_photo_path TEXT NOT NULL,
    local_video_path TEXT,
    local_thumbnail_path TEXT,

    -- Media remoti (URL dopo sync)
    remote_photo_url TEXT,
    remote_video_url TEXT,
    remote_thumbnail_url TEXT,

    -- GPS
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    gps_accuracy REAL,

    -- Timestamps
    catch_time INTEGER NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),

    -- Sync
    sync_status TEXT NOT NULL DEFAULT 'PENDING',
    last_sync_attempt INTEGER,
    sync_error TEXT,
    retry_count INTEGER DEFAULT 0
);

-- Tabella tornei (cache)
CREATE TABLE tournaments_cache (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL,
    start_date INTEGER,
    end_date INTEGER,
    rules TEXT,
    min_weight REAL,
    max_catches_per_day INTEGER,

    -- Cache metadata
    cached_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
);

-- Tabella zone pesca (cache GeoJSON)
CREATE TABLE fishing_zones_cache (
    id TEXT PRIMARY KEY,
    tournament_id TEXT NOT NULL,
    name TEXT NOT NULL,
    geo_json TEXT NOT NULL,  -- GeoJSON completo

    cached_at INTEGER NOT NULL
);

-- Tabella classifica (cache)
CREATE TABLE leaderboard_cache (
    tournament_id TEXT NOT NULL,
    participant_id TEXT NOT NULL,
    rank INTEGER,
    total_weight REAL,
    total_catches INTEGER,
    total_points REAL,

    cached_at INTEGER NOT NULL,
    PRIMARY KEY (tournament_id, participant_id)
);

-- Tabella statistiche personali (cache)
CREATE TABLE user_stats_cache (
    user_id TEXT PRIMARY KEY,
    total_catches INTEGER,
    total_weight REAL,
    tournaments_participated INTEGER,
    tournaments_won INTEGER,
    best_catch_weight REAL,

    cached_at INTEGER NOT NULL
);

-- Tabella sessione utente
CREATE TABLE user_session (
    id INTEGER PRIMARY KEY CHECK (id = 1),  -- Solo una riga
    user_id TEXT NOT NULL,
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    role TEXT NOT NULL,

    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    token_expires_at INTEGER NOT NULL,

    created_at INTEGER NOT NULL,
    last_activity INTEGER NOT NULL
);

-- Tabella coda sync
CREATE TABLE sync_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL,  -- 'catch', 'profile', etc.
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL,       -- 'create', 'update', 'delete'
    payload TEXT NOT NULL,      -- JSON
    priority INTEGER DEFAULT 0,

    created_at INTEGER NOT NULL,
    attempts INTEGER DEFAULT 0,
    last_attempt INTEGER,
    status TEXT DEFAULT 'PENDING'
);

-- Indici per performance
CREATE INDEX idx_catches_sync_status ON catches(sync_status);
CREATE INDEX idx_catches_tournament ON catches(tournament_id);
CREATE INDEX idx_sync_queue_status ON sync_queue(status);
CREATE INDEX idx_leaderboard_tournament ON leaderboard_cache(tournament_id);
```

### Gestione File Media

```
App Documents/
└── TournamentMaster/
    ├── catches/
    │   ├── pending/           # File in attesa di sync
    │   │   ├── catch_abc123/
    │   │   │   ├── photo.jpg
    │   │   │   ├── video.mp4
    │   │   │   └── thumbnail.jpg
    │   │   └── catch_def456/
    │   │       └── ...
    │   └── synced/            # File sincronizzati (cache locale)
    │       └── ...
    ├── cache/
    │   ├── tournaments/       # JSON tornei
    │   ├── leaderboards/      # JSON classifiche
    │   └── maps/              # Tile mappe offline
    └── temp/                  # File temporanei
```

### Politica Pulizia Storage

```swift
class StorageManager {

    // Limiti storage
    static let maxPendingStorageMB = 500
    static let maxCacheStorageMB = 200
    static let maxSyncedMediaAgeDays = 30

    func cleanupStorage() async {
        // 1. Elimina media sincronizzati vecchi (> 30 giorni)
        await deleteSyncedMediaOlderThan(days: maxSyncedMediaAgeDays)

        // 2. Elimina cache scaduta
        await deleteExpiredCache()

        // 3. Se ancora sopra limite, elimina cache meno usata
        let currentSize = await calculateStorageUsage()
        if currentSize > maxTotalStorageMB {
            await deleteLeastRecentlyUsedCache()
        }
    }

    func checkStorageBeforeCapture() -> Bool {
        let availableMB = getAvailableStorageMB()
        let requiredMB = 150  // Spazio per foto + video

        if availableMB < requiredMB {
            // Mostra alert e suggerisci pulizia
            return false
        }
        return true
    }
}
```

---

## SISTEMA DI SINCRONIZZAZIONE

### Algoritmo Sync Completo

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      ALGORITMO SINCRONIZZAZIONE                              │
└─────────────────────────────────────────────────────────────────────────────┘

1. TRIGGER SYNC
   ├── Network diventa disponibile
   ├── App torna in foreground
   ├── Timer periodico (ogni 15 min se online)
   └── Utente richiede manualmente

2. PRE-SYNC CHECK
   ├── Verifica connessione stabile (non solo wifi captive)
   ├── Verifica batteria > 20% (per upload grandi)
   └── Verifica spazio server disponibile

3. UPLOAD PHASE (Locale → Server)
   │
   ├── 3.1 Ordina coda per priorita'
   │       - Catture vecchie prima
   │       - Catture con video dopo (piu' grandi)
   │
   ├── 3.2 Per ogni item in coda:
   │       │
   │       ├── Upload media a Cloudinary
   │       │   ├── Foto (compressione 80%)
   │       │   ├── Video (720p max)
   │       │   └── Thumbnail
   │       │
   │       ├── Invia dati a Backend
   │       │   POST /api/catches
   │       │   { ...dati, photoPath: cloudinaryUrl }
   │       │
   │       ├── Se successo:
   │       │   ├── Aggiorna sync_status = SYNCED
   │       │   ├── Salva server_id
   │       │   └── Sposta media in /synced/
   │       │
   │       └── Se errore:
   │           ├── Incrementa retry_count
   │           ├── Se retry < 3: status = PENDING
   │           ├── Se retry >= 3: status = FAILED
   │           └── Notifica utente se FAILED
   │
   └── 3.3 Emetti progresso UI (X di Y completati)

4. DOWNLOAD PHASE (Server → Locale)
   │
   ├── 4.1 Scarica classifica tornei attivi
   │       GET /api/leaderboard/{tournamentId}
   │
   ├── 4.2 Scarica statistiche personali
   │       GET /api/stats/user/me
   │
   ├── 4.3 Scarica aggiornamenti tornei
   │       GET /api/tournaments?updatedSince={lastSync}
   │
   └── 4.4 Aggiorna cache locale con TTL

5. POST-SYNC
   ├── Aggiorna last_sync_timestamp
   ├── Schedula prossimo sync
   ├── Notifica UI (badge aggiornato)
   └── Se prima sync dopo offline lungo: notifica push locale

```

### API Endpoint per Sync

```typescript
// Backend: Nuovi endpoint per supporto offline

// POST /api/catches/batch - Upload multiplo catture
router.post('/batch', authenticate, async (req, res) => {
  const { catches } = req.body;  // Array di catture

  const results = await Promise.allSettled(
    catches.map(c => CatchService.create(c, req.user.id))
  );

  res.json({
    success: true,
    data: {
      succeeded: results.filter(r => r.status === 'fulfilled').map(r => r.value),
      failed: results.filter(r => r.status === 'rejected').map((r, i) => ({
        index: i,
        error: r.reason.message
      }))
    }
  });
});

// GET /api/sync/status - Stato sync per client
router.get('/status', authenticate, async (req, res) => {
  const { lastSyncAt } = req.query;

  const updates = await SyncService.getUpdatesSince(
    req.user.id,
    new Date(lastSyncAt)
  );

  res.json({
    success: true,
    data: {
      hasUpdates: updates.length > 0,
      tournaments: updates.tournaments,
      leaderboards: updates.leaderboards,
      catches: updates.catches,  // Catture validate/rifiutate
      serverTime: new Date().toISOString()
    }
  });
});

// POST /api/sync/conflict - Risoluzione conflitti
router.post('/conflict', authenticate, async (req, res) => {
  const { localId, serverId, resolution } = req.body;
  // resolution: 'keep_local' | 'keep_server' | 'merge'

  const resolved = await SyncService.resolveConflict(
    localId,
    serverId,
    resolution,
    req.user.id
  );

  res.json({ success: true, data: resolved });
});
```

### Gestione Conflitti

```swift
enum ConflictResolution {
    case keepLocal      // Mantieni versione locale
    case keepServer     // Mantieni versione server
    case merge          // Tenta merge automatico
    case askUser        // Chiedi all'utente
}

struct SyncConflict {
    let localVersion: CatchEntity
    let serverVersion: CatchDTO
    let conflictType: ConflictType
}

enum ConflictType {
    case bothModified       // Entrambi modificati
    case deletedOnServer    // Eliminato su server
    case deletedLocally     // Eliminato localmente
}

class ConflictResolver {

    func resolve(_ conflict: SyncConflict) -> ConflictResolution {
        switch conflict.conflictType {
        case .bothModified:
            // Se solo metadata diversi, merge
            if onlyMetadataChanged(conflict) {
                return .merge
            }
            // Se dati importanti diversi, chiedi utente
            return .askUser

        case .deletedOnServer:
            // Cattura eliminata su server (es. rifiutata da giudice)
            // Notifica utente e rimuovi locale
            return .keepServer

        case .deletedLocally:
            // Rare: utente ha cancellato ma era gia' su server
            return .keepServer
        }
    }

    private func onlyMetadataChanged(_ conflict: SyncConflict) -> Bool {
        // Confronta solo campi critici (peso, GPS, foto)
        // Se uguali, differenze sono in note/timestamp
        return conflict.localVersion.weight == conflict.serverVersion.weight &&
               conflict.localVersion.latitude == conflict.serverVersion.latitude
    }
}
```

---

## FUNZIONALITA' DA IMPLEMENTARE

### Checklist Implementazione

#### Backend (Priorita' CRITICA)

| # | Funzionalita' | Descrizione | File | Stato |
|---|---------------|-------------|------|-------|
| 1 | **Batch Upload API** | Endpoint per upload multiplo catture | `catch.routes.ts` | ❌ TODO |
| 2 | **Sync Status API** | Endpoint per stato sync client | `sync.routes.ts` | ❌ TODO |
| 3 | **Conflict Resolution API** | Endpoint risoluzione conflitti | `sync.routes.ts` | ❌ TODO |
| 4 | **Webhook Cloudinary** | Callback conferma upload | `upload.routes.ts` | ❌ TODO |
| 5 | **Compression Middleware** | Compressione response JSON | `middleware/` | ❌ TODO |
| 6 | **Delta Sync** | Solo dati modificati dopo timestamp | `sync.service.ts` | ❌ TODO |

#### Mobile - Core Offline (Priorita' CRITICA)

| # | Funzionalita' | Descrizione | Effort |
|---|---------------|-------------|--------|
| 1 | **Database Locale** | SQLite/Room/CoreData schema | 8h |
| 2 | **File Storage Manager** | Gestione foto/video locali | 6h |
| 3 | **Sync Engine** | Upload/download automatico | 16h |
| 4 | **Network Monitor** | Rilevamento stato connessione | 4h |
| 5 | **Background Sync** | WorkManager / BGTask | 8h |
| 6 | **Conflict UI** | Interfaccia risoluzione conflitti | 6h |

#### Mobile - Cache & UI (Priorita' ALTA)

| # | Funzionalita' | Descrizione | Effort |
|---|---------------|-------------|--------|
| 7 | **Tournaments Cache** | Cache lista e dettaglio tornei | 4h |
| 8 | **Leaderboard Cache** | Cache classifica con TTL | 4h |
| 9 | **Stats Cache** | Cache statistiche personali | 3h |
| 10 | **Offline Indicator UI** | Badge/Banner stato offline | 2h |
| 11 | **Sync Progress UI** | Barra progresso upload | 3h |
| 12 | **Pending Catches List** | Lista catture in attesa sync | 4h |

#### Mobile - Media (Priorita' ALTA)

| # | Funzionalita' | Descrizione | Effort |
|---|---------------|-------------|--------|
| 13 | **Camera Offline** | Scatto foto senza internet | 4h |
| 14 | **Video Recorder Offline** | Registrazione video 720p | 6h |
| 15 | **Thumbnail Generator** | Generazione thumbnail locale | 3h |
| 16 | **Media Compression** | Compressione prima upload | 4h |
| 17 | **Storage Cleanup** | Pulizia automatica storage | 3h |

#### Mobile - UX Offline (Priorita' MEDIA)

| # | Funzionalita' | Descrizione | Effort |
|---|---------------|-------------|--------|
| 18 | **Offline Maps** | Cache tile mappe zone pesca | 8h |
| 19 | **Rules Cache** | Regolamento torneo offline | 2h |
| 20 | **Push Notifications** | Notifica sync completata | 4h |
| 21 | **Retry Manual** | Pulsante retry sync fallite | 2h |
| 22 | **Storage Warning** | Alert spazio insufficiente | 2h |

### Stima Totale Implementazione

| Categoria | Ore Stimate |
|-----------|-------------|
| Backend APIs | 24h |
| Mobile Core Offline | 48h |
| Mobile Cache & UI | 20h |
| Mobile Media | 20h |
| Mobile UX | 18h |
| Testing & QA | 24h |
| **TOTALE** | **154h (~4 settimane FTE)** |

---

## PUBBLICAZIONE GOOGLE PLAY STORE

### Prerequisiti

| Requisito | Dettaglio |
|-----------|-----------|
| Account Google Play Developer | $25 una tantum |
| App firmata con Release Key | Keystore sicuro |
| Privacy Policy URL | Obbligatoria |
| Asset grafici | Icona, screenshot, feature graphic |
| Classificazione contenuti | Questionario IARC |

### Procedura Passo-Passo

#### 1. Creare Account Developer

```
1. Vai a: https://play.google.com/console
2. Accedi con account Google
3. Paga $25 di registrazione
4. Completa verifica identita' (2-3 giorni)
```

#### 2. Preparare Asset Grafici

| Asset | Dimensioni | Formato |
|-------|------------|---------|
| Icona app | 512x512 px | PNG 32-bit |
| Feature graphic | 1024x500 px | PNG/JPEG |
| Screenshot telefono | 16:9 o 9:16 | PNG/JPEG |
| Screenshot tablet | 16:9 | PNG/JPEG |

#### 3. Generare Release Build

```bash
# Con EAS (React Native/Expo)
eas build --platform android --profile production

# Con Android Studio (Kotlin)
./gradlew bundleRelease
# Output: app/build/outputs/bundle/release/app-release.aab
```

#### 4. Creare App su Play Console

```
1. Play Console → Crea app
2. Nome: "TournamentMaster"
3. Lingua: Italiano
4. Tipo: App
5. Gratuita/A pagamento: Gratuita
6. Dichiarazioni: Accetta tutti
```

#### 5. Completare Store Listing

```
- Titolo: TournamentMaster - Tornei Pesca
- Descrizione breve (80 char): Gestisci tornei di pesca sportiva con GPS e classifica live
- Descrizione completa (4000 char): [Descrizione dettagliata]
- Categoria: Sport
- Tag: pesca, tornei, GPS, classifica
- Email contatto: support@tournamentmaster.it
- Privacy Policy URL: https://tournamentmaster.it/privacy
```

#### 6. Classificazione Contenuti

```
Completa questionario IARC:
- Violenza: No
- Contenuti sessuali: No
- Linguaggio: No
- Sostanze: No
- Gambling: No
→ Risultato atteso: PEGI 3 / Everyone
```

#### 7. Upload AAB e Rilascio

```bash
# Upload manuale
Play Console → Release → Production → Create release → Upload AAB

# Upload automatico con EAS
eas submit --platform android
```

#### 8. Review e Pubblicazione

```
- Review iniziale: 1-3 giorni
- Aggiornamenti successivi: ore/1 giorno
- Se rifiutata: correggi e re-submit
```

### Costi Google Play

| Voce | Costo |
|------|-------|
| Account Developer | $25 (una tantum) |
| Pubblicazione | Gratuita |
| Aggiornamenti | Gratuiti |
| **Totale primo anno** | **$25** |

---

## PUBBLICAZIONE APPLE APP STORE

### Prerequisiti

| Requisito | Dettaglio |
|-----------|-----------|
| Apple Developer Account | $99/anno |
| Mac con Xcode | Per build e submit |
| App Store Connect | Console pubblicazione |
| Privacy Policy URL | Obbligatoria |
| App Privacy Labels | Dichiarazione dati raccolti |

### Procedura Passo-Passo

#### 1. Creare Account Developer

```
1. Vai a: https://developer.apple.com/programs/
2. Enroll come Individual o Organization
3. Paga $99/anno
4. Verifica identita' (Organization richiede D-U-N-S)
5. Attivazione: 24-48 ore
```

#### 2. Configurare Certificati e Provisioning

```bash
# Con EAS (gestisce automaticamente)
eas credentials

# Manuale (Xcode)
1. Xcode → Preferences → Accounts → Manage Certificates
2. Crea Distribution Certificate
3. App Store Connect → Identifiers → Crea App ID
4. Provisioning Profiles → Crea Distribution Profile
```

#### 3. Preparare Asset Grafici

| Asset | Dimensioni | Note |
|-------|------------|------|
| Icona app | 1024x1024 px | No trasparenza, no angoli arrotondati |
| Screenshot iPhone 6.5" | 1284x2778 px | Obbligatorio |
| Screenshot iPhone 5.5" | 1242x2208 px | Obbligatorio |
| Screenshot iPad 12.9" | 2048x2732 px | Se supporta tablet |

#### 4. Creare App su App Store Connect

```
1. App Store Connect → My Apps → +
2. Platform: iOS
3. Name: TournamentMaster
4. Primary Language: Italian
5. Bundle ID: com.tournamentmaster.app
6. SKU: tournamentmaster-ios
```

#### 5. Completare App Information

```
App Information:
- Name: TournamentMaster
- Subtitle: Tornei Pesca Sportiva
- Category: Sports
- Content Rights: Non usa contenuti terze parti

Privacy:
- Privacy Policy URL: https://tournamentmaster.it/privacy
- Privacy Nutrition Labels: Compila per ogni dato raccolto
```

#### 6. Privacy Nutrition Labels

```
Dati raccolti (da dichiarare):

DATI COLLEGATI ALL'UTENTE:
├── Informazioni di contatto
│   └── Email (registrazione, comunicazioni)
├── Posizione
│   └── Posizione precisa (validazione catture GPS)
├── Contenuti utente
│   └── Foto e video (catture)
└── Identificatori
    └── ID utente

DATI NON COLLEGATI ALL'UTENTE:
└── Diagnostica
    └── Dati prestazioni e crash
```

#### 7. Build e Upload

```bash
# Con EAS (React Native/Expo)
eas build --platform ios --profile production
eas submit --platform ios

# Con Xcode (Swift)
1. Product → Archive
2. Window → Organizer → Distribute App
3. App Store Connect → Upload
```

#### 8. TestFlight (Beta Testing)

```
1. App Store Connect → TestFlight
2. Aggiungi Internal Testers (team)
3. Aggiungi External Testers (beta pubblica)
4. Attendi review TestFlight (24h prima volta)
5. Testa almeno 1 settimana prima di release
```

#### 9. Submit for Review

```
App Store Connect → App Store → Submit for Review

Checklist pre-submit:
☐ Tutti i metadata completi
☐ Screenshot per tutti i device
☐ Privacy policy funzionante
☐ Demo account fornito (se login richiesto)
☐ Note per reviewer compilate
```

#### 10. Review e Pubblicazione

```
- Prima review: 24-48 ore (fino a 1 settimana)
- Review rifiutata: correggi e re-submit
- Dopo approvazione: scegli data rilascio
- Aggiornamenti successivi: 24-48 ore
```

### Costi Apple

| Voce | Costo |
|------|-------|
| Apple Developer Program | $99/anno |
| Pubblicazione | Inclusa |
| Aggiornamenti | Inclusi |
| **Totale annuale** | **$99/anno** |

### Note Importanti Apple

```
⚠️ ATTENZIONE - Motivi comuni di rifiuto:

1. Login required senza demo account
   → Fornisci credenziali demo nelle note reviewer

2. Incomplete functionality
   → Tutte le feature dichiarate devono funzionare

3. Placeholder content
   → Rimuovi "Lorem ipsum" e immagini placeholder

4. Crashes
   → Testa su device reali, non solo simulatore

5. Privacy issues
   → Spiega perche' servono camera/GPS/foto

6. In-app purchases senza Apple Pay
   → Se vendi quote iscrizione, usa IAP Apple
```

---

## COSTI E TEMPISTICHE

### Riepilogo Costi

| Voce | Costo | Frequenza |
|------|-------|-----------|
| Google Play Developer | $25 | Una tantum |
| Apple Developer Program | $99 | Annuale |
| Cloudinary (storage media) | ~$89/mese | Mensile (production) |
| Backend hosting (Railway/Render) | ~$20/mese | Mensile |
| Database hosting | ~$15/mese | Mensile |
| **Totale Anno 1** | **~$1,600** | |
| **Totale Anni successivi** | **~$1,500/anno** | |

### Timeline Sviluppo Realistica

```
FASE 1: SETUP (Settimana 1)
├── Setup account developer Android/iOS
├── Configurazione CI/CD (EAS)
├── Setup certificati e signing
└── Preparazione asset grafici

FASE 2: CORE OFFLINE (Settimane 2-4)
├── Implementazione database locale
├── Sistema storage file media
├── Sync engine base
└── Network monitoring

FASE 3: FEATURES (Settimane 5-6)
├── Camera/Video offline
├── Cache tornei e classifiche
├── UI stati sync
└── Gestione conflitti

FASE 4: TESTING (Settimana 7)
├── Test offline prolungato
├── Test sync con dati reali
├── Test su device fisici
└── Beta testing interno

FASE 5: BETA PUBBLICA (Settimane 8-9)
├── TestFlight (iOS)
├── Internal testing (Android)
├── Raccolta feedback
└── Fix bug critici

FASE 6: RELEASE (Settimana 10)
├── Submit Google Play
├── Submit App Store
├── Monitoraggio review
└── Go live
```

---

## CHECKLIST PRE-LANCIO

### Android

```
SVILUPPO
☐ App funziona completamente offline
☐ Sync automatico testato (3+ giorni offline)
☐ Camera/Video funzionano offline
☐ GPS funziona offline
☐ Storage locale gestito correttamente
☐ Nessun crash su test 100+ catture offline

BUILD
☐ Release build firmato con production keystore
☐ ProGuard/R8 configurato
☐ Versione e version code incrementati
☐ Testato su Android 7, 10, 13, 14

STORE
☐ Icona 512x512 PNG
☐ Feature graphic 1024x500
☐ Screenshot telefono (almeno 4)
☐ Screenshot tablet (se supportato)
☐ Descrizione completa IT/EN
☐ Privacy policy URL funzionante
☐ Classificazione IARC completata
☐ Categoria e tag corretti
```

### iOS

```
SVILUPPO
☐ Stessi requisiti Android +
☐ Background fetch configurato
☐ Testato su iPhone e iPad
☐ Testato su iOS 15, 16, 17

BUILD
☐ Archive creato senza warning
☐ Provisioning profile production
☐ Bundle ID corretto
☐ Version e build number corretti

STORE
☐ Icona 1024x1024 PNG
☐ Screenshot iPhone 6.5" (almeno 3)
☐ Screenshot iPhone 5.5" (almeno 3)
☐ Screenshot iPad 12.9" (se supportato)
☐ Descrizione IT/EN
☐ Privacy policy URL
☐ App Privacy labels compilate
☐ Age rating completato
☐ Demo account per reviewer
☐ Note per reviewer (spiega offline mode)
```

### Backend

```
☐ API batch upload implementata
☐ API sync status implementata
☐ Rate limiting configurato
☐ HTTPS obbligatorio
☐ Cloudinary configurato production
☐ Database backup automatico
☐ Monitoring attivo (Sentry, LogRocket)
☐ Load test completato (100 sync simultanei)
```

---

## APPENDICE: CODICE ESEMPIO COMPLETO

### React Native - Hook useOfflineSync

```typescript
// hooks/useOfflineSync.ts
import { useEffect, useState, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncService } from '../services/syncService';
import { catchRepository } from '../repositories/catchRepository';

interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncAt: Date | null;
  syncError: string | null;
}

export function useOfflineSync() {
  const [state, setState] = useState<SyncState>({
    isOnline: true,
    isSyncing: false,
    pendingCount: 0,
    lastSyncAt: null,
    syncError: null,
  });

  // Monitor network
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(netState => {
      const isOnline = netState.isConnected && netState.isInternetReachable;

      setState(prev => ({ ...prev, isOnline }));

      if (isOnline && !state.isSyncing) {
        performSync();
      }
    });

    return () => unsubscribe();
  }, []);

  // Load pending count
  useEffect(() => {
    loadPendingCount();
  }, []);

  const loadPendingCount = async () => {
    const count = await catchRepository.getPendingCount();
    setState(prev => ({ ...prev, pendingCount: count }));
  };

  const performSync = useCallback(async () => {
    if (state.isSyncing) return;

    setState(prev => ({ ...prev, isSyncing: true, syncError: null }));

    try {
      await syncService.syncAll({
        onProgress: (completed, total) => {
          setState(prev => ({
            ...prev,
            pendingCount: total - completed,
          }));
        },
      });

      setState(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncAt: new Date(),
        pendingCount: 0,
      }));

      await AsyncStorage.setItem('lastSyncAt', new Date().toISOString());

    } catch (error) {
      setState(prev => ({
        ...prev,
        isSyncing: false,
        syncError: error.message,
      }));
    }
  }, [state.isSyncing]);

  const saveCatchOffline = useCallback(async (catchData: CatchData) => {
    const localCatch = await catchRepository.saveLocal(catchData);

    setState(prev => ({
      ...prev,
      pendingCount: prev.pendingCount + 1,
    }));

    // Se online, tenta sync immediato
    if (state.isOnline) {
      performSync();
    }

    return localCatch;
  }, [state.isOnline, performSync]);

  const retryFailedSync = useCallback(async () => {
    await catchRepository.resetFailedToRetry();
    await loadPendingCount();

    if (state.isOnline) {
      performSync();
    }
  }, [state.isOnline, performSync]);

  return {
    ...state,
    saveCatchOffline,
    performSync,
    retryFailedSync,
    refreshPendingCount: loadPendingCount,
  };
}
```

### React Native - Componente CatchScreen Offline

```typescript
// screens/CatchScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  StyleSheet,
} from 'react-native';
import { Camera } from 'expo-camera';
import * as Location from 'expo-location';
import * as FileSystem from 'expo-file-system';
import { useOfflineSync } from '../hooks/useOfflineSync';

export function CatchScreen({ route, navigation }) {
  const { tournamentId } = route.params;
  const { isOnline, saveCatchOffline, pendingCount } = useOfflineSync();

  const [photo, setPhoto] = useState<string | null>(null);
  const [video, setVideo] = useState<string | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const takePhoto = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permesso negato', 'Serve accesso alla fotocamera');
      return;
    }

    // Cattura foto
    const result = await Camera.takePictureAsync({
      quality: 0.8,
      base64: false,
    });

    // Salva localmente
    const localPath = `${FileSystem.documentDirectory}catches/pending/${Date.now()}.jpg`;
    await FileSystem.makeDirectoryAsync(
      `${FileSystem.documentDirectory}catches/pending`,
      { intermediates: true }
    );
    await FileSystem.moveAsync({
      from: result.uri,
      to: localPath,
    });

    setPhoto(localPath);

    // Cattura GPS
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    setLocation(loc);
  };

  const recordVideo = async () => {
    // Implementazione simile con limite 60 secondi
  };

  const saveCatch = async (weight: number, speciesId?: string, notes?: string) => {
    if (!photo || !location) {
      Alert.alert('Errore', 'Foto e GPS sono obbligatori');
      return;
    }

    setIsSaving(true);

    try {
      const catchData = {
        tournamentId,
        localPhotoPath: photo,
        localVideoPath: video,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        gpsAccuracy: location.coords.accuracy,
        weight,
        speciesId,
        notes,
        catchTime: new Date(),
      };

      await saveCatchOffline(catchData);

      Alert.alert(
        'Cattura salvata!',
        isOnline
          ? 'Upload in corso...'
          : `Salvata offline. ${pendingCount + 1} catture in attesa di sync.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );

    } catch (error) {
      Alert.alert('Errore', error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Offline banner */}
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>
            📴 Offline - Le catture saranno sincronizzate quando torni online
          </Text>
        </View>
      )}

      {/* Pending count */}
      {pendingCount > 0 && (
        <View style={styles.pendingBadge}>
          <Text style={styles.pendingText}>
            ⏳ {pendingCount} catture in attesa
          </Text>
        </View>
      )}

      {/* Camera preview / Photo taken */}
      {photo ? (
        <Image source={{ uri: photo }} style={styles.preview} />
      ) : (
        <TouchableOpacity style={styles.cameraButton} onPress={takePhoto}>
          <Text style={styles.cameraText}>📷 Scatta Foto</Text>
        </TouchableOpacity>
      )}

      {/* Video button */}
      <TouchableOpacity style={styles.videoButton} onPress={recordVideo}>
        <Text style={styles.videoText}>
          {video ? '✅ Video registrato' : '🎥 Registra Video (opzionale)'}
        </Text>
      </TouchableOpacity>

      {/* GPS Status */}
      <View style={styles.gpsStatus}>
        <Text>
          {location
            ? `📍 GPS: ${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)}`
            : '⏳ Acquisizione GPS...'}
        </Text>
      </View>

      {/* Form peso, specie, note... */}
      {/* ... */}

      {/* Save button */}
      <TouchableOpacity
        style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
        onPress={() => saveCatch(/* form values */)}
        disabled={isSaving || !photo}
      >
        <Text style={styles.saveText}>
          {isSaving ? 'Salvataggio...' : '💾 Salva Cattura'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  offlineBanner: {
    backgroundColor: '#FFA000',
    padding: 8,
    borderRadius: 4,
    marginBottom: 16,
  },
  offlineText: { color: '#FFF', textAlign: 'center' },
  pendingBadge: {
    backgroundColor: '#2196F3',
    padding: 8,
    borderRadius: 4,
    marginBottom: 16,
  },
  pendingText: { color: '#FFF', textAlign: 'center' },
  cameraButton: {
    backgroundColor: '#4CAF50',
    padding: 40,
    borderRadius: 8,
    alignItems: 'center',
  },
  cameraText: { color: '#FFF', fontSize: 18 },
  preview: { width: '100%', height: 300, borderRadius: 8 },
  videoButton: {
    backgroundColor: '#9C27B0',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  videoText: { color: '#FFF', textAlign: 'center' },
  gpsStatus: { marginTop: 16, padding: 8, backgroundColor: '#E0E0E0', borderRadius: 4 },
  saveButton: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    marginTop: 24,
  },
  saveButtonDisabled: { backgroundColor: '#BDBDBD' },
  saveText: { color: '#FFF', textAlign: 'center', fontSize: 18 },
});
```

---

*Documento generato il 2026-01-02*
*TournamentMaster - Guida Sviluppo App Native Offline-First*
