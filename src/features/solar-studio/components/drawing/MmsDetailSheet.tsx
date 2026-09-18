import { Sheet, TitleBlock, SHEET_SIZES } from './index';
import type { Project, XY } from '../../types';
import type { SegmentStructure, XYZ } from '../../lib/structure';
import { foundationFootprints } from '../../lib/mms/parts';
import { foundationAssembly } from '../../lib/foundation';
import { nodeHardware } from '../../lib/hardware';
import { fitToBox } from '../../lib/drawing-project';
import { panelCornersOnRoof } from '../../lib/layout';
import { validateMms } from '../../lib/mms/validate';
import { panelPose } from '../../lib/panel-pose';

/** Additional sheet in the EXISTING drawing set, projected exclusively from the live graph. */
export function MmsDetailSheet({ project, structures }: { project: Project; structures: SegmentStructure[] }) {
  const spec = project.components.panel;
  const first = structures.find(s => s.mms);
  if (!spec || !first) return null;
  const { w } = SHEET_SIZES.a3;
  const graph = structures.flatMap(s => s.members);
  const planFit = fitToBox(project.roofs.flatMap(r => r.polygon), { x: 35, y: 72, w: 660, h: 570 });
  const path = (points: XY[]) => points.map(p => `${planFit.toX(p.x)},${planFit.toY(p.y)}`).join(' ');
  const seg = project.segments.find(s => s.id === first.segmentId)!;
  const rafter = first.members.find(m => m.kind === 'rafter') ?? first.members.find(m => m.kind === 'rail')!;
  const dx = rafter.b.x - rafter.a.x, dy = rafter.b.y - rafter.a.y, len = Math.hypot(dx, dy) || 1;
  const section = (p: XYZ): XY => ({ x: ((p.x - rafter.a.x) * dx + (p.y - rafter.a.y) * dy) / len, y: p.z });
  const nearAxis = (p: XYZ) => Math.abs((p.x - rafter.a.x) * dy - (p.y - rafter.a.y) * dx) / len < .06;
  const frame = first.members.filter(m => (nearAxis(m.a) && nearAxis(m.b)) || m.id === rafter.id);
  const roof = project.roofs.find(r => r.id === seg.roofId);
  const moduleSections = project.panels.filter(p => p.segmentId === seg.id && p.enabled).flatMap(p => {
    const corners = panelCornersOnRoof(p, spec, roof);
    const crossing: XY[] = [];
    corners.forEach((a, i) => {
      const b = corners[(i + 1) % corners.length];
      const cross = (v: XY) => ((v.x - rafter.a.x) * dy - (v.y - rafter.a.y) * dx) / len;
      const ca = cross(a), cb = cross(b);
      if (Math.abs(ca) < 1e-5) crossing.push(a);
      if (ca * cb < 0) { const t = ca / (ca - cb); crossing.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }); }
    });
    if (crossing.length < 2) return [];
    const pose = panelPose(project, p, spec, roof);
    const az = (roof?.pitchDeg ? roof.slopeAzimuthDeg : p.azimuthDeg) * Math.PI / 180;
    const at = (v: XY): XYZ => ({ ...v, z: pose.position[1] - ((v.x - p.center.x) * Math.sin(az) + (v.y - p.center.y) * Math.cos(az)) * Math.tan(pose.tiltRad) });
    crossing.sort((a, b) => section(at(a)).x - section(at(b)).x);
    return [{ id: p.id, a: at(crossing[0]), b: at(crossing[crossing.length - 1]) }];
  });
  const foundations = first.nodes.filter(n => n.kind === 'roof_anchor' && nearAxis(n.position));
  const floor = foundations.length ? Math.min(...foundations.map(n => n.position.z)) : Math.min(...first.nodes.filter(n => n.kind === 'sheet_standoff').map(n => n.position.z));
  const sectionFit = fitToBox([...frame.flatMap(m => [section(m.a), section(m.b)]), ...moduleSections.flatMap(m => [section(m.a), section(m.b)]), { x: 0, y: floor }], { x: 735, y: 92, w: 350, h: 205 });
  const sx = (p: XYZ) => sectionFit.toX(section(p).x), sy = (p: XYZ) => sectionFit.toY(p.z);
  const parts = foundationAssembly(first.foundation, first.foundationShape, first.mms).parts;
  const partFit = fitToBox(parts.flatMap(p => [{ x: p.offset.x - p.size.x / 2, y: p.offset.z - p.size.z / 2 }, { x: p.offset.x + p.size.x / 2, y: p.offset.z + p.size.z / 2 }]), { x: 745, y: 360, w: 155, h: 145 });
  const clamp = first.nodes.find(n => n.kind === 'panel_clamp_mid' || n.kind === 'panel_clamp_end');
  const hardware = clamp ? nodeHardware(clamp.kind, first.mms, clamp.fastenerSpec.bolts) : [];
  const hwFit = fitToBox(hardware.flatMap(p => [{ x: p.offset.x - p.size.x / 2, y: p.offset.y - p.size.y / 2 }, { x: p.offset.x + p.size.x / 2, y: p.offset.y + p.size.y / 2 }]), { x: 925, y: 365, w: 150, h: 110 });
  const errors = validateMms(project, structures).filter(f => f.status === 'error').length;
  return <Sheet size="a3">
    <g fontFamily="monospace" fill="#222" data-testid="mms-engineering-drawing">
      <text x={w / 2} y={35} textAnchor="middle" fontSize={15} fontWeight={800}>MMS · SETTING-OUT PLAN / ELEVATION / CONNECTION DETAILS</text>
      <text x={35} y={55} fontSize={9}>LIVE MODEL · {errors ? `${errors} GEOMETRIC CONFLICTS — NOT FOR CONSTRUCTION` : 'PRELIMINARY — ENGINEER VERIFICATION REQUIRED'}</text>
      {project.roofs.map(r => <polygon key={r.id} points={path(r.polygon)} fill="#f3f2ef" stroke="#333" strokeWidth={1.5} />)}
      {project.panels.filter(p => p.enabled).map(p => <polygon key={p.id} points={path(panelCornersOnRoof(p, spec, project.roofs.find(r => r.id === p.roofId)))} fill="#dbe3e8" fillOpacity={.5} stroke="#758188" strokeWidth={.5} />)}
      {project.walkways.map(v => <line key={v.id} x1={planFit.toX(v.a.x)} y1={planFit.toY(v.a.y)} x2={planFit.toX(v.b.x)} y2={planFit.toY(v.b.y)} stroke="#ddd0a5" strokeWidth={v.widthMm / 1000 * planFit.unitsPerMetre} />)}
      {project.obstructions.map(o => <g key={o.id}><rect x={planFit.toX(o.center.x) - (o.shape === 'circle' ? o.diameterM : o.lengthM) / 2 * planFit.unitsPerMetre} y={planFit.toY(o.center.y) - (o.shape === 'circle' ? o.diameterM : o.widthM) / 2 * planFit.unitsPerMetre} width={(o.shape === 'circle' ? o.diameterM : o.lengthM) * planFit.unitsPerMetre} height={(o.shape === 'circle' ? o.diameterM : o.widthM) * planFit.unitsPerMetre} fill="#ddd" stroke="#777" transform={`rotate(${-o.rotationDeg},${planFit.toX(o.center.x)},${planFit.toY(o.center.y)})`} /><text x={planFit.toX(o.center.x)} y={planFit.toY(o.center.y)} fontSize={7}>{o.label}</text></g>)}
      {graph.map(m => <line key={m.id} x1={planFit.toX(m.a.x)} y1={planFit.toY(m.a.y)} x2={planFit.toX(m.b.x)} y2={planFit.toY(m.b.y)} stroke="#354d4a" strokeWidth={m.kind === 'beam' ? 1.4 : .7} />)}
      {structures.flatMap(s => s.nodes.filter(n => n.kind === 'roof_anchor').flatMap(n => foundationFootprints(s, n).filter(p => ['ballast', 'plate', 'pedestal'].includes(p.part.bucket)).map((p, i) => <polygon key={`${n.id}-footprint-${i}`} points={path(p.polygon)} stroke="#333" strokeWidth={.6} fill={p.part.bucket === 'ballast' ? '#ccc' : 'none'} />)))}
      {structures.flatMap(s => s.nodes.filter(n => n.kind === 'roof_anchor' || n.kind === 'sheet_standoff').map(n => <circle key={n.id} cx={planFit.toX(n.position.x)} cy={planFit.toY(n.position.y)} r={2} fill="#a35b34" />))}
      <text x={735} y={70} fontSize={10} fontWeight={700}>SECTION / FRAME · {seg.label}</text>
      <line x1={735} y1={sectionFit.toY(floor)} x2={1085} y2={sectionFit.toY(floor)} stroke="#555" />
      {frame.map(m => <line key={m.id} x1={sx(m.a)} y1={sy(m.a)} x2={sx(m.b)} y2={sy(m.b)} stroke="#222" strokeWidth={1.3} />)}
      {moduleSections.map(m => <line key={m.id} x1={sx(m.a)} y1={sy(m.a)} x2={sx(m.b)} y2={sy(m.b)} stroke="#305776" strokeWidth={2.6} />)}
      {foundations.flatMap(n => parts.filter(p => ['ballast', 'pedestal', 'plate'].includes(p.bucket)).map((p, i) => <rect key={`${n.id}-${i}`} x={sx(n.position) - p.size.z / 2 * sectionFit.unitsPerMetre} y={sectionFit.toY(n.position.z + p.offset.y + p.size.y / 2)} width={p.size.z * sectionFit.unitsPerMetre} height={Math.max(.6, p.size.y * sectionFit.unitsPerMetre)} fill="#aaa" stroke="#444" strokeWidth={.5} />))}
      <text x={735} y={317} fontSize={9}>Rafter/rail length {rafter.lengthM.toFixed(3)} m · tilt {seg.racking.kind === 'flush' ? project.roofs.find(r => r.id === seg.roofId)?.pitchDeg : seg.racking.tiltDeg}°</text>
      <text x={735} y={339} fontSize={10} fontWeight={700}>BASE / BALLAST · PLAN</text>
      {parts.map((p, i) => <rect key={i} x={partFit.toX(p.offset.x - p.size.x / 2)} y={partFit.toY(p.offset.z + p.size.z / 2)} width={p.size.x * partFit.unitsPerMetre} height={p.size.z * partFit.unitsPerMetre} fill={p.bucket === 'bolt' ? '#333' : p.bucket === 'ballast' ? '#ccc' : 'none'} stroke="#333" strokeWidth={.7} />)}
      <text x={925} y={339} fontSize={10} fontWeight={700}>CLAMP · ELEVATION</text>
      {hardware.map((p, i) => <rect key={i} x={hwFit.toX(p.offset.x - p.size.x / 2)} y={hwFit.toY(p.offset.y + p.size.y / 2)} width={p.size.x * hwFit.unitsPerMetre} height={p.size.y * hwFit.unitsPerMetre} fill="#bbb" stroke="#333" />)}
      <text x={735} y={530} fontSize={9}>Plate {first.mms?.anchor.plateSizeMm} × {first.mms?.anchor.plateSizeMm} × {first.mms?.anchor.plateThicknessMm} mm</text>
      <text x={735} y={547} fontSize={9}>Anchors {first.mms?.anchor.count} × M{first.mms?.anchor.diameterMm} @ {first.mms?.anchor.spacingMm} mm</text>
      <text x={735} y={564} fontSize={9}>Embedment {first.mms?.anchor.embedmentMm ?? 'NOT SUPPLIED'} mm</text>
      <text x={735} y={590} fontSize={8}>Connection shapes are nominal catalogue assemblies.</text>
      <text x={735} y={606} fontSize={8}>All lengths/positions derive from the current MMS graph.</text>
      <text x={735} y={622} fontSize={8}>No capacity, uplift or roof strength certification.</text>
      <text x={35} y={676} fontSize={9}>Plan units: metres · Detail units: millimetres · Roofs, panels, obstructions, access and MMS share the project coordinate frame.</text>
    </g>
    <TitleBlock size="a3" rows={[[ 'PROJECT', project.info.name ], [ 'DRAWING', 'MMS SETTING OUT & CONNECTIONS' ], [ 'STATUS', 'PRELIMINARY — NOT FOR CONSTRUCTION' ]]} />
  </Sheet>;
}