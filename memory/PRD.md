# HelioGrid Studio upgrade

## User request
Upgrade the **existing** HelioGrid rooftop solar Studio into a parametric MMS engineering and realistic visualization environment. Preserve RCC/metal roofs, array placement, shared state, renderer, inspector, BOM and drawings. Minimal discovery; approximately 98 credits available at request. No fake engineering calculations or certification.

## Architecture / brief integration audit
- Existing product is Next.js 15 / React 19 / Three.js + R3F, NOT the empty repository described by the earlier handoff. Retain this architecture.
- Studio: `screens/Step6Editor.tsx`, `three/Scene3D.tsx`, routed through `src/app/(studio)/wizard`.
- Roofs: `types.ts` Roof/RoofType; `lib/roof-plane.ts`, `scene-model.ts`, existing roof factories.
- Modules: `lib/layout.ts`, `segment-ops.ts`, `panel-pose.ts`, `three/PanelsInstanced.tsx`.
- MMS: `lib/structure.ts` deterministic member/node graph, `foundation.ts`, `hardware.ts`, `derive/structures.ts`.
- State: existing `store/store.tsx` + undoable project patches; derived fingerprints, existing persistence. No second store.
- Validation: existing `lib/drc.ts` and geometry utilities in `geo.ts`.
- BOM: `lib/bom/emitters/mechanical.ts`; drawings: `components/drawing/StructureSheet.tsx`, `lib/dxf.ts`.
- Renderer already has textured roofs, cell/glass materials, sunlight, shadows, environment, cameras and instancing. Extend hardware/material detail and inspection instead of replacing.

## Approved priorities
P0: extend domain/configuration + generator, connected roof-aware validation.
P1: realistic attachment rendering, existing inspector edits, honest engineering data, existing BOM/drawings.
P2: extension contracts for additional structural checks and future systems, not unrelated implementations.

## Status
Implementation in progress. No verification claims yet. Existing platform runtime expected a different directory layout; adapting launch wrapper without moving the product.