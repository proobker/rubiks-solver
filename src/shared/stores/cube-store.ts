import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CubeState, MoveString, FaceName } from '@/shared/types/cube';
import { SOLVED_STATE, FACE_TO_AXIS } from '@/shared/types/cube';
import { applyMove, applyMoves, cloneState, isSolved } from '@/features/engine/moves';
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
  return applyMovesToPieces(
    buildSolvedPieces(),
    moves.map((move) => ({
      axis: FACE_TO_AXIS[move[0] as FaceName],
      direction: move.includes("'") ? -1 : move.includes('2') ? 2 : 1,
    })),
  );
}

export interface PendingMove {
  move: MoveString;
  face: FaceName;
  direction: 1 | -1 | 2;
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
  startPractice: () => void;
  clearPractice: () => void;
  resetToPracticeStart: () => void;
}

function parseMove(moveStr: MoveString): PendingMove {
  const face = moveStr[0] as FaceName;
  let direction: 1 | -1 | 2 = 1;
  if (moveStr.includes("'")) direction = -1;
  else if (moveStr.includes('2')) direction = 2;
  return { move: moveStr, face, direction };
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
        const newPieces = applyMoveToPieces(
          pieces,
          FACE_TO_AXIS[currentAnimation.face],
          currentAnimation.direction,
        );
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
        return history
          .map((entry) => {
            const move = entry.move;
            if (move.includes("'")) return move[0] as MoveString;
            if (move.includes('2')) return move as MoveString;
            return `${move}'` as MoveString;
          })
          .reverse();
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
      partialize: (s) => ({ moveSpeed: s.moveSpeed }),
    },
  ),
);
