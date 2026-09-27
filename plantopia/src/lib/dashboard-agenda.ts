// Agrupa plantas para la sección "Agenda de cuidados" del dashboard,
// reutilizando las funciones puras de plant-status.ts (no duplica lógica de fechas).
import {
  isCareOverdue,
  isWateringOverdue,
  isFertilizingOverdue,
  isWateringDueSoon,
  isFertilizingDueSoon,
} from './plant-status';

interface CareInfo {
  watering_frequency_days: number | null;
  last_watered: string | null;
  fertilizing_frequency_days: number | null;
  last_fertilized: string | null;
}

export type AgendaGroupKey = 'overdue' | 'today' | 'this_week';

// Ventana de la vista de agenda (distinta del umbral de 2 días que usa el resto
// de la app para "vencen pronto" — ver spec 2026-09-27, sección "Fuera de alcance").
export const AGENDA_WEEK_WINDOW_DAYS = 7;

export function groupPlantsByAgenda<T extends CareInfo>(
  plants: T[],
  today: Date = new Date()
): Record<AgendaGroupKey, T[]> {
  const overdue: T[] = [];
  const dueToday: T[] = [];
  const thisWeek: T[] = [];

  for (const plant of plants) {
    if (isCareOverdue(plant, today)) {
      overdue.push(plant);
    } else if (isWateringDueSoon(plant, 0, today) || isFertilizingDueSoon(plant, 0, today)) {
      dueToday.push(plant);
    } else if (
      isWateringDueSoon(plant, AGENDA_WEEK_WINDOW_DAYS, today) ||
      isFertilizingDueSoon(plant, AGENDA_WEEK_WINDOW_DAYS, today)
    ) {
      thisWeek.push(plant);
    }
  }

  return { overdue, today: dueToday, this_week: thisWeek };
}

export interface AgendaAction {
  eventType: 'watered' | 'fertilized';
  label: string;
}

// Un eje (riego o fertilización) se considera "accionable" desde la agenda si está
// atrasado O vence dentro de la ventana de la semana — independiente de a qué balde
// (overdue/today/this_week) pertenezca la planta por su otro eje.
export function agendaActions(plant: CareInfo, today: Date = new Date()): AgendaAction[] {
  const actions: AgendaAction[] = [];
  if (isWateringOverdue(plant, today) || isWateringDueSoon(plant, AGENDA_WEEK_WINDOW_DAYS, today)) {
    actions.push({ eventType: 'watered', label: '💧' });
  }
  if (isFertilizingOverdue(plant, today) || isFertilizingDueSoon(plant, AGENDA_WEEK_WINDOW_DAYS, today)) {
    actions.push({ eventType: 'fertilized', label: '🌿' });
  }
  return actions;
}
