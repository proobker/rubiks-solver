import { describe, expect, it } from 'vitest';
import { MOVE_BASES, SOLVED_STATE, type MoveBase, type MoveString } from '@/shared/types/cube';
import { applyMove, applyMoves, invertAlgorithm, invertMove, isSolved, parseAlgorithm } from './moves';
import { applyMovesToPieces, buildSolvedPieces, piecesToState } from './pieces';
import { generateScramble } from './scramble';
import { applyFaceletMoves, piecesToFacelets, solvedFacelets } from '@/features/learning/facelets';

const EVERY_MOVE: MoveString[] = (Object.keys(MOVE_BASES) as MoveBase[]).flatMap(
  (base) => [base, `${base}'`, `${base}2`] as MoveString[],
);

function randomMoves(length: number): MoveString[] {
  return Array.from({ length }, () => EVERY_MOVE[Math.floor(Math.random() * EVERY_MOVE.length)]);
}

describe('grid engine', () => {
  it.each(EVERY_MOVE)('%s followed by its inverse returns to solved', (move) => {
    expect(isSolved(applyMoves(SOLVED_STATE, [move, invertMove(move)]))).toBe(true);
  });

  it.each(EVERY_MOVE)('%s applied four times is the identity', (move) => {
    expect(applyMoves(SOLVED_STATE, [move, move, move, move])).toEqual(SOLVED_STATE);
  });

  it('a single outer turn leaves the cube unsolved', () => {
    expect(isSolved(applyMove(SOLVED_STATE, 'R'))).toBe(false);
  });

  it('undoes a random scramble with its inverted algorithm', () => {
    for (let i = 0; i < 50; i++) {
      const moves = randomMoves(30);
      expect(isSolved(applyMoves(applyMoves(SOLVED_STATE, moves), invertAlgorithm(moves)))).toBe(true);
    }
  });

  it('generates scrambles without consecutive same-face turns', () => {
    const scramble = generateScramble(25);
    expect(scramble).toHaveLength(25);
    for (let i = 1; i < scramble.length; i++) expect(scramble[i][0]).not.toBe(scramble[i - 1][0]);
  });
});

describe('parseAlgorithm', () => {
  it('parses wide, slice, rotation and Singmaster variants', () => {
    expect(parseAlgorithm("R U' Rw2 M E' S2 x y' z2 R2'")).toEqual(['R', "U'", 'r2', 'M', "E'", 'S2', 'x', "y'", 'z2', 'R2']);
  });

  it('returns an empty list for blank input', () => {
    expect(parseAlgorithm('   ')).toEqual([]);
  });

  it('rejects invalid tokens', () => {
    expect(() => parseAlgorithm('R Q')).toThrow();
    expect(() => parseAlgorithm('Mw')).toThrow();
  });
});

describe('grid and piece model stay in sync', () => {
  it.each(EVERY_MOVE)('%s produces the same colors in both models', (move) => {
    const pieces = applyMovesToPieces(buildSolvedPieces(), [move]);
    expect(piecesToState(pieces)).toEqual(applyMove(SOLVED_STATE, move));
  });

  it('matches after long random sequences of every move type', () => {
    for (let i = 0; i < 50; i++) {
      const moves = randomMoves(40);
      const pieces = applyMovesToPieces(buildSolvedPieces(), moves);
      expect(piecesToState(pieces)).toEqual(applyMoves(SOLVED_STATE, moves));
    }
  });

  it('matches the facelet engine used by the learning features', () => {
    for (let i = 0; i < 50; i++) {
      const moves = randomMoves(40);
      const pieces = applyMovesToPieces(buildSolvedPieces(), moves);
      expect(piecesToFacelets(pieces)).toEqual(applyFaceletMoves(solvedFacelets(), moves));
    }
  });
});
