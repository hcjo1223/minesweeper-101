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
 * 지뢰찾기 플레이어 관점의 실전 논리 추론 힌트 엔진 (나무위키 지뢰 찾기/공략 기반)
 *
 * 1) 첫 클릭 전: 중앙 부근 추천 (첫 클릭 3×3 안전 보장)
 * 2) 기본 확정 규칙:
 *    - 깃발 충족: 주변 깃발 수 == 숫자 -> 나머지 닫힌 칸은 100% 안전
 *    - 확정 지뢰: 남은 지뢰 수 == 닫힌 칸 수 -> 닫힌 칸은 모두 100% 지뢰
 * 3) 부분집합(Subset) & 차집합(Difference) 추론:
 *    - 부분집합 (1-1 패턴 등): A ⊂ B 이고 남은 지뢰 수가 같으면 (B \ A)는 100% 안전
 *    - 일반 차집합 (1-2, 1-3, 1-2-1, 꺾인 1-2 등):
 *      (B.remaining - A.remaining === |B \ A|)이면 (B \ A)는 100% 지뢰, (A \ B)는 100% 안전
 * 4) 마인 카운팅(Mine Counting):
 *    - 서로 겹치지 않는 영역들의 남은 지뢰 합이 보드 전체 남은 지뢰와 같으면 그 밖의 칸은 모두 안전
 */
export function getLogicalPlayerHint(
  board: readonly (readonly CellState[])[],
  config: BoardConfig,
  minesGenerated: boolean,
  fallbackSafeCoord: Coordinate | null
): PlayerHint | null {
  const { rows, cols, mines } = config;

  if (!minesGenerated) {
    const center = {
      row: Math.floor(rows / 2),
      col: Math.floor(cols / 2),
    };
    return {
      coord: center,
      action: 'reveal',
      patternName: '첫 클릭 안심 출발',
      reason:
        '첫 번째로 여는 칸과 주변 8칸(3×3)에는 절대 지뢰가 배치되지 않습니다. 중앙 부근을 눌러 넓은 오프닝(빈 안전 지대)을 먼저 열어 보세요.',
      relatedCells: [center],
    };
  }

  let flaggedCount = 0;
  const misflaggedCells: Coordinate[] = [];
  const allUnrevealedSafeAndHidden: Coordinate[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = board[r]![c]!;
      if (cell.isFlagged) {
        flaggedCount++;
        if (!cell.isMine) {
          const hasRevealedNeighbor = getNeighbors(r, c, rows, cols).some(
            (n) => board[n.row]![n.col]!.isRevealed
          );
          if (hasRevealedNeighbor) {
            misflaggedCells.push({ row: r, col: c });
          }
        }
      } else if (!cell.isRevealed) {
        allUnrevealedSafeAndHidden.push({ row: r, col: c });
      }
    }
  }

  const totalRemainingMines = mines - flaggedCount;
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
          patternName: '확정 안전 (깃발 충족)',
          reason: `${formatPos({ row: r, col: c })}의 숫자 ${cell.neighborMines} 주변에 이미 깃발 ${flagged.length}개가 모두 꽂혀 있습니다. 따라서 ${formatPos(target)}은 100% 안전합니다. 숫자 ${cell.neighborMines}을 직접 눌러(양클릭/화음) 주변을 한 번에 열 수도 있습니다!`,
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

  // 3. 부분집합(Subset) & 일반 차집합(Difference) 추론 (나무위키 3.1 ~ 3.5 원리)
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

      const bOnly = b.hidden.filter((c) => !a.hiddenKeys.has(coordKey(c)));
      const aOnly = a.hidden.filter((c) => !b.hiddenKeys.has(coordKey(c)));
      const hasOverlap = aOnly.length < a.hidden.length;

      if (!hasOverlap || bOnly.length === 0) continue;

      // 3-A. 부분집합 안전 추론: A ⊂ B 이고 A.remaining === B.remaining -> B \ A 는 모두 안전
      if (aOnly.length === 0 && b.remaining === a.remaining) {
        const target = bOnly[0]!;
        if (!board[target.row]![target.col]!.isMine) {
          const isOneOne = a.remaining === 1 && b.remaining === 1;
          return {
            coord: target,
            action: 'reveal',
            patternName: isOneOne ? '부분집합 · 1-1 패턴' : '부분집합 안전 추론',
            reason: `${formatPos(a.center)}(남은 지뢰 ${a.remaining})의 영역이 ${formatPos(b.center)}(남은 지뢰 ${b.remaining}) 영역 안에 완전히 포함됩니다. 공유 구역에 지뢰가 모두 들어가므로 바깥쪽 ${formatPos(target)}은 100% 안전합니다!`,
            relatedCells: [a.center, b.center],
          };
        }
      }

      // 3-B. 일반 차집합 추론: (B.remaining - A.remaining === |B \ A|) -> B \ A 는 모두 지뢰, A \ B 는 모두 안전!
      if (b.remaining - a.remaining === bOnly.length) {
        const mineTarget = bOnly[0]!;
        if (board[mineTarget.row]![mineTarget.col]!.isMine) {
          const isOneTwo = a.remaining === 1 && b.remaining === 2;
          return {
            coord: mineTarget,
            action: 'flag',
            patternName: isOneTwo ? '차집합 · 1-2 패턴' : '차집합 지뢰 추론',
            reason: `${formatPos(a.center)} 구역에 지뢰가 최대 ${a.remaining}개뿐인데 ${formatPos(b.center)}에는 지뢰가 ${b.remaining}개 필요합니다. 모자란 ${b.remaining - a.remaining}개가 바깥쪽 ${bOnly.length}칸에 모두 들어가야 하므로 ${formatPos(mineTarget)}은 100% 지뢰입니다!`,
            relatedCells: [a.center, b.center],
          };
        }
      }
    }
  }

  // 4. 마인 카운팅(Mine Counting - 나무위키 3.6):
  // 보드 전체 남은 지뢰가 적고, 서로 겹치지 않는 활성 숫자 구역들의 합이 남은 지뢰 수와 같다면 그 밖의 모든 칸은 안전!
  if (totalRemainingMines > 0 && totalRemainingMines <= 8 && constraints.length > 0) {
    const chosen: CellConstraint[] = [];
    const coveredKeys = new Set<string>();
    let sumMines = 0;

    for (const c of constraints) {
      const overlaps = c.hidden.some((h) => coveredKeys.has(coordKey(h)));
      if (!overlaps && sumMines + c.remaining <= totalRemainingMines) {
        chosen.push(c);
        c.hidden.forEach((h) => coveredKeys.add(coordKey(h)));
        sumMines += c.remaining;
      }
    }

    if (sumMines === totalRemainingMines) {
      const outsideSafe = allUnrevealedSafeAndHidden.find(
        (c) => !coveredKeys.has(coordKey(c)) && !board[c.row]![c.col]!.isMine
      );
      if (outsideSafe) {
        return {
          coord: outsideSafe,
          action: 'reveal',
          patternName: '마인 카운팅 (남은 지뢰 계산)',
          reason: `보드 전체에 남은 지뢰가 ${totalRemainingMines}개뿐인데, 현재 열린 숫자 주변 구역들에서 이미 ${sumMines}개의 지뢰 위치가 모두 할당됩니다. 따라서 구역 밖의 ${formatPos(outsideSafe)}은 100% 안전합니다!`,
          relatedCells: chosen.map((c) => c.center),
        };
      }
    }
  }

  // 5. 찍기 / 탐색 추천 위치 (나무위키 7. 찍기 참고)
  if (fallbackSafeCoord) {
    return {
      coord: fallbackSafeCoord,
      action: 'reveal',
      patternName: '새로운 단서 열기 (찍기/탐색)',
      reason: `현재 열린 숫자만으로는 100% 확정되는 패턴이 보이지 않는 구간입니다. ${formatPos(fallbackSafeCoord)}을 열어 새로운 숫자 단서를 확보해 보세요.`,
      relatedCells: [fallbackSafeCoord],
    };
  }

  return null;
}
