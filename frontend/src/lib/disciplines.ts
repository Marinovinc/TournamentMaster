/**
 * Discipline FIPSAS - Definizioni centralizzate
 *
 * Questo file contiene tutte le discipline riconosciute dal sistema,
 * organizzate per categoria (Mare, Acque Interne, Casting).
 */

// Labels per visualizzazione UI
export const disciplineLabels: Record<string, string> = {
  // ========== MARE (Pesca di Superficie) ==========
  SURF_CASTING: "Surf Casting",
  BIG_GAME: "Big Game",
  CANNA_NATANTE: "Pesca con Canna da Natante",
  CANNA_RIVA: "Pesca con Canna da Riva",
  BOLENTINO: "Bolentino",
  DRIFTING: "Drifting",
  TRAINA_COSTIERA: "Traina Costiera",
  EGING: "Eging",
  VERTICAL_JIGGING: "Vertical Jigging",
  SHORE: "Shore Fishing",
  KAYAK_FISHING_MARE: "Kayak Fishing Mare",

  // ========== ACQUE INTERNE ==========
  PESCA_COLPO: "Pesca al Colpo",
  FEEDER: "Feeder",
  FLY_FISHING: "Pesca a Mosca",
  TROTA_TORRENTE: "Trota Torrente",
  TROTA_LAGO: "Trota Lago",
  SPINNING_FRESHWATER: "Spinning Acque Interne",
  PREDATORI_BARCA: "Predatori da Barca",
  BASS_FISHING: "Bass Fishing",
  BELLY_BOAT: "Pesca da Belly Boat",
  CARPFISHING: "Carpfishing",
  STREET_FISHING: "Street Fishing",
  TROUT_AREA: "Trout Area",
  PESCA_FIUME: "Pesca in Fiume",
  BILANCELLA: "Pesca con Bilancella",
  STORIONE: "Pesca allo Storione",
  KAYAK_FISHING_INTERNO: "Kayak Fishing Acque Interne",

  // ========== CASTING (Discipline Tecniche) ==========
  LONG_CASTING: "Long Casting",
  FLY_CASTING: "Fly Casting",
  CASTING: "Casting",

  // ========== DEPRECATI (backward compatibility) ==========
  MATCH_FISHING: "Pesca al Colpo",
  PREDATORI: "Predatori",

  // ========== GENERALE ==========
  SOCIAL: "Sociale/Amatoriale",
  OTHER: "Altra Disciplina",
};

// Discipline raggruppate per categoria
export const disciplineCategories = {
  mare: {
    label: "Mare",
    disciplines: [
      "SURF_CASTING",
      "BIG_GAME",
      "CANNA_NATANTE",
      "CANNA_RIVA",
      "BOLENTINO",
      "DRIFTING",
      "TRAINA_COSTIERA",
      "EGING",
      "VERTICAL_JIGGING",
      "SHORE",
      "KAYAK_FISHING_MARE",
    ],
  },
  acqueInterne: {
    label: "Acque Interne",
    disciplines: [
      "PESCA_COLPO",
      "FEEDER",
      "FLY_FISHING",
      "TROTA_TORRENTE",
      "TROTA_LAGO",
      "SPINNING_FRESHWATER",
      "PREDATORI_BARCA",
      "BASS_FISHING",
      "BELLY_BOAT",
      "CARPFISHING",
      "STREET_FISHING",
      "TROUT_AREA",
      "PESCA_FIUME",
      "BILANCELLA",
      "STORIONE",
      "KAYAK_FISHING_INTERNO",
    ],
  },
  casting: {
    label: "Casting",
    disciplines: ["LONG_CASTING", "FLY_CASTING", "CASTING"],
  },
  generale: {
    label: "Generale",
    disciplines: ["SOCIAL", "OTHER"],
  },
};

// Helper per ottenere il label di una disciplina
export function getDisciplineLabel(discipline: string): string {
  return disciplineLabels[discipline] || discipline;
}

// Helper per ottenere la categoria di una disciplina
export function getDisciplineCategory(discipline: string): string | null {
  for (const [category, data] of Object.entries(disciplineCategories)) {
    if (data.disciplines.includes(discipline)) {
      return data.label;
    }
  }
  return null;
}

// Lista piatta di tutte le discipline (per dropdown)
export const allDisciplines = Object.keys(disciplineLabels).filter(
  (d) => !["MATCH_FISHING", "PREDATORI"].includes(d) // Escludi deprecati
);
