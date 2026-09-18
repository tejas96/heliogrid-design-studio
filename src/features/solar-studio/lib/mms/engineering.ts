import type { Project } from '../../types';
import type { SegmentStructure } from '../structure';
import { foundationDeadLoadKg } from '../foundation';
import { polygonArea } from '../geo';
import type { EngineeringCheck } from './types';

/** Mass takeoff is derived. Capacities/reactions are NOT inferred from member appearance. */
export function mmsEngineering(project: Project, structures: SegmentStructure[]) {
  const rows = project.roofs.map(roof => {
    const ids = new Set(project.segments.filter(s => s.roofId === roof.id).map(s => s.id));
    const mine = structures.filter(s => ids.has(s.segmentId));
    const memberKg = mine.reduce((v, s) => v + s.steelKg, 0);
    const foundationKg = mine.reduce((v, s) => v + s.nodes.filter(n => n.kind === 'roof_anchor').length * foundationDeadLoadKg(s.foundation, s.foundationShape, s.mms), 0);
    const moduleCount = project.panels.filter(p => p.roofId === roof.id && p.enabled).length;
    const moduleKg = project.components.panel?.weightKg != null ? moduleCount * project.components.panel.weightKg : null;
    const areaM2 = Math.abs(polygonArea(roof.polygon));
    const knownMassKg = memberKg + foundationKg + (moduleKg ?? 0);
    return { roofId: roof.id, name: roof.name, areaM2, memberKg, foundationKg, moduleKg, knownMassKg, averageLoadKpa: areaM2 > 0 ? knownMassKg * 9.80665 / 1000 / areaM2 : null, supportCount: mine.reduce((v, s) => v + s.nodes.filter(n => n.kind === 'roof_anchor' || n.kind === 'sheet_standoff').length, 0) };
  });
  const w = project.mmsEngineering;
  const factors = [w?.basicWindSpeedMs, w?.riskFactorK1, w?.terrainHeightFactorK2, w?.topographyFactorK3, w?.importanceFactorK4];
  const windSpeedMs = factors.every(v => v != null && Number.isFinite(v) && v > 0) ? factors.reduce<number>((p, v) => p * v!, 1) : null;
  const referencePressureKpa = windSpeedMs == null ? null : .6 * windSpeedMs ** 2 / 1000;
  const checks: EngineeringCheck[] = [
    ...['Beam bending', 'Rafter bending', 'Column compression', 'Deflection', 'Buckling', 'Connection capacity'].map(label => ({ key: label.toLowerCase().replaceAll(' ', '_'), label, status: 'not_calculated' as const, standard: 'IS 800', reason: 'Load combinations, certified material properties, restraint and connection design required.' })),
    ...['Wind uplift', 'Anchor capacity', 'Sliding', 'Overturning', 'Ballast resistance'].map(label => ({ key: label.toLowerCase().replaceAll(' ', '_'), label, status: 'not_calculated' as const, standard: 'IS 875 Part 3 / connection design', reason: 'Site-specific net pressure zones, tributary areas and certified capacities required.' })),
    { key: 'roof', label: 'Roof capacity / point reactions', status: 'not_calculated', standard: 'IS 456 / existing structure assessment', reason: 'Slab reinforcement, load paths and support reactions are not established by the average roof load.' },
    { key: 'seismic', label: 'Seismic / snow / live loads', status: 'not_calculated', standard: 'Applicable IS 1893 / IS 875 provisions', reason: 'Site inputs and engineer-selected load combinations required.' },
  ];
  return { roofs: rows, windSpeedMs, referencePressureKpa, checks, disclaimer: 'PRELIMINARY — not a structural certification. Mass excludes unweighed connection hardware; average load is not a slab-capacity or reaction check.' };
}