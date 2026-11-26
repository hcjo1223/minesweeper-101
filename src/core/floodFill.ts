import type {
  CellState,
  Coordinate,
  FloodFillAlgorithm,
  FloodFillTrace,
} from './types';
import { getNeighbors } from '../utils/directions';

/**
 * Step 03: 큐(Queue) 기반 너비 우선 탐색(BFS) Flood Fill
 *
 * - 시작 셀로부터 물결이 퍼져나가듯 거리순(동심원 형태)으로 안전 구역을 확장합니다.
 * - 콜 스택(Call Stack) 대신 힙 메모리의 큐 배열을 사용하므로 보드가 아무리 커도
 *   Maximum call stack size exceeded (Stack Overflow)가 발생하지 않습니다.
 */
export function floodFillBFS(
  board: CellState[][],
  origin: Coordinate
): FloodFillTrace {
  const rows = board.length;
  const cols = board[0]?.length ?? 0;
  const visitedOrder: Coordinate[] = [];

  const startCell = board[origin.row]?.[origin.col];
  if (!startCell || startCell.isRevealed || startCell.isFlagged || startCell.isMine) {
    return {
      algorithm: 'bfs',
      origin,
      visitedOrder,
      maxFrontierSize: 0,
      cellsRevealed: 0,
    };
  }

  const queue: Coordinate[] = [origin];
  let head = 0;
  let maxFrontierSize = 1;

  // 큐에 중복 삽입을 방지하기 위해 시작 셀을 즉시 오픈 처리
  let stepOrder = 1;
  board[origin.row]![origin.col] = {
    ...startCell,
    isRevealed: true,
    revealOrder: stepOrder++,
  };
  visitedOrder.push(origin);

  while (head < queue.length) {
    const activeQueueSize = queue.length - head;
    if (activeQueueSize > maxFrontierSize) {
      maxFrontierSize = activeQueueSize;
    }

    const current = queue[head++]!;
    const currentCell = board[current.row]![current.col]!;

    // 인접 지뢰 수가 0인 빈 칸일 때만 주변 8방향 이웃으로 연쇄 확장을 이어갑니다.
    if (currentCell.neighborMines === 0) {
      const neighbors = getNeighbors(current.row, current.col, rows, cols);
      for (const neighbor of neighbors) {
        const neighborCell = board[neighbor.row]![neighbor.col]!;
        if (
          !neighborCell.isRevealed &&
          !neighborCell.isFlagged &&
          !neighborCell.isMine
        ) {
          board[neighbor.row]![neighbor.col] = {
            ...neighborCell,
            isRevealed: true,
            revealOrder: stepOrder++,
          };
          visitedOrder.push(neighbor);

          if (neighborCell.neighborMines === 0) {
            queue.push(neighbor);
          }
        }
      }
    }
  }

  return {
    algorithm: 'bfs',
    origin,
    visitedOrder,
    maxFrontierSize,
    cellsRevealed: visitedOrder.length,
  };
}

/**
 * Step 03: 재귀(Recursion) 기반 깊이 우선 탐색(DFS) Flood Fill
 *
 * - 한 방향 끝까지 깊숙이 파고든 뒤 백트래킹(Backtracking)하며 빈 칸을 엽니다.
 * - 코드가 직관적이고 간결하지만, 최악의 경우 열린 셀 개수(R × C)만큼
 *   재귀 호출 스택(Call Stack Depth)이 깊어질 수 있습니다.
 */
export function floodFillDFS(
  board: CellState[][],
  origin: Coordinate
): FloodFillTrace {
  const rows = board.length;
  const cols = board[0]?.length ?? 0;
  const visitedOrder: Coordinate[] = [];
  let maxStackDepth = 0;
  let stepOrder = 1;

  function dfs(coord: Coordinate, depth: number): void {
    const cell = board[coord.row]?.[coord.col];
    if (!cell || cell.isRevealed || cell.isFlagged || cell.isMine) {
      return;
    }

    if (depth > maxStackDepth) {
      maxStackDepth = depth;
    }

    board[coord.row]![coord.col] = {
      ...cell,
      isRevealed: true,
      revealOrder: stepOrder++,
    };
    visitedOrder.push(coord);

    // 숫자 셀(neighborMines > 0)은 자신만 열고 더 이상 재귀 확장하지 않음 (경계벽 역할)
    if (cell.neighborMines > 0) {
      return;
    }

    const neighbors = getNeighbors(coord.row, coord.col, rows, cols);
    for (const neighbor of neighbors) {
      const nextCell = board[neighbor.row]![neighbor.col]!;
      if (!nextCell.isRevealed && !nextCell.isFlagged && !nextCell.isMine) {
        dfs(neighbor, depth + 1);
      }
    }
  }

  dfs(origin, 1);

  return {
    algorithm: 'dfs',
    origin,
    visitedOrder,
    maxFrontierSize: maxStackDepth,
    cellsRevealed: visitedOrder.length,
  };
}

/**
 * 선택된 알고리즘(BFS 또는 DFS)으로 Flood Fill을 수행합니다.
 */
export function runFloodFill(
  board: CellState[][],
  origin: Coordinate,
  algorithm: FloodFillAlgorithm = 'bfs'
): FloodFillTrace {
  return algorithm === 'dfs'
    ? floodFillDFS(board, origin)
    : floodFillBFS(board, origin);
}
