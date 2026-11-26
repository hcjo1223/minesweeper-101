import type {
  BoardConfig,
  CellState,
  Coordinate,
  FloodFillAlgorithm,
  FloodFillTrace,
  GameSnapshot,
  GameStatus,
} from './types';
import { DIFFICULTY_PRESETS } from './types';
import { cloneBoard, createEmptyBoard, populateMines } from './board';
import { runFloodFill } from './floodFill';
import { getNeighbors, isValidCoord } from '../utils/directions';
import type { RandomGenerator } from '../utils/random';

export interface EngineOptions {
  config?: BoardConfig;
  algorithm?: FloodFillAlgorithm;
  rng?: RandomGenerator;
}

/**
 * Step 04 & Step 05: UI에 전혀 의존하지 않는 헤드리스(Headless) 지뢰찾기 코어 엔진
 *
 * DOM, React, Canvas 등 어떤 UI 프레임워크에서도 동일하게 재사용할 수 있으며,
 * 순수 입출력 메서드만으로 단위 테스트(Unit Test)가 가능하도록 설계되었습니다.
 */
export class MinesweeperEngine {
  private config: BoardConfig;
  private board: CellState[][];
  private status: GameStatus;
  private minesGenerated: boolean;
  private moveCount: number;
  private algorithm: FloodFillAlgorithm;
  private lastFloodFillTrace: FloodFillTrace | null;
  private rng: RandomGenerator;

  constructor(options: EngineOptions = {}) {
    this.config = options.config ?? DIFFICULTY_PRESETS.beginner;
    this.algorithm = options.algorithm ?? 'bfs';
    this.rng = options.rng ?? Math.random;
    this.board = createEmptyBoard(this.config);
    this.status = 'idle';
    this.minesGenerated = false;
    this.moveCount = 0;
    this.lastFloodFillTrace = null;
  }

  /**
   * 게임을 초기 상태로 리셋하거나 새로운 난이도/설정을 적용합니다.
   */
  public reset(
    nextConfig?: BoardConfig,
    nextRng?: RandomGenerator
  ): GameSnapshot {
    if (nextConfig) {
      this.config = nextConfig;
    }
    if (nextRng) {
      this.rng = nextRng;
    }
    this.board = createEmptyBoard(this.config);
    this.status = 'idle';
    this.minesGenerated = false;
    this.moveCount = 0;
    this.lastFloodFillTrace = null;
    return this.getSnapshot();
  }

  /**
   * Flood Fill 탐색 알고리즘(BFS vs DFS)을 실시간으로 전환합니다.
   */
  public setAlgorithm(algorithm: FloodFillAlgorithm): GameSnapshot {
    this.algorithm = algorithm;
    return this.getSnapshot();
  }

  /**
   * 특정 좌표 (row, col)의 셀을 오픈합니다.
   * - 첫 클릭(idle)인 경우: 클릭한 좌표와 주변 8칸을 보호하며 지뢰를 동적 배치합니다.
   * - 지뢰를 클릭한 경우: 모든 지뢰를 공개하고 패배(lost) 상태로 전환합니다.
   * - 안전 셀을 클릭한 경우: Flood Fill 알고리즘으로 연결된 안전 구역을 열고 승리 조건을 판정합니다.
   */
  public reveal(row: number, col: number): GameSnapshot {
    if (
      this.status === 'won' ||
      this.status === 'lost' ||
      !isValidCoord(row, col, this.config.rows, this.config.cols)
    ) {
      return this.getSnapshot();
    }

    const targetCell = this.board[row]![col]!;
    if (targetCell.isRevealed || targetCell.isFlagged) {
      return this.getSnapshot();
    }

    let nextBoard = cloneBoard(this.board, true);

    // 첫 클릭 안전 보장: 첫 클릭 시점에 지뢰를 배치
    if (!this.minesGenerated) {
      nextBoard = populateMines(
        nextBoard,
        this.config,
        { row, col },
        this.rng
      );
      this.minesGenerated = true;
      this.status = 'playing';
    }

    this.moveCount += 1;
    const cellAfterSetup = nextBoard[row]![col]!;

    // 지뢰를 밟은 경우 -> 게임 오버
    if (cellAfterSetup.isMine) {
      this.board = this.revealAllMinesOnLoss(nextBoard, { row, col });
      this.status = 'lost';
      this.lastFloodFillTrace = null;
      return this.getSnapshot();
    }

    // 안전 셀 오픈 및 Flood Fill 연쇄 확장
    const trace = runFloodFill(nextBoard, { row, col }, this.algorithm);
    this.board = nextBoard;
    this.lastFloodFillTrace = trace;

    this.evaluateWinCondition();
    return this.getSnapshot();
  }

  /**
   * 특정 좌표 (row, col)에 깃발(Flag)을 꽂거나 해제합니다.
   */
  public toggleFlag(row: number, col: number): GameSnapshot {
    if (
      this.status === 'won' ||
      this.status === 'lost' ||
      !isValidCoord(row, col, this.config.rows, this.config.cols)
    ) {
      return this.getSnapshot();
    }

    const cell = this.board[row]![col]!;
    if (cell.isRevealed) {
      return this.getSnapshot();
    }

    const nextBoard = cloneBoard(this.board, false);
    nextBoard[row]![col] = {
      ...cell,
      isFlagged: !cell.isFlagged,
    };
    this.board = nextBoard;
    return this.getSnapshot();
  }

  /**
   * 고급 조작 — 코딩(Chording / Quick Reveal):
   * 이미 열린 숫자 셀 주변 8칸에 꽂힌 깃발 개수가 해당 셀의 `neighborMines`와 일치할 때,
   * 깃발이 꽂히지 않은 나머지 인접 셀들을 한 번에 오픈합니다.
   */
  public chord(row: number, col: number): GameSnapshot {
    if (
      this.status !== 'playing' ||
      !isValidCoord(row, col, this.config.rows, this.config.cols)
    ) {
      return this.getSnapshot();
    }

    const centerCell = this.board[row]![col]!;
    if (!centerCell.isRevealed || centerCell.neighborMines <= 0) {
      return this.getSnapshot();
    }

    const neighbors = getNeighbors(
      row,
      col,
      this.config.rows,
      this.config.cols
    );
    const flaggedNeighbors = neighbors.filter(
      (n) => this.board[n.row]![n.col]!.isFlagged
    );

    if (flaggedNeighbors.length !== centerCell.neighborMines) {
      return this.getSnapshot();
    }

    const unrevealedNeighbors = neighbors.filter((n) => {
      const c = this.board[n.row]![n.col]!;
      return !c.isRevealed && !c.isFlagged;
    });

    if (unrevealedNeighbors.length === 0) {
      return this.getSnapshot();
    }

    const nextBoard = cloneBoard(this.board, true);
    this.moveCount += 1;

    // 잘못된 깃발로 인해 열린 칸 중 지뢰가 있는지 먼저 확인
    const explodedMine = unrevealedNeighbors.find(
      (n) => nextBoard[n.row]![n.col]!.isMine
    );
    if (explodedMine) {
      this.board = this.revealAllMinesOnLoss(nextBoard, explodedMine);
      this.status = 'lost';
      this.lastFloodFillTrace = null;
      return this.getSnapshot();
    }

    let combinedVisited: Coordinate[] = [];
    let maxFrontier = 0;

    for (const neighbor of unrevealedNeighbors) {
      if (!nextBoard[neighbor.row]![neighbor.col]!.isRevealed) {
        const trace = runFloodFill(nextBoard, neighbor, this.algorithm);
        combinedVisited = [...combinedVisited, ...trace.visitedOrder];
        if (trace.maxFrontierSize > maxFrontier) {
          maxFrontier = trace.maxFrontierSize;
        }
      }
    }

    // 통합된 방문 순서 번호 재할당
    combinedVisited.forEach((coord, idx) => {
      const c = nextBoard[coord.row]![coord.col]!;
      nextBoard[coord.row]![coord.col] = {
        ...c,
        revealOrder: idx + 1,
      };
    });

    this.board = nextBoard;
    this.lastFloodFillTrace = {
      algorithm: this.algorithm,
      origin: { row, col },
      visitedOrder: combinedVisited,
      maxFrontierSize: maxFrontier,
      cellsRevealed: combinedVisited.length,
    };

    this.evaluateWinCondition();
    return this.getSnapshot();
  }

  /**
   * 현재 보드에서 열리지 않은 안전한 셀 하나를 힌트로 반환합니다 (학습 및 디버깅 보조 기능).
   */
  public getSafeHint(): Coordinate | null {
    if (this.status === 'won' || this.status === 'lost') {
      return null;
    }

    // 아직 첫 클릭 전이라면 보드 정중앙 좌표를 추천
    if (!this.minesGenerated) {
      return {
        row: Math.floor(this.config.rows / 2),
        col: Math.floor(this.config.cols / 2),
      };
    }

    // 1순위: 이미 열린 셀과 인접한 안전한 미오픈 셀 (논리적으로 추론 가능한 후보 우선)
    for (let r = 0; r < this.config.rows; r++) {
      for (let c = 0; c < this.config.cols; c++) {
        const cell = this.board[r]![c]!;
        if (!cell.isRevealed && !cell.isFlagged && !cell.isMine) {
          const neighbors = getNeighbors(
            r,
            c,
            this.config.rows,
            this.config.cols
          );
          const touchesRevealed = neighbors.some(
            (n) => this.board[n.row]![n.col]!.isRevealed
          );
          if (touchesRevealed) {
            return { row: r, col: c };
          }
        }
      }
    }

    // 2순위: 임의의 미오픈 안전 셀
    for (let r = 0; r < this.config.rows; r++) {
      for (let c = 0; c < this.config.cols; c++) {
        const cell = this.board[r]![c]!;
        if (!cell.isRevealed && !cell.isFlagged && !cell.isMine) {
          return { row: r, col: c };
        }
      }
    }

    return null;
  }

  /**
   * UI에 전달할 불변(Immutable) 스냅샷 객체를 생성합니다.
   */
  public getSnapshot(): GameSnapshot {
    let revealedCount = 0;
    let flaggedCount = 0;

    for (let r = 0; r < this.config.rows; r++) {
      for (let c = 0; c < this.config.cols; c++) {
        const cell = this.board[r]![c]!;
        if (cell.isRevealed && !cell.isMine) {
          revealedCount++;
        }
        if (cell.isFlagged) {
          flaggedCount++;
        }
      }
    }

    const totalCells = this.config.rows * this.config.cols;
    const safeCellsTotal = totalCells - this.config.mines;

    return {
      board: cloneBoard(this.board, false),
      config: { ...this.config },
      status: this.status,
      minesGenerated: this.minesGenerated,
      revealedCount,
      flaggedCount,
      remainingMines: this.config.mines - flaggedCount,
      safeCellsTotal,
      moveCount: this.moveCount,
      algorithm: this.algorithm,
      lastFloodFillTrace: this.lastFloodFillTrace,
    };
  }

  /**
   * Step 04: 승리 조건 판정
   * (열린 안전 셀 개수 === 전체 셀 수 - 지뢰 수)이면 승리(won)로 전환하고
   * 남은 모든 지뢰 위치에 자동으로 깃발을 표시합니다.
   */
  private evaluateWinCondition(): void {
    const totalCells = this.config.rows * this.config.cols;
    const safeCellsTotal = totalCells - this.config.mines;

    let revealedSafeCount = 0;
    for (let r = 0; r < this.config.rows; r++) {
      for (let c = 0; c < this.config.cols; c++) {
        const cell = this.board[r]![c]!;
        if (cell.isRevealed && !cell.isMine) {
          revealedSafeCount++;
        }
      }
    }

    if (revealedSafeCount === safeCellsTotal) {
      this.status = 'won';
      // 승리 시 아직 깃발이 꽂히지 않은 지뢰 칸에 자동으로 깃발 표시
      for (let r = 0; r < this.config.rows; r++) {
        for (let c = 0; c < this.config.cols; c++) {
          const cell = this.board[r]![c]!;
          if (cell.isMine && !cell.isFlagged) {
            this.board[r]![c] = { ...cell, isFlagged: true };
          }
        }
      }
    }
  }

  /**
   * 패배 시 폭발한 지뢰를 표시하고 보드 전체의 지뢰 위치를 공개합니다.
   */
  private revealAllMinesOnLoss(
    board: CellState[][],
    explodedCoord: Coordinate
  ): CellState[][] {
    return board.map((row, r) =>
      row.map((cell, c) => {
        const isExploded =
          r === explodedCoord.row && c === explodedCoord.col;
        if (cell.isMine) {
          return {
            ...cell,
            isRevealed: true,
            isExploded,
          };
        }
        return cell;
      })
    );
  }
}
