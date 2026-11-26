import type { Coordinate } from '../core/types';

/**
 * 8방향 탐색을 위한 방향 벡터 (상좌, 상, 상우, 좌, 우, 하좌, 하, 하우)
 * Step 02: 지뢰 배치와 8방향 탐색에서 사용하는 핵심 상수입니다.
 */
export const DIRECTIONS_8: readonly [number, number][] = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
] as const;

/**
 * 주어진 (row, col) 좌표가 2차원 보드 경계 내부에 있는지 판별합니다.
 */
export function isValidCoord(
  row: number,
  col: number,
  rows: number,
  cols: number
): boolean {
  return row >= 0 && row < rows && col >= 0 && col < cols;
}

/**
 * 특정 셀 (row, col)을 둘러싼 유효한 8방향 이웃 좌표 목록을 반환합니다.
 * 모서리(3개), 변(5개), 내부(8개) 등 경계 조건을 안전하게 처리합니다.
 */
export function getNeighbors(
  row: number,
  col: number,
  rows: number,
  cols: number
): Coordinate[] {
  const neighbors: Coordinate[] = [];
  for (const [dr, dc] of DIRECTIONS_8) {
    const nr = row + dr;
    const nc = col + dc;
    if (isValidCoord(nr, nc, rows, cols)) {
      neighbors.push({ row: nr, col: nc });
    }
  }
  return neighbors;
}

/**
 * 첫 클릭 보호(First-Click Safe) 판정:
 * 첫 클릭한 셀 (safeRow, safeCol)과 체비쇼프 거리(Chebyshev distance)가 radius 이하인
 * 주변 8칸(총 3x3 영역)인지 확인합니다.
 */
export function isWithinSafeZone(
  row: number,
  col: number,
  safeRow: number,
  safeCol: number,
  radius = 1
): boolean {
  return (
    Math.abs(row - safeRow) <= radius && Math.abs(col - safeCol) <= radius
  );
}
