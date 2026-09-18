import * as THREE from 'three';
import type { StructuralMaterial } from '../lib/mms/types';
import { MATERIALS } from '../lib/mms/catalogue';
const cache = new Map<StructuralMaterial, THREE.MeshStandardMaterial>();
let roughness: THREE.DataTexture | undefined;
/** Deterministic zinc spangle / brushing. Shared textures, no remote assets or per-frame work. */
export function mmsMaterial(kind: StructuralMaterial): THREE.MeshStandardMaterial {
  const cached = cache.get(kind); if (cached) return cached;
  if (!roughness) {
    const data = new Uint8Array(128 * 128 * 4);
    for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
      const i = (y * 128 + x) * 4;
      const grain = Math.sin(x * 19.13 + y * 73.79) * 43758.54;
      const v = 190 + Math.floor((grain - Math.floor(grain)) * 50);
      data[i] = data[i + 1] = data[i + 2] = v; data[i + 3] = 255;
    }
    roughness = new THREE.DataTexture(data, 128, 128, THREE.RGBAFormat);
    roughness.wrapS = roughness.wrapT = THREE.RepeatWrapping;
    roughness.repeat.set(8, 8); roughness.needsUpdate = true;
  }
  const p = MATERIALS[kind];
  const material = new THREE.MeshStandardMaterial({ color: p.color, roughness: p.roughness, metalness: p.metalness, roughnessMap: roughness, envMapIntensity: .8 });
  cache.set(kind, material); return material;
}