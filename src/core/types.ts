/**
 * 2차원 보드 상의 행(row), 열(col) 좌표
 */
export interface Coordinate {
  readonly row: number;
  readonly col: number;
}

/**
 * 난이도 프리셋 식별자
 */
export type DifficultyKey = 'beginner' | 'intermediate' | 'expert';

/**
 * 보드 크기 및 지뢰 개수 설정
 */
export interface BoardConfig {
  readonly rows: number;
  readonly cols: number;
  readonly mines: number;
}

/**
 * 난이도 프리셋 메타데이터
 */
export interface DifficultyPreset extends BoardConfig {
  readonly key: DifficultyKey;
  readonly label: string;
  readonly subtitle: string;
}

/**
 * 클래식 지뢰찾기 3대 난이도 프리셋
 * - 초급(Beginner): 9×9 보드, 지뢰 10개
 * - 중급(Intermediate): 16×16 보드, 지뢰 40개
 * - 고급(Expert): 30×16 보드 (가로 30열 × 세로 16행), 지뢰 99개
 */
export const DIFFICULTY_PRESETS: Record<DifficultyKey, DifficultyPreset> = {
  beginner: {
    key: 'beginner',
    label: '초급 (Beginner)',
    subtitle: '9 × 9 · 10 Mines',
    rows: 9,
    cols: 9,
    mines: 10,
  },
  intermediate: {
    key: 'intermediate',
    label: '중급 (Intermediate)',
    subtitle: '16 × 16 · 40 Mines',
    rows: 16,
    cols: 16,
    mines: 40,
  },
  expert: {
    key: 'expert',
    label: '고급 (Expert)',
    subtitle: '30 × 16 · 99 Mines',
    rows: 16,
    cols: 30,
    mines: 99,
  },
};

/**
 * 개별 셀(Cell)의 상태 모델 (Step 01: 보드 설계와 데이터 모델링)
 */
export interface CellState {
  readonly row: number;
  readonly col: number;
  readonly isMine: boolean;
  readonly isRevealed: boolean;
  readonly isFlagged: boolean;
  readonly isQuestioned?: boolean;
  readonly neighborMines: number;
  readonly isExploded?: boolean;
  /**
   * 직전 Flood Fill 탐색에서 몇 번째로 열린 셀인지 나타내는 순서 (1-indexed).
   * BFS(물결 모양 확산)와 DFS(깊이 우선 탐색)의 탐색 순서 차이를 시각화할 때 사용됩니다.
   */
  readonly revealOrder?: number;
}

/**
 * 게임 진행 상태
 * - idle: 첫 클릭 대기 중 (아직 지뢰가 배치되지 않은 상태)
 * - playing: 첫 클릭 이후 게임 진행 중
 * - won: 지뢰가 아닌 모든 안전 칸을 모두 오픈하여 승리
 * - lost: 지뢰를 밟아 게임 오버
 */
export type GameStatus = 'idle' | 'playing' | 'won' | 'lost';

/**
 * 빈 칸 연쇄 확장(Flood Fill)에 사용할 탐색 알고리즘 종류
 * - bfs: 큐(Queue) 기반 너비 우선 탐색
 * - dfs: 재귀(Recursion) 기반 깊이 우선 탐색
 */
export type FloodFillAlgorithm = 'bfs' | 'dfs';

/**
 * Flood Fill 알고리즘 실행 결과 및 성능/탐색 메트릭
 * Step 03 학습을 위해 탐색 순서와 최대 큐/콜스택 크기를 기록합니다.
 */
export interface FloodFillTrace {
  readonly algorithm: FloodFillAlgorithm;
  readonly origin: Coordinate;
  readonly visitedOrder: readonly Coordinate[];
  readonly maxFrontierSize: number;
  readonly cellsRevealed: number;
}

/**
 * UI 렌더링을 위한 불변(Immutable) 게임 상태 스냅샷
 */
export interface GameSnapshot {
  readonly board: readonly (readonly CellState[])[];
  readonly config: BoardConfig;
  readonly status: GameStatus;
  readonly minesGenerated: boolean;
  readonly revealedCount: number;
  readonly flaggedCount: number;
  readonly remainingMines: number;
  readonly safeCellsTotal: number;
  readonly moveCount: number;
  readonly threeBV: number;
  readonly usedFlag: boolean;
  readonly algorithm: FloodFillAlgorithm;
  readonly lastFloodFillTrace: FloodFillTrace | null;
}
