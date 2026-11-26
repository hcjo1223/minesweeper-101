import { useState } from 'react';
import type { FloodFillAlgorithm, GameSnapshot } from '../core/types';
import { CURRICULUM_STEPS } from './curriculumData';

interface AlgorithmInspectorProps {
  readonly snapshot: GameSnapshot;
  readonly onSelectAlgorithm: (algo: FloodFillAlgorithm) => void;
}

export function AlgorithmInspector({
  snapshot,
  onSelectAlgorithm,
}: AlgorithmInspectorProps) {
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const trace = snapshot.lastFloodFillTrace;
  const activeStep = CURRICULUM_STEPS[activeStepIndex] ?? CURRICULUM_STEPS[0]!;

  return (
    <aside className="inspector-column" aria-label="알고리즘 분석 및 학습 로드맵">
      {/* 1. 실시간 Flood Fill 탐색 분석기 */}
      <section className="inspector-panel">
        <div className="panel-header">
          <div>
            <span className="panel-eyebrow">LIVE TELEMETRY · STEP 03</span>
            <h2 className="panel-title">Flood Fill 탐색 인스펙터</h2>
          </div>
          <span className="algo-pill mono">
            {snapshot.algorithm === 'bfs' ? 'Queue BFS' : 'Recursive DFS'}
          </span>
        </div>

        <p className="panel-description">
          인접 지뢰가 <code>0</code>인 빈 칸을 클릭하면 주변 안전 구역이 연쇄
          확장됩니다. 상단 또는 아래 버튼으로 <strong>BFS</strong>와{' '}
          <strong>DFS</strong>를 전환하고 보드 위의 탐색 순번(<code>#1, #2…</code>
          )이 어떻게 달라지는지 비교해 보세요.
        </p>

        <div className="algo-comparison-toggle">
          <button
            id="inspector-bfs-btn"
            type="button"
            className={`algo-switch-card ${snapshot.algorithm === 'bfs' ? 'selected' : ''}`}
            onClick={() => onSelectAlgorithm('bfs')}
          >
            <div className="algo-switch-header">
              <strong>BFS (너비 우선 탐색)</strong>
              <span className="mono">Queue · O(V+E)</span>
            </div>
            <p>시작점부터 동심원 물결 모양으로 균일하게 확장 (스택 안전)</p>
          </button>

          <button
            id="inspector-dfs-btn"
            type="button"
            className={`algo-switch-card ${snapshot.algorithm === 'dfs' ? 'selected' : ''}`}
            onClick={() => onSelectAlgorithm('dfs')}
          >
            <div className="algo-switch-header">
              <strong>DFS (깊이 우선 탐색)</strong>
              <span className="mono">Recursion · O(V+E)</span>
            </div>
            <p>한 방향 끝까지 깊숙이 탐색한 뒤 백트래킹하며 확장</p>
          </button>
        </div>

        {trace ? (
          <div className="trace-metrics-box" id="flood-fill-telemetry">
            <div className="trace-grid">
              <div className="trace-stat">
                <span className="trace-stat-label">시작 좌표 (Origin)</span>
                <span className="trace-stat-value mono">
                  ({trace.origin.row}, {trace.origin.col})
                </span>
              </div>
              <div className="trace-stat">
                <span className="trace-stat-label">연쇄 오픈된 셀</span>
                <span className="trace-stat-value mono">
                  {trace.cellsRevealed}칸
                </span>
              </div>
              <div className="trace-stat">
                <span className="trace-stat-label">
                  {trace.algorithm === 'bfs'
                    ? '최대 큐 길이 (Max Queue)'
                    : '최대 재귀 깊이 (Max Stack)'}
                </span>
                <span className="trace-stat-value mono">
                  {trace.maxFrontierSize}
                </span>
              </div>
            </div>

            <div className="trace-path-preview">
              <div className="trace-path-header">
                <span>방문 순서 로그 (Visited Order)</span>
                <span className="mono">
                  총 {trace.visitedOrder.length}개 좌표
                </span>
              </div>
              <div className="trace-coords-list mono">
                {trace.visitedOrder.slice(0, 18).map((coord, idx) => (
                  <span key={`${coord.row}-${coord.col}-${idx}`} className="coord-chip">
                    #{idx + 1} ({coord.row},{coord.col})
                  </span>
                ))}
                {trace.visitedOrder.length > 18 && (
                  <span className="coord-chip more">
                    +{trace.visitedOrder.length - 18}개 더 열림
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="trace-empty-state">
            보드에서 칸을 클릭하면 이곳에 실시간 Flood Fill 탐색 경로와 큐/스택
            메모리 사용량이 표시됩니다.
          </div>
        )}
      </section>

      {/* 2. 5단계 학습 로드맵 가이드 */}
      <section className="inspector-panel">
        <div className="panel-header">
          <div>
            <span className="panel-eyebrow">LEARNING ROADMAP · DOCS/</span>
            <h2 className="panel-title">5단계 핵심 알고리즘 가이드</h2>
          </div>
        </div>

        <div
          className="step-tabs"
          role="tablist"
          aria-label="5단계 학습 커리큘럼"
        >
          {CURRICULUM_STEPS.map((item, idx) => (
            <button
              key={item.stepNumber}
              id={`curriculum-tab-${idx + 1}`}
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
            <span className="step-file-tag mono">📄 {activeStep.docFile}</span>
            <span className="step-file-tag mono">⚙️ {activeStep.sourceFile}</span>
          </div>

          <h3 className="step-detail-title">
            {activeStep.stepNumber}: {activeStep.title}
          </h3>

          <div className="step-keywords">
            {activeStep.keywords.map((kw) => (
              <span key={kw} className="keyword-tag">
                {kw}
              </span>
            ))}
          </div>

          <p className="step-summary">{activeStep.summary}</p>

          <div className="step-insight-box">
            <strong>핵심 설계 포인트 (Why This Matters)</strong>
            <p>{activeStep.keyInsight}</p>
          </div>

          <pre className="step-code-block mono">
            <code>{activeStep.codeSnippet}</code>
          </pre>
        </article>
      </section>
    </aside>
  );
}
