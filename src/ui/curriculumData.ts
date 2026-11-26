export interface CurriculumStep {
  readonly stepNumber: string;
  readonly title: string;
  readonly docFile: string;
  readonly sourceFile: string;
  readonly keywords: readonly string[];
  readonly summary: string;
  readonly keyInsight: string;
  readonly codeSnippet: string;
}

export const CURRICULUM_STEPS: readonly CurriculumStep[] = [
  {
    stepNumber: 'Step 01',
    title: '보드 설계와 데이터 모델링',
    docFile: 'docs/01-board-modeling.md',
    sourceFile: 'src/core/types.ts',
    keywords: ['2D Grid', 'CellState', 'Immutability'],
    summary:
      '지뢰찾기 보드를 단순 2차원 숫자 배열이 아닌 명시적 상태 객체(CellState)의 2차원 배열로 모델링하여 렌더링과 비즈니스 로직의 결합도를 낮춥니다.',
    keyInsight:
      'isMine(데이터)과 isRevealed/isFlagged(표현 상태)를 분리하면 첫 클릭 전까지 지뢰 생성을 지연(Lazy Evaluation)시키거나 불변 스냅샷을 만들기가 매우 쉬워집니다.',
    codeSnippet: `export interface CellState {
  readonly row: number;
  readonly col: number;
  readonly isMine: boolean;
  readonly isRevealed: boolean;
  readonly isFlagged: boolean;
  readonly neighborMines: number;
  readonly revealOrder?: number;
}`,
  },
  {
    stepNumber: 'Step 02',
    title: '지뢰 배치와 8방향 탐색',
    docFile: 'docs/02-mine-placement.md',
    sourceFile: 'src/core/board.ts',
    keywords: ['Fisher-Yates Shuffle', '8-Way Vector (dx, dy)', 'Boundary Check'],
    summary:
      '랜덤 좌표를 반복 뽑는 while 루프 대신 Fisher-Yates 셔플로 O(N) 시간에 중복 없이 지뢰를 배치하고, 8방향 벡터(DIRECTIONS_8)로 인접 지뢰 수를 계산합니다.',
    keyInsight:
      'if문 8개를 나열하는 대신 DIRECTIONS_8 상수 배열을 순회하며 경계값(0 <= r < rows && 0 <= c < cols)을 검사하면 코드가 간결해지고 오타 버그가 사라집니다.',
    codeSnippet: `export const DIRECTIONS_8 = [
  [-1, -1], [-1, 0], [-1, 1],
  [ 0, -1],          [ 0, 1],
  [ 1, -1], [ 1, 0], [ 1, 1],
] as const;

// Fisher-Yates O(N) 균등 셔플 후 상위 mines개 선택
const shuffled = fisherYatesShuffle(candidates, rng);
const selectedMines = shuffled.slice(0, mines);`,
  },
  {
    stepNumber: 'Step 03',
    title: '빈 칸 연쇄 확장 알고리즘 (Flood Fill)',
    docFile: 'docs/03-flood-fill.md',
    sourceFile: 'src/core/floodFill.ts',
    keywords: ['Flood Fill', 'Queue BFS vs Recursive DFS', 'Call Stack'],
    summary:
      '인접 지뢰가 0인 빈 칸을 클릭했을 때 주변 안전 구역을 자동으로 여는 Flood Fill을 큐 기반 BFS와 재귀 기반 DFS 두 가지 방식으로 구현하고 비교합니다.',
    keyInsight:
      'BFS는 시작점부터 물결처럼 동심원으로 퍼지며 힙 메모리 큐를 사용해 스택 오버플로가 없습니다. 반면 DFS는 한 방향 끝까지 파고들며 숫자 셀(neighborMines > 0)을 만나면 경계벽으로 삼아 멈춥니다.',
    codeSnippet: `while (head < queue.length) {
  const curr = queue[head++]!;
  if (board[curr.row][curr.col].neighborMines === 0) {
    for (const next of getNeighbors(curr.row, curr.col, rows, cols)) {
      if (!cell.isRevealed && !cell.isFlagged && !cell.isMine) {
        cell.isRevealed = true;
        if (cell.neighborMines === 0) queue.push(next);
      }
    }
  }
}`,
  },
  {
    stepNumber: 'Step 04',
    title: '게임 루프와 승패 판정',
    docFile: 'docs/04-game-loop.md',
    sourceFile: 'src/core/MinesweeperEngine.ts',
    keywords: ['First-Click Safe', 'Win Condition', 'Chording'],
    summary:
      '첫 클릭 시 클릭 좌표와 주변 8칸(3×3)을 지뢰 후보에서 제외하여 반드시 빈 칸(0)에서 출발하도록 보장하고, 안전 칸 오픈 수로 승리를 판정합니다.',
    keyInsight:
      '승리 조건을 "모든 지뢰에 깃발 꽂기"가 아닌 "열린 안전 칸 수 === 전체 칸 수 - 지뢰 수"로 정의하면 불필요한 깃발 강제 없이 정확한 클리어 판정이 가능합니다.',
    codeSnippet: `// Chebyshev 거리 <= 1 (3x3 영역) 지뢰 배치 제외
export function isWithinSafeZone(r: number, c: number, sr: number, sc: number) {
  return Math.abs(r - sr) <= 1 && Math.abs(c - sc) <= 1;
}

// 승리 조건: 지뢰가 아닌 모든 안전 칸이 열렸는가?
if (revealedSafeCount === rows * cols - mines) {
  this.status = 'won';
}`,
  },
  {
    stepNumber: 'Step 05',
    title: 'UI 분리 및 아키텍처 개선',
    docFile: 'docs/05-architecture.md',
    sourceFile: 'tests/minesweeper.test.ts',
    keywords: ['Headless Engine', 'Dependency Injection', 'Deterministic Test'],
    summary:
      '게임 규칙을 담당하는 MinesweeperEngine(src/core)과 화면을 그리는 React 컴포넌트(src/ui)를 완전히 분리하고 시드 기반 난수 생성기로 단위 테스트를 작성합니다.',
    keyInsight:
      '코어 엔진이 DOM이나 React에 의존하지 않으면 터미널(CLI), Canvas, React 어디서나 재사용할 수 있고, 브라우저 없이 수 밀리초 만에 모든 엣지 케이스를 검증할 수 있습니다.',
    codeSnippet: `// 시드 기반 결정론적 난수 주입으로 100% 재현 가능한 단위 테스트
const engine = new MinesweeperEngine({
  config: DIFFICULTY_PRESETS.beginner,
  rng: createSeededRandom(101),
});
const snapshot = engine.reveal(4, 4);
expect(snapshot.status).toBe('playing');`,
  },
];
