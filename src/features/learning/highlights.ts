import type { Piece } from '@/features/engine/pieces';
import { pieceAt, stickerColorOn } from '@/features/engine/pieces';

export type HighlightMap = Map<number, { label?: string }>;

export function getStageHighlights(
  stageId: string,
  pieces: Piece[],
  labelForId?: (id: number) => string | undefined,
): HighlightMap {
  const highlights = new Map<number, { label?: string }>();
  const add = (id: number) => {
    const label = labelForId?.(id);
    highlights.set(id, { label });
  };

  switch (stageId) {
    case 'white-cross': {
      const piecesToHighlight = edgeSlots.filter(([x, y, z]) => {
        const piece = pieceAt(pieces, x, y, z);
        if (!piece) return false;
        return ['U', 'D', 'F', 'B'].some((f) => stickerColorOn(piece, f as never) === 'white');
      });
      piecesToHighlight.forEach(([x, y, z]) => {
        const piece = pieceAt(pieces, x, y, z);
        if (piece) add(piece.id);
      });
      break;
    }
    case 'white-corners': {
      cornerSlots
        .filter(([x, y, z]) => {
          const piece = pieceAt(pieces, x, y, z);
          if (!piece) return false;
          return stickerColorOn(piece, 'U') === 'white' || stickerColorOn(piece, 'D') === 'white';
        })
        .forEach(([x, y, z]) => {
          const piece = pieceAt(pieces, x, y, z);
          if (piece) add(piece.id);
        });
      break;
    }
    case 'middle-layer': {
      middleLayerSlots.forEach(([x, y, z]) => {
        const piece = pieceAt(pieces, x, y, z);
        if (piece) add(piece.id);
      });
      break;
    }
    case 'yellow-cross': {
      yellowCrossSlots.forEach(([x, y, z]) => {
        const piece = pieceAt(pieces, x, y, z);
        if (piece) add(piece.id);
      });
      break;
    }
    case 'yellow-face': {
      yellowFaceSlots.forEach(([x, y, z]) => {
        const piece = pieceAt(pieces, x, y, z);
        if (piece) add(piece.id);
      });
      break;
    }
    case 'position-corners': {
      cornerSlots.forEach(([x, y, z]) => {
        const piece = pieceAt(pieces, x, y, z);
        if (piece) add(piece.id);
      });
      break;
    }
    case 'permute-edges': {
      edgeAllSlots.forEach(([x, y, z]) => {
        const piece = pieceAt(pieces, x, y, z);
        if (piece) add(piece.id);
      });
      break;
    }
  }

  return highlights;
}

type Slot = [number, number, number];

const edgeSlots: Slot[] = [
  [0, 1, 1], [0, 1, -1], [1, 1, 0], [-1, 1, 0],
  [0, -1, 1], [0, -1, -1], [1, -1, 0], [-1, -1, 0],
  [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
];

const cornerSlots: Slot[] = [
  [1, 1, 1], [-1, 1, 1], [1, 1, -1], [-1, 1, -1],
  [1, -1, 1], [-1, -1, 1], [1, -1, -1], [-1, -1, -1],
];

const middleLayerSlots: Slot[] = [
  [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
];

const yellowCrossSlots: Slot[] = [
  [0, 1, 1], [0, 1, -1], [1, 1, 0], [-1, 1, 0],
];

const yellowFaceSlots: Slot[] = [
  [1, 1, 1], [-1, 1, 1], [1, 1, -1], [-1, 1, -1],
  [0, 1, 1], [0, 1, -1], [1, 1, 0], [-1, 1, 0],
];

const edgeAllSlots: Slot[] = [
  [0, 1, 1], [0, 1, -1], [1, 1, 0], [-1, 1, 0],
  [0, -1, 1], [0, -1, -1], [1, -1, 0], [-1, -1, 0],
  [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
];
