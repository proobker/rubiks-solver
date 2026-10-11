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
- `src/shared/types/cube.ts` — `FACE_TO_AXIS`, `FACE_TO_POSITION`, `COLOR_TO_HEX`, `SOLVED_STATE`, `MoveString`, `MoveDirection` (`1 | -1 | 2`), `MOVE_BASES`/`moveSpec`. `MoveString` covers faces `U D F B L R`, wide `u d f b l r`, slices `M E S` and rotations `x y z`; a `MoveSpec` is `{ axis, layers, direction }`. `ALL_MOVES` stays the 18 outer face turns.
- Non-face moves are applied to the grid **geometrically** (`applySpecGeometrically` in `moves.ts`, via `faceletPosition`/`faceletCell` + `rotateVec` from `pieces.ts`), so they match the piece model by construction. `parseMoveString` is case-sensitive (lowercase = wide).
- Scramble generator (plain): `src/features/engine/scramble.ts`. Real WCA scrambles use the **`cubing` npm library** via `src/features/engine/wca-scramble.ts` (`generateWCAScramble()` → `randomScrambleForEvent('333')`), exposed through the `useWCAScramble()` hook in `src/features/engine/use-wca-scramble.ts` (it prefers a preloaded value from `preloadWCAScramble()`). `cubing` is GPL-licensed and code-splits into lazy chunks; only import it through `wca-scramble.ts`.

## Solver

- `src/features/solver/kociemba.ts` — client that manages a **web worker** (`solver.worker.ts`). It serializes the grid to a flat 54-char face-letters string (`stateToFlatString`, face order U R F D L B, letters assigned by **current center colors** so rotated cubes solve) and posts it to the worker, which runs the `rubik-solver` library (Kociemba two-phase) off the main thread.
- `solver.worker.ts` — the worker module: `initSolver()` on load, replies with `solve-result` / `error`. `rubik-solver` only lives inside the worker; never import it on the main thread.
- `kociemba.ts` `solveCube(state)` returns `Promise<MoveString[]>` with a **20s timeout** (`SOLVE_TIMEOUT_MS`), rejects if a solve is already in flight, and verifies the solution actually solves the input state before resolving. It enforces a single in-flight request.
- `preload.ts` — `preloadSolver()` lazily spins up the worker once (called from `App` on mount) so the first Solve is fast.
- `solve-panel.tsx` — "Solve" runs `solveCube(state)`; the result is a step-through player (prev = `undo`, next, play/pause, apply rest). It records `history.length` at solve time and treats the solution as stale once the cube changes outside the player.

## Learning

See `docs/architecture.md` §8 for details.

- `stages.ts` — `ALL_STAGES` from `algorithms.json`; `stageItems(stage)` flattens cases/algorithms into `DrillItem`s. Every `cases[].moves` must be a parseable algorithm.
- `facelets.ts` — 54-sticker `Uint8Array` view with compiled move permutations; orientation-independent predicates (compare against live centers). All learning logic runs on facelets.
- `stage-goals.ts` — `STAGE_GOALS`: per-stage `prereq`, `progress`/`max`, `preferredTop`, `targets`, hint mode and practice-setup generators (`generateStageSetup`).
- `suggestions.ts` — `getStageHint(stageId, pieces)`: reorient → IDDFS (crosses) or algorithm-macro search (`[y][U] alg`), returning step lists.
- `highlights.ts` — target slots → piece ids (highlights follow the physical piece).
- `learning-panel.tsx` composes `stage-stepper`, `hint-card` (the sticky `CoachBar`: progress, Set up / Hint / Drill), collapsible `Section`s with `algorithm-card` case tiles and `case-diagram`, `practice-bar` and `drill-panel` (focus mode with streak/accuracy) (with `drill.ts`, `case-stats.ts`). A stage completes only when it is solved after being seen incomplete with moves made.

## Timer

- `src/features/timer/timer-panel.tsx` — the Timer tab. Auto-times solves: the clock starts on the first applied move after a scramble (listening to store `history`) and stops when `solved`. Move count excludes rotations. Solve sessions persist under localStorage key `rubiks-solver:solve-sessions`; the panel shows Best/ao5/ao12/Mean (pure helpers in `stats.ts`) and a deletable history. Uses `useWCAScramble()` for its "New scramble" button.

## Persistence

- Installed as a **PWA** via `vite-plugin-pwa` in `vite.config.ts` (`registerType: 'autoUpdate'`). Site base is `/` (served at the root of `https://rubiks.rabidahal.com.np`, GitHub Pages); `manifest`/`workbox.navigateFallback`/`scope`/`start_url` are all pinned to that base. PWA icons live in `/public` (`pwa-192x192.png`, `pwa-512x512.png`, `pwa-maskable-512x512.png`); keep them in sync with the manifest if you re-theme.
- `cube-store.ts` uses zustand `persist` (key `rubiks-solver`, `version: 1`): `partialize` keeps `moveSpeed`, `state`, `pieces`, `scrambleMoves` so the cube survives reloads. `history`, the animation queue and `practiceStart` are not persisted. `merge` validates `state`/`pieces` together (falls back to solved if either is malformed) and recomputes `solved`.
- Completed learning stages persist via `src/lib/use-local-storage.ts` under the key `rubiks-solver:completed-stages` (a `string[]` of stage ids). Drill stats persist under `rubiks-solver:case-stats`.
- Reset progress clears both keys and is surfaced in the Learn tab.

## Data flow / entry points

- `src/app/App.tsx` — shell; owns the active tab, keyboard shortcuts (U D F B L R, X Y Z rotations, Shift = prime), persisted learning progress, and the solved/stage-complete `Celebration`. Tabs are defined in `src/app/tabs.ts` (id, label, icon) and rendered by `tab-content.tsx`. Desktop: a 360–400px sidebar with a `Segmented` tab bar. Mobile (`useMediaQuery`, below `md`): a bottom sheet (`mobile-sheet.tsx`, peek/expanded) plus an icon nav bar. Tab panels render in exactly one place so they are never mounted twice. The canvas has a single bottom `CanvasToolbar` (`features/cube/canvas-toolbar.tsx`: view-preset menu, X-Ray toggle, speed popover).
- `src/features/cube/rubiks-cube.tsx` — renderer. Uses drei `CameraControls` (not `OrbitControls`); a ref-based `CameraApi.setPreset(name)` animates the camera to preset positions (isometric/front/back/left/right/top/bottom, target = origin). `CAMERA_PRESETS` holds positions; initial camera is `[5.5, 5, 7]`. The `reveal` prop renders `<RevealPanels>`: floating, borderless `DoubleSide` sticker panels (colored front and back, no backing) reconstructed from the piece model via `piecesOnFace` + `stickerColorOn`, with `quaternionFromZTo` orienting each panel toward its face normal. Panels are **camera-aware** — `useFrame` recomputes which faces are hidden (face hidden when `dot(camera.position, normal) < 0`) so mirrors appear for whichever faces the current view hides. **Do not** revert to semi-transparent cubies (the old `opacity`/`depthWrite` x-ray approach was removed).
- `src/features/learning/highlights.ts` — `getStageHighlights(stageId, pieces)` returns a `Map<pieceId, {label?}>`. Highlight lookup is by **piece id**, not slot, so highlights follow the correct physical piece.
- `src/features/moves/moves-panel.tsx`, `src/features/learning/learning-panel.tsx`, `src/features/solver/solve-panel.tsx`, `src/features/timer/timer-panel.tsx` — tab panels.
- `src/components/ui/` — shared primitives: `Button` (cva variants in `variants.ts`: primary/soft/secondary/ghost × `accent | danger` × size, flat with hover/active states), `Card`, `Section` (collapsible, open state persisted under `rubiks-solver:section:<id>`), `Segmented`, `Progress`, `Badge`, `Celebration` (CSS confetti; remount with a new `key`), `MoveButton`/`MovePanel`, `MoveChips`. Use these instead of inline button/card class strings. Theme tokens live in `src/index.css`; animations respect `prefers-reduced-motion`.

### Visual design (Railway-inspired)

- Palette: canvas `#13111C`, borders `#33323E`. Tailwind's `zinc-*` scale is **remapped** in `@theme` to these purple-tinted grays, so use `zinc-*` for neutrals and never raw hex. One accent, `--color-accent` `#9D4EDD` (`-hover`, `-active`, `-soft` for text), is reserved for primary actions and active/selected states. Green, amber and red are only for status (solved, warning, error). Cube colors (`--color-cube-*`) appear only as face indicators, never as UI decoration.
- Type: Inter (`font-sans`) for UI, IBM Plex Serif (`font-serif`, 400/500) for the wordmark and panel headings, JetBrains Mono for move notation. Labels are sentence case at `text-xs`/`text-[13px]` `font-medium`, with no uppercase tracked micro-labels.
- Radii: `rounded-md` (6px) for buttons and inputs, `rounded-lg` (8px) max for cards and popovers, `rounded` (4px) for badges. Surfaces are flat with 1px `zinc-800` borders; no gradients, glows, keycap shadows or `rounded-xl+`.

## Conventions

- Path alias `@/` → `src/`.
- No test framework; verify with `npm run build` + `npm run lint`.
- Comments are avoided unless they explain a non-obvious invariant (see the rotation-convention note above); keep code self-documenting otherwise.
