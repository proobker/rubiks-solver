# Rubik's Solver

An interactive 3D Rubik's cube built with React, Three.js, and TypeScript. Play with the cube directly, follow guided learning stages, get instant solutions, and time your solves — all in the browser as a PWA.

![Rubik's Cube](public/icons.svg)

## Features

- **Interactive 3D cube** rendered with Three.js (`@react-three/fiber` + `drei`). Orbit the camera, preset views (isometric/front/back/left/right/top/bottom), and turn faces with buttons or keyboard.
- **Moves tab** — Scramble / WCA scramble / Reset / Undo, plus a per-face move keypad and animation-speed control.
- **Learn tab** — guided beginner (7 stages) and CFOP (6 stages) progressions. Each stage highlights the relevant pieces, shows a live progress bar, and suggests the next move via a local search. Algorithms can be applied or stepped through one move at a time.
- **Solve tab** — one-click optimal solutions using the Kociemba two-phase algorithm (typically ≤ 20 moves), computed off the main thread in a web worker with a 20s timeout.
- **Timer tab** — auto-timed solves: the clock starts on your first move after a scramble and stops when the cube is solved. Best / average / solve count persist locally.
- **X-Ray reveal** — shows the stickers on whichever faces are hidden from the current camera (floating, borderless panels reconstructed from the piece model).
- **WCA scrambles** — official random-state scrambles via the `cubing` library (preloaded for instant feedback).
- **PWA** — installable, offline-capable (service worker via `vite-plugin-pwa`), deployed to GitHub Pages.

## Live demo

Deployed to GitHub Pages at **https://proobker.github.io/rubiks-solver/**

## Tech stack

- [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org)
- [Three.js](https://threejs.org) with [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber) and [@react-three/drei](https://github.com/pmndrs/drei)
- [@react-spring/three](https://react-spring.io) for slice-turn animation
- [zustand](https://github.com/pmndrs/zustand) with `persist` middleware for store state
- [Vite 8](https://vitejs.dev) + [Tailwind CSS 4](https://tailwindcss.com)
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app) for the installable PWA
- [rubik-solver](https://www.npmjs.com/package/rubik-solver) (Kociemba two-phase) in a web worker
- [cubing](https://js.cubing.net/cubing/) for official WCA scrambles
- [oxlint](https://oxc.rs) for linting

## Getting started

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173/rubiks-solver/`).

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server with HMR |
| `npm run build` | Type-check (`tsc -b`) then production bundle (`vite build`) |
| `npm run lint` | Lint with oxlint |
| `npm run preview` | Preview the production build locally |

There is **no test runner** configured; verify changes with `npm run build` and `npm run lint`.

## Usage

- **Turn faces**: click the move buttons in the sidebar (or the compact keypad on mobile), or press `U D F B L R` on the keyboard. Hold `Shift` for the prime (`'`) variant.
- **Orbit**: drag on the canvas. Use the preset buttons to jump the camera to a face-on or isometric view.
- **Keyboard shortcuts**: `U D F B L R` turn faces; `Shift` + key = prime (`'`).

## Project structure

```
src/
  app/App.tsx            # Shell: tabs, keyboard shortcuts, camera presets, X-Ray toggle
  features/
    cube/rubiks-cube.tsx # Three.js renderer (pieces, animation, X-Ray reveal panels)
    engine/              # Moves, scramble, WCA scramble, piece model (grid + piece logic)
    learning/            # Stages (algorithms.json), suggestions, highlights, panel UI
    solver/              # Kociemba solver (web worker), solve panel
    timer/               # Auto-timing solve timer
  shared/
    stores/cube-store.ts # Zustand store (grid state + pieces + move queue)
    types/cube.ts        # Cube types, color maps, face→axis/position
  components/            # Shared UI (move buttons, error boundary)
  lib/                   # Utilities (cn, useLocalStorage)
docs/architecture.md     # Deep technical documentation
```

## Key concept

The cube is represented **twice**: a 6-face grid (`CubeState`, used by the solver and scrambles) and a 26-piece model (used by the renderer). Both are kept in sync on every move. See [docs/architecture.md](docs/architecture.md) for the full technical details.

## License

[MIT](LICENSE)
