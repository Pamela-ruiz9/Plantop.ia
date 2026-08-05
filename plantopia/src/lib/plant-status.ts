// Determina si el riego o la fertilización de una planta están vencidos,
// según su frecuencia configurada y la fecha del último cuidado.

interface WateringInfo {
  watering_frequency_days: number | null;
  last_watered: string | null;
}

interface FertilizingInfo {
  fertilizing_frequency_days: number | null;
  last_fertilized: string | null;
}

function daysSince(dateStr: string, today: Date): number {
  const then = new Date(`${dateStr}T00:00:00`);
  const diffMs = today.getTime() - then.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function daysUntilDue(frequencyDays: number, lastDateStr: string, today: Date): number {
  return frequencyDays - daysSince(lastDateStr, today);
}

export function isWateringOverdue(plant: WateringInfo, today: Date = new Date()): boolean {
  if (plant.watering_frequency_days == null || !plant.last_watered) return false;
  return daysSince(plant.last_watered, today) > plant.watering_frequency_days;
}

export function isFertilizingOverdue(plant: FertilizingInfo, today: Date = new Date()): boolean {
  if (plant.fertilizing_frequency_days == null || !plant.last_fertilized) return false;
  return daysSince(plant.last_fertilized, today) > plant.fertilizing_frequency_days;
}

export function isWateringDueSoon(plant: WateringInfo, daysAhead = 2, today: Date = new Date()): boolean {
  if (plant.watering_frequency_days == null || !plant.last_watered) return false;
  const until = daysUntilDue(plant.watering_frequency_days, plant.last_watered, today);
  return until >= 0 && until <= daysAhead;
}

export function isFertilizingDueSoon(plant: FertilizingInfo, daysAhead = 2, today: Date = new Date()): boolean {
  if (plant.fertilizing_frequency_days == null || !plant.last_fertilized) return false;
  const until = daysUntilDue(plant.fertilizing_frequency_days, plant.last_fertilized, today);
  return until >= 0 && until <= daysAhead;
}

export function isCareOverdue(plant: WateringInfo & FertilizingInfo, today: Date = new Date()): boolean {
  return isWateringOverdue(plant, today) || isFertilizingOverdue(plant, today);
}

export function countCareOverdue(
  plants: Array<WateringInfo & FertilizingInfo>,
  today: Date = new Date()
): number {
  return plants.filter((plant) => isCareOverdue(plant, today)).length;
}
