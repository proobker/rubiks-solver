import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CubeState, MoveString, MoveSpec } from '@/shared/types/cube';
import { SOLVED_STATE, moveSpec } from '@/shared/types/cube';
import { applyMove, applyMoves, cloneState, invertAlgorithm, isSolved } from '@/features/engine/moves';
import { generateScramble } from '@/features/engine/scramble';
import {
  buildSolvedPieces,
  applyMoveToPieces,
  applyMovesToPieces,
  clonePieces,
} from '@/features/engine/pieces';
import type { Piece } from '@/features/engine/pieces';

interface HistoryEntry {
  state: CubeState;
  pieces: Piece[];
  move: MoveString;
}

export function piecesForMoves(moves: MoveString[]): Piece[] {
  return applyMovesToPieces(buildSolvedPieces(), moves);
}

export interface PendingMove {
  move: MoveString;
  spec: MoveSpec;
}

export interface PracticeStart {
  state: CubeState;
  pieces: Piece[];
}

interface CubeStore {
  state: CubeState;
  pieces: Piece[];
  history: HistoryEntry[];
  moveQueue: PendingMove[];
  isAnimating: boolean;
  currentAnimation: PendingMove | null;
  animationId: number;
  moveSpeed: number;
  solved: boolean;
  scrambleMoves: MoveString[];
  practiceStart: PracticeStart | null;

  applyMove: (move: MoveString) => void;
  applyAlgorithm: (moves: MoveString[]) => void;
  processNextMove: () => void;
  onAnimationComplete: () => void;
  scramble: (length?: number) => void;
  applyScramble: (moves: MoveString[]) => void;
  reset: () => void;
  undo: () => void;
  setMoveSpeed: (speed: number) => void;
  getInverseAlgorithm: () => MoveString[];
  loadPosition: (moves: MoveString[]) => void;
  startPractice: () => void;
  clearPractice: () => void;
  resetToPracticeStart: () => void;
}

type PersistedCube = Pick<CubeStore, 'moveSpeed' | 'state' | 'pieces' | 'scrambleMoves'>;

const FACES = ['U', 'D', 'F', 'B', 'L', 'R'] as const;

function isValidState(value: unknown): value is CubeState {
  if (!value || typeof value !== 'object') return false;
  const faces = value as Record<string, unknown>;
  return FACES.every((face) => {
    const grid = faces[face];
    return (
      Array.isArray(grid) &&
      grid.length === 3 &&
      grid.every((row) => Array.isArray(row) && row.length === 3 && row.every((c) => typeof c === 'string'))
    );
  });
}

function isValidPieces(value: unknown): value is Piece[] {
  return (
    Array.isArray(value) &&
    value.length === 26 &&
    value.every(
      (p) =>
        p &&
        typeof p.id === 'number' &&
        Array.isArray(p.position) &&
        p.position.length === 3 &&
        Array.isArray(p.stickers) &&
        p.stickers.every((s: unknown) => {
          const sticker = s as { dir?: unknown; color?: unknown };
          return Array.isArray(sticker.dir) && sticker.dir.length === 3 && typeof sticker.color === 'string';
        }),
    )
  );
}

function parseMove(move: MoveString): PendingMove {
  return { move, spec: moveSpec(move) };
}

export const useCubeStore = create<CubeStore>()(
  persist(
    (set, get) => ({
      state: cloneState(SOLVED_STATE),
      pieces: buildSolvedPieces(),
      history: [],
      moveQueue: [],
      isAnimating: false,
      currentAnimation: null,
      animationId: 0,
      moveSpeed: 1,
      solved: true,
      scrambleMoves: [],
      practiceStart: null,

      applyMove: (move) => {
        const { moveQueue, isAnimating, animationId } = get();
        const pending = parseMove(move);

        if (isAnimating || moveQueue.length > 0) {
          set({ moveQueue: [...moveQueue, pending] });
        } else {
          set({ currentAnimation: pending, isAnimating: true, animationId: animationId + 1 });
        }
      },

      applyAlgorithm: (moves) => {
        const { moveQueue, isAnimating, animationId } = get();
        const pendingMoves = moves.map(parseMove);

        if (isAnimating || moveQueue.length > 0) {
          set({ moveQueue: [...moveQueue, ...pendingMoves] });
        } else {
          const [first, ...rest] = pendingMoves;
          set({
            currentAnimation: first,
            isAnimating: true,
            animationId: animationId + 1,
            moveQueue: rest,
          });
        }
      },

      processNextMove: () => {
        const { moveQueue, animationId } = get();
        if (moveQueue.length === 0) {
          set({ isAnimating: false, currentAnimation: null });
          return;
        }
        const [next, ...rest] = moveQueue;
        set({ currentAnimation: next, moveQueue: rest, animationId: animationId + 1 });
      },

      onAnimationComplete: () => {
        const { state, pieces, history, currentAnimation } = get();
        if (!currentAnimation) return;

        const newState = applyMove(state, currentAnimation.move);
        const newPieces = applyMoveToPieces(pieces, currentAnimation.spec);
        const newHistory = [
          ...history,
          { state: cloneState(state), pieces: clonePieces(pieces), move: currentAnimation.move },
        ];

        set({
          state: newState,
          pieces: newPieces,
          history: newHistory,
          solved: isSolved(newState),
        });

        get().processNextMove();
      },

      scramble: (length = 20) => {
        const moves = generateScramble(length);
        const newState = applyMoves(cloneState(SOLVED_STATE), moves);
        const newPieces = piecesForMoves(moves);
        set({
          state: newState,
          pieces: newPieces,
          history: [],
          scrambleMoves: moves,
          solved: false,
          moveQueue: [],
          currentAnimation: null,
          animationId: 0,
          isAnimating: false,
          practiceStart: null,
        });
      },

      applyScramble: (moves) => {
        const newState = applyMoves(cloneState(SOLVED_STATE), moves);
        const newPieces = piecesForMoves(moves);
        set({
          state: newState,
          pieces: newPieces,
          history: [],
          scrambleMoves: moves,
          solved: false,
          moveQueue: [],
          currentAnimation: null,
          animationId: 0,
          isAnimating: false,
          practiceStart: null,
        });
      },

      reset: () => {
        set({
          state: cloneState(SOLVED_STATE),
          pieces: buildSolvedPieces(),
          history: [],
          solved: true,
          scrambleMoves: [],
          moveQueue: [],
          currentAnimation: null,
          animationId: 0,
          isAnimating: false,
          practiceStart: null,
        });
      },

      undo: () => {
        const { history, isAnimating } = get();
        if (isAnimating) return;
        if (history.length === 0) return;
        const last = history[history.length - 1];
        set({
          state: last.state,
          pieces: last.pieces,
          history: history.slice(0, -1),
          solved: isSolved(last.state),
        });
      },

      setMoveSpeed: (speed) => set({ moveSpeed: speed }),

      getInverseAlgorithm: () => {
        const { history } = get();
        return invertAlgorithm(history.map((entry) => entry.move));
      },

      loadPosition: (moves) => {
        const newState = applyMoves(cloneState(SOLVED_STATE), moves);
        set({
          state: newState,
          pieces: piecesForMoves(moves),
          history: [],
          solved: isSolved(newState),
          moveQueue: [],
          currentAnimation: null,
          animationId: 0,
          isAnimating: false,
          practiceStart: null,
        });
      },

      startPractice: () => {
        const { state, pieces } = get();
        set({
          practiceStart: { state: cloneState(state), pieces: clonePieces(pieces) },
        });
      },

      clearPractice: () => set({ practiceStart: null }),

      resetToPracticeStart: () => {
        const { practiceStart } = get();
        if (!practiceStart) return;
        set({
          state: cloneState(practiceStart.state),
          pieces: clonePieces(practiceStart.pieces),
          history: [],
          solved: isSolved(practiceStart.state),
          moveQueue: [],
          currentAnimation: null,
          isAnimating: false,
          animationId: 0,
        });
      },
    }),
    {
      name: 'rubiks-solver',
      version: 1,
      partialize: (s) => ({
        moveSpeed: s.moveSpeed,
        state: s.state,
        pieces: s.pieces,
        scrambleMoves: s.scrambleMoves,
      }),
      migrate: (persisted) => {
        const moveSpeed = (persisted as Partial<PersistedCube> | null)?.moveSpeed;
        return typeof moveSpeed === 'number' ? { moveSpeed } : {};
      },
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<PersistedCube>;
        const moveSpeed = typeof saved.moveSpeed === 'number' ? saved.moveSpeed : current.moveSpeed;
        if (!isValidState(saved.state) || !isValidPieces(saved.pieces)) {
          return { ...current, moveSpeed };
        }
        return {
          ...current,
          moveSpeed,
          state: saved.state,
          pieces: saved.pieces,
          scrambleMoves: Array.isArray(saved.scrambleMoves) ? saved.scrambleMoves : [],
          solved: isSolved(saved.state),
        };
      },
    },
  ),
);
