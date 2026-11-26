import { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle,
  Compass,
  Flag,
  Lightbulb,
  Medal,
  Sparkle,
  Target,
  WarningCircle,
} from '@phosphor-icons/react';
import type { PlayerHint } from '../core/solverHint';
import {
  DIFFICULTY_PRESETS,
  type DifficultyKey,
  type GameSnapshot,
} from '../core/types';
import { PLAYER_GUIDE_STEPS, PRACTICE_PUZZLES } from './playerGuideData';
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
  const [quizIndex, setQuizIndex] = useState<number>(0);
  const [quizFeedback, setQuizFeedback] = useState<{
    selectedIndex: number;
    isCorrect: boolean;
  } | null>(null);

  const isQuizTab = activeStepIndex === PLAYER_GUIDE_STEPS.length;
  const activeStep = PLAYER_GUIDE_STEPS[activeStepIndex] ?? PLAYER_GUIDE_STEPS[0]!;
  const activeQuiz = PRACTICE_PUZZLES[quizIndex] ?? PRACTICE_PUZZLES[0]!;
  const presets = Object.values(DIFFICULTY_PRESETS);

  const handleSelectQuizCell = (cellIndex: number) => {
    const cell = activeQuiz.cells[cellIndex];
    if (!cell || cell.tone !== 'hidden') return;
    const isCorrect = activeQuiz.targetIndices.includes(cellIndex);
    setQuizFeedback({ selectedIndex: cellIndex, isCorrect });
  };

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
          어디를 눌러야 할지 막막할 때 <strong>힌트 보기</strong>를 누르면
          부분집합(1-1), 차집합(1-2), 마인 카운팅 등 현재 보드에 적용 가능한{' '}
          <strong>추론 이유</strong>를 알려드립니다.
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
                  ? '첫 클릭은 100% 안전합니다. 모서리보다는 중앙 부근을 열면 넓은 오프닝이 열리기 쉽습니다.'
                  : snapshot.status === 'won'
                    ? `3BV ${snapshot.threeBV} 보드를 ${snapshot.moveCount}회 클릭으로 클리어했습니다! ${!snapshot.usedFlag ? '깃발 없이 깨는 노플래그(NF)에 성공하셨네요!' : '더 빠른 기록이나 노플래그(NF)에도 도전해 보세요.'}`
                    : snapshot.status === 'lost'
                      ? '아쉽게 지뢰가 터졌어요! 상단의 "같은 판 재도전"으로 방금 배치 그대로 다시 풀어보거나 새 판을 시작해 보세요.'
                      : '숫자 주변에 깃발을 다 꽂았다면 숫자를 클릭(양클릭/Shift+클릭)해 보세요. 나머지 안전 칸이 동시에 열립니다.'}
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

      {/* 2. 나무위키 정석 공략 5단계 + 실전 연습 퀴즈 */}
      <section className="inspector-panel">
        <div className="panel-header">
          <div>
            <span className="panel-eyebrow">
              <BookOpen size={13} weight="bold" aria-hidden="true" />
              HOW TO PLAY · STRATEGY &amp; QUIZ
            </span>
            <h2 className="panel-title">지뢰 찾는 방법 완벽 가이드</h2>
          </div>
        </div>

        <div
          className="step-tabs"
          role="tablist"
          aria-label="지뢰 찾는 방법 및 실전 퀴즈"
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
          <button
            id="guide-tab-quiz"
            type="button"
            role="tab"
            aria-selected={isQuizTab}
            className={`step-tab-btn step-tab-quiz ${isQuizTab ? 'active' : ''}`}
            onClick={() => setActiveStepIndex(PLAYER_GUIDE_STEPS.length)}
          >
            <span className="step-num mono">Quiz</span>
            <span className="step-short-title">
              실전 연습 문제 (직접 풀어보기)
            </span>
          </button>
        </div>

        {isQuizTab ? (
          <article className="step-detail-card" role="tabpanel">
            <div className="quiz-selector-row">
              {PRACTICE_PUZZLES.map((qz, idx) => (
                <button
                  key={qz.id}
                  id={`quiz-select-${idx + 1}`}
                  type="button"
                  className={`quiz-pill-btn ${quizIndex === idx ? 'active' : ''}`}
                  onClick={() => {
                    setQuizIndex(idx);
                    setQuizFeedback(null);
                  }}
                >
                  Q{idx + 1}
                </button>
              ))}
              <span className="keyword-tag">{activeQuiz.difficultyLabel}</span>
            </div>

            <h3 className="step-detail-title">{activeQuiz.title}</h3>
            <p className="step-summary">{activeQuiz.prompt}</p>

            <div className="mini-pattern-box">
              <div
                className="mini-pattern-grid"
                style={{
                  gridTemplateColumns: `repeat(${activeQuiz.cols}, 38px)`,
                }}
                aria-label={activeQuiz.title}
              >
                {activeQuiz.cells.map((cell, idx) => {
                  const isHiddenClickable = cell.tone === 'hidden';
                  const isSelected = quizFeedback?.selectedIndex === idx;
                  const resultClass =
                    isSelected && quizFeedback
                      ? quizFeedback.isCorrect
                        ? 'quiz-correct'
                        : 'quiz-wrong'
                      : '';

                  if (isHiddenClickable) {
                    return (
                      <button
                        key={idx}
                        id={`quiz-cell-${idx}`}
                        type="button"
                        className={`mini-cell mini-cell-interactive tone-${cell.tone} ${resultClass}`}
                        onClick={() => handleSelectQuizCell(idx)}
                        aria-label={`연습 보드 ${idx + 1}번 닫힌 칸`}
                      >
                        {isSelected && quizFeedback?.isCorrect ? (
                          activeQuiz.targetType === 'mine' ? (
                            <Flag size={16} weight="fill" aria-hidden="true" />
                          ) : (
                            <Check size={16} weight="bold" aria-hidden="true" />
                          )
                        ) : (
                          <Target size={14} weight="regular" aria-hidden="true" />
                        )}
                      </button>
                    );
                  }

                  return (
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
                  );
                })}
              </div>
              <p className="mini-pattern-caption">
                표적 표시가 있는 닫힌 칸 중 정답을 직접 클릭해 보세요.
              </p>
            </div>

            {quizFeedback && (
              <div
                className={`quiz-feedback-box ${
                  quizFeedback.isCorrect ? 'correct' : 'wrong'
                }`}
                role="status"
              >
                {quizFeedback.isCorrect ? (
                  <>
                    <CheckCircle size={18} weight="bold" aria-hidden="true" />
                    <span>{activeQuiz.explanation}</span>
                  </>
                ) : (
                  <>
                    <WarningCircle size={18} weight="bold" aria-hidden="true" />
                    <span>
                      아쉬워요! 해당 칸은 아직 확정할 수 없습니다. 두 숫자가
                      공유하는 칸의 개수를 다시 비교해 보세요.
                    </span>
                  </>
                )}
              </div>
            )}
          </article>
        ) : (
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
              <p className="mini-pattern-caption">
                {activeStep.miniBoardCaption}
              </p>
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
        )}
      </section>
    </aside>
  );
}
