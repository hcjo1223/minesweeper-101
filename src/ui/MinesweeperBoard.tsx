import {
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from 'react';
import {
  ArrowsInSimple,
  ArrowsOutSimple,
  Bomb,
  CheckCircle,
  Flag,
  Flame,
  HandTap,
  Keyboard,
  Lightbulb,
  ShieldCheck,
  WarningCircle,
} from '@phosphor-icons/react';
import type { PlayerHint } from '../core/solverHint';
import type { CellState, Coordinate, GameSnapshot } from '../core/types';
import type { BoardScaleMode } from './useMinesweeper';

interface MinesweeperBoardProps {
  readonly snapshot: GameSnapshot;
  readonly showNeighborGuide: boolean;
  readonly playerHint: PlayerHint | null;
  readonly isNewRecord: boolean;
  readonly elapsedSeconds: number;
  readonly boardScale: BoardScaleMode;
  readonly onChangeBoardScale: (mode: BoardScaleMode) => void;
  readonly onCellPrimary: (row: number, col: number) => void;
  readonly onCellSecondary: (row: number, col: number) => void;
  readonly onCellChord: (row: number, col: number) => void;
  readonly onApplyHint: () => void;
  readonly onReset: () => void;
}

const LONG_PRESS_DELAY_MS = 380;
const MOVE_CANCEL_THRESHOLD_PX = 8;

export function MinesweeperBoard({
  snapshot,
  showNeighborGuide,
  playerHint,
  isNewRecord,
  elapsedSeconds,
  boardScale,
  onChangeBoardScale,
  onCellPrimary,
  onCellSecondary,
  onCellChord,
  onApplyHint,
  onReset,
}: MinesweeperBoardProps) {
  const { board, config, status } = snapshot;
  const [focusedCoord, setFocusedCoord] = useState<Coordinate>({
    row: 0,
    col: 0,
  });
  const [hoveredNumberCoord, setHoveredNumberCoord] =
    useState<Coordinate | null>(null);

  const gridRef = useRef<HTMLDivElement | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const longPressTriggeredRef = useRef<boolean>(false);

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handlePointerDown = (
    e: PointerEvent<HTMLButtonElement>,
    row: number,
    col: number
  ) => {
    if (e.pointerType !== 'touch' && e.pointerType !== 'pen') {
      return;
    }

    longPressTriggeredRef.current = false;
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
    clearLongPressTimer();

    longPressTimerRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      pointerStartRef.current = null;
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(14);
      }
      onCellSecondary(row, col);
    }, LONG_PRESS_DELAY_MS);
  };

  const handlePointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    if (!pointerStartRef.current) return;
    const dx = Math.abs(e.clientX - pointerStartRef.current.x);
    const dy = Math.abs(e.clientY - pointerStartRef.current.y);
    if (dx > MOVE_CANCEL_THRESHOLD_PX || dy > MOVE_CANCEL_THRESHOLD_PX) {
      clearLongPressTimer();
      pointerStartRef.current = null;
    }
  };

  const handlePointerEnd = () => {
    clearLongPressTimer();
    pointerStartRef.current = null;
  };

  const handleCellClick = (row: number, col: number) => {
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      return;
    }
    setFocusedCoord({ row, col });
    onCellPrimary(row, col);
  };

  const handleContextMenu = (
    e: MouseEvent<HTMLButtonElement>,
    row: number,
    col: number
  ) => {
    e.preventDefault();
    setFocusedCoord({ row, col });
    onCellSecondary(row, col);
  };

  const moveFocusTo = (nextRow: number, nextCol: number) => {
    const clampedRow = Math.max(0, Math.min(config.rows - 1, nextRow));
    const clampedCol = Math.max(0, Math.min(config.cols - 1, nextCol));
    setFocusedCoord({ row: clampedRow, col: clampedCol });
    const nextBtn = gridRef.current?.querySelector<HTMLButtonElement>(
      `#cell-${clampedRow}-${clampedCol}`
    );
    nextBtn?.focus();
  };

  const handleCellKeyDown = (
    e: KeyboardEvent<HTMLButtonElement>,
    row: number,
    col: number
  ) => {
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        moveFocusTo(row - 1, col);
        break;
      case 'ArrowDown':
        e.preventDefault();
        moveFocusTo(row + 1, col);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        moveFocusTo(row, col - 1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        moveFocusTo(row, col + 1);
        break;
      case 'Home':
        e.preventDefault();
        moveFocusTo(row, 0);
        break;
      case 'End':
        e.preventDefault();
        moveFocusTo(row, config.cols - 1);
        break;
      case 'f':
      case 'F':
        e.preventDefault();
        onCellSecondary(row, col);
        break;
      default:
        break;
    }
  };

  const renderCellContent = (cell: CellState) => {
    if (!cell.isRevealed) {
      if (cell.isFlagged) {
        return (
          <Flag
            className="cell-svg-icon flag-svg"
            weight="fill"
            aria-hidden="true"
          />
        );
      }
      return null;
    }

    if (cell.isMine) {
      return cell.isExploded ? (
        <Flame
          className="cell-svg-icon exploded-svg"
          weight="fill"
          aria-hidden="true"
        />
      ) : (
        <Bomb
          className="cell-svg-icon mine-svg"
          weight="duotone"
          aria-hidden="true"
        />
      );
    }

    if (cell.neighborMines > 0) {
      return (
        <span className={`cell-number num-${cell.neighborMines}`}>
          {cell.neighborMines}
        </span>
      );
    }

    return null;
  };

  const getCellAriaLabel = (cell: CellState): string => {
    const pos = `${cell.row + 1}행 ${cell.col + 1}열`;
    if (!cell.isRevealed) {
      return cell.isFlagged ? `${pos}, 깃발 꽂힘` : `${pos}, 닫힌 칸`;
    }
    if (cell.isMine) {
      return cell.isExploded ? `${pos}, 폭발한 지뢰` : `${pos}, 지뢰`;
    }
    return cell.neighborMines > 0
      ? `${pos}, 인접 지뢰 ${cell.neighborMines}개`
      : `${pos}, 빈 안전 칸`;
  };

  const showScaleToggle = config.cols > 9;
  const activeGuideCenter = showNeighborGuide ? hoveredNumberCoord : null;

  return (
    <div className="board-stage">
      <div className="board-status-banner" role="status" aria-live="polite">
        {playerHint && status !== 'won' && status !== 'lost' ? (
          <div className={`status-message hint-banner hint-${playerHint.action}`}>
            <span className="status-with-icon">
              <Lightbulb size={18} weight="bold" aria-hidden="true" />
              <span>
                <strong>{playerHint.patternName}</strong> — {playerHint.reason}
              </span>
            </span>
            <button
              id="banner-apply-hint"
              type="button"
              className="banner-action-btn"
              onClick={onApplyHint}
            >
              {playerHint.action === 'reveal'
                ? '이 칸 열기'
                : playerHint.action === 'flag'
                  ? '깃발 꽂기'
                  : '깃발 해제'}
            </button>
          </div>
        ) : (
          <>
            {status === 'idle' && (
              <p className="status-message idle">
                <span className="status-badge">
                  <ShieldCheck size={14} weight="bold" aria-hidden="true" />
                  첫 클릭 안심
                </span>
                <span>
                  처음 누르는 칸과 주변 8칸에는 지뢰가 없습니다. 편한 곳을 눌러
                  게임을 시작하세요!
                </span>
              </p>
            )}
            {status === 'playing' && (
              <p className="status-message playing">
                <span>
                  지뢰 위치를 찾으면 깃발(우클릭·길게 누르기)을 꽂고, 깃발을 다
                  찾은 숫자를 누르면 주변이 한 번에 열립니다.
                </span>
              </p>
            )}
            {status === 'won' && (
              <div className="status-message won">
                <span className="status-with-icon">
                  <CheckCircle size={18} weight="bold" aria-hidden="true" />
                  <span>
                    <strong>클리어 성공!</strong> {elapsedSeconds}초 만에 모든
                    지뢰를 피해냈습니다.
                    {isNewRecord ? ' (신기록 달성!)' : ''}
                  </span>
                </span>
                <button
                  id="banner-play-again-won"
                  type="button"
                  className="banner-action-btn"
                  onClick={onReset}
                >
                  다시 플레이
                </button>
              </div>
            )}
            {status === 'lost' && (
              <div className="status-message lost">
                <span className="status-with-icon">
                  <WarningCircle size={18} weight="bold" aria-hidden="true" />
                  <span>
                    <strong>지뢰가 터졌습니다!</strong> 아쉬워요 — 새 게임으로
                    다시 도전해 보세요.
                  </span>
                </span>
                <button
                  id="banner-play-again-lost"
                  type="button"
                  className="banner-action-btn"
                  onClick={onReset}
                >
                  새 게임 시작
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {showScaleToggle && (
        <div className="board-scale-toolbar">
          <span className="scale-hint mono">
            {config.cols} × {config.rows} 보드
          </span>
          <div
            className="segmented-control"
            role="group"
            aria-label="모바일 보드 보기 크기"
          >
            <button
              id="scale-fit-btn"
              type="button"
              className={`segment-btn ${boardScale === 'fit' ? 'active' : ''}`}
              onClick={() => onChangeBoardScale('fit')}
              aria-pressed={boardScale === 'fit'}
            >
              <ArrowsInSimple size={14} weight="bold" aria-hidden="true" />
              <span>화면 맞춤</span>
            </button>
            <button
              id="scale-comfort-btn"
              type="button"
              className={`segment-btn ${boardScale === 'comfort' ? 'active' : ''}`}
              onClick={() => onChangeBoardScale('comfort')}
              aria-pressed={boardScale === 'comfort'}
            >
              <ArrowsOutSimple size={14} weight="bold" aria-hidden="true" />
              <span>큰 셀 (스크롤)</span>
            </button>
          </div>
        </div>
      )}

      <div className="board-scroll-wrapper">
        <div
          ref={gridRef}
          id="minesweeper-grid"
          className={`minesweeper-grid cols-${config.cols} scale-${boardScale}`}
          style={
            {
              '--grid-cols': config.cols,
              gridTemplateColumns: `repeat(${config.cols}, var(--cell-size))`,
            } as CSSProperties
          }
          role="grid"
          aria-label={`지뢰찾기 보드 (${config.rows}행 ${config.cols}열)`}
          onMouseLeave={() => setHoveredNumberCoord(null)}
        >
          {board.map((rowCells, rIdx) =>
            rowCells.map((cell, cIdx) => {
              const isHintTarget =
                playerHint?.coord.row === rIdx &&
                playerHint?.coord.col === cIdx;
              const isHintRelated =
                playerHint?.relatedCells.some(
                  (rc) => rc.row === rIdx && rc.col === cIdx
                ) ?? false;

              const isNeighborHighlighted =
                activeGuideCenter !== null &&
                !(
                  activeGuideCenter.row === rIdx &&
                  activeGuideCenter.col === cIdx
                ) &&
                Math.abs(activeGuideCenter.row - rIdx) <= 1 &&
                Math.abs(activeGuideCenter.col - cIdx) <= 1;

              const isRovingFocus =
                focusedCoord.row === rIdx && focusedCoord.col === cIdx;

              const hintClass = isHintTarget
                ? `hint-cell hint-target-${playerHint!.action}`
                : isHintRelated
                  ? 'hint-related-cell'
                  : '';

              const cellClasses = [
                'mine-cell',
                cell.isRevealed ? 'revealed' : 'unrevealed',
                cell.isFlagged ? 'flagged' : '',
                cell.isExploded ? 'exploded' : '',
                cell.isRevealed && cell.neighborMines === 0 && !cell.isMine
                  ? 'empty-zero'
                  : '',
                isNeighborHighlighted ? 'neighbor-guide-cell' : '',
                hintClass,
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <button
                  key={`${rIdx}-${cIdx}`}
                  id={`cell-${rIdx}-${cIdx}`}
                  type="button"
                  role="gridcell"
                  tabIndex={isRovingFocus ? 0 : -1}
                  className={cellClasses}
                  aria-label={getCellAriaLabel(cell)}
                  onClick={() => handleCellClick(rIdx, cIdx)}
                  onDoubleClick={() => onCellChord(rIdx, cIdx)}
                  onContextMenu={(e) => handleContextMenu(e, rIdx, cIdx)}
                  onMouseEnter={() => {
                    if (
                      showNeighborGuide &&
                      cell.isRevealed &&
                      !cell.isMine &&
                      cell.neighborMines > 0
                    ) {
                      setHoveredNumberCoord({ row: rIdx, col: cIdx });
                    } else {
                      setHoveredNumberCoord(null);
                    }
                  }}
                  onPointerDown={(e) => handlePointerDown(e, rIdx, cIdx)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerEnd}
                  onPointerCancel={handlePointerEnd}
                  onKeyDown={(e) => handleCellKeyDown(e, rIdx, cIdx)}
                >
                  {renderCellContent(cell)}
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="board-controls-legend">
        <span className="legend-item desktop-only-legend">
          <Keyboard size={14} weight="bold" aria-hidden="true" />
          <span>
            좌클릭 열기 · 우클릭 깃발 · 숫자 클릭 빠른 열기 · 방향키 / F 깃발 / H 힌트 / R 새 게임
          </span>
        </span>
        <span className="legend-item mobile-only-legend">
          <HandTap size={14} weight="bold" aria-hidden="true" />
          <span>짧게 탭: 열기 · 길게 누르기: 깃발 꽂기 · 숫자 탭: 빠른 열기</span>
        </span>
      </div>
    </div>
  );
}
