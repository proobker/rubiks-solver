# Rubik's Solver — Architecture

This document is the deep technical reference for the codebase. It explains how the cube is modeled, how state flows through the app, and how each subsystem works. Line references point into the source tree under `src/`.

## Overview

The app is a single-page React application that renders a 3D Rubik's cube with [Three.js](https://threejs.org) (via `@react-three/fiber` + `@react-three/drei`). It exposes four tabs — **Moves**, **Learn**, **Solve**, **Timer** — plus an X-Ray reveal overlay, official WCA scrambles, and an installable PWA.

The single most important design decision is that the cube is represented **twice**, and keeping the two representations in sync is the core invariant of the codebase.

---

## 1. The dual representation

### 1.1 Grid state

`state: CubeState` (`src/shared/types/cube.ts`) is a pure data model: six faces, each a `3x3` grid of `FaceColor`.

```ts
interface CubeState {
  U: Face; // Face = FaceColor[][]
  D: Face;
  F: Face;
  B: Face;
  L: Face;
  R: Face;
}
```

It lives in the zustand store (`src/shared/stores/cube-store.ts`). The grid is the **source of truth for the solver and for WCA scrambles** — both operate on this flat color representation.

### 1.2 Piece model

`pieces: Piece[]` (`src/features/engine/pieces.ts`) is a physically-tracked model of the 26 motion-bearing cubies (the center of the cube is empty). Each piece tracks its integer 3D slot and its stickers:

```ts
interface Piece {
  id: number;
  position: [number, number, number]; // an integer slot in {-1,0,1}^3
  stickers: { dir: AxisVec; color: FaceColor }[]; // dir is a unit axis vector
}
```

The piece model drives the **renderer** — the 3D cube is drawn piece-by-piece from `position` + `sticker.dir`, not re-derived from the grid.

### 1.3 Why two representations?

- The **grid** is the natural structure for the solver (Kociemba expects a face-letter sequence) and for `isSolved` checks and scrambles.
- The **piece model** is the natural structure for physically rendering 26 cubies that must visibly *stay where an animation moved them*.

The codebase explicitly avoids re-deriving sticker colors per spatial slot from the grid (a past `getCubieFaces`-style approach) because that teleported pieces back to their slots on rest and produced the "moves snap to wrong colors" bug. The rule: **never update one representation without the other.** See `CLAUDE.md` for the operational version of this invariant.

### 1.4 Keeping them in sync

Every mutation updates **both** with the same move. The synchronization points in `cube-store.ts`:

| Mutation | Grid | Pieces | Notes |
| --- | --- | --- | --- |
| `onAnimationComplete` | `applyMove(state, move)` | `applyMoveToPieces(pieces, axis, dir)` | single live move |
| `scramble` / `applyScramble` | `applyMoves(cloneState(SOLVED_STATE), moves)` | `piecesForMoves(moves)` | from solved, resets history |
| `reset` | `cloneState(SOLVED_STATE)` | `buildSolvedPieces()` | |
| `undo` | `state = history[i].state` | `pieces = history[i].pieces` | history snapshots carry **both** |

---

## 2. State flow and the animation pipeline

The store (`src/shared/stores/cube-store.ts`) is a zustand store. Its mutable cell is the cube state; much of its logic is an **animation pipeline** that serializes turn requests because three.js animations are asynchronous.

Relevant store fields:

```
state, pieces, history, moveQueue, isAnimating,
currentAnimation, animationId, moveSpeed, solved, scrambleMoves
```

### 2.1 Requesting a move

`applyMove(move)` or `applyAlgorithm(moves)` parse a `MoveString` into a `PendingMove { move, face, direction }`, where `direction` is `1 | -1 | 2`.

- If nothing is animating and the queue is empty, the first move becomes `currentAnimation` and `isAnimating = true`.
- Otherwise the move is appended to `moveQueue`.

### 2.2 Driving the animation

`processNextMove()` advances the queue: it pops the next `currentAnimation` (or clears `isAnimating`/`currentAnimation` when empty), bumping `animationId` so the renderer mounts a fresh animated group.

### 2.3 Committing a move

`onAnimationComplete()` is the callback fired when the animated slice finishes rotating. It:

1. Computes `newState` from the grid.
2. Computes `newPieces` from the piece model.
3. Appends a history snapshot carrying **both** `state` and `pieces` (cloned).
4. Sets `solved = isSolved(newState)`.
5. Calls `processNextMove()`.

### 2.4 Undo

`undo()` refuses while animating, then pops the last history entry and restores both representations from it. `getInverseAlgorithm()` reconstructs the inverse of the applied moves (used implicitly by the history model) — it reverses the history and flips `'` markers.

### 2.5 Persistence

`persist` middleware stores **only** `moveSpeed` (via `partialize`). The cube `state`/`pieces` are never serialized — a fresh page load starts solved. See §9.

---

## 3. Move engine (`src/features/engine/moves.ts`)

A pure grid engine. Key API: `applyMove`, `applyMoves`, `parseMoveString`, `parseAlgorithm`, `isSolved`, `cloneState`.

### 3.1 The prime-as-three-turns invariant

`applyFaceTurn` applies a clockwise cycle to the sticker data. A prime move (`direction: -1`) is implemented as **three clockwise turns**; a double move (`direction: 2`) as two. This makes a prime move a *true inverse*: `X` followed by `X'` returns to solved, and — critically — the piece model and the grid agree on the final layout for every direction.

This is **load-bearing**: the solver's solution verification and the grid↔piece sync both rely on prime and clockwise having consistent semantics. Keep it.

### 3.2 `isSolved`

Checks that each face is uniformly its center color. Used to set the store's `solved` flag and by the solver's validation.

---

## 4. Piece model (`src/features/engine/pieces.ts`)

`buildSolvedPieces()` constructs the 26 cubies (skipping the `(0,0,0)` center). Each cubie gets stickers only on the faces it exposes in the solved state.

### 4.1 Rotation math

`applyMoveToPieces(pieces, axis, direction)`:

- Picks the per-axis rotation function (`rotX`/`rotY`/`rotZ`) and a sign from the chosen axis.
- Computes `theta = angleFor(direction) * sign(axis)`, where `angleFor` maps `1 → -PI/2`, `-1 → PI/2`, `2 → PI`.
- Rotates every piece **on the slice** (`onSlice`, a position coordinate equal to the axis value) — both `position` and each `sticker.dir` — then `snap`s (rounds) them back to integer slot/dir values.

### 4.2 The rotation-convention invariant

For seamless animation (no snap on rest), the animated slice's rotation **must exactly equal** the piece model's committed rotation:

- Piece side: `angleFor(direction) * sign(axis)`.
- Renderer side: `ANGLE_MAP` in `src/features/cube/rubiks-cube.tsx` = `{ 1: -PI/2, '-1': PI/2, 2: PI }`, signed by the axis.

**If you change one, change the other.** This is the most likely source of visual regressions in this codebase.

### 4.3 Lookups

- `piecesOnFace(pieces, face)` — the 9 pieces on a given face.
- `stickerColorOn(piece, face)` — the color a piece shows on a given face.
- `pieceAt(pieces, x, y, z)` — the piece in a given slot (used heavily by learning).
- `stickerFace(dir)` — maps a sticker direction to a `FaceName`.

---

## 5. The renderer (`src/features/cube/rubiks-cube.tsx`)

A `<Canvas>` (react-three-fiber) containing lights, the animated pieces, the camera, and the X-Ray overlay.

### 5.1 Piece rendering

`AnimatedPieces` maps every `Piece` to a `PieceMesh`: a `boxGeometry` cubie whose six `material-<i>` slots are colored from the piece's stickers (via `DIR_TO_SLOT`), with `INTERIOR_COLOR` for internal faces. A cubie's `group` is positioned at `position * SLOT`.

### 5.2 Slice animation

During a move, the 9 pieces on the `currentAnimation.face` are pulled out of the static group and wrapped in `AnimatedSlice`, which rotates them via `@react-spring/three` by the same angle as `ANGLE_MAP` (see §4.2). The group's `key` includes `animationId` so each new move mounts a fresh spring; `onRest` calls the store's `onAnimationComplete` (see §2.3). A small `Html` overlay shows the current move name.

Sizes: `CUBIE_SIZE = 0.94`, `GAP = 0.06`, `SLOT = CUBIE_SIZE + GAP = 1`.

### 5.3 Camera

Uses drei `CameraControls` (not `OrbitControls`). A ref-based `CameraApi` exposes `setPreset(name)`; `CAMERA_PRESETS` maps preset names to look-at positions (initial camera `[5.5, 5, 7]`, fov 35). `App` forwards its own `cameraApiRef` so the preset buttons (overlaid on the canvas) can drive the camera.

### 5.4 X-Ray reveal (`RevealPanels`)

The `reveal` prop renders floating sticker panels for the faces hidden from the current view. Key properties:

- **Borderless & double-sided**: each sticker is an independent `planeGeometry` with `meshBasicMaterial` `side={DoubleSide}` — the sticker color shows on both sides, with no black backing plate. `STICKER_SIZE = PANEL_CELL - 0.08` leaves a small gap between stickers (they are not merged).
- **Reconstructed from the piece model**: panels are placed per piece using `piecesOnFace` + `stickerColorOn`, and oriented by `quaternionFromZTo(faceNormal)`. Reusing each cubie's exact in-cube position gives the correct sticker orientation with no UV math.
- **Camera-aware**: `useFrame` recomputes, each frame, which faces are "hidden" when `dot(camera.position, faceNormal) < 0` (cube target is origin). So the mirror panels always appear for *whichever* face currently turns away from the viewer — not a fixed three.
- **Hooks-order constraint**: `useThree`, `useFrame`, `useState`, `useRef` are called before the `if (!reveal) return null` early return, per the rules of hooks.
- `FACE_NORMALS` maps each face to its outward unit vector; `DEFAULT_HIDDEN` derives the default hidden set from the isometric camera preset.

> Do **not** reintroduce semi-transparent cubies for x-ray. The old `opacity`/`depthWrite` approach was removed in favor of `RevealPanels`.

---

## 6. The solver (`src/features/solver/`)

### 6.1 Overall design

The Kociemba two-phase algorithm is expensive and synchronous, so it runs in a **web worker** to keep the UI responsive. The `rubik-solver` npm library lives **only** inside the worker — never import it on the main thread.

### 6.2 `kociemba.ts` (main-thread client)

- `ensureSolver()` lazily creates the worker (once) and caches a `workerReady` promise.
- `solveCube(state)` returns `Promise<MoveString[]>`:
  - Enforces a **single in-flight request** — rejects with "A solve is already in progress" if `pending` is set.
  - Imposes a **20s timeout** (`SOLVE_TIMEOUT_MS`) via `setTimeout`.
  - Serializes the grid to a flat 54-char string (`stateToFlatString`, face order `U R F D L B`) and posts it to the worker.
  - On `solve-result`, parses the solution moves and **verifies** `isSolved(applyMoves(state, moves))` before resolving; rejects if invalid.
  - Handles worker `error` events.
- `preload.ts` — `preloadSolver()` calls `ensureSolver()` once, called from `App` on mount so the first Solve is fast (worker spins up behind the scenes).

### 6.3 `solver.worker.ts` (worker)

Runs `initSolver()` on load, then handles `{ type: 'solve' }` messages: builds a `Cube.fromString(stateString)`, calls `solve(cube)`, and replies with `solve-result` (or `error`).

### 6.4 `solve-panel.tsx`

The Solve tab calls `solveCube(state)`; results render as a series of `MoveButton`s that can be applied individually or all at once (via `applyAlgorithm`). The Solve button is disabled while animating to avoid racing the worker with a half-moved state.

---

## 7. WCA scrambles (`src/features/engine/`)

`cubing` is a GPL-licensed library that code-splits into lazy chunks. To keep the initial bundle lean and scrambles instant:

- `wca-scramble.ts` is the **only** module allowed to import `cubing/scramble`. `generateWCAScramble()` → `randomScrambleForEvent('333')`, parsed to `MoveString[]`.
- `preloadWCAScramble()` pre-generates one scramble into a module-level `cached` variable.
- `useWCA-scramble.ts` provides the `useWCAScramble()` hook: it prefers `takePreloadedWCAScramble()` (which consumes the cache) before falling back to `generateWCAScramble()`, then calls `applyScramble`.
- `App` calls `preloadWCAScramble()` on mount. The plain (non-WCA) scramble is `scramble.ts` — a local generator that avoids repeating the same face and opposite-back-to-back pairs.

---

## 8. The learning system (`src/features/learning/`)

The Learn tab teaches beginner (7 stages) and CFOP (6 stages) methods.

### 8.1 Stage definitions

`stages.ts` loads `ALL_STAGES` from `algorithms.json` (`src/features/learning/algorithms.json`). Each `LearningStage` has an `id`, `method` (`beginner`/`cfop`), `order`, `prerequisite`, `goal`, and a list of `algorithms` (notations plus named cases). `BEGINNER_STAGES` and `CFOP_STAGES` are derived by filtering on `method`.

### 8.2 Suggestions (`suggestions.ts`)

`getStageProgress(stageId, pieces)` computes the best next move:

1. **Score the stage** via a `SCORERS` map — each stage defines what "progress" means (e.g. `whiteCross` counts white edges matched to their centers; `yellowOnU` counts yellow stickers on top).
2. **Greedy breadth-first search** up to `MAX_SEQUENCE_LENGTH = 3` moves over `ALL_MOVES`, skipping redundant consecutive same-axis moves (`isRedundant`). It simulates moves on the piece model (via `applyMoveToPieces`) to find a move/sequence that increases the score, immediately returning the shortest path that reaches the stage `max`.
3. Returns the first move, the best sequence, the resulting score delta, and a human `rationale`.

The panel drives its progress bar and auto-advance (`stageComplete` when `value >= max`) from this.

### 8.3 Highlights (`highlights.ts`)

`getStageHighlights(stageId, pieces)` returns `Map<pieceId, {label?}>` keyed by **piece id** (not slot) so highlights follow the physical piece as it moves. It uses the slot tables (`edgeSlots`, `cornerSlots`, `middleLayerSlots`, etc.) to decide which pieces to mark per stage.

### 8.4 Panel (`learning-panel.tsx`)

A beginner/CFOP toggle, stage cards (locked until the prerequisite is complete), the suggested-move panel, and per-algorithm cards with "Apply" and per-move "step" buttons. Completed stages persist under localStorage key `rubiks-solver:completed-stages`.

---

## 9. Timer (`src/features/timer/timer-panel.tsx`)

Auto-timing: the app considers a "solve" active when `history.length > 0 && !solved`. On the first move after a scramble the clock starts (`startAtRef = Date.now()`); a `50ms` interval updates the elapsed display; on `solved` it records a session `{ timeMs, moves: history.length, ts }`. Sessions persist under localStorage key `rubiks-solver:solve-sessions`, and the panel shows Best / Average / Solve count.

---

## 10. PWA & deployment

- **PWA**: `vite-plugin-pwa` in `vite.config.ts` with `registerType: 'autoUpdate'`. The site base is `/rubiks-solver/` (GitHub Pages); the manifest `scope`, `start_url`, and `workbox.navigateFallback` are all pinned to that base. PWA icons live in `/public` (`pwa-192x192.png`, `pwa-512x512.png`, `pwa-maskable-512x512.png`).
- **Deploy**: `.github/workflows/deploy.yml` builds on `main` (`npm ci` + `npm run build`) and deploys `dist/` to GitHub Pages via the standard `actions/deploy-pages` flow.
- **Code splitting**: `vite.config.ts` uses a `manualChunks` rule to push three.js + react-three + react-spring into a single `three` chunk. `cubing` splits into its own lazy chunks (see §7).

---

## 11. Invariants checklist

These are the load-bearing invariant rules to preserve when editing:

1. **Never update the grid or the piece model without the other** — every mutation updates both (`CLAUDE.md` / §1.4).
2. **Do not reintroduce slot-based `getCubieFaces`-style rendering** — render from the tracked piece model (§1.3).
3. **`ANGLE_MAP` (renderer) must equal `angleFor * sign(axis)` (piece model)** — otherwise animation snaps (§4.2).
4. **Prime is three clockwise turns** — keeps `X X'` an identity and the grid/piece models consistent (§3.1).
5. **`rubik-solver` lives only in the web worker** — never import it on the main thread (§6.1).
6. **`cubing` is only imported through `wca-scramble.ts`** — it is GPL and code-splits (§7).
7. **Keep the x-ray as `RevealPanels`**, not semi-transparent cubies (§5.4).
