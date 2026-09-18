import type { Project } from '../../types';
import { deriveStructures } from '../../lib/derive/structures';
import { MATERIALS } from '../../lib/mms/catalogue';
import { validateMms } from '../../lib/mms/validate';

export function MmsComponentDetails({ project, segmentId, componentId }: { project: Project; segmentId: string; componentId?: string }) {
  if (!componentId) return null;
  const structures = deriveStructures(project);
  const s = structures.find(s => s.segmentId === segmentId);
  const m = s?.members.find(m => m.id === componentId);
  const n = s?.nodes.find(n => n.id === componentId);
  if (!s || (!m && !n)) return null;
  const at = m?.a ?? n!.position;
  const issues = validateMms(project, structures).filter(f => f.componentIds.includes(componentId));
  return <div className="mms-config" data-testid="mms-component-inspector">
    <strong data-testid="mms-component-type">{(m?.kind ?? (n?.kind === 'roof_anchor' ? s.foundation : n!.kind)).replaceAll('_', ' ')}</strong>
    <dl className="mms-metrics" data-testid="mms-component-metadata">
      <dt>Material</dt><dd>{s.mms ? MATERIALS[s.mms.material].label : 'Galvanized steel'}</dd>
      {m && <><dt>Section</dt><dd>{m.profile?.sectionMm ?? m.profileKey}</dd><dt>Length · derived</dt><dd>{m.lengthM.toFixed(3)} m</dd><dt>Member mass</dt><dd>{m.profile ? (m.lengthM * m.profile.kgPerM).toFixed(2) + ' kg' : 'Not supplied'}</dd></>}
      <dt>Position E / N / Z</dt><dd>{at.x.toFixed(2)} / {at.y.toFixed(2)} / {at.z.toFixed(2)} m</dd>
      {n && <><dt>Connected members</dt><dd>{n.memberIds.length}</dd>{Object.entries(n.fastenerSpec).map(([key, qty]) => <span key={key} style={{ display: 'contents' }}><dt>{key}</dt><dd>{qty}</dd></span>)}</>}
      {n?.kind === 'roof_anchor' && s.mms && s.foundation === 'ballast' && <><dt>Ballast block</dt><dd>{s.mms.ballast.lengthM} × {s.mms.ballast.widthM} × {s.mms.ballast.heightM} m</dd><dt>Declared ballast mass</dt><dd>{s.mms.ballast.massKg * s.mms.ballast.blocksPerSupport} kg / support</dd></>}
      {n?.kind === 'roof_anchor' && s.mms && s.foundation === 'anchor' && <><dt>Anchor</dt><dd>{s.mms.anchor.type} · M{s.mms.anchor.diameterMm}</dd><dt>Embedment</dt><dd>{s.mms.anchor.embedmentMm ? `${s.mms.anchor.embedmentMm} mm` : 'Not supplied'}</dd></>}
    </dl>
    <div data-testid="mms-component-validation" className="mms-note">{issues.length ? issues.map(f => f.message).join(' ') : 'No component geometry conflict detected. Structural capacity not calculated.'}</div>
  </div>;
}