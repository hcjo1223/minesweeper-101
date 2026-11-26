import {
  ArrowClockwise,
  Bomb,
  CursorClick,
  Flag,
  Hash,
  Lightbulb,
  Smiley,
  SmileyWink,
  SmileyXEyes,
  Timer,
  TreeStructure,
  Trophy,
  Waves,
} from '@phosphor-icons/react';
import {
  DIFFICULTY_PRESETS,
  type DifficultyKey,
  type FloodFillAlgorithm,
  type GameSnapshot,
} from '../core/types';
import type { ClickActionMode } from './useMinesweeper';

interface GameControlsProps {
  readonly difficulty: DifficultyKey;
  readonly snapshot: GameSnapshot;
  readonly elapsedSeconds: number;
  readonly actionMode: ClickActionMode;
  readonly showTraversalOrder: boolean;
  readonly onSelectDifficulty: (key: DifficultyKey) => void;
  readonly onReset: () => void;
  readonly onToggleActionMode: (mode: ClickActionMode) => void;
  readonly onSelectAlgorithm: (algo: FloodFillAlgorithm) => void;
  readonly onToggleTraversalOrder: () => void;
  readonly onRequestHint: () => void;
}

export function GameControls({
  difficulty,
  snapshot,
  elapsedSeconds,
  actionMode,
  showTraversalOrder,
  onSelectDifficulty,
  onReset,
  onToggleActionMode,
  onSelectAlgorithm,
  onToggleTraversalOrder,
  onRequestHint,
}: GameControlsProps) {
  const presets = Object.values(DIFFICULTY_PRESETS);
  const progressPercent =
    snapshot.safeCellsTotal > 0
      ? Math.round((snapshot.revealedCount / snapshot.safeCellsTotal) * 100)
      : 0;

  const formattedMines = String(Math.max(-99, snapshot.remainingMines)).padStart(
    3,
    '0'
  );
  const formattedTime = String(elapsedSeconds).padStart(3, '0');

  const renderStatusIcon = () => {
    if (snapshot.status === 'won') {
      return <SmileyWink size={18} weight="bold" aria-hidden="true" />;
    }
    if (snapshot.status === 'lost') {
      return <SmileyXEyes size={18} weight="bold" aria-hidden="true" />;
    }
    return <Smiley size={18} weight="bold" aria-hidden="true" />;
  };

  return (
    <section className="controls-panel" aria-label="게임 설정 및 상태 제어">
      <div className="controls-top-row">
        <div
          className="difficulty-group"
          role="group"
          aria-label="난이도 프리셋 선택"
        >
          {presets.map((preset) => {
            const isActive = preset.key === difficulty;
            return (
              <button
                key={preset.key}
                id={`difficulty-${preset.key}`}
                type="button"
                className={`difficulty-btn ${isActive ? 'active' : ''}`}
                onClick={() => onSelectDifficulty(preset.key)}
                aria-pressed={isActive}
              >
                <span className="difficulty-label">{preset.label}</span>
                <span className="difficulty-sub">{preset.subtitle}</span>
              </button>
            );
          })}
        </div>

        <div className="action-buttons-group desktop-actions">
          <button
            id="btn-safe-hint"
            type="button"
            className="utility-btn"
            onClick={onRequestHint}
            disabled={snapshot.status === 'won' || snapshot.status === 'lost'}
            title="열리지 않은 안전 칸 하나를 하이라이트합니다 (단축키: H)"
          >
            <Lightbulb size={16} weight="bold" aria-hidden="true" />
            <span>안전 힌트</span>
          </button>
          <button
            id="btn-new-game"
            type="button"
            className="reset-btn"
            onClick={onReset}
            title="새 게임 시작 (단축키: R)"
          >
            {renderStatusIcon()}
            <span>새 게임</span>
            <ArrowClockwise size={15} weight="bold" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="hud-bar">
        <div className="hud-metrics">
          <div className="hud-metric" title="남은 지뢰 수 (전체 지뢰 - 꽂은 깃발)">
            <span className="hud-label">
              <Bomb size={12} weight="bold" aria-hidden="true" />
              MINES
            </span>
            <span className="hud-value mono" id="hud-mines-remaining">
              {formattedMines}
            </span>
          </div>

          <div className="hud-metric" title="경과 시간 (초)">
            <span className="hud-label">
              <Timer size={12} weight="bold" aria-hidden="true" />
              TIME
            </span>
            <span className="hud-value mono" id="hud-timer">
              {formattedTime}s
            </span>
          </div>

          <div className="hud-metric hud-metric-progress" title="안전 구역 탐색 진행률">
            <span className="hud-label">
              <Trophy size={12} weight="bold" aria-hidden="true" />
              PROGRESS
            </span>
            <span className="hud-value mono" id="hud-progress">
              {snapshot.revealedCount}/{snapshot.safeCellsTotal} ({progressPercent}
              %)
            </span>
          </div>
        </div>

        <div className="hud-toggles">
          <div
            className="segmented-control desktop-mode-toggle"
            role="group"
            aria-label="좌클릭 동작 모드"
          >
            <button
              id="mode-reveal-btn"
              type="button"
              className={`segment-btn ${actionMode === 'reveal' ? 'active' : ''}`}
              onClick={() => onToggleActionMode('reveal')}
              aria-pressed={actionMode === 'reveal'}
            >
              <CursorClick size={15} weight="bold" aria-hidden="true" />
              <span>칸 열기</span>
            </button>
            <button
              id="mode-flag-btn"
              type="button"
              className={`segment-btn ${actionMode === 'flag' ? 'active' : ''}`}
              onClick={() => onToggleActionMode('flag')}
              aria-pressed={actionMode === 'flag'}
            >
              <Flag size={15} weight="bold" aria-hidden="true" />
              <span>깃발 꽂기</span>
            </button>
          </div>

          <div
            className="segmented-control"
            role="group"
            aria-label="Flood Fill 알고리즘 선택"
          >
            <button
              id="algo-bfs-btn"
              type="button"
              className={`segment-btn ${snapshot.algorithm === 'bfs' ? 'active' : ''}`}
              onClick={() => onSelectAlgorithm('bfs')}
              aria-pressed={snapshot.algorithm === 'bfs'}
              title="큐(Queue) 기반 너비 우선 탐색: 시작점부터 동심원 형태로 확장"
            >
              <Waves size={15} weight="bold" aria-hidden="true" />
              <span>BFS (큐)</span>
            </button>
            <button
              id="algo-dfs-btn"
              type="button"
              className={`segment-btn ${snapshot.algorithm === 'dfs' ? 'active' : ''}`}
              onClick={() => onSelectAlgorithm('dfs')}
              aria-pressed={snapshot.algorithm === 'dfs'}
              title="재귀(Recursion) 기반 깊이 우선 탐색: 한 방향 끝까지 파고든 후 백트래킹"
            >
              <TreeStructure size={15} weight="bold" aria-hidden="true" />
              <span>DFS (재귀)</span>
            </button>
          </div>

          <button
            id="toggle-traversal-overlay-btn"
            type="button"
            className={`overlay-toggle-btn ${showTraversalOrder ? 'active' : ''}`}
            onClick={onToggleTraversalOrder}
            aria-pressed={showTraversalOrder}
            title="Flood Fill로 열린 각 칸의 탐색 순번(#1, #2...)을 보드 위에 표시합니다"
          >
            <Hash size={15} weight="bold" aria-hidden="true" />
            <span>{showTraversalOrder ? '탐색 순서: ON' : '탐색 순서: OFF'}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
