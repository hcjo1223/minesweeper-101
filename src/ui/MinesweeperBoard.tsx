import type { MouseEvent } from 'react';
import type { CellState, Coordinate, GameSnapshot } from '../core/types';

interface MinesweeperBoardProps {
  readonly snapshot: GameSnapshot;
  readonly showTraversalOrder: boolean;
  readonly hintCoord: Coordinate | null;
  readonly onCellPrimary: (row: number, col: number) => void;
  readonly onCellSecondary: (row: number, col: number) => void;
  readonly onCellChord: (row: number, col: number) => void;
  readonly onReset: () => void;
}

export function MinesweeperBoard({
  snapshot,
  showTraversalOrder,
  hintCoord,
  onCellPrimary,
  onCellSecondary,
  onCellChord,
  onReset,
}: MinesweeperBoardProps) {
  const { board, config, status } = snapshot;

  const handleContextMenu = (
    e: MouseEvent<HTMLButtonElement>,
    row: number,
    col: number
  ) => {
    e.preventDefault();
    onCellSecondary(row, col);
  };

  const renderCellContent = (cell: CellState) => {
    if (!cell.isRevealed) {
      if (cell.isFlagged) {
        return (
          <span className="cell-icon flag-icon" aria-label="깃발">
            🚩
          </span>
        );
      }
      return null;
    }

    if (cell.isMine) {
      return (
        <span className="cell-icon mine-icon" aria-label="지뢰">
          {cell.isExploded ? '💥' : '💣'}
        </span>
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
      return `${pos}, 지뢰`;
    }
    return cell.neighborMines > 0
      ? `${pos}, 인접 지뢰 ${cell.neighborMines}개`
      : `${pos}, 빈 안전 칸`;
  };

  return (
    <div className="board-stage">
      <div className="board-status-banner" role="status" aria-live="polite">
        {status === 'idle' && (
          <p className="status-message idle">
            <span className="status-badge">First-Click Safe</span> 첫 번째로
            클릭하는 칸과 그 주변 8칸(3×3)에는 절대 지뢰가 배치되지 않습니다.
            아무 칸이나 클릭해 시작하세요!
          </p>
        )}
        {status === 'playing' && (
          <p className="status-message playing">
            좌클릭으로 칸을 열고, 우클릭(또는 상단 깃발 모드)으로 지뢰 위치에
            깃발을 꽂으세요. 열린 숫자를 클릭하면 주변 칸을 한 번에 여는{' '}
            <strong>Chording</strong>이 동작합니다.
          </p>
        )}
        {status === 'won' && (
          <div className="status-message won">
            <span>
              🎉 <strong>클리어 성공!</strong> 모든 안전 구역(
              {snapshot.safeCellsTotal}칸)을 완벽하게 탐색했습니다.
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
            <span>
              💥 <strong>지뢰 폭발!</strong> 지뢰를 밟아 게임이 종료되었습니다.
              탐색 로그를 확인하거나 새 게임을 시작해 보세요.
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

      <div className="board-scroll-wrapper">
        <div
          id="minesweeper-grid"
          className={`minesweeper-grid cols-${config.cols}`}
          style={{
            gridTemplateColumns: `repeat(${config.cols}, var(--cell-size))`,
          }}
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
                  className={cellClasses}
                  aria-label={getCellAriaLabel(cell)}
                  onClick={() => onCellPrimary(rIdx, cIdx)}
                  onDoubleClick={() => onCellChord(rIdx, cIdx)}
                  onContextMenu={(e) => handleContextMenu(e, rIdx, cIdx)}
                >
                  {renderCellContent(cell)}
                  {hasTraversalBadge && (
                    <span
                      className="traversal-order-badge"
                      title={`${snapshot.algorithm.toUpperCase()} 탐색 순서 #${cell.revealOrder}`}
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
    </div>
  );
}
