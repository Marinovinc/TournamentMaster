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

import { useState, useEffect } from "react";
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
import api from "@/lib/api";

// Default scoring presets per specie comune
const DEFAULT_SCORING_PRESETS: Record<string, { small: number; medium: number; large: number; extraLarge: number }> = {
  "Tonno Rosso": { small: 500, medium: 750, large: 1000, extraLarge: 1500 },
  "Ricciola": { small: 200, medium: 350, large: 500, extraLarge: 750 },
  "Dentice": { small: 150, medium: 250, large: 400, extraLarge: 600 },
  "Lampuga": { small: 100, medium: 175, large: 250, extraLarge: 400 },
  "Spigola": { small: 125, medium: 200, large: 350, extraLarge: 500 },
  "Orata": { small: 100, medium: 175, large: 275, extraLarge: 400 },
  "default": { small: 100, medium: 200, large: 400, extraLarge: 800 },
};

// Threshold presets per taglia (in cm)
const SIZE_THRESHOLDS: Record<string, { small: number; medium: number; large: number }> = {
  "Tonno Rosso": { small: 80, medium: 120, large: 180 },
  "Ricciola": { small: 50, medium: 80, large: 120 },
  "Dentice": { small: 30, medium: 50, large: 70 },
  "Lampuga": { small: 40, medium: 60, large: 90 },
  "Spigola": { small: 35, medium: 55, large: 75 },
  "Orata": { small: 25, medium: 40, large: 55 },
  "default": { small: 30, medium: 50, large: 80 },
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
}

interface Props {
  tournamentId?: string;
  initialScoring?: SpeciesScoring[];
  onChange?: (scoring: SpeciesScoring[]) => void;
  readOnly?: boolean;
}

export function SpeciesScoringConfig({ tournamentId, initialScoring, onChange, readOnly = false }: Props) {
  const [species, setSpecies] = useState<Species[]>([]);
  const [scoring, setScoring] = useState<SpeciesScoring[]>(initialScoring || []);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSpeciesId, setSelectedSpeciesId] = useState<string>("");
  const [newScoring, setNewScoring] = useState<SpeciesScoring>({
    speciesId: "",
    pointsSmall: 100,
    pointsMedium: 200,
    pointsLarge: 400,
    pointsExtraLarge: 800,
    catchReleaseBonus: 1.5,
  });

  // Fetch available species
  useEffect(() => {
    const fetchSpecies = async () => {
      try {
        const res = await api<{ species: Species[] }>("/api/species");
        if (res.success && res.data?.species) {
          setSpecies(res.data.species);
        } else {
          // Demo species for development
          setSpecies([
            { id: "1", commonNameIt: "Tonno Rosso", commonNameEn: "Bluefin Tuna", scientificName: "Thunnus thynnus" },
            { id: "2", commonNameIt: "Ricciola", commonNameEn: "Greater Amberjack", scientificName: "Seriola dumerili" },
            { id: "3", commonNameIt: "Dentice", commonNameEn: "Common Dentex", scientificName: "Dentex dentex" },
            { id: "4", commonNameIt: "Orata", commonNameEn: "Gilt-head Bream", scientificName: "Sparus aurata" },
            { id: "5", commonNameIt: "Spigola", commonNameEn: "European Sea Bass", scientificName: "Dicentrarchus labrax" },
            { id: "6", commonNameIt: "Lampuga", commonNameEn: "Mahi-mahi", scientificName: "Coryphaena hippurus" },
          ]);
        }
      } catch {
        console.error("Error fetching species");
      }
    };
    fetchSpecies();
  }, []);

  // Auto-fill presets when species is selected
  const handleSpeciesSelect = (speciesId: string) => {
    setSelectedSpeciesId(speciesId);
    const selectedSpecies = species.find(s => s.id === speciesId);
    if (selectedSpecies) {
      const speciesName = selectedSpecies.commonNameIt;
      const preset = DEFAULT_SCORING_PRESETS[speciesName] || DEFAULT_SCORING_PRESETS["default"];
      const thresholds = SIZE_THRESHOLDS[speciesName] || SIZE_THRESHOLDS["default"];

      setNewScoring({
        speciesId,
        speciesName,
        pointsSmall: preset.small,
        pointsMedium: preset.medium,
        pointsLarge: preset.large,
        pointsExtraLarge: preset.extraLarge,
        thresholdSmallCm: thresholds.small,
        thresholdMediumCm: thresholds.medium,
        thresholdLargeCm: thresholds.large,
        catchReleaseBonus: 1.5,
      });
    }
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
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" disabled={availableSpecies.length === 0}>
                  <Plus className="h-4 w-4 mr-1" />
                  Aggiungi Specie
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
                        {s.speciesName || speciesInfo?.commonNameIt || "Specie"}
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
