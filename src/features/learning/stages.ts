export interface AlgorithmCase {
  id: string;
  name: string;
  pattern: string;
  moves: string;
  description: string;
}

export interface Algorithm {
  id: string;
  notation: string;
  description: string;
  cases?: AlgorithmCase[];
}

export interface LearningStage {
  id: string;
  name: string;
  description: string;
  order: number;
  goal: string;
  algorithms: Algorithm[];
  prerequisite?: string;
}

export const BEGINNER_STAGES: LearningStage[] = [
  {
    id: 'white-cross',
    name: 'White Cross',
    description: 'Form a white cross on the white face with correct edge colors matching the center pieces.',
    order: 1,
    goal: 'The white face shows a + shape, and each edge piece matches the center color of the adjacent face.',
    algorithms: [],
  },
  {
    id: 'white-corners',
    name: 'White Corners',
    description: 'Insert the four white corner pieces to complete the first layer.',
    order: 2,
    goal: 'The entire white face is complete, and the first layer side colors match their center pieces.',
    algorithms: [
      {
        id: 'right-insert',
        notation: "R U R' U'",
        description: 'Insert a white corner from the bottom-right position into the top layer.',
      },
      {
        id: 'left-insert',
        notation: "L' U' L U",
        description: 'Insert a white corner from the bottom-left position into the top layer.',
      },
    ],
    prerequisite: 'white-cross',
  },
  {
    id: 'middle-layer',
    name: 'Middle Layer Edges',
    description: 'Insert the four middle layer edge pieces without disturbing the completed first layer.',
    order: 3,
    goal: 'The first two layers (F2L) are complete — white face done and middle ring of colors matches centers.',
    algorithms: [
      {
        id: 'insert-right',
        notation: "U R U' R' U' F' U F",
        description: 'Insert an edge piece from the top layer into the middle layer on the right side.',
      },
      {
        id: 'insert-left',
        notation: "U' L' U L U F U' F'",
        description: 'Insert an edge piece from the top layer into the middle layer on the left side.',
      },
    ],
    prerequisite: 'white-corners',
  },
  {
    id: 'yellow-cross',
    name: 'Yellow Cross',
    description: 'Form a yellow cross on the yellow face (top).',
    order: 4,
    goal: 'The yellow face shows a + shape. Corner orientation does not matter yet.',
    algorithms: [
      {
        id: 'edge-flip',
        notation: "F R U R' U' F'",
        description: 'Orients the yellow edges. Apply 1-3 times depending on the starting pattern.',
        cases: [
          { id: 'dot', name: 'Dot', pattern: '•', moves: 'F R U R\' U\' F\' (×2-3)', description: 'No edges oriented — apply algorithm twice.' },
          { id: 'l-shape', name: 'L-Shape', pattern: '┗', moves: 'F R U R\' U\' F\'', description: 'Two adjacent edges oriented — hold L in top-left and apply once.' },
          { id: 'line', name: 'Line', pattern: '—', moves: 'F R U R\' U\' F\'', description: 'Two opposite edges oriented — hold line horizontal and apply once.' },
        ],
      },
    ],
    prerequisite: 'middle-layer',
  },
  {
    id: 'yellow-face',
    name: 'Yellow Face',
    description: 'Orient all yellow stickers on the yellow face so the entire face is solid yellow.',
    order: 5,
    goal: 'The entire yellow face is yellow. Side colors of the last layer may still be incorrect.',
    algorithms: [
      {
        id: 'sune',
        notation: "R U R' U R U2 R'",
        description: 'Orients corners. Apply 1-2 times with correct positioning.',
        cases: [
          { id: 'sune', name: 'Sune', pattern: 'fish', moves: 'R U R\' U R U2 R\'', description: 'One corner oriented — hold the oriented corner at front-left.' },
          { id: 'antisune', name: 'Anti-Sune', pattern: 'fish-rev', moves: 'R U2 R\' U\' R U\' R\'', description: 'Mirror case — one corner oriented, different angle.' },
        ],
      },
    ],
    prerequisite: 'yellow-cross',
  },
  {
    id: 'position-corners',
    name: 'Position Yellow Corners',
    description: 'Move the yellow corner pieces to their correct positions (permutation).',
    order: 6,
    goal: 'Each yellow corner is in its correct position, though they may need to be twisted.',
    algorithms: [
      {
        id: 'corner-cycle',
        notation: "U R U' L' U R' U' L",
        description: 'Cycles three corners clockwise. Apply 1-2 times to position all corners.',
      },
    ],
    prerequisite: 'yellow-face',
  },
  {
    id: 'permute-edges',
    name: 'Permute Yellow Edges',
    description: 'Cycle the yellow edge pieces to their final correct positions to complete the cube.',
    order: 7,
    goal: 'The entire cube is solved!',
    algorithms: [
      {
        id: 'edge-cycle',
        notation: "R U' R U R U R U' R' U' R2",
        description: 'Cycles three edges clockwise. Apply 1-2 times to solve.',
        cases: [
          { id: 'clockwise', name: 'Clockwise', pattern: '→', moves: 'R U\' R U R U R U\' R\' U\' R2', description: 'Three edges need clockwise rotation.' },
          { id: 'counter-clockwise', name: 'Counter-clockwise', pattern: '←', moves: 'R2 U R U R\' U\' R\' U\' R\' U R\'', description: 'Three edges need counter-clockwise rotation.' },
        ],
      },
    ],
    prerequisite: 'position-corners',
  },
];
