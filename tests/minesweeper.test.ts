import { describe, expect, it } from 'vitest';
import {
  calculateNeighborMines,
  createEmptyBoard,
  populateMines,
} from '../src/core/board';
import { floodFillBFS, floodFillDFS } from '../src/core/floodFill';
import { MinesweeperEngine } from '../src/core/MinesweeperEngine';
import { getLogicalPlayerHint } from '../src/core/solverHint';
import { DIFFICULTY_PRESETS } from '../src/core/types';
import { getNeighbors, isWithinSafeZone } from '../src/utils/directions';
import { createSeededRandom, fisherYatesShuffle } from '../src/utils/random';

describe('Step 01: 보드 설계와 데이터 모델링 (createEmptyBoard)', () => {
  it('지정한 행(rows)과 열(cols) 크기의 빈 2차원 보드를 생성한다', () => {
    const board = createEmptyBoard({ rows: 9, cols: 9, mines: 10 });
    expect(board).toHaveLength(9);
    expect(board[0]).toHaveLength(9);

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = board[r]![c]!;
        expect(cell).toEqual({
          row: r,
          col: c,
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          neighborMines: 0,
        });
      }
    }
  });
});

describe('Step 02: 지뢰 배치와 8방향 탐색 (populateMines & directions)', () => {
  it('모서리(3개), 변(5개), 중앙(8개) 좌표의 유효한 이웃만 정확히 반환한다', () => {
    expect(getNeighbors(0, 0, 9, 9)).toHaveLength(3);
    expect(getNeighbors(0, 4, 9, 9)).toHaveLength(5);
    expect(getNeighbors(4, 4, 9, 9)).toHaveLength(8);
  });

  it('Fisher-Yates 셔플은 원본 배열을 변형하지 않고 동일한 원소 집합을 유지한다', () => {
    const original = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const rng = createSeededRandom(42);
    const shuffled = fisherYatesShuffle(original, rng);

    expect(original).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect([...shuffled].sort((a, b) => a - b)).toEqual(original);
  });

  it('첫 클릭 좌표와 그 주변 8칸(3×3 안전 구역)에는 절대 지뢰가 배치되지 않는다', () => {
    const config = DIFFICULTY_PRESETS.intermediate; // 16x16, 40 mines
    const safeCoord = { row: 7, col: 7 };

    for (let seed = 1; seed <= 25; seed++) {
      const empty = createEmptyBoard(config);
      const populated = populateMines(
        empty,
        config,
        safeCoord,
        createSeededRandom(seed)
      );

      let totalMines = 0;
      for (let r = 0; r < config.rows; r++) {
        for (let c = 0; c < config.cols; c++) {
          const cell = populated[r]![c]!;
          if (cell.isMine) {
            totalMines++;
            expect(
              isWithinSafeZone(r, c, safeCoord.row, safeCoord.col, 1)
            ).toBe(false);
          }
        }
      }

      expect(totalMines).toBe(config.mines);
      expect(populated[safeCoord.row]![safeCoord.col]!.neighborMines).toBe(0);
    }
  });
});

describe('Step 03: 빈 칸 연쇄 확장 알고리즘 (BFS vs DFS Flood Fill)', () => {
  function createCustomTestBoard() {
    // 5x5 보드에서 우측 하단 (4, 4)에만 지뢰 1개 배치
    const board = createEmptyBoard({ rows: 5, cols: 5, mines: 1 });
    board[4]![4] = { ...board[4]![4]!, isMine: true };
    calculateNeighborMines(board);
    return board;
  }

  it('BFS와 DFS 모두 동일한 안전 구역 셀들을 오픈하고 경계 숫자 셀에서 멈춘다', () => {
    const bfsBoard = createCustomTestBoard();
    const dfsBoard = createCustomTestBoard();

    const bfsTrace = floodFillBFS(bfsBoard, { row: 0, col: 0 });
    const dfsTrace = floodFillDFS(dfsBoard, { row: 0, col: 0 });

    // (4, 4) 지뢰를 제외한 24개 안전 셀이 모두 열려야 함
    expect(bfsTrace.cellsRevealed).toBe(24);
    expect(dfsTrace.cellsRevealed).toBe(24);
    expect(bfsBoard[4]![4]!.isRevealed).toBe(false);
    expect(dfsBoard[4]![4]!.isRevealed).toBe(false);

    // 두 알고리즘의 방문 순서(visitedOrder)는 서로 다르지만 열린 좌표 집합은 동일
    expect(bfsTrace.visitedOrder).not.toEqual(dfsTrace.visitedOrder);
  });

  it('깃발(isFlagged)이 꽂힌 셀은 Flood Fill 확장 중에도 오픈되지 않고 보호된다', () => {
    const board = createCustomTestBoard();
    board[0]![1] = { ...board[0]![1]!, isFlagged: true };

    floodFillBFS(board, { row: 0, col: 0 });
    expect(board[0]![1]!.isRevealed).toBe(false);
  });
});

describe('Step 04 & 05: 게임 루프, 승패 판정 및 헤드리스 코어 엔진 (MinesweeperEngine)', () => {
  it('첫 클릭 시 상태가 idle에서 playing으로 전환되고 연쇄 확장이 일어난다', () => {
    const engine = new MinesweeperEngine({
      config: DIFFICULTY_PRESETS.beginner,
      rng: createSeededRandom(101),
    });

    expect(engine.getSnapshot().status).toBe('idle');
    const afterFirstClick = engine.reveal(4, 4);

    expect(afterFirstClick.status).toBe('playing');
    expect(afterFirstClick.minesGenerated).toBe(true);
    expect(afterFirstClick.revealedCount).toBeGreaterThan(1);
    expect(afterFirstClick.lastFloodFillTrace?.cellsRevealed).toBe(
      afterFirstClick.revealedCount
    );
  });

  it('모든 안전 칸을 오픈하면 승리(won) 상태가 되고 남은 지뢰에 자동 깃발이 꽂힌다', () => {
    const engine = new MinesweeperEngine({
      config: { rows: 5, cols: 5, mines: 3 },
      rng: createSeededRandom(2026),
    });

    // 첫 클릭 실행
    let snapshot = engine.reveal(2, 2);

    // 지뢰가 아닌 모든 안전 셀을 순차적으로 오픈
    for (let r = 0; r < snapshot.config.rows; r++) {
      for (let c = 0; c < snapshot.config.cols; c++) {
        const cell = snapshot.board[r]![c]!;
        if (!cell.isMine && !cell.isRevealed) {
          snapshot = engine.reveal(r, c);
        }
      }
    }

    expect(snapshot.status).toBe('won');
    expect(snapshot.revealedCount).toBe(25 - 3);
    expect(snapshot.remainingMines).toBe(0);
  });

  it('지뢰가 있는 칸을 오픈하면 패배(lost) 상태가 되고 모든 지뢰가 공개된다', () => {
    const engine = new MinesweeperEngine({
      config: DIFFICULTY_PRESETS.beginner,
      rng: createSeededRandom(77),
    });

    let snapshot = engine.reveal(0, 0);
    let mineCoord = { row: -1, col: -1 };

    for (let r = 0; r < snapshot.config.rows; r++) {
      for (let c = 0; c < snapshot.config.cols; c++) {
        if (snapshot.board[r]![c]!.isMine) {
          mineCoord = { row: r, col: c };
          break;
        }
      }
      if (mineCoord.row !== -1) break;
    }

    snapshot = engine.reveal(mineCoord.row, mineCoord.col);
    expect(snapshot.status).toBe('lost');
    expect(snapshot.board[mineCoord.row]![mineCoord.col]!.isExploded).toBe(
      true
    );
  });

  it('Chording: 열린 숫자 셀 주변 깃발 개수가 일치하면 인접 미오픈 셀들을 한 번에 오픈한다', () => {
    const engine = new MinesweeperEngine({
      config: { rows: 5, cols: 5, mines: 1 },
      rng: createSeededRandom(999),
    });

    let snapshot = engine.reveal(0, 0);

    // 지뢰 위치 찾기 및 깃발 꽂기
    let mineRow = -1;
    let mineCol = -1;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (snapshot.board[r]![c]!.isMine) {
          mineRow = r;
          mineCol = c;
        }
      }
    }

    snapshot = engine.toggleFlag(mineRow, mineCol);
    expect(snapshot.board[mineRow]![mineCol]!.isFlagged).toBe(true);

    // 지뢰와 인접한 열린 숫자 셀에서 chord 호출
    const neighbors = getNeighbors(mineRow, mineCol, 5, 5);
    const revealedNumberNeighbor = neighbors.find((n) => {
      const cell = snapshot.board[n.row]![n.col]!;
      return cell.isRevealed && cell.neighborMines > 0;
    });

    if (revealedNumberNeighbor) {
      snapshot = engine.chord(
        revealedNumberNeighbor.row,
        revealedNumberNeighbor.col
      );
      expect(snapshot.status).not.toBe('lost');
    }
  });
});

describe('플레이어 공략 힌트 추론 엔진 (getLogicalPlayerHint)', () => {
  it('확정 지뢰 규칙: 남은 지뢰 수와 닫힌 이웃 칸 수가 같으면 깃발 꽂기를 추천한다', () => {
    const config = { rows: 3, cols: 3, mines: 1 };
    const board = createEmptyBoard(config);
    board[0]![2] = { ...board[0]![2]!, isMine: true };
    calculateNeighborMines(board);

    // (0, 2)만 닫힌 상태로 두고 나머지 안전 칸 모두 오픈
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (!(r === 0 && c === 2)) {
          board[r]![c] = { ...board[r]![c]!, isRevealed: true };
        }
      }
    }

    const hint = getLogicalPlayerHint(board, config, true, { row: 0, col: 0 });
    expect(hint?.action).toBe('flag');
    expect(hint?.coord).toEqual({ row: 0, col: 2 });
  });

  it('1-2 패턴 추론: 1과 2가 나란히 있을 때 2의 바깥쪽 칸을 지뢰로 정확히 지목한다', () => {
    const config = { rows: 2, cols: 4, mines: 2 };
    const board = createEmptyBoard(config);
    board[0]![1] = { ...board[0]![1]!, isMine: true };
    board[0]![2] = { ...board[0]![2]!, isMine: true };
    calculateNeighborMines(board);

    // 아래 행만 전부 오픈 -> 단순 Rule B로는 못 찾고 1-2 부분집합 추론으로만 확정 가능
    for (let c = 0; c < 4; c++) {
      board[1]![c] = { ...board[1]![c]!, isRevealed: true };
    }

    const hint = getLogicalPlayerHint(board, config, true, { row: 0, col: 0 });
    expect(hint?.action).toBe('flag');
    expect(hint?.patternName).toContain('1-2 패턴');
    expect(hint?.coord).toEqual({ row: 0, col: 2 });
  });

  it('1-1 패턴 추론: 벽에 붙은 1과 1을 비교해 세 번째 바깥 칸이 안전함을 찾아낸다', () => {
    const config = { rows: 2, cols: 4, mines: 1 };
    const board = createEmptyBoard(config);
    board[0]![1] = { ...board[0]![1]!, isMine: true };
    calculateNeighborMines(board);

    for (let c = 0; c < 4; c++) {
      board[1]![c] = { ...board[1]![c]!, isRevealed: true };
    }

    const hint = getLogicalPlayerHint(board, config, true, { row: 0, col: 0 });
    expect(hint?.action).toBe('reveal');
    expect(hint?.patternName).toContain('1-1 패턴');
    expect(hint?.coord).toEqual({ row: 0, col: 2 });
  });
});

