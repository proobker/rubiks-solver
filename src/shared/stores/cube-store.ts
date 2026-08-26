import { create } from 'zustand';
import type { CubeState, MoveString } from '@/shared/types/cube';
import { SOLVED_STATE } from '@/shared/types/cube';
import { applyMove, applyMoves, cloneState, isSolved } from '@/features/engine/moves';
import { generateScramble } from '@/features/engine/scramble';

interface HistoryEntry {
  state: CubeState;
  move: MoveString;
}

interface CubeStore {
  state: CubeState;
  history: HistoryEntry[];
  moveQueue: MoveString[];
  isAnimating: boolean;
  moveSpeed: number;
  solved: boolean;
  scrambleMoves: MoveString[];

  applyMove: (move: MoveString) => void;
  applyAlgorithm: (moves: MoveString[]) => void;
  scramble: (length?: number) => void;
  reset: () => void;
  undo: () => void;
  setAnimating: (animating: boolean) => void;
  setMoveSpeed: (speed: number) => void;
  dequeueMove: () => MoveString | null;
  getInverseAlgorithm: () => MoveString[];
}

export const useCubeStore = create<CubeStore>((set, get) => ({
  state: cloneState(SOLVED_STATE),
  history: [],
  moveQueue: [],
  isAnimating: false,
  moveSpeed: 1,
  solved: true,
  scrambleMoves: [],

  applyMove: (move) => {
    const { state, history } = get();
    const newState = applyMove(state, move);
    set({
      state: newState,
      history: [...history, { state: cloneState(state), move }],
      solved: isSolved(newState),
    });
  },

  applyAlgorithm: (moves) => {
    const { state, history } = get();
    let currentState = cloneState(state);
    const newHistory = [...history];

    for (const move of moves) {
      const prevState = cloneState(currentState);
      currentState = applyMove(currentState, move);
      newHistory.push({ state: prevState, move });
    }

    set({
      state: currentState,
      history: newHistory,
      solved: isSolved(currentState),
    });
  },

  scramble: (length = 20) => {
    const moves = generateScramble(length);
    const newState = applyMoves(cloneState(SOLVED_STATE), moves);
    set({
      state: newState,
      history: [],
      scrambleMoves: moves,
      solved: false,
    });
  },

  reset: () => {
    set({
      state: cloneState(SOLVED_STATE),
      history: [],
      solved: true,
      scrambleMoves: [],
    });
  },

  undo: () => {
    const { history } = get();
    if (history.length === 0) return;
    const last = history[history.length - 1];
    set({
      state: last.state,
      history: history.slice(0, -1),
      solved: isSolved(last.state),
    });
  },

  setAnimating: (animating) => set({ isAnimating: animating }),

  setMoveSpeed: (speed) => set({ moveSpeed: speed }),

  dequeueMove: () => {
    const { moveQueue } = get();
    if (moveQueue.length === 0) return null;
    const [next, ...rest] = moveQueue;
    set({ moveQueue: rest });
    return next;
  },

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
