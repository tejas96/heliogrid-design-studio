// ─── What the 3D shows when it is opened from a wizard step ─────────────────
// The scene always drew the WHOLE canonical project, whatever step opened it.
// So re-opening the 3D from Roof Setup (Step 2) after the modules had been
// laid out showed those modules, and Obstructions (Step 3) showed the array,
// the strings and the cable runs. A step must show what it OWNS and what the
// earlier steps built — never what a later step will add.
//
// This is the single place that decides that. The scene reads the scoped
// project everywhere (meshes, bounds, picking, shading), so nothing downstream
// can disagree with it. Edits are unaffected: ops always run against the store.
import type { Project } from '../types';

/** The first wizard step at which the array and everything hung off it exists. */
const DESIGN_STAGE = 5;
/** The first wizard step at which obstructions exist. */
const OBSTRUCTION_STAGE = 3;
/** Roof Setup. Its 3D is a look at the traced roof, not the studio. */
const ROOF_STAGE = 2;

/**
 * Does the scene-tools radial menu belong on screen at `stage`?
 *
 * Owner directive, 2026-09-18: not on Roof Setup. That step opens the 3D only
 * to look at the roof it just traced, and every tool in the menu (heatmap,
 * share, .glb export, measures, surroundings, sun path) is about a design the
 * step does not own yet. Keyboard still reaches the views (1–6), fly (F),
 * isolate (I), measure (M) and the shortcut sheet (?).
 */
export function stageShowsSceneTools(stage?: number): boolean {
  return stage !== ROOF_STAGE;
}

/** Does the design (modules, racking, wiring, BOS) belong on screen at `stage`? */
export function stageShowsDesign(stage?: number): boolean {
  return stage === undefined || stage >= DESIGN_STAGE;
}

/** Do obstructions belong on screen at `stage`? */
function stageShowsObstructions(stage?: number): boolean {
  return stage === undefined || stage >= OBSTRUCTION_STAGE;
}

/**
 * The project as the given step is allowed to see it. `stage` undefined means
 * the full studio (Step 6, the proposal render, the customer share link).
 */
export function projectForStage(project: Project, stage?: number): Project {
  if (stageShowsDesign(stage)) return project;
  const scoped: Project = {
    ...project,
    panels: [],
    segments: [],
    keepouts: [],
    walkways: [],
    rails: [],
    arresters: [],
    inverterPlacements: [],
    batteryPlacements: [],
    electricalBoxes: [],
    cableRoutes: [],
    strings: [],
  };
  return stageShowsObstructions(stage) ? scoped : { ...scoped, obstructions: [] };
}
