/**
 * =============================================================================
 * NEW CATCH PAGE
 * =============================================================================
 * Pagina per registrare una nuova cattura durante un torneo
 *
 * Flusso:
 * 1. Selezione torneo attivo (se multipli)
 * 2. Scatto foto con CatchCamera + upload Cloudinary
 * 3. Inserimento peso, specie, note
 * 4. Submit al backend
 * =============================================================================
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { CatchCamera } from "@/components/native/CatchCamera";
import { useUpload } from "@/hooks/useUpload";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Fish,
  Camera,
  Scale,
  Trophy,
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  MapPin,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";

// Types
interface Tournament {
  id: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  minWeight?: number;
  maxCatchesPerDay?: number;
}

interface Species {
  id: string;
  commonNameIt: string;
  commonNameEn: string;
  scientificName?: string;
}

interface CatchPhoto {
  url: string;
  thumbnailUrl?: string;
  publicId?: string;
  latitude: number | null;
  longitude: number | null;
  timestamp: Date;
  savedLocally: boolean;
  uploadedToCloud: boolean;
}

type Step = "tournament" | "photo" | "details" | "confirm";

export default function NewCatchPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string || "it";
  const { user, token, isAuthenticated, isLoading: authLoading } = useAuth();

  // Wizard state
  const [currentStep, setCurrentStep] = useState<Step>("tournament");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Data state
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [species, setSpecies] = useState<Species[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Form state
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [photo, setPhoto] = useState<CatchPhoto | null>(null);
  const [weight, setWeight] = useState("");
  const [length, setLength] = useState("");
  const [selectedSpecies, setSelectedSpecies] = useState<string>("");
  const [notes, setNotes] = useState("");

  // Fetch active tournaments and species
  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;

      try {
        setLoadingData(true);

        // Fetch tournaments where user is registered and status is ONGOING
        const tournamentsRes = await api<{ tournaments: Tournament[] }>("/api/tournaments?status=ONGOING");

        if (tournamentsRes.success && tournamentsRes.data) {
          setTournaments(tournamentsRes.data.tournaments || []);

          // Auto-select if only one tournament
          if (tournamentsRes.data.tournaments?.length === 1) {
            setSelectedTournament(tournamentsRes.data.tournaments[0]);
          }
        } else {
          // Demo data for development
          setTournaments([
            {
              id: "demo-1",
              name: "Gran Premio Estate 2025",
              status: "ONGOING",
              startDate: new Date().toISOString(),
              endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              minWeight: 0.5,
              maxCatchesPerDay: 10,
            },
          ]);
        }

        // Fetch species
        const speciesRes = await api<{ species: Species[] }>("/api/species");

        if (speciesRes.success && speciesRes.data) {
          setSpecies(speciesRes.data.species || []);
        } else {
          // Demo species
          setSpecies([
            { id: "1", commonNameIt: "Tonno Rosso", commonNameEn: "Bluefin Tuna", scientificName: "Thunnus thynnus" },
            { id: "2", commonNameIt: "Ricciola", commonNameEn: "Greater Amberjack", scientificName: "Seriola dumerili" },
            { id: "3", commonNameIt: "Dentice", commonNameEn: "Common Dentex", scientificName: "Dentex dentex" },
            { id: "4", commonNameIt: "Orata", commonNameEn: "Gilt-head Bream", scientificName: "Sparus aurata" },
            { id: "5", commonNameIt: "Spigola", commonNameEn: "European Sea Bass", scientificName: "Dicentrarchus labrax" },
          ]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [token]);

  // Handle photo taken from CatchCamera
  const handlePhotoTaken = useCallback((catchPhoto: CatchPhoto) => {
    setPhoto(catchPhoto);
    setCurrentStep("details");
  }, []);

  // Handle form submission
  const handleSubmit = async () => {
    if (!selectedTournament || !photo || !weight) {
      setSubmitError("Compila tutti i campi obbligatori");
      return;
    }

    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum <= 0) {
      setSubmitError("Inserisci un peso valido");
      return;
    }

    // Check minimum weight
    if (selectedTournament.minWeight && weightNum < selectedTournament.minWeight) {
      setSubmitError(`Il peso minimo per questo torneo e ${selectedTournament.minWeight} kg`);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const catchData = {
        tournamentId: selectedTournament.id,
        weight: weightNum,
        length: length ? parseFloat(length) : undefined,
        latitude: photo.latitude,
        longitude: photo.longitude,
        speciesId: selectedSpecies || undefined,
        photoPath: photo.url,
        caughtAt: photo.timestamp.toISOString(),
        notes: notes || undefined,
      };

      const result = await api("/api/catches", {
        method: "POST",
        body: catchData,
      });

      if (result.success) {
        setSubmitSuccess(true);
        // Redirect after 2 seconds
        setTimeout(() => {
          router.push(`/${locale}/dashboard`);
        }, 2000);
      } else {
        setSubmitError(result.message || "Errore durante l'invio della cattura");
      }
    } catch (error) {
      console.error("Submit error:", error);
      setSubmitError("Errore di rete. Riprova.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step navigation
  const goToStep = (step: Step) => {
    setCurrentStep(step);
  };

  const canProceedFromTournament = selectedTournament !== null;
  const canProceedFromDetails = weight !== "" && parseFloat(weight) > 0;

  // Auth check
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push(`/${locale}/login`);
    return null;
  }

  // Loading data
  if (loadingData) {
    return (
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-muted-foreground">Caricamento tornei...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No active tournaments
  if (tournaments.length === 0) {
    return (
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Nessun Torneo Attivo
            </CardTitle>
            <CardDescription>
              Non sei iscritto a nessun torneo attualmente in corso.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Per registrare una cattura, devi prima iscriverti a un torneo in corso.
            </p>
            <div className="flex gap-2">
              <Link href={`/${locale}/tournaments`}>
                <Button>
                  <Trophy className="h-4 w-4 mr-2" />
                  Esplora Tornei
                </Button>
              </Link>
              <Link href={`/${locale}/dashboard`}>
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (submitSuccess) {
    return (
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="p-4 rounded-full bg-green-100">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold">Cattura Registrata!</h2>
              <p className="text-muted-foreground">
                La tua cattura e stata inviata con successo ed e in attesa di validazione.
              </p>
              <p className="text-sm text-muted-foreground">
                Reindirizzamento alla dashboard...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Progress indicator
  const steps: { key: Step; label: string; icon: React.ReactNode }[] = [
    { key: "tournament", label: "Torneo", icon: <Trophy className="h-4 w-4" /> },
    { key: "photo", label: "Foto", icon: <Camera className="h-4 w-4" /> },
    { key: "details", label: "Dettagli", icon: <Scale className="h-4 w-4" /> },
    { key: "confirm", label: "Conferma", icon: <Check className="h-4 w-4" /> },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Fish className="h-6 w-6" />
            Nuova Cattura
          </h1>
          <p className="text-muted-foreground">Registra la tua cattura</p>
        </div>
        <Link href={`/${locale}/dashboard`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Annulla
          </Button>
        </Link>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between">
          {steps.map((step, index) => (
            <div
              key={step.key}
              className={`flex items-center gap-1 text-sm ${
                index <= currentStepIndex ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {step.icon}
              <span className="hidden sm:inline">{step.label}</span>
            </div>
          ))}
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step: Tournament Selection */}
      {currentStep === "tournament" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Seleziona Torneo
            </CardTitle>
            <CardDescription>
              Scegli il torneo per cui vuoi registrare la cattura
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              {tournaments.map((tournament) => (
                <div
                  key={tournament.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    selectedTournament?.id === tournament.id
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedTournament(tournament)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{tournament.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="default">In Corso</Badge>
                  </div>
                  {tournament.minWeight && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Peso minimo: {tournament.minWeight} kg
                    </p>
                  )}
                </div>
              ))}
            </div>

            <Button
              className="w-full"
              disabled={!canProceedFromTournament}
              onClick={() => goToStep("photo")}
            >
              Continua
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step: Photo Capture */}
      {currentStep === "photo" && (
        <div className="space-y-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => goToStep("tournament")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Cambia torneo
          </Button>

          <CatchCamera
            onPhotoTaken={handlePhotoTaken}
            onCancel={() => goToStep("tournament")}
            tournamentId={selectedTournament?.id}
          />
        </div>
      )}

      {/* Step: Details */}
      {currentStep === "details" && photo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              Dettagli Cattura
            </CardTitle>
            <CardDescription>
              Inserisci peso e informazioni aggiuntive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Photo preview */}
            <div className="relative rounded-lg overflow-hidden">
              <img
                src={photo.url}
                alt="Cattura"
                className="w-full h-48 object-cover"
              />
              {photo.latitude && photo.longitude && (
                <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  GPS: {photo.latitude.toFixed(4)}, {photo.longitude.toFixed(4)}
                </div>
              )}
              {photo.uploadedToCloud && (
                <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                  Caricata su cloud
                </div>
              )}
            </div>

            {/* Weight - Required */}
            <div className="space-y-2">
              <Label htmlFor="weight">
                Peso (kg) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="weight"
                type="number"
                step="0.01"
                min="0"
                placeholder="es. 5.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
              {selectedTournament?.minWeight && (
                <p className="text-xs text-muted-foreground">
                  Peso minimo richiesto: {selectedTournament.minWeight} kg
                </p>
              )}
            </div>

            {/* Length - Optional */}
            <div className="space-y-2">
              <Label htmlFor="length">Lunghezza (cm) - opzionale</Label>
              <Input
                id="length"
                type="number"
                step="0.1"
                min="0"
                placeholder="es. 85"
                value={length}
                onChange={(e) => setLength(e.target.value)}
              />
            </div>

            {/* Species - Optional */}
            <div className="space-y-2">
              <Label htmlFor="species">Specie - opzionale</Label>
              <Select value={selectedSpecies} onValueChange={setSelectedSpecies}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona specie..." />
                </SelectTrigger>
                <SelectContent>
                  {species.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.commonNameIt} ({s.scientificName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes - Optional */}
            <div className="space-y-2">
              <Label htmlFor="notes">Note - opzionale</Label>
              <Textarea
                id="notes"
                placeholder="Aggiungi note sulla cattura..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Navigation */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setPhoto(null);
                  goToStep("photo");
                }}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Nuova Foto
              </Button>
              <Button
                className="flex-1"
                disabled={!canProceedFromDetails}
                onClick={() => goToStep("confirm")}
              >
                Continua
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Confirm */}
      {currentStep === "confirm" && photo && selectedTournament && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="h-5 w-5" />
              Conferma Cattura
            </CardTitle>
            <CardDescription>
              Verifica i dati prima dell'invio
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary */}
            <div className="space-y-4">
              {/* Photo */}
              <div className="rounded-lg overflow-hidden">
                <img
                  src={photo.thumbnailUrl || photo.url}
                  alt="Cattura"
                  className="w-full h-32 object-cover"
                />
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Torneo</p>
                  <p className="font-medium">{selectedTournament.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Peso</p>
                  <p className="font-medium">{weight} kg</p>
                </div>
                {length && (
                  <div>
                    <p className="text-muted-foreground">Lunghezza</p>
                    <p className="font-medium">{length} cm</p>
                  </div>
                )}
                {selectedSpecies && (
                  <div>
                    <p className="text-muted-foreground">Specie</p>
                    <p className="font-medium">
                      {species.find(s => s.id === selectedSpecies)?.commonNameIt || "-"}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Data/Ora</p>
                  <p className="font-medium">
                    {photo.timestamp.toLocaleString()}
                  </p>
                </div>
                {photo.latitude && photo.longitude && (
                  <div>
                    <p className="text-muted-foreground">Posizione GPS</p>
                    <p className="font-medium text-xs">
                      {photo.latitude.toFixed(4)}, {photo.longitude.toFixed(4)}
                    </p>
                  </div>
                )}
              </div>

              {notes && (
                <div>
                  <p className="text-muted-foreground text-sm">Note</p>
                  <p className="text-sm">{notes}</p>
                </div>
              )}
            </div>

            {/* Error message */}
            {submitError && (
              <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {submitError}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => goToStep("details")}
                disabled={isSubmitting}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Modifica
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Invio...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Invia Cattura
                  </>
                )}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              La cattura sara validata da un giudice prima di essere approvata
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
