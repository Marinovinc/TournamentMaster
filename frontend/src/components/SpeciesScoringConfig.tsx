/**
 * =============================================================================
 * SPECIES SCORING CONFIGURATION COMPONENT
 * =============================================================================
 * Componente per configurare i punteggi per specie/taglia in tornei Catch & Release
 *
 * Uso:
 * <SpeciesScoringConfig
 *   tournamentId="xxx"
 *   onChange={(scoring) => handleScoringChange(scoring)}
 * />
 * =============================================================================
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Fish, Plus, Trash2, Save, Settings } from "lucide-react";

/**
 * Specie per disciplina FIPSAS
 * Ogni disciplina ha le sue specie target specifiche
 * Fonti: fipsas.it, obiettivopesca.org, pescare.net
 */
const SPECIES_BY_DISCIPLINE: Record<string, Array<{
  id: string;
  name: string;
  scientificName: string;
  points: { small: number; medium: number; large: number; extraLarge: number };
  thresholds: { small: number; medium: number; large: number }; // cm
}>> = {
  // BIG GAME - Grandi pelagici mediterraneo
  BIG_GAME: [
    { id: "tonno_rosso", name: "Tonno Rosso", scientificName: "Thunnus thynnus",
      points: { small: 500, medium: 1000, large: 2000, extraLarge: 4000 },
      thresholds: { small: 100, medium: 150, large: 200 } },
    { id: "pesce_spada", name: "Pesce Spada", scientificName: "Xiphias gladius",
      points: { small: 400, medium: 800, large: 1500, extraLarge: 3000 },
      thresholds: { small: 120, medium: 180, large: 250 } },
    { id: "aguglia_imperiale", name: "Aguglia Imperiale", scientificName: "Tetrapturus belone",
      points: { small: 600, medium: 1200, large: 2500, extraLarge: 5000 },
      thresholds: { small: 140, medium: 180, large: 220 } },
    { id: "alalunga", name: "Alalunga", scientificName: "Thunnus alalunga",
      points: { small: 300, medium: 600, large: 1000, extraLarge: 1800 },
      thresholds: { small: 60, medium: 80, large: 100 } },
    { id: "lampuga_bg", name: "Lampuga", scientificName: "Coryphaena hippurus",
      points: { small: 150, medium: 300, large: 500, extraLarge: 800 },
      thresholds: { small: 50, medium: 80, large: 110 } },
  ],
  // DRIFTING - Simile a Big Game
  DRIFTING: [
    { id: "tonno_rosso_dr", name: "Tonno Rosso", scientificName: "Thunnus thynnus",
      points: { small: 500, medium: 1000, large: 2000, extraLarge: 4000 },
      thresholds: { small: 100, medium: 150, large: 200 } },
    { id: "alalunga_dr", name: "Alalunga", scientificName: "Thunnus alalunga",
      points: { small: 300, medium: 600, large: 1000, extraLarge: 1800 },
      thresholds: { small: 60, medium: 80, large: 100 } },
    { id: "pesce_spada_dr", name: "Pesce Spada", scientificName: "Xiphias gladius",
      points: { small: 400, medium: 800, large: 1500, extraLarge: 3000 },
      thresholds: { small: 120, medium: 180, large: 250 } },
  ],
  // TRAINA COSTIERA - Pelagici costieri
  TRAINA_COSTIERA: [
    { id: "ricciola", name: "Ricciola", scientificName: "Seriola dumerili",
      points: { small: 200, medium: 400, large: 800, extraLarge: 1500 },
      thresholds: { small: 50, medium: 80, large: 110 } },
    { id: "dentice_tc", name: "Dentice", scientificName: "Dentex dentex",
      points: { small: 150, medium: 300, large: 600, extraLarge: 1000 },
      thresholds: { small: 30, medium: 45, large: 60 } },
    { id: "leccia", name: "Leccia", scientificName: "Lichia amia",
      points: { small: 180, medium: 350, large: 700, extraLarge: 1200 },
      thresholds: { small: 50, medium: 75, large: 100 } },
    { id: "lampuga_tc", name: "Lampuga", scientificName: "Coryphaena hippurus",
      points: { small: 100, medium: 200, large: 400, extraLarge: 700 },
      thresholds: { small: 40, medium: 60, large: 85 } },
    { id: "serra", name: "Serra", scientificName: "Pomatomus saltatrix",
      points: { small: 80, medium: 160, large: 300, extraLarge: 500 },
      thresholds: { small: 35, medium: 50, large: 70 } },
    { id: "palamita", name: "Palamita", scientificName: "Sarda sarda",
      points: { small: 80, medium: 150, large: 280, extraLarge: 450 },
      thresholds: { small: 35, medium: 50, large: 65 } },
  ],
  // BOLENTINO - Pesci di fondo
  BOLENTINO: [
    { id: "cernia", name: "Cernia Bruna", scientificName: "Epinephelus marginatus",
      points: { small: 300, medium: 600, large: 1200, extraLarge: 2000 },
      thresholds: { small: 45, medium: 65, large: 90 } },
    { id: "dentice_bo", name: "Dentice", scientificName: "Dentex dentex",
      points: { small: 150, medium: 300, large: 550, extraLarge: 900 },
      thresholds: { small: 30, medium: 45, large: 60 } },
    { id: "pagello", name: "Pagello Fragolino", scientificName: "Pagellus erythrinus",
      points: { small: 50, medium: 100, large: 180, extraLarge: 300 },
      thresholds: { small: 18, medium: 25, large: 35 } },
    { id: "sarago_maggiore", name: "Sarago Maggiore", scientificName: "Diplodus sargus",
      points: { small: 80, medium: 150, large: 280, extraLarge: 450 },
      thresholds: { small: 23, medium: 32, large: 42 } },
    { id: "tanuta", name: "Tanuta", scientificName: "Spondyliosoma cantharus",
      points: { small: 60, medium: 120, large: 220, extraLarge: 350 },
      thresholds: { small: 20, medium: 28, large: 38 } },
    { id: "orata_bo", name: "Orata", scientificName: "Sparus aurata",
      points: { small: 100, medium: 200, large: 380, extraLarge: 600 },
      thresholds: { small: 25, medium: 38, large: 50 } },
  ],
  // SURF CASTING - Pesci costieri
  SURF_CASTING: [
    { id: "spigola", name: "Spigola", scientificName: "Dicentrarchus labrax",
      points: { small: 150, medium: 300, large: 550, extraLarge: 900 },
      thresholds: { small: 36, medium: 50, large: 70 } },
    { id: "orata_sc", name: "Orata", scientificName: "Sparus aurata",
      points: { small: 100, medium: 200, large: 380, extraLarge: 600 },
      thresholds: { small: 25, medium: 38, large: 50 } },
    { id: "sarago_sc", name: "Sarago", scientificName: "Diplodus sargus",
      points: { small: 70, medium: 140, large: 260, extraLarge: 420 },
      thresholds: { small: 23, medium: 32, large: 42 } },
    { id: "mormora", name: "Mormora", scientificName: "Lithognathus mormyrus",
      points: { small: 50, medium: 100, large: 180, extraLarge: 280 },
      thresholds: { small: 20, medium: 28, large: 38 } },
    { id: "ombrina", name: "Ombrina", scientificName: "Umbrina cirrosa",
      points: { small: 120, medium: 240, large: 450, extraLarge: 750 },
      thresholds: { small: 30, medium: 45, large: 65 } },
  ],
  // SPINNING - Predatori costieri
  SHORE: [
    { id: "spigola_sp", name: "Spigola", scientificName: "Dicentrarchus labrax",
      points: { small: 150, medium: 300, large: 550, extraLarge: 900 },
      thresholds: { small: 36, medium: 50, large: 70 } },
    { id: "serra_sp", name: "Serra", scientificName: "Pomatomus saltatrix",
      points: { small: 80, medium: 160, large: 300, extraLarge: 500 },
      thresholds: { small: 35, medium: 50, large: 70 } },
    { id: "barracuda", name: "Barracuda", scientificName: "Sphyraena sphyraena",
      points: { small: 100, medium: 200, large: 380, extraLarge: 600 },
      thresholds: { small: 40, medium: 55, large: 75 } },
    { id: "leccia_sp", name: "Leccia Stella", scientificName: "Trachinotus ovatus",
      points: { small: 70, medium: 140, large: 260, extraLarge: 420 },
      thresholds: { small: 25, medium: 35, large: 50 } },
  ],
  // EGING - Cefalopodi
  EGING: [
    { id: "totano", name: "Totano", scientificName: "Todarodes sagittatus",
      points: { small: 100, medium: 200, large: 350, extraLarge: 550 },
      thresholds: { small: 20, medium: 30, large: 45 } },
    { id: "calamaro", name: "Calamaro", scientificName: "Loligo vulgaris",
      points: { small: 80, medium: 160, large: 280, extraLarge: 450 },
      thresholds: { small: 15, medium: 25, large: 35 } },
    { id: "seppia", name: "Seppia", scientificName: "Sepia officinalis",
      points: { small: 60, medium: 120, large: 220, extraLarge: 350 },
      thresholds: { small: 12, medium: 18, large: 28 } },
  ],
  // VERTICAL JIGGING
  VERTICAL_JIGGING: [
    { id: "ricciola_vj", name: "Ricciola", scientificName: "Seriola dumerili",
      points: { small: 200, medium: 400, large: 800, extraLarge: 1500 },
      thresholds: { small: 50, medium: 80, large: 110 } },
    { id: "dentice_vj", name: "Dentice", scientificName: "Dentex dentex",
      points: { small: 150, medium: 300, large: 600, extraLarge: 1000 },
      thresholds: { small: 30, medium: 45, large: 60 } },
    { id: "cernia_vj", name: "Cernia", scientificName: "Epinephelus marginatus",
      points: { small: 250, medium: 500, large: 1000, extraLarge: 1800 },
      thresholds: { small: 45, medium: 65, large: 90 } },
    { id: "leccia_vj", name: "Leccia", scientificName: "Lichia amia",
      points: { small: 180, medium: 350, large: 700, extraLarge: 1200 },
      thresholds: { small: 50, medium: 75, large: 100 } },
  ],
  // DEFAULT per discipline non specificate
  default: [
    { id: "generic_1", name: "Specie 1", scientificName: "",
      points: { small: 100, medium: 200, large: 400, extraLarge: 800 },
      thresholds: { small: 30, medium: 50, large: 80 } },
  ],
};

interface Species {
  id: string;
  commonNameIt: string;
  commonNameEn: string;
  scientificName?: string;
}

interface SpeciesScoring {
  speciesId: string;
  speciesName?: string;
  pointsSmall: number;
  pointsMedium: number;
  pointsLarge: number;
  pointsExtraLarge: number;
  thresholdSmallCm?: number;
  thresholdMediumCm?: number;
  thresholdLargeCm?: number;
  catchReleaseBonus: number;
  isCustom?: boolean; // true se specie custom aggiunta dall'utente
}

interface Props {
  tournamentId?: string;
  discipline?: string; // Disciplina del torneo (BIG_GAME, BOLENTINO, etc.)
  initialScoring?: SpeciesScoring[];
  onChange?: (scoring: SpeciesScoring[]) => void;
  readOnly?: boolean;
}

export function SpeciesScoringConfig({ tournamentId, discipline = "default", initialScoring, onChange, readOnly = false }: Props) {
  const [scoring, setScoring] = useState<SpeciesScoring[]>(initialScoring || []);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [customDialogOpen, setCustomDialogOpen] = useState(false);
  const [selectedSpeciesId, setSelectedSpeciesId] = useState<string>("");
  const [customSpeciesName, setCustomSpeciesName] = useState("");
  const [customScientificName, setCustomScientificName] = useState("");
  const [newScoring, setNewScoring] = useState<SpeciesScoring>({
    speciesId: "",
    pointsSmall: 100,
    pointsMedium: 200,
    pointsLarge: 400,
    pointsExtraLarge: 800,
    catchReleaseBonus: 1.5,
  });

  // Get species from discipline-specific list
  const disciplineSpecies = SPECIES_BY_DISCIPLINE[discipline] || SPECIES_BY_DISCIPLINE["default"];

  // Convert discipline species to Species format for compatibility
  const species: Species[] = disciplineSpecies.map(s => ({
    id: s.id,
    commonNameIt: s.name,
    commonNameEn: s.name, // Could be expanded with EN names
    scientificName: s.scientificName,
  }));

  // Auto-fill presets when species is selected
  const handleSpeciesSelect = (speciesId: string) => {
    setSelectedSpeciesId(speciesId);
    // Find species data from discipline list
    const speciesData = disciplineSpecies.find(s => s.id === speciesId);
    if (speciesData) {
      setNewScoring({
        speciesId,
        speciesName: speciesData.name,
        pointsSmall: speciesData.points.small,
        pointsMedium: speciesData.points.medium,
        pointsLarge: speciesData.points.large,
        pointsExtraLarge: speciesData.points.extraLarge,
        thresholdSmallCm: speciesData.thresholds.small,
        thresholdMediumCm: speciesData.thresholds.medium,
        thresholdLargeCm: speciesData.thresholds.large,
        catchReleaseBonus: 1.5,
        isCustom: false,
      });
    }
  };

  // Add custom species (not in predefined list)
  const handleAddCustomSpecies = () => {
    if (!customSpeciesName.trim()) return;

    const customId = `custom_${Date.now()}`;
    const customScoring: SpeciesScoring = {
      speciesId: customId,
      speciesName: customSpeciesName.trim(),
      pointsSmall: newScoring.pointsSmall,
      pointsMedium: newScoring.pointsMedium,
      pointsLarge: newScoring.pointsLarge,
      pointsExtraLarge: newScoring.pointsExtraLarge,
      thresholdSmallCm: newScoring.thresholdSmallCm,
      thresholdMediumCm: newScoring.thresholdMediumCm,
      thresholdLargeCm: newScoring.thresholdLargeCm,
      catchReleaseBonus: newScoring.catchReleaseBonus,
      isCustom: true,
    };

    const updatedScoring = [...scoring, customScoring];
    setScoring(updatedScoring);
    onChange?.(updatedScoring);
    setCustomDialogOpen(false);

    // Reset form
    setCustomSpeciesName("");
    setCustomScientificName("");
    setNewScoring({
      speciesId: "",
      pointsSmall: 100,
      pointsMedium: 200,
      pointsLarge: 400,
      pointsExtraLarge: 800,
      catchReleaseBonus: 1.5,
    });
  };

  // Add new species scoring
  const handleAddScoring = () => {
    if (!newScoring.speciesId) return;

    // Check if species already added
    if (scoring.some(s => s.speciesId === newScoring.speciesId)) {
      alert("Questa specie e gia stata aggiunta");
      return;
    }

    const selectedSpecies = species.find(s => s.id === newScoring.speciesId);
    const updatedScoring = [
      ...scoring,
      {
        ...newScoring,
        speciesName: selectedSpecies?.commonNameIt,
      },
    ];

    setScoring(updatedScoring);
    onChange?.(updatedScoring);
    setDialogOpen(false);

    // Reset form
    setSelectedSpeciesId("");
    setNewScoring({
      speciesId: "",
      pointsSmall: 100,
      pointsMedium: 200,
      pointsLarge: 400,
      pointsExtraLarge: 800,
      catchReleaseBonus: 1.5,
    });
  };

  // Remove species scoring
  const handleRemoveScoring = (speciesId: string) => {
    const updatedScoring = scoring.filter(s => s.speciesId !== speciesId);
    setScoring(updatedScoring);
    onChange?.(updatedScoring);
  };

  // Update existing scoring
  const handleUpdateScoring = (speciesId: string, field: keyof SpeciesScoring, value: number) => {
    const updatedScoring = scoring.map(s => {
      if (s.speciesId === speciesId) {
        return { ...s, [field]: value };
      }
      return s;
    });
    setScoring(updatedScoring);
    onChange?.(updatedScoring);
  };

  // Get available species (not yet added)
  const availableSpecies = species.filter(s => !scoring.some(sc => sc.speciesId === s.id));

  return (
    <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-green-600" />
            <CardTitle className="text-lg">Configurazione Punteggi C&R</CardTitle>
          </div>
          {!readOnly && (
            <div className="flex gap-2">
              {/* Dialog for predefined species */}
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" disabled={availableSpecies.length === 0}>
                    <Plus className="h-4 w-4 mr-1" />
                    Specie Lista
                  </Button>
                </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Aggiungi Punteggio Specie</DialogTitle>
                  <DialogDescription>
                    Configura i punti per ogni fascia taglia di questa specie
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Specie</Label>
                    <Select value={selectedSpeciesId} onValueChange={handleSpeciesSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona specie..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSpecies.map(s => (
                          <SelectItem key={s.id} value={s.id}>
                            <div className="flex items-center gap-2">
                              <Fish className="h-4 w-4" />
                              {s.commonNameIt}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedSpeciesId && (
                    <>
                      <div className="grid grid-cols-4 gap-2">
                        <div className="grid gap-1">
                          <Label className="text-xs text-center">S</Label>
                          <Input
                            type="number"
                            value={newScoring.pointsSmall}
                            onChange={(e) => setNewScoring({ ...newScoring, pointsSmall: parseInt(e.target.value) || 0 })}
                            className="text-center"
                          />
                        </div>
                        <div className="grid gap-1">
                          <Label className="text-xs text-center">M</Label>
                          <Input
                            type="number"
                            value={newScoring.pointsMedium}
                            onChange={(e) => setNewScoring({ ...newScoring, pointsMedium: parseInt(e.target.value) || 0 })}
                            className="text-center"
                          />
                        </div>
                        <div className="grid gap-1">
                          <Label className="text-xs text-center">L</Label>
                          <Input
                            type="number"
                            value={newScoring.pointsLarge}
                            onChange={(e) => setNewScoring({ ...newScoring, pointsLarge: parseInt(e.target.value) || 0 })}
                            className="text-center"
                          />
                        </div>
                        <div className="grid gap-1">
                          <Label className="text-xs text-center">XL</Label>
                          <Input
                            type="number"
                            value={newScoring.pointsExtraLarge}
                            onChange={(e) => setNewScoring({ ...newScoring, pointsExtraLarge: parseInt(e.target.value) || 0 })}
                            className="text-center"
                          />
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <Label className="text-xs">Soglie Taglia (cm) - opzionale</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label className="text-xs text-muted-foreground">S &lt;</Label>
                            <Input
                              type="number"
                              value={newScoring.thresholdSmallCm || ""}
                              onChange={(e) => setNewScoring({ ...newScoring, thresholdSmallCm: parseInt(e.target.value) || undefined })}
                              placeholder="cm"
                              className="text-center"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">M &lt;</Label>
                            <Input
                              type="number"
                              value={newScoring.thresholdMediumCm || ""}
                              onChange={(e) => setNewScoring({ ...newScoring, thresholdMediumCm: parseInt(e.target.value) || undefined })}
                              placeholder="cm"
                              className="text-center"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">L &lt;</Label>
                            <Input
                              type="number"
                              value={newScoring.thresholdLargeCm || ""}
                              onChange={(e) => setNewScoring({ ...newScoring, thresholdLargeCm: parseInt(e.target.value) || undefined })}
                              placeholder="cm"
                              className="text-center"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <Label className="text-xs">Bonus Rilascio (moltiplicatore)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          min="1"
                          value={newScoring.catchReleaseBonus}
                          onChange={(e) => setNewScoring({ ...newScoring, catchReleaseBonus: parseFloat(e.target.value) || 1 })}
                        />
                        <p className="text-xs text-muted-foreground">
                          Es. 1.5 = +50% punti se rilasciato correttamente
                        </p>
                      </div>
                    </>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Annulla
                  </Button>
                  <Button onClick={handleAddScoring} disabled={!selectedSpeciesId}>
                    <Save className="h-4 w-4 mr-1" />
                    Aggiungi
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Dialog for custom species */}
            <Dialog open={customDialogOpen} onOpenChange={setCustomDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Specie Custom
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Aggiungi Specie Personalizzata</DialogTitle>
                  <DialogDescription>
                    Aggiungi una specie non presente nella lista predefinita
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Nome Specie *</Label>
                    <Input
                      value={customSpeciesName}
                      onChange={(e) => setCustomSpeciesName(e.target.value)}
                      placeholder="Es. Pesce Balestra"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Nome Scientifico (opzionale)</Label>
                    <Input
                      value={customScientificName}
                      onChange={(e) => setCustomScientificName(e.target.value)}
                      placeholder="Es. Balistes capriscus"
                      className="italic"
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <div className="grid gap-1">
                      <Label className="text-xs text-center">S</Label>
                      <Input
                        type="number"
                        value={newScoring.pointsSmall}
                        onChange={(e) => setNewScoring({ ...newScoring, pointsSmall: parseInt(e.target.value) || 0 })}
                        className="text-center"
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-xs text-center">M</Label>
                      <Input
                        type="number"
                        value={newScoring.pointsMedium}
                        onChange={(e) => setNewScoring({ ...newScoring, pointsMedium: parseInt(e.target.value) || 0 })}
                        className="text-center"
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-xs text-center">L</Label>
                      <Input
                        type="number"
                        value={newScoring.pointsLarge}
                        onChange={(e) => setNewScoring({ ...newScoring, pointsLarge: parseInt(e.target.value) || 0 })}
                        className="text-center"
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-xs text-center">XL</Label>
                      <Input
                        type="number"
                        value={newScoring.pointsExtraLarge}
                        onChange={(e) => setNewScoring({ ...newScoring, pointsExtraLarge: parseInt(e.target.value) || 0 })}
                        className="text-center"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label className="text-xs">Soglie Taglia (cm) - opzionale</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">S &lt;</Label>
                        <Input
                          type="number"
                          value={newScoring.thresholdSmallCm || ""}
                          onChange={(e) => setNewScoring({ ...newScoring, thresholdSmallCm: parseInt(e.target.value) || undefined })}
                          placeholder="cm"
                          className="text-center"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">M &lt;</Label>
                        <Input
                          type="number"
                          value={newScoring.thresholdMediumCm || ""}
                          onChange={(e) => setNewScoring({ ...newScoring, thresholdMediumCm: parseInt(e.target.value) || undefined })}
                          placeholder="cm"
                          className="text-center"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">L &lt;</Label>
                        <Input
                          type="number"
                          value={newScoring.thresholdLargeCm || ""}
                          onChange={(e) => setNewScoring({ ...newScoring, thresholdLargeCm: parseInt(e.target.value) || undefined })}
                          placeholder="cm"
                          className="text-center"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label className="text-xs">Bonus Rilascio (moltiplicatore)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="1"
                      value={newScoring.catchReleaseBonus}
                      onChange={(e) => setNewScoring({ ...newScoring, catchReleaseBonus: parseFloat(e.target.value) || 1 })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCustomDialogOpen(false)}>
                    Annulla
                  </Button>
                  <Button onClick={handleAddCustomSpecies} disabled={!customSpeciesName.trim()}>
                    <Save className="h-4 w-4 mr-1" />
                    Aggiungi
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            </div>
          )}
        </div>
        <CardDescription>
          Definisci i punti per ogni specie e fascia taglia (S/M/L/XL)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {scoring.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Fish className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nessuna specie configurata</p>
            <p className="text-xs">Aggiungi specie per definire i punteggi C&R</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Specie</TableHead>
                <TableHead className="text-center w-16">S</TableHead>
                <TableHead className="text-center w-16">M</TableHead>
                <TableHead className="text-center w-16">L</TableHead>
                <TableHead className="text-center w-16">XL</TableHead>
                <TableHead className="text-center w-20">Bonus</TableHead>
                {!readOnly && <TableHead className="w-10"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {scoring.map((s) => {
                const speciesInfo = species.find(sp => sp.id === s.speciesId);
                return (
                  <TableRow key={s.speciesId}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Fish className="h-4 w-4 text-muted-foreground" />
                        <span>{s.speciesName || speciesInfo?.commonNameIt || "Specie"}</span>
                        {s.isCustom && (
                          <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                            Custom
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {readOnly ? (
                        <Badge variant="outline">{s.pointsSmall}</Badge>
                      ) : (
                        <Input
                          type="number"
                          value={s.pointsSmall}
                          onChange={(e) => handleUpdateScoring(s.speciesId, "pointsSmall", parseInt(e.target.value) || 0)}
                          className="w-16 text-center h-8"
                        />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {readOnly ? (
                        <Badge variant="outline">{s.pointsMedium}</Badge>
                      ) : (
                        <Input
                          type="number"
                          value={s.pointsMedium}
                          onChange={(e) => handleUpdateScoring(s.speciesId, "pointsMedium", parseInt(e.target.value) || 0)}
                          className="w-16 text-center h-8"
                        />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {readOnly ? (
                        <Badge variant="outline">{s.pointsLarge}</Badge>
                      ) : (
                        <Input
                          type="number"
                          value={s.pointsLarge}
                          onChange={(e) => handleUpdateScoring(s.speciesId, "pointsLarge", parseInt(e.target.value) || 0)}
                          className="w-16 text-center h-8"
                        />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {readOnly ? (
                        <Badge variant="outline">{s.pointsExtraLarge}</Badge>
                      ) : (
                        <Input
                          type="number"
                          value={s.pointsExtraLarge}
                          onChange={(e) => handleUpdateScoring(s.speciesId, "pointsExtraLarge", parseInt(e.target.value) || 0)}
                          className="w-16 text-center h-8"
                        />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        x{s.catchReleaseBonus}
                      </Badge>
                    </TableCell>
                    {!readOnly && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveScoring(s.speciesId)}
                          className="h-8 w-8 text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {scoring.length > 0 && (
          <p className="text-xs text-muted-foreground mt-3">
            Punti base moltiplicati per il bonus quando il pesce viene rilasciato correttamente (video obbligatorio)
          </p>
        )}
      </CardContent>
    </Card>
  );
}
