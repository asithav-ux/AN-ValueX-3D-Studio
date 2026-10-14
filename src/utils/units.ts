import type { MeasurementUnit } from '../types/packaging';

/**
 * Packaging dimensions are stored in base centimeters (cm).
 * This utility converts between base cm and display unit (mm, cm, in).
 */

export function fromBaseCm(valCm: number, unit: MeasurementUnit): number {
  if (unit === 'mm') {
    return Math.round(valCm * 10 * 10) / 10; // 1 decimal place mm
  }
  if (unit === 'in') {
    return Math.round((valCm / 2.54) * 100) / 100; // 2 decimal places in
  }
  return Math.round(valCm * 10) / 10;
}

export function toBaseCm(valInUnit: number, unit: MeasurementUnit): number {
  if (unit === 'mm') {
    return valInUnit / 10;
  }
  if (unit === 'in') {
    return valInUnit * 2.54;
  }
  return valInUnit;
}

export function formatDimension(valCm: number, unit: MeasurementUnit): string {
  const converted = fromBaseCm(valCm, unit);
  return `${converted} ${unit}`;
}

export function getUnitStep(unit: MeasurementUnit): number {
  if (unit === 'mm') return 1;
  if (unit === 'in') return 0.1;
  return 0.1;
}

export function getUnitMinMax(unit: MeasurementUnit, minCm: number, maxCm: number): { min: number; max: number } {
  return {
    min: fromBaseCm(minCm, unit),
    max: fromBaseCm(maxCm, unit),
  };
}
