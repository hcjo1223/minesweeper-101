import { getNeighbors } from '../utils/directions';
import type { BoardConfig, CellState, Coordinate } from './types';

export interface PlayerHint {
  readonly coord: Coordinate;
  readonly action: 'reveal' | 'flag' | 'check_flag';
  readonly patternName: string;
  readonly reason: string;
  readonly relatedCells: readonly Coordinate[];
}

interface CellConstraint {
  readonly center: Coordinate;
  readonly number: number;
  readonly remaining: number;
  readonly hidden: readonly Coordinate[];
  readonly hiddenKeys: ReadonlySet<string>;
}

function coordKey(c: Coordinate): string {
  return `${c.row},${c.col}`;
}

function formatPos(c: Coordinate): string {
  return `${c.row + 1}행 ${c.col + 1}열`;
}

/**
 * 지뢰찾기 플레이어 관점의 실전 논리 추론 힌트 엔진
 *
 * 1) 첫 클릭 전: 중앙 부근 추천
 * 2) 기본 확정 규칙:
 *    - 깃발 충족: 주변 깃발 수 == 숫자 -> 나머지 닫힌 칸은 100% 안전
 *    - 확정 지뢰: 남은 지뢰 수 == 닫힌 칸 수 -> 닫힌 칸은 모두 100% 지뢰
 * 3) 고급 패턴 규칙 (부분집합 추론: 1-1 패턴, 1-2 패턴 등)
 * 4) 잘못된 깃발 감지: 플레이어가 잘못 꽂은 깃발 때문에 모순이 생길 경우 깃발 재확인 안내
 */
export function getLogicalPlayerHint(
  board: readonly (readonly CellState[])[],
  config: BoardConfig,
  minesGenerated: boolean,
  fallbackSafeCoord: Coordinate | null
): PlayerHint | null {
  const { rows, cols } = config;

  if (!minesGenerated) {
    const center = {
      row: Math.floor(rows / 2),
      col: Math.floor(cols / 2),
    };
    return {
      coord: center,
      action: 'reveal',
      patternName: '첫 클릭 안전 출발',
      reason:
        '첫 번째로 여는 칸과 주변 8칸(3×3)에는 절대 지뢰가 배치되지 않습니다. 중앙 부근을 눌러 넓은 안전 구역을 먼저 확보해 보세요.',
      relatedCells: [center],
    };
  }

  // 플레이어가 잘못 꽂은 깃발이 있는지 우선 확인 (안전 칸에 깃발을 꽂은 경우)
  const misflaggedCells: Coordinate[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = board[r]![c]!;
      if (cell.isFlagged && !cell.isMine) {
        const hasRevealedNeighbor = getNeighbors(r, c, rows, cols).some(
          (n) => board[n.row]![n.col]!.isRevealed
        );
        if (hasRevealedNeighbor) {
          misflaggedCells.push({ row: r, col: c });
        }
      }
    }
  }

  const constraints: CellConstraint[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = board[r]![c]!;
      if (!cell.isRevealed || cell.isMine || cell.neighborMines <= 0) {
        continue;
      }

      const neighbors = getNeighbors(r, c, rows, cols);
      const flagged = neighbors.filter((n) => board[n.row]![n.col]!.isFlagged);
      const hidden = neighbors.filter((n) => {
        const target = board[n.row]![n.col]!;
        return !target.isRevealed && !target.isFlagged;
      });

      if (hidden.length === 0) {
        continue;
      }

      // 1. 확정 안전 칸 (깃발 수 == 셀의 숫자)
      if (flagged.length === cell.neighborMines) {
        const target = hidden[0]!;
        if (board[target.row]![target.col]!.isMine && misflaggedCells.length > 0) {
          const wrongFlag = misflaggedCells[0]!;
          return {
            coord: wrongFlag,
            action: 'check_flag',
            patternName: '깃발 위치 재확인',
            reason: `${formatPos({ row: r, col: c })} 주변에 잘못 꽂힌 깃발이 있어 계산이 어긋났습니다. ${formatPos(wrongFlag)}의 깃발을 해제하고 주변 숫자를 다시 확인해 보세요.`,
            relatedCells: [{ row: r, col: c }, wrongFlag],
          };
        }

        return {
          coord: target,
          action: 'reveal',
          patternName: '확정 안전 칸 (깃발 충족)',
          reason: `${formatPos({ row: r, col: c })}의 숫자 ${cell.neighborMines} 주변에 이미 깃발 ${flagged.length}개가 모두 꽂혀 있습니다. 따라서 ${formatPos(target)}은 100% 안전합니다. 숫자 ${cell.neighborMines}을 직접 눌러 주변을 한 번에 열 수도 있습니다!`,
          relatedCells: [{ row: r, col: c }, ...flagged],
        };
      }

      // 2. 확정 지뢰 칸 (남은 지뢰 수 == 닫힌 이웃 칸 수)
      const remaining = cell.neighborMines - flagged.length;
      if (remaining > 0 && remaining === hidden.length) {
        const target = hidden[0]!;
        if (!board[target.row]![target.col]!.isMine && misflaggedCells.length > 0) {
          const wrongFlag = misflaggedCells[0]!;
          return {
            coord: wrongFlag,
            action: 'check_flag',
            patternName: '깃발 위치 재확인',
            reason: `${formatPos(wrongFlag)}에 잘못 꽂힌 깃발로 인해 ${formatPos({ row: r, col: c })}의 남은 지뢰 계산에 오차가 생겼습니다. 해당 깃발을 먼저 확인해 주세요.`,
            relatedCells: [{ row: r, col: c }, wrongFlag],
          };
        }

        return {
          coord: target,
          action: 'flag',
          patternName: '확정 지뢰 찾기',
          reason: `${formatPos({ row: r, col: c })}의 숫자 ${cell.neighborMines}에서 아직 찾지 못한 지뢰가 ${remaining}개이고, 닫힌 칸도 딱 ${hidden.length}칸뿐입니다. ${formatPos(target)}은 100% 지뢰이므로 깃발을 꽂으세요!`,
          relatedCells: [{ row: r, col: c }],
        };
      }

      if (remaining > 0) {
        constraints.push({
          center: { row: r, col: c },
          number: cell.neighborMines,
          remaining,
          hidden,
          hiddenKeys: new Set(hidden.map(coordKey)),
        });
      }
    }
  }

  // 3. 두 인접 숫자 비교 (1-1 패턴, 1-2 패턴 등 부분집합 추론)
  for (let i = 0; i < constraints.length; i++) {
    const a = constraints[i]!;
    for (let j = 0; j < constraints.length; j++) {
      if (i === j) continue;
      const b = constraints[j]!;

      if (
        Math.abs(a.center.row - b.center.row) > 2 ||
        Math.abs(a.center.col - b.center.col) > 2
      ) {
        continue;
      }

      if (a.hidden.length >= b.hidden.length) continue;

      const isASubsetOfB = a.hidden.every((coord) =>
        b.hiddenKeys.has(coordKey(coord))
      );
      if (!isASubsetOfB) continue;

      const diff = b.hidden.filter((coord) => !a.hiddenKeys.has(coordKey(coord)));
      if (diff.length === 0) continue;

      const target = diff[0]!;

      // 3-A. B와 A의 남은 지뢰 수가 같으면, 바깥쪽 diff는 모두 안전! (예: 1-1 패턴)
      if (b.remaining === a.remaining && !board[target.row]![target.col]!.isMine) {
        const isOneOne = a.remaining === 1 && b.remaining === 1;
        return {
          coord: target,
          action: 'reveal',
          patternName: isOneOne ? '1-1 패턴 (확정 안전)' : '연계 숫자 안전 추론',
          reason: `${formatPos(a.center)}(남은 지뢰 ${a.remaining})의 닫힌 칸들이 ${formatPos(b.center)}(남은 지뢰 ${b.remaining}) 영역 안에 모두 포함됩니다. 공유 구역에 지뢰가 다 들어가므로 바깥쪽 ${formatPos(target)}은 100% 안전합니다!`,
          relatedCells: [a.center, b.center],
        };
      }

      // 3-B. (B 남은 지뢰 - A 남은 지뢰) == diff 길이이면, 바깥쪽 diff는 모두 지뢰! (예: 1-2 패턴)
      if (
        b.remaining - a.remaining === diff.length &&
        board[target.row]![target.col]!.isMine
      ) {
        const isOneTwo = a.remaining === 1 && b.remaining === 2;
        return {
          coord: target,
          action: 'flag',
          patternName: isOneTwo ? '1-2 패턴 (확정 지뢰)' : '연계 숫자 지뢰 추론',
          reason: `${formatPos(a.center)} 구역에 지뢰 ${a.remaining}개가 들어가고도 ${formatPos(b.center)}에는 지뢰가 ${b.remaining - a.remaining}개 더 필요합니다. 남은 바깥 칸이 ${diff.length}칸뿐이므로 ${formatPos(target)}은 반드시 지뢰입니다!`,
          relatedCells: [a.center, b.center],
        };
      }
    }
  }

  // 4. 단순/부분집합 논리로 확정되지 않는 상황 -> 안전 셀 탐색 추천
  if (fallbackSafeCoord) {
    return {
      coord: fallbackSafeCoord,
      action: 'reveal',
      patternName: '새로운 단서 열기',
      reason: `현재 열린 숫자들만으로는 100% 확정되는 단순 패턴이 아직 보이지 않습니다. ${formatPos(fallbackSafeCoord)}을 열어 새로운 숫자 단서를 확보해 보세요.`,
      relatedCells: [fallbackSafeCoord],
    };
  }

  return null;
}
