// Etiquetas legibles para los enums del esquema.
import type {
  PlantLocation,
  HealthStatus,
  LightType,
  GrowthPhase,
  EventType,
} from '../types/database';
import type {
  HumidityLevel, CareDifficulty, FloweringSeason,
  AdultSize, PlantType, CatalogLocation,
} from '../types/catalog';

export const LOCATION_LABELS: Record<PlantLocation, string> = {
  indoor: 'Interior',
  outdoor: 'Exterior',
};

export const HEALTH_LABELS: Record<HealthStatus, string> = {
  healthy: 'Saludable',
  needs_attention: 'Necesita atención',
  sick: 'Enferma',
};

export const HEALTH_COLORS: Record<HealthStatus, string> = {
  healthy: 'bg-green-950 text-green-300 border-green-900',
  needs_attention: 'bg-amber-950 text-amber-300 border-amber-900',
  sick: 'bg-red-950 text-red-300 border-red-900',
};

export const LIGHT_LABELS: Record<LightType, string> = {
  direct: 'Luz directa',
  bright_indirect: 'Indirecta brillante',
  low_indirect: 'Indirecta baja',
  shade: 'Sombra',
};

export const PHASE_LABELS: Record<GrowthPhase, string> = {
  vegetative: 'Vegetativa',
  flowering: 'Floración',
  fruiting: 'Fructificación',
  dormancy: 'Dormancia',
  latent: 'Latente',
};

export const EVENT_LABELS: Record<EventType, string> = {
  watered: 'Riego',
  fertilized: 'Fertilización',
  repotted: 'Trasplante',
  pruned: 'Poda',
  pest_detected: 'Plaga detectada',
  pest_treated: 'Plaga tratada',
  phase_change: 'Cambio de fase',
  photo_added: 'Foto agregada',
  note: 'Nota',
};

export const EVENT_ICONS: Record<EventType, string> = {
  watered: '💧',
  fertilized: '🌿',
  repotted: '🪴',
  pruned: '✂️',
  pest_detected: '🐛',
  pest_treated: '🧴',
  phase_change: '🔄',
  photo_added: '📷',
  note: '📝',
};

export const PHASE_ICONS: Record<GrowthPhase, string> = {
  vegetative: '🌱',
  flowering: '🌸',
  fruiting: '🍓',
  dormancy: '😴',
  latent: '⏸️',
};

export const LOCATIONS: PlantLocation[] = ['indoor', 'outdoor'];
export const HEALTH_STATUSES: HealthStatus[] = ['healthy', 'needs_attention', 'sick'];
export const LIGHT_TYPES: LightType[] = ['direct', 'bright_indirect', 'low_indirect', 'shade'];
export const GROWTH_PHASES: GrowthPhase[] = [
  'vegetative',
  'flowering',
  'fruiting',
  'dormancy',
  'latent',
];
export const EVENT_TYPES: EventType[] = [
  'watered',
  'fertilized',
  'repotted',
  'pruned',
  'pest_detected',
  'pest_treated',
  'phase_change',
  'photo_added',
  'note',
];

export const HUMIDITY_LABELS: Record<HumidityLevel, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
};

export const CARE_DIFFICULTY_LABELS: Record<CareDifficulty, string> = {
  easy: 'Fácil',
  medium: 'Media',
  hard: 'Difícil',
};

export const FLOWERING_SEASON_LABELS: Record<FloweringSeason, string> = {
  spring: 'Primavera',
  summer: 'Verano',
  fall: 'Otoño',
  winter: 'Invierno',
  year_round: 'Todo el año',
  none: 'No florece',
};

export const ADULT_SIZE_LABELS: Record<AdultSize, string> = {
  compact: 'Compacta',
  medium: 'Mediana',
  large: 'Grande',
  xlarge: 'Muy grande',
};

export const PLANT_TYPE_LABELS: Record<PlantType, string> = {
  suculenta: 'Suculenta',
  tropical: 'Tropical',
  cactus: 'Cactus',
  helecho: 'Helecho',
  trepadora: 'Trepadora',
  árbol: 'Árbol',
  otra: 'Otra',
};

export const CATALOG_LOCATION_LABELS: Record<CatalogLocation, string> = {
  indoor: 'Interior',
  outdoor: 'Exterior',
  both: 'Interior y exterior',
};

export const HUMIDITY_LEVELS: HumidityLevel[] = ['low', 'medium', 'high'];
export const CARE_DIFFICULTIES: CareDifficulty[] = ['easy', 'medium', 'hard'];
export const FLOWERING_SEASONS: FloweringSeason[] = ['spring', 'summer', 'fall', 'winter', 'year_round', 'none'];
export const ADULT_SIZES: AdultSize[] = ['compact', 'medium', 'large', 'xlarge'];
export const PLANT_TYPES: PlantType[] = ['suculenta', 'tropical', 'cactus', 'helecho', 'trepadora', 'árbol', 'otra'];
export const CATALOG_LOCATIONS: CatalogLocation[] = ['indoor', 'outdoor', 'both'];
