import type { BoardConfig, CellState, Coordinate } from './types';
import { getNeighbors, isWithinSafeZone } from '../utils/directions';
import { fisherYatesShuffle, type RandomGenerator } from '../utils/random';

/**
 * Step 01: 초기 빈 2차원 보드를 생성합니다.
 * 첫 클릭 전까지는 지뢰를 배치하지 않고(Lazy Evaluation) 모든 셀을 안전 상태로 초기화합니다.
 */
export function createEmptyBoard(config: BoardConfig): CellState[][] {
  const { rows, cols } = config;
  return Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col): CellState => ({
      row,
      col,
      isMine: false,
      isRevealed: false,
      isFlagged: false,
      neighborMines: 0,
    }))
  );
}

/**
 * 불변성(Immutability) 유지를 위해 2차원 보드를 깊은 복사하고,
 * 직전 턴의 revealOrder 시각화를 선택적으로 초기화합니다.
 */
export function cloneBoard(
  board: readonly (readonly CellState[])[],
  clearRevealOrder = false
): CellState[][] {
  return board.map((row) =>
    row.map((cell) => {
      if (clearRevealOrder && cell.revealOrder !== undefined) {
        const { revealOrder: _, ...rest } = cell;
        return { ...rest };
      }
      return { ...cell };
    })
  );
}

/**
 * Step 02: 각 셀 주변 8방향의 지뢰 개수(neighborMines)를 계산합니다.
 */
export function calculateNeighborMines(board: CellState[][]): void {
  const rows = board.length;
  const cols = board[0]?.length ?? 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const current = board[r]![c]!;
      if (current.isMine) {
        board[r]![c] = { ...current, neighborMines: 0 };
        continue;
      }

      const neighbors = getNeighbors(r, c, rows, cols);
      let mineCount = 0;
      for (const n of neighbors) {
        if (board[n.row]![n.col]!.isMine) {
          mineCount++;
        }
      }
      board[r]![c] = { ...current, neighborMines: mineCount };
    }
  }
}

/**
 * Step 02 & Step 04: 첫 클릭 안전 보장(First-Click Safe) 지뢰 배치
 *
 * 1. 첫 번째로 클릭한 셀(safeCoord)과 그 주변 8칸(3×3 구역)을 지뢰 후보군에서 제외합니다.
 * 2. 남은 후보 좌표를 Fisher-Yates 알고리즘으로 셔플한 뒤 앞에서부터 mines개만큼 선택합니다.
 * 3. 모든 셀에 대해 8방향 인접 지뢰 수를 계산합니다.
 */
export function populateMines(
  board: readonly (readonly CellState[])[],
  config: BoardConfig,
  safeCoord: Coordinate,
  rng: RandomGenerator = Math.random
): CellState[][] {
  const { rows, cols, mines } = config;
  const nextBoard = cloneBoard(board, true);

  // 1차 후보군: 첫 클릭 셀과 주변 8칸(반경 1)을 모두 제외한 좌표
  const primaryCandidates: Coordinate[] = [];
  // 보조 후보군: 보드가 매우 작아 3x3 제외 시 지뢰 공간이 부족할 때만 사용하는 주변 8칸
  const fallbackRingCandidates: Coordinate[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (r === safeCoord.row && c === safeCoord.col) {
        continue; // 첫 클릭 셀은 어떤 경우에도 지뢰 배치 금지
      }
      if (isWithinSafeZone(r, c, safeCoord.row, safeCoord.col, 1)) {
        fallbackRingCandidates.push({ row: r, col: c });
      } else {
        primaryCandidates.push({ row: r, col: c });
      }
    }
  }

  const shuffledPrimary = fisherYatesShuffle(primaryCandidates, rng);
  const selectedMines: Coordinate[] = shuffledPrimary.slice(0, mines);

  // 만약 커스텀 소형 보드에서 지뢰 수가 primaryCandidates보다 많다면 주변 8칸에서 부족분만 충원
  if (selectedMines.length < mines) {
    const needed = mines - selectedMines.length;
    const shuffledFallback = fisherYatesShuffle(fallbackRingCandidates, rng);
    selectedMines.push(...shuffledFallback.slice(0, needed));
  }

  for (const { row, col } of selectedMines) {
    nextBoard[row]![col] = {
      ...nextBoard[row]![col]!,
      isMine: true,
    };
  }

  calculateNeighborMines(nextBoard);
  return nextBoard;
}

/**
 * 3BV (Bechtel's Board Benchmark Value) 계산
 * 깃발 없이 좌클릭만으로 보드를 클리어하기 위해 필요한 최소 클릭 수입니다.
 * 1) 연결된 빈 칸(0) 덩어리(오프닝)마다 1회 클릭 (주변 숫자까지 함께 열림)
 * 2) 어떤 0-오프닝에도 속하지 않은 나머지 안전 숫자 셀마다 1회 클릭
 */
export function calculate3BV(board: readonly (readonly CellState[])[]): number {
  const rows = board.length;
  const cols = board[0]?.length ?? 0;
  if (rows === 0 || cols === 0) return 0;

  const marked: boolean[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => false)
  );
  let count = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = board[r]![c]!;
      if (cell.isMine || cell.neighborMines !== 0 || marked[r]![c]) {
        continue;
      }

      // 새로운 0-오프닝 영역 발견 -> 1회 클릭으로 취급하고 연결된 안전 영역 마킹
      count++;
      const queue: Coordinate[] = [{ row: r, col: c }];
      marked[r]![c] = true;
      let head = 0;

      while (head < queue.length) {
        const curr = queue[head++]!;
        const currCell = board[curr.row]![curr.col]!;
        if (currCell.neighborMines !== 0) continue;

        for (const n of getNeighbors(curr.row, curr.col, rows, cols)) {
          const neighborCell = board[n.row]![n.col]!;
          if (!neighborCell.isMine && !marked[n.row]![n.col]) {
            marked[n.row]![n.col] = true;
            if (neighborCell.neighborMines === 0) {
              queue.push(n);
            }
          }
        }
      }
    }
  }

  // 어떤 0-오프닝에도 포함되지 않은 독립 안전 숫자 셀 카운트
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = board[r]![c]!;
      if (!cell.isMine && !marked[r]![c]) {
        count++;
      }
    }
  }

  return count;
}
