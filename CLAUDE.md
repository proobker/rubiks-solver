# CLAUDE.md

Guidance for working in this Rubik's cube project (React + Three.js + Vite + TypeScript).

For the deep technical reference (dual representation, animation pipeline, solver worker, learning engine, invariants), see [docs/architecture.md](docs/architecture.md).

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
- Scramble generator (plain): `src/features/engine/scramble.ts`. Real WCA scrambles use the **`cubing` npm library** via `src/features/engine/wca-scramble.ts` (`generateWCAScramble()` → `randomScrambleForEvent('333')`), exposed through the `useWCAScramble()` hook in `src/features/engine/use-wca-scramble.ts` (it prefers a preloaded value from `preloadWCAScramble()`). `cubing` is GPL-licensed and code-splits into lazy chunks; only import it through `wca-scramble.ts`.

## Solver

- `src/features/solver/kociemba.ts` — client that manages a **web worker** (`solver.worker.ts`). It serializes the grid to a flat 54-char face-letters string (`stateToFlatString`, face order U R F D L B) and posts it to the worker, which runs the `rubik-solver` library (Kociemba two-phase) off the main thread.
- `solver.worker.ts` — the worker module: `initSolver()` on load, replies with `solve-result` / `error`. `rubik-solver` only lives inside the worker; never import it on the main thread.
- `kociemba.ts` `solveCube(state)` returns `Promise<MoveString[]>` with a **20s timeout** (`SOLVE_TIMEOUT_MS`), rejects if a solve is already in flight, and verifies the solution actually solves the input state before resolving. It enforces a single in-flight request.
- `preload.ts` — `preloadSolver()` lazily spins up the worker once (called from `App` on mount) so the first Solve is fast.
- `solve-panel.tsx` — "Solve" runs `solveCube(state)`; results render as `MoveButton`s and can be applied individually or all at once.

## Learning

- `src/features/learning/stages.ts` — `ALL_STAGES` loaded from `algorithms.json`; `BEGINNER_STAGES` (7) and `CFOP_STAGES` (6), each `LearningStage` with `id`, `method`, `order`, `prerequisite`, `goal`, and `algorithms` (notations + cases).
- `src/features/learning/suggestions.ts` — `getStageProgress(stageId, pieces)` returns the best next move. It scores the current state per stage, then does a **greedy breadth-first search** up to `MAX_SEQUENCE_LENGTH = 3` moves over `ALL_MOVES` (skipping redundant same-axis moves) to find a move/sequence that increases the score, returning the first move plus the best sequence and a human rationale. The `SCORERS` map defines what "progress" means per stage (e.g. white edges matched to centers, yellow-on-top count).
- `src/features/learning/highlights.ts` — `getStageHighlights(stageId, pieces)` returns `Map<pieceId, {label?}>` keyed by **piece id** (not slot) so highlights follow the physical piece.
- `src/features/learning/learning-panel.tsx` — Learn tab UI: beginner/CFOP toggle, stage cards (locked until prerequisite complete), progress bar driven by `getStageProgress`, highlighted pieces via `getStageHighlights`, and algorithm cards that Apply or step through moves.

## Timer

- `src/features/timer/timer-panel.tsx` — the Timer tab. Auto-times solves: the clock starts on the first applied move after a scramble (listening to store `history`) and stops when `solved`. Move count = `store.history.length`. Solve sessions persist under localStorage key `rubiks-solver:solve-sessions`. Uses `useWCAScramble()` for its "New Scramble" button.

## Persistence

- Installed as a **PWA** via `vite-plugin-pwa` in `vite.config.ts` (`registerType: 'autoUpdate'`). Site base is `/rubiks-solver/` (GitHub Pages); `manifest`/`workbox.navigateFallback`/`scope`/`start_url` are all pinned to that base. PWA icons live in `/public` (`pwa-192x192.png`, `pwa-512x512.png`, `pwa-maskable-512x512.png`); keep them in sync with the manifest if you re-theme.
- `moveSpeed` is persisted via zustand `persist` on `cube-store.ts` (`partialize` keeps only `moveSpeed`; the cube `state`/`pieces` are never serialized).
- Completed learning stages persist via `src/lib/use-local-storage.ts` under the key `rubiks-solver:completed-stages` (a `string[]` of stage ids).
- Reset progress clears that key and is surfaced in the Learn tab.

## Data flow / entry points

- `src/app/App.tsx` — shell; owns the sidebar tabs (Moves / Learn / Solve / Timer), keyboard shortcuts (U D F B L R, Shift = prime), and persisted learning progress. Responsive: on mobile (`md:` breakpoint) the sidebar is hidden and a compact tab bar + bottom move keypad are shown; desktop keeps the sidebar. Camera preset buttons and the X-Ray reveal toggle overlay the canvas.
- `src/features/cube/rubiks-cube.tsx` — renderer. Uses drei `CameraControls` (not `OrbitControls`); a ref-based `CameraApi.setPreset(name)` animates the camera to preset positions (isometric/front/back/left/right/top/bottom, target = origin). `CAMERA_PRESETS` holds positions; initial camera is `[5.5, 5, 7]`. The `reveal` prop renders `<RevealPanels>`: floating, borderless `DoubleSide` sticker panels (colored front and back, no backing) reconstructed from the piece model via `piecesOnFace` + `stickerColorOn`, with `quaternionFromZTo` orienting each panel toward its face normal. Panels are **camera-aware** — `useFrame` recomputes which faces are hidden (face hidden when `dot(camera.position, normal) < 0`) so mirrors appear for whichever faces the current view hides. **Do not** revert to semi-transparent cubies (the old `opacity`/`depthWrite` x-ray approach was removed).
- `src/features/learning/highlights.ts` — `getStageHighlights(stageId, pieces)` returns a `Map<pieceId, {label?}>`. Highlight lookup is by **piece id**, not slot, so highlights follow the correct physical piece.
- `src/features/learning/learning-panel.tsx`, `src/features/solver/solve-panel.tsx`, `src/features/timer/timer-panel.tsx`, `src/components/ui/move-button.tsx` — UI.

## Conventions

- Path alias `@/` → `src/`.
- No test framework; verify with `npm run build` + `npm run lint`.
- Comments are avoided unless they explain a non-obvious invariant (see the rotation-convention note above); keep code self-documenting otherwise.
