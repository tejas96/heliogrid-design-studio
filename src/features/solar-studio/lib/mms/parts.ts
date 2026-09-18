import { foundationAssembly } from '../foundation';
import { rectCorners } from '../geo';
import { tableYawRad, type SegmentStructure, type StructureNode } from '../structure';

/** Same EN↔Three transform as the instanced renderer; shared by validation and drawings. */
export function foundationFootprints(s: SegmentStructure, node: StructureNode) {
  const yaw = tableYawRad(s), cos = Math.cos(yaw), sin = Math.sin(yaw);
  return foundationAssembly(s.foundation, s.foundationShape, s.mms).parts.map(part => {
    const center = { x: node.position.x + part.offset.x * cos + part.offset.z * sin, y: node.position.y + part.offset.x * sin - part.offset.z * cos };
    return { part, center, polygon: rectCorners(center, part.size.x, part.size.z, yaw * 180 / Math.PI), bottom: node.position.z + part.offset.y - part.size.y / 2, top: node.position.z + part.offset.y + part.size.y / 2 };
  });
}