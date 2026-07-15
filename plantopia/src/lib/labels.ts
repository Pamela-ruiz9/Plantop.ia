// Etiquetas legibles para los enums del esquema.
import type {
  PlantLocation,
  HealthStatus,
  LightType,
  GrowthPhase,
  EventType,
} from '../types/database';

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
