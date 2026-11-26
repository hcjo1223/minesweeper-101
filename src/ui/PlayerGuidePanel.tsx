import { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Check,
  Compass,
  Flag,
  Lightbulb,
  Medal,
  Sparkle,
} from '@phosphor-icons/react';
import type { PlayerHint } from '../core/solverHint';
import { DIFFICULTY_PRESETS, type DifficultyKey, type GameSnapshot } from '../core/types';
import { PLAYER_GUIDE_STEPS } from './playerGuideData';
import type { BestTimesMap } from './useMinesweeper';

interface PlayerGuidePanelProps {
  readonly snapshot: GameSnapshot;
  readonly difficulty: DifficultyKey;
  readonly bestTimes: BestTimesMap;
  readonly playerHint: PlayerHint | null;
  readonly onRequestHint: () => void;
  readonly onApplyHint: () => void;
}

export function PlayerGuidePanel({
  snapshot,
  difficulty,
  bestTimes,
  playerHint,
  onRequestHint,
  onApplyHint,
}: PlayerGuidePanelProps) {
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const activeStep = PLAYER_GUIDE_STEPS[activeStepIndex] ?? PLAYER_GUIDE_STEPS[0]!;
  const presets = Object.values(DIFFICULTY_PRESETS);

  return (
    <aside className="inspector-column" aria-label="실전 지뢰 찾기 코치 및 공략 가이드">
      {/* 1. 실시간 플레이 코치 & 공략 힌트 */}
      <section className="inspector-panel">
        <div className="panel-header">
          <div>
            <span className="panel-eyebrow">
              <Compass size={13} weight="bold" aria-hidden="true" />
              PLAY COACH · LIVE HINT
            </span>
            <h2 className="panel-title">실시간 지뢰 찾기 코치</h2>
          </div>
          <button
            id="coach-hint-btn"
            type="button"
            className="coach-hint-trigger"
            onClick={onRequestHint}
            disabled={snapshot.status === 'won' || snapshot.status === 'lost'}
          >
            <Lightbulb size={15} weight="bold" aria-hidden="true" />
            <span>힌트 보기</span>
          </button>
        </div>

        <p className="panel-description">
          어디를 눌러야 할지 막막할 때 <strong>힌트 보기</strong>를 누르면,
          현재 보드에서 논리적으로 100% 찾아낼 수 있는 지뢰나 안전 칸의{' '}
          <strong>추론 이유</strong>를 바로 알려드립니다.
        </p>

        {playerHint ? (
          <div
            className={`coach-hint-card action-${playerHint.action}`}
            id="player-coach-hint-card"
          >
            <div className="coach-hint-header">
              <span className="coach-pattern-badge">{playerHint.patternName}</span>
              <span className="coach-coord-badge mono">
                {playerHint.coord.row + 1}행 {playerHint.coord.col + 1}열
              </span>
            </div>
            <p className="coach-hint-reason">{playerHint.reason}</p>
            <div className="coach-hint-actions">
              <button
                id="coach-apply-hint-btn"
                type="button"
                className="coach-apply-btn"
                onClick={onApplyHint}
              >
                <span>
                  {playerHint.action === 'reveal'
                    ? '추천 칸 바로 열기'
                    : playerHint.action === 'flag'
                      ? '추천 칸에 깃발 꽂기'
                      : '잘못된 깃발 해제하기'}
                </span>
                <ArrowRight size={14} weight="bold" aria-hidden="true" />
              </button>
            </div>
          </div>
        ) : (
          <div className="coach-tips-card">
            <div className="coach-tip-row">
              <span className="coach-tip-pill">
                {snapshot.status === 'idle'
                  ? '시작 팁'
                  : snapshot.status === 'won'
                    ? '클리어!'
                    : snapshot.status === 'lost'
                      ? '재도전'
                      : '실전 요령'}
              </span>
              <p>
                {snapshot.status === 'idle'
                  ? '첫 클릭은 100% 안전합니다. 모서리보다는 중앙 부근을 열면 넓은 공간이 한 번에 열리기 쉽습니다.'
                  : snapshot.status === 'won'
                    ? '축하합니다! 더 높은 난이도(중급·고급)로 도전하거나 최고 기록 단축을 노려보세요.'
                    : snapshot.status === 'lost'
                      ? '지뢰를 밟았어요! 아래 5단계 공략의 1-1 / 1-2 패턴을 익히면 찍는 횟수를 크게 줄일 수 있습니다.'
                      : '숫자 주변에 깃발을 다 꽂았다면 그 숫자를 한 번만 클릭해 보세요. 나머지 안전한 칸이 동시에 열립니다.'}
              </p>
            </div>
          </div>
        )}

        {/* 난이도별 내 최고 기록 */}
        <div className="best-times-strip" aria-label="난이도별 최고 기록">
          {presets.map((preset) => {
            const record = bestTimes[preset.key];
            const isCurrent = preset.key === difficulty;
            return (
              <div
                key={preset.key}
                className={`best-time-item ${isCurrent ? 'current' : ''}`}
              >
                <span className="best-time-label">
                  <Medal size={12} weight="bold" aria-hidden="true" />
                  {preset.label.split(' ')[0]} 최고
                </span>
                <span className="best-time-value mono">
                  {record !== undefined ? `${record}s` : '--'}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. 지뢰 찾는 방법 5단계 마스터 가이드 */}
      <section className="inspector-panel">
        <div className="panel-header">
          <div>
            <span className="panel-eyebrow">
              <BookOpen size={13} weight="bold" aria-hidden="true" />
              HOW TO PLAY · 5 STEPS
            </span>
            <h2 className="panel-title">지뢰 찾는 방법 완벽 가이드</h2>
          </div>
        </div>

        <div
          className="step-tabs"
          role="tablist"
          aria-label="지뢰 찾는 방법 5단계"
        >
          {PLAYER_GUIDE_STEPS.map((item, idx) => (
            <button
              key={item.stepNumber}
              id={`guide-tab-${idx + 1}`}
              type="button"
              role="tab"
              aria-selected={activeStepIndex === idx}
              className={`step-tab-btn ${activeStepIndex === idx ? 'active' : ''}`}
              onClick={() => setActiveStepIndex(idx)}
            >
              <span className="step-num mono">{item.stepNumber}</span>
              <span className="step-short-title">{item.title}</span>
            </button>
          ))}
        </div>

        <article className="step-detail-card" role="tabpanel">
          <div className="step-meta-row">
            <span className="keyword-tag">{activeStep.badge}</span>
          </div>

          <h3 className="step-detail-title">
            {activeStep.stepNumber}: {activeStep.title}
          </h3>

          <p className="step-summary">{activeStep.summary}</p>

          {/* 시각적 미니 패턴 보드 */}
          <div className="mini-pattern-box">
            <div
              className="mini-pattern-grid"
              style={{
                gridTemplateColumns: `repeat(${activeStep.miniBoardCols}, 34px)`,
              }}
              aria-label={activeStep.miniBoardCaption}
            >
              {activeStep.miniBoard.map((cell, idx) => (
                <div
                  key={idx}
                  className={`mini-cell tone-${cell.tone} ${
                    cell.numberColor ? `num-${cell.numberColor}` : ''
                  }`}
                >
                  {cell.icon === 'flag' && (
                    <Flag size={16} weight="fill" aria-hidden="true" />
                  )}
                  {cell.icon === 'check' && (
                    <Check size={16} weight="bold" aria-hidden="true" />
                  )}
                  {cell.label && <span className="mono">{cell.label}</span>}
                </div>
              ))}
            </div>
            <p className="mini-pattern-caption">{activeStep.miniBoardCaption}</p>
          </div>

          <div className="step-insight-box">
            <strong>
              <Sparkle size={14} weight="bold" aria-hidden="true" />
              실전 적용 공식
            </strong>
            <p>{activeStep.actionRule}</p>
          </div>

          <p className="step-pro-tip">
            <strong>꿀팁:</strong> {activeStep.proTip}
          </p>
        </article>
      </section>
    </aside>
  );
}
