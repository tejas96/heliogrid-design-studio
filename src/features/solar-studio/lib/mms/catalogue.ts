import type { RoofType } from '../../types';
import type { MmsConfig, MountStrategy, StructuralMaterial } from './types';

export const MATERIALS: Record<StructuralMaterial, { label: string; density: number; color: string; roughness: number; metalness: number }> = {
  galvanized_steel: { label: 'Galvanized steel', density: 7850, color: '#aeb4b7', roughness: .48, metalness: .78 },
  aluminium: { label: 'Aluminium', density: 2700, color: '#c4c9ca', roughness: .35, metalness: .85 },
  stainless_steel: { label: 'Stainless steel', density: 8000, color: '#b7bdc1', roughness: .3, metalness: .88 },
  painted_steel: { label: 'Painted steel', density: 7850, color: '#596566', roughness: .62, metalness: .3 },
};
interface MountPreset { id: MountStrategy; label: string; roofs: RoofType[]; flush?: boolean; heightM?: number; tilt?: number }
const RCC: RoofType[] = ['rcc_flat'];
const METAL: RoofType[] = ['metal_shed'];
export const MOUNT_CATALOGUE: MountPreset[] = [
  { id: 'rcc_fixed', label: 'RCC · Standard fixed tilt', roofs: RCC, heightM: .45, tilt: 10 },
  { id: 'rcc_ballast', label: 'RCC · Ballasted', roofs: RCC, heightM: .45 },
  { id: 'rcc_anchor', label: 'RCC · Anchored / penetrative', roofs: RCC, heightM: .45 },
  { id: 'low_height', label: 'RCC · Low height', roofs: RCC, heightM: .3, tilt: 5 },
  { id: 'elevated', label: 'Elevated · Usable space', roofs: RCC, heightM: 1.8288 },
  { id: 'high_height', label: 'High height · Parking / utility', roofs: RCC, heightM: 2.4384 },
  { id: 'east_west', label: 'East–West · Low tilt', roofs: RCC, heightM: .45, tilt: 10 },
  { id: 'south_facing', label: 'South-facing', roofs: RCC, heightM: .45, tilt: 15 },
  { id: 'adjustable', label: 'Adjustable tilt', roofs: RCC, heightM: .6 },
  { id: 'obstacle_clearance', label: 'Custom obstacle clearance', roofs: RCC, heightM: 2.4384 },
  ...(['trapezoidal', 'corrugated', 'standing_seam', 'clamp_mounted', 'rail_mounted', 'purlin_mounted', 'rafter_mounted', 'direct_sheet'] as const).map(id => ({ id, label: id.replaceAll('_', ' '), roofs: METAL, flush: true })),
  { id: 'industrial_custom', label: 'Custom industrial structure', roofs: METAL, heightM: .6 },
  { id: 'roof_hook', label: 'Rail + roof hook', roofs: ['tile'], flush: true },
  { id: 'adjustable_hook', label: 'Adjustable roof hook', roofs: ['tile'], flush: true },
  { id: 'flush', label: 'Flush-mounted rails', roofs: ['rcc_flat', 'metal_shed', 'tile'], flush: true },
  { id: 'custom', label: 'Custom structure', roofs: ['rcc_flat', 'metal_shed', 'tile'] },
];
/** Nominal catalogue sizes, explicitly assumed until replaced by project data. */
export function defaultMms(roof: RoofType): MmsConfig {
  return {
    version: 1, strategy: roof === 'metal_shed' ? 'purlin_mounted' : roof === 'tile' ? 'roof_hook' : 'rcc_fixed',
    material: 'galvanized_steel', railInsetRatio: .18, attachmentSpacingM: 1.2, railStockLengthM: 6,
    edgeClearanceM: .1, obstacleClearanceM: .05,
    ballast: { type: 'precast_concrete', lengthM: .6, widthM: .4, heightM: .15, massKg: 86.4, blocksPerSupport: 1 },
    anchor: { type: 'chemical', count: 4, diameterMm: 12, spacingMm: 120, plateSizeMm: 200, plateThicknessMm: 10 },
  };
}