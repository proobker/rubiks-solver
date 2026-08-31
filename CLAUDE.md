# CLAUDE.md

Guidance for working in this Rubik's cube project (React + Three.js + Vite + TypeScript).

## Commands

- `npm run dev` — start Vite dev server
- `npm run build` — `tsc -b && vite build` (type-check + bundle)
- `npm run lint` — `oxlint`
- `npm run preview` — preview the production build

Run `npm run build` and `npm run lint` after any change. There is **no test runner** configured.

## Architecture

The cube is represented **twice**, and keeping both in sync is the most important invariant in the codebase:

1. **Grid state** (`state: CubeState` in `src/shared/stores/cube-store.ts`) — 6 face grids of 3x3 `FaceColor`. This is the source of truth for the **solver** (`src/features/solver/kociemba.ts`) and **WCA scrambles**.
2. **Piece model** (`pieces: Piece[]`, `src/features/engine/pieces.ts`) — 26 physically-tracked cubies. Each `Piece` has a `position` (integer 3D slot in `{-1,0,1}^3`) and a list of `stickers`, each with a `dir` (AxisVec unit vector) and a `color`. This drives the **renderer**.

Every mutation in the store updates **both** representations with the same move: `onAnimationComplete`, `scramble`, `applyScramble`, `reset`, `undo` (history snapshots carry both `state` and `pieces`). Never update one without the other.

### Why the piece model exists

The renderer (`src/features/cube/rubiks-cube.tsx`) draws pieces from their tracked `position` + `sticker.dir`, so cubies visibly *stay where the animation moved them*. The old implementation re-derived each spatial slot's colors from the grid (via a `getCubieFaces` lookup) and teleported pieces back to their slots on rest, which caused the "moves snap to wrong colors" bug. Do not reintroduce slot-based `getCubieFaces`-style rendering.

### Rotation-convention invariant

For the animation to be seamless (no snap on rest), the animated slice rotation **must exactly equal** the piece model's committed rotation:

- `src/features/engine/pieces.ts` `angleFor` + `applyMoveToPieces` rotate positions and sticker dirs by `angleFor(direction) * sign(axis)`.
- `src/features/cube/rubiks-cube.tsx` `ANGLE_MAP` and `AnimatedSlice` must rotate the same 3D angle. `ANGLE_MAP = { 1: -PI/2, '-1': PI/2, 2: PI }` (signed by the axis in the component). If you change one, change the other.

## Engine conventions

- `src/features/engine/moves.ts` — a grid engine. `applyFaceTurn` implements a prime move (`direction: -1`) as **three clockwise turns** so that `'` is a true inverse (`X` then `X'` returns to solved). Keep this property; it is load-bearing for the solver and the piece model matching the grid.
- `src/shared/types/cube.ts` — `FACE_TO_AXIS`, `FACE_TO_POSITION`, `COLOR_TO_HEX`, `SOLVED_STATE`, `MoveString`, `MoveDirection` (`1 | -1 | 2`).
- Scramble generator: `src/features/engine/scramble.ts`. (There is no separate WCA scrambler; the "WCA Scramble" button reuses `generateScramble`.)

## Persistence

- `moveSpeed` is persisted via zustand `persist` on `cube-store.ts` (`partialize` keeps only `moveSpeed`; the cube `state`/`pieces` are never serialized).
- Completed learning stages persist via `src/lib/use-local-storage.ts` under the key `rubiks-solver:completed-stages` (a `string[]` of stage ids).
- Reset progress clears that key and is surfaced in the Learn tab.

## Data flow / entry points

- `src/app/App.tsx` — shell; owns the sidebar tabs (Moves / Learn / Solve), keyboard shortcuts (U D F B L R, Shift = prime), and persisted learning progress.
- `src/features/learning/highlights.ts` — `getStageHighlights(stageId, pieces)` returns a `Map<pieceId, {label?}>`. Highlight lookup is by **piece id**, not slot, so highlights follow the correct physical piece.
- `src/features/learning/learning-panel.tsx`, `src/features/solver/solve-panel.tsx`, `src/components/ui/move-button.tsx` — UI.

## Conventions

- Path alias `@/` → `src/`.
- No test framework; verify with `npm run build` + `npm run lint`.
- Comments are avoided unless they explain a non-obvious invariant (see the rotation-convention note above); keep code self-documenting otherwise.
