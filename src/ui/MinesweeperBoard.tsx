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
  ShieldCheck,
  WarningCircle,
} from '@phosphor-icons/react';
import type { CellState, Coordinate, GameSnapshot } from '../core/types';
import type { BoardScaleMode } from './useMinesweeper';

interface MinesweeperBoardProps {
  readonly snapshot: GameSnapshot;
  readonly showTraversalOrder: boolean;
  readonly hintCoord: Coordinate | null;
  readonly boardScale: BoardScaleMode;
  readonly onChangeBoardScale: (mode: BoardScaleMode) => void;
  readonly onCellPrimary: (row: number, col: number) => void;
  readonly onCellSecondary: (row: number, col: number) => void;
  readonly onCellChord: (row: number, col: number) => void;
  readonly onReset: () => void;
}

const LONG_PRESS_DELAY_MS = 380;
const MOVE_CANCEL_THRESHOLD_PX = 8;

export function MinesweeperBoard({
  snapshot,
  showTraversalOrder,
  hintCoord,
  boardScale,
  onChangeBoardScale,
  onCellPrimary,
  onCellSecondary,
  onCellChord,
  onReset,
}: MinesweeperBoardProps) {
  const { board, config, status, lastFloodFillTrace } = snapshot;
  const [focusedCoord, setFocusedCoord] = useState<Coordinate>({
    row: 0,
    col: 0,
  });

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
    // 터치/펜 입력일 때만 롱프레스(깃발 꽂기) 제스처 활성화
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
    // 터치 롱프레스로 이미 깃발이 처리된 경우 후속 click 무시
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

  const maxTraceOrder = Math.max(1, lastFloodFillTrace?.cellsRevealed ?? 1);
  const showScaleToggle = config.cols > 9;

  return (
    <div className="board-stage">
      <div className="board-status-banner" role="status" aria-live="polite">
        {status === 'idle' && (
          <p className="status-message idle">
            <span className="status-badge">
              <ShieldCheck size={14} weight="bold" aria-hidden="true" />
              First-Click Safe
            </span>
            <span>
              첫 클릭과 주변 8칸(3×3)에는 지뢰가 배치되지 않습니다. 아무 칸이나
              눌러 시작하세요.
            </span>
          </p>
        )}
        {status === 'playing' && (
          <p className="status-message playing">
            <span>
              열린 숫자를 클릭/더블클릭하면 <strong>Chording</strong>으로 주변
              안전 칸을 한 번에 엽니다. 모바일에서는 길게 눌러(Long-press) 깃발을
              꽂을 수 있습니다.
            </span>
          </p>
        )}
        {status === 'won' && (
          <div className="status-message won">
            <span className="status-with-icon">
              <CheckCircle size={18} weight="bold" aria-hidden="true" />
              <span>
                <strong>클리어 성공!</strong> 모든 안전 구역(
                {snapshot.safeCellsTotal}칸)을 완벽하게 탐색했습니다.
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
                <strong>지뢰 폭발!</strong> 탐색 로그를 확인하거나 새 게임을
                시작해 보세요.
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
      </div>

      {showScaleToggle && (
        <div className="board-scale-toolbar">
          <span className="scale-hint mono">
            {config.cols} × {config.rows} Grid
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
        >
          {board.map((rowCells, rIdx) =>
            rowCells.map((cell, cIdx) => {
              const isHinted =
                hintCoord?.row === rIdx && hintCoord?.col === cIdx;
              const hasTraversalBadge =
                showTraversalOrder &&
                cell.isRevealed &&
                !cell.isMine &&
                cell.revealOrder !== undefined;

              // Perceptual color ramp progress (0.0 -> 1.0) for Flood Fill visualization
              const traversalProgress =
                hasTraversalBadge && cell.revealOrder !== undefined
                  ? Number((cell.revealOrder / maxTraceOrder).toFixed(2))
                  : 0;

              const isRovingFocus =
                focusedCoord.row === rIdx && focusedCoord.col === cIdx;

              const cellClasses = [
                'mine-cell',
                cell.isRevealed ? 'revealed' : 'unrevealed',
                cell.isFlagged ? 'flagged' : '',
                cell.isExploded ? 'exploded' : '',
                cell.isRevealed && cell.neighborMines === 0 && !cell.isMine
                  ? 'empty-zero'
                  : '',
                hasTraversalBadge ? 'traversed-cell' : '',
                isHinted ? 'hint-cell' : '',
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
                  style={
                    hasTraversalBadge
                      ? ({
                          '--traversal-ratio': traversalProgress,
                        } as CSSProperties)
                      : undefined
                  }
                  aria-label={getCellAriaLabel(cell)}
                  onClick={() => handleCellClick(rIdx, cIdx)}
                  onDoubleClick={() => onCellChord(rIdx, cIdx)}
                  onContextMenu={(e) => handleContextMenu(e, rIdx, cIdx)}
                  onPointerDown={(e) => handlePointerDown(e, rIdx, cIdx)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerEnd}
                  onPointerCancel={handlePointerEnd}
                  onKeyDown={(e) => handleCellKeyDown(e, rIdx, cIdx)}
                >
                  {renderCellContent(cell)}
                  {hasTraversalBadge && (
                    <span
                      className="traversal-order-badge"
                      aria-hidden="true"
                    >
                      {cell.revealOrder}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="board-controls-legend">
        <span className="legend-item desktop-only-legend">
          <Keyboard size={14} weight="bold" aria-hidden="true" />
          <span>방향키 이동 · Enter/Space 열기 · F 깃발 · R 새 게임</span>
        </span>
        <span className="legend-item mobile-only-legend">
          <HandTap size={14} weight="bold" aria-hidden="true" />
          <span>짧게 탭: 열기 · 길게 누르기: 깃발 꽂기</span>
        </span>
      </div>
    </div>
  );
}
