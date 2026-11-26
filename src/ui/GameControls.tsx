import {
  ArrowClockwise,
  Bomb,
  Crosshair,
  CursorClick,
  Flag,
  Lightbulb,
  Medal,
  Smiley,
  SmileyWink,
  SmileyXEyes,
  Timer,
  Trophy,
} from '@phosphor-icons/react';
import {
  DIFFICULTY_PRESETS,
  type DifficultyKey,
  type GameSnapshot,
} from '../core/types';
import type { BestTimesMap, ClickActionMode } from './useMinesweeper';

interface GameControlsProps {
  readonly difficulty: DifficultyKey;
  readonly snapshot: GameSnapshot;
  readonly elapsedSeconds: number;
  readonly actionMode: ClickActionMode;
  readonly showNeighborGuide: boolean;
  readonly bestTimes: BestTimesMap;
  readonly onSelectDifficulty: (key: DifficultyKey) => void;
  readonly onReset: () => void;
  readonly onToggleActionMode: (mode: ClickActionMode) => void;
  readonly onToggleNeighborGuide: () => void;
  readonly onRequestHint: () => void;
}

export function GameControls({
  difficulty,
  snapshot,
  elapsedSeconds,
  actionMode,
  showNeighborGuide,
  bestTimes,
  onSelectDifficulty,
  onReset,
  onToggleActionMode,
  onToggleNeighborGuide,
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
  const bestTime = bestTimes[difficulty];

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
    <section className="controls-panel" aria-label="게임 난이도 및 플레이 제어">
      <div className="controls-top-row">
        <div
          className="difficulty-group"
          role="group"
          aria-label="난이도 선택"
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
            title="현재 보드에서 추론 가능한 다음 수를 알려줍니다 (단축키: H)"
          >
            <Lightbulb size={16} weight="bold" aria-hidden="true" />
            <span>공략 힌트</span>
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
              남은 지뢰
            </span>
            <span className="hud-value mono" id="hud-mines-remaining">
              {formattedMines}
            </span>
          </div>

          <div className="hud-metric" title="현재 게임 경과 시간">
            <span className="hud-label">
              <Timer size={12} weight="bold" aria-hidden="true" />
              진행 시간
            </span>
            <span className="hud-value mono" id="hud-timer">
              {formattedTime}s
            </span>
          </div>

          <div className="hud-metric hud-metric-progress" title="안전 칸 탐색률 및 난이도 최고 기록">
            <span className="hud-label">
              {bestTime !== undefined ? (
                <>
                  <Medal size={12} weight="bold" aria-hidden="true" />
                  최고 {bestTime}s · 진행률
                </>
              ) : (
                <>
                  <Trophy size={12} weight="bold" aria-hidden="true" />
                  안전 칸 진행률
                </>
              )}
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
            aria-label="클릭 동작 모드"
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

          <button
            id="toggle-neighbor-guide-btn"
            type="button"
            className={`overlay-toggle-btn ${showNeighborGuide ? 'active' : ''}`}
            onClick={onToggleNeighborGuide}
            aria-pressed={showNeighborGuide}
            title="열린 숫자 위에 마우스를 올리면 해당 숫자가 영향을 미치는 주변 8칸 범위를 표시합니다"
          >
            <Crosshair size={15} weight="bold" aria-hidden="true" />
            <span>
              {showNeighborGuide ? '주변 8칸 가이드: ON' : '주변 8칸 가이드: OFF'}
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
