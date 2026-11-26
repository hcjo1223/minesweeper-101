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

  const statusEmoji =
    snapshot.status === 'won'
      ? '😎'
      : snapshot.status === 'lost'
        ? '💥'
        : snapshot.status === 'playing'
          ? '🧐'
          : '🙂';

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

        <div className="action-buttons-group">
          <button
            id="btn-safe-hint"
            type="button"
            className="utility-btn"
            onClick={onRequestHint}
            disabled={snapshot.status === 'won' || snapshot.status === 'lost'}
            title="열리지 않은 안전 칸 하나를 하이라이트합니다"
          >
            💡 안전 힌트
          </button>
          <button
            id="btn-new-game"
            type="button"
            className="reset-btn"
            onClick={onReset}
          >
            <span aria-hidden="true">{statusEmoji}</span> 새 게임
          </button>
        </div>
      </div>

      <div className="hud-bar">
        <div className="hud-metrics">
          <div className="hud-metric" title="남은 지뢰 수 (전체 지뢰 - 꽂은 깃발)">
            <span className="hud-label">남은 지뢰 (MINES)</span>
            <span className="hud-value mono" id="hud-mines-remaining">
              {formattedMines}
            </span>
          </div>

          <div className="hud-metric" title="경과 시간 (초)">
            <span className="hud-label">경과 시간 (TIME)</span>
            <span className="hud-value mono" id="hud-timer">
              {formattedTime}s
            </span>
          </div>

          <div className="hud-metric" title="안전 구역 탐색 진행률">
            <span className="hud-label">안전 칸 오픈 (PROGRESS)</span>
            <span className="hud-value mono" id="hud-progress">
              {snapshot.revealedCount}/{snapshot.safeCellsTotal} ({progressPercent}
              %)
            </span>
          </div>
        </div>

        <div className="hud-toggles">
          <div
            className="segmented-control"
            role="group"
            aria-label="좌클릭 동작 모드"
          >
            <button
              id="mode-reveal-btn"
              type="button"
              className={`segment-btn ${actionMode === 'reveal' ? 'active' : ''}`}
              onClick={() => onToggleActionMode('reveal')}
            >
              ⛏️ 칸 열기
            </button>
            <button
              id="mode-flag-btn"
              type="button"
              className={`segment-btn ${actionMode === 'flag' ? 'active' : ''}`}
              onClick={() => onToggleActionMode('flag')}
            >
              🚩 깃발 꽂기
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
              title="큐(Queue) 기반 너비 우선 탐색: 시작점부터 동심원 형태로 확장"
            >
              BFS (큐)
            </button>
            <button
              id="algo-dfs-btn"
              type="button"
              className={`segment-btn ${snapshot.algorithm === 'dfs' ? 'active' : ''}`}
              onClick={() => onSelectAlgorithm('dfs')}
              title="재귀(Recursion) 기반 깊이 우선 탐색: 한 방향 끝까지 파고든 후 백트래킹"
            >
              DFS (재귀)
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
            {showTraversalOrder ? '🔢 탐색 순서 표시: 켜짐' : '🔢 탐색 순서 표시: 꺼짐'}
          </button>
        </div>
      </div>
    </section>
  );
}
