import { create } from 'zustand';
import type { CubeState, MoveString, FaceName } from '@/shared/types/cube';
import { SOLVED_STATE } from '@/shared/types/cube';
import { applyMove, applyMoves, cloneState, isSolved } from '@/features/engine/moves';
import { generateScramble } from '@/features/engine/scramble';

interface HistoryEntry {
  state: CubeState;
  move: MoveString;
}

export interface PendingMove {
  move: MoveString;
  face: FaceName;
  direction: 1 | -1 | 2;
}

interface CubeStore {
  state: CubeState;
  history: HistoryEntry[];
  moveQueue: PendingMove[];
  isAnimating: boolean;
  currentAnimation: PendingMove | null;
  moveSpeed: number;
  solved: boolean;
  scrambleMoves: MoveString[];

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
}

function parseMove(moveStr: MoveString): PendingMove {
  const face = moveStr[0] as FaceName;
  let direction: 1 | -1 | 2 = 1;
  if (moveStr.includes("'")) direction = -1;
  else if (moveStr.includes('2')) direction = 2;
  return { move: moveStr, face, direction };
}

export const useCubeStore = create<CubeStore>((set, get) => ({
  state: cloneState(SOLVED_STATE),
  history: [],
  moveQueue: [],
  isAnimating: false,
  currentAnimation: null,
  moveSpeed: 1,
  solved: true,
  scrambleMoves: [],

  applyMove: (move) => {
    const { moveQueue, isAnimating } = get();
    const pending = parseMove(move);

    if (isAnimating || moveQueue.length > 0) {
      set({ moveQueue: [...moveQueue, pending] });
    } else {
      set({ currentAnimation: pending, isAnimating: true });
    }
  },

  applyAlgorithm: (moves) => {
    const { moveQueue, isAnimating } = get();
    const pendingMoves = moves.map(parseMove);

    if (isAnimating || moveQueue.length > 0) {
      set({ moveQueue: [...moveQueue, ...pendingMoves] });
    } else {
      const [first, ...rest] = pendingMoves;
      set({
        currentAnimation: first,
        isAnimating: true,
        moveQueue: rest,
      });
    }
  },

  processNextMove: () => {
    const { moveQueue } = get();
    if (moveQueue.length === 0) {
      set({ isAnimating: false, currentAnimation: null });
      return;
    }
    const [next, ...rest] = moveQueue;
    set({ currentAnimation: next, moveQueue: rest });
  },

  onAnimationComplete: () => {
    const { state, history, currentAnimation } = get();
    if (!currentAnimation) return;

    const newState = applyMove(state, currentAnimation.move);
    const newHistory = [...history, { state: cloneState(state), move: currentAnimation.move }];

    set({
      state: newState,
      history: newHistory,
      solved: isSolved(newState),
    });

    get().processNextMove();
  },

  scramble: (length = 20) => {
    const moves = generateScramble(length);
    const newState = applyMoves(cloneState(SOLVED_STATE), moves);
    set({
      state: newState,
      history: [],
      scrambleMoves: moves,
      solved: false,
      moveQueue: [],
      currentAnimation: null,
      isAnimating: false,
    });
  },

  applyScramble: (moves) => {
    const newState = applyMoves(cloneState(SOLVED_STATE), moves);
    set({
      state: newState,
      history: [],
      scrambleMoves: moves,
      solved: false,
      moveQueue: [],
      currentAnimation: null,
      isAnimating: false,
    });
  },

  reset: () => {
    set({
      state: cloneState(SOLVED_STATE),
      history: [],
      solved: true,
      scrambleMoves: [],
      moveQueue: [],
      currentAnimation: null,
      isAnimating: false,
    });
  },

  undo: () => {
    const { history, isAnimating } = get();
    if (isAnimating) return;
    if (history.length === 0) return;
    const last = history[history.length - 1];
    set({
      state: last.state,
      history: history.slice(0, -1),
      solved: isSolved(last.state),
    });
  },

  setMoveSpeed: (speed) => set({ moveSpeed: speed }),

  getInverseAlgorithm: () => {
    const { history } = get();
    return history.map((entry) => {
      const move = entry.move;
      if (move.includes("'")) return move[0] as MoveString;
      if (move.includes('2')) return move as MoveString;
      return `${move}'` as MoveString;
    }).reverse();
  },
}));
