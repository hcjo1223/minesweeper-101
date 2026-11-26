import { useEffect } from 'react';
import {
  ArrowClockwise,
  Bomb,
  BookOpen,
  Cpu,
  CursorClick,
  Flag,
  GameController,
  Lightbulb,
  Moon,
  Sun,
} from '@phosphor-icons/react';
import { AlgorithmInspector } from './ui/AlgorithmInspector';
import { GameControls } from './ui/GameControls';
import { MinesweeperBoard } from './ui/MinesweeperBoard';
import { useMinesweeper } from './ui/useMinesweeper';

export function App() {
  const {
    theme,
    mobileTab,
    boardScale,
    difficulty,
    snapshot,
    elapsedSeconds,
    actionMode,
    showTraversalOrder,
    hintCoord,
    toggleTheme,
    setMobileTab,
    setBoardScale,
    setActionMode,
    setShowTraversalOrder,
    startNewGame,
    handleCellPrimaryAction,
    handleCellSecondaryAction,
    handleCellChord,
    handleAlgorithmChange,
    requestSafeHint,
  } = useMinesweeper('beginner');

  // Global keyboard shortcuts for PC convenience: R (Reset), H (Hint)
  useEffect(() => {
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.metaKey ||
        e.ctrlKey ||
        e.altKey
      ) {
        return;
      }
      if (e.key === 'r' || e.key === 'R') {
        startNewGame(difficulty);
      } else if (e.key === 'h' || e.key === 'H') {
        if (snapshot.status !== 'won' && snapshot.status !== 'lost') {
          requestSafeHint();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [difficulty, requestSafeHint, snapshot.status, startNewGame]);

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="header-inner">
          <div className="brand-block">
            <div className="brand-emblem" aria-hidden="true">
              <Bomb size={22} weight="duotone" />
            </div>
            <div className="brand-copy">
              <span className="brand-tag mono">MINESWEEPER 101 · LAB</span>
              <h1 className="site-title">
                Minesweeper 101
                <span className="site-subtitle">
                  Play the classic game, master the underlying algorithms
                </span>
              </h1>
            </div>
          </div>

          <div className="header-meta">
            <div className="architecture-indicator desktop-only-pill">
              <Cpu size={14} weight="bold" aria-hidden="true" />
              <span className="arch-label">Core</span>
              <code className="mono">Headless TS</code>
            </div>

            <div className="architecture-indicator">
              <span className="arch-label">Flood Fill</span>
              <code className="mono">{snapshot.algorithm.toUpperCase()}</code>
            </div>

            <button
              id="theme-toggle-btn"
              type="button"
              className="theme-toggle-btn"
              onClick={toggleTheme}
              aria-label={
                theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'
              }
              title={
                theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'
              }
            >
              {theme === 'dark' ? (
                <Sun size={18} weight="bold" aria-hidden="true" />
              ) : (
                <Moon size={18} weight="bold" aria-hidden="true" />
              )}
              <span className="theme-toggle-label">
                {theme === 'dark' ? 'Light' : 'Dark'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile / Tablet View Switcher (< 1024px) */}
      <nav
        className="mobile-view-switcher"
        aria-label="모바일 작업 화면 전환"
      >
        <button
          id="mobile-tab-game"
          type="button"
          className={`mobile-view-tab ${mobileTab === 'game' ? 'active' : ''}`}
          onClick={() => {
            setMobileTab('game');
            window.scrollTo({ top: 0 });
          }}
          aria-pressed={mobileTab === 'game'}
        >
          <GameController size={18} weight="bold" aria-hidden="true" />
          <span>지뢰찾기 게임</span>
        </button>
        <button
          id="mobile-tab-lab"
          type="button"
          className={`mobile-view-tab ${mobileTab === 'lab' ? 'active' : ''}`}
          onClick={() => {
            setMobileTab('lab');
            window.scrollTo({ top: 0 });
          }}
          aria-pressed={mobileTab === 'lab'}
        >
          <BookOpen size={18} weight="bold" aria-hidden="true" />
          <span>알고리즘 &amp; 학습</span>
          {snapshot.lastFloodFillTrace && (
            <span className="mobile-tab-badge mono">
              {snapshot.lastFloodFillTrace.cellsRevealed}
            </span>
          )}
        </button>
      </nav>

      <main className="workspace-container">
        <div
          className={`game-column ${mobileTab === 'game' ? 'mobile-visible' : 'mobile-hidden'}`}
        >
          <GameControls
            difficulty={difficulty}
            snapshot={snapshot}
            elapsedSeconds={elapsedSeconds}
            actionMode={actionMode}
            showTraversalOrder={showTraversalOrder}
            onSelectDifficulty={(key) => startNewGame(key)}
            onReset={() => startNewGame(difficulty)}
            onToggleActionMode={setActionMode}
            onSelectAlgorithm={handleAlgorithmChange}
            onToggleTraversalOrder={() =>
              setShowTraversalOrder((prev) => !prev)
            }
            onRequestHint={requestSafeHint}
          />

          <MinesweeperBoard
            snapshot={snapshot}
            showTraversalOrder={showTraversalOrder}
            hintCoord={hintCoord}
            boardScale={boardScale}
            onChangeBoardScale={setBoardScale}
            onCellPrimary={handleCellPrimaryAction}
            onCellSecondary={handleCellSecondaryAction}
            onCellChord={handleCellChord}
            onReset={() => startNewGame(difficulty)}
          />
        </div>

        <div
          className={`lab-column-wrapper ${mobileTab === 'lab' ? 'mobile-visible' : 'mobile-hidden'}`}
        >
          <AlgorithmInspector
            snapshot={snapshot}
            onSelectAlgorithm={handleAlgorithmChange}
          />
        </div>
      </main>

      {/* Mobile Sticky Bottom Action Dock (< 768px, Game Tab only) */}
      {mobileTab === 'game' && (
        <div
          className="mobile-bottom-dock"
          role="region"
          aria-label="모바일 빠른 조작 바"
        >
          <button
            id="mobile-mode-reveal"
            type="button"
            className={`dock-btn ${actionMode === 'reveal' ? 'active' : ''}`}
            onClick={() => setActionMode('reveal')}
            aria-pressed={actionMode === 'reveal'}
          >
            <CursorClick size={18} weight="bold" aria-hidden="true" />
            <span>열기</span>
          </button>

          <button
            id="mobile-mode-flag"
            type="button"
            className={`dock-btn ${actionMode === 'flag' ? 'active-flag' : ''}`}
            onClick={() => setActionMode('flag')}
            aria-pressed={actionMode === 'flag'}
          >
            <Flag size={18} weight="bold" aria-hidden="true" />
            <span>깃발</span>
          </button>

          <button
            id="mobile-btn-hint"
            type="button"
            className="dock-btn"
            onClick={requestSafeHint}
            disabled={snapshot.status === 'won' || snapshot.status === 'lost'}
          >
            <Lightbulb size={18} weight="bold" aria-hidden="true" />
            <span>힌트</span>
          </button>

          <button
            id="mobile-btn-reset"
            type="button"
            className="dock-btn dock-btn-primary"
            onClick={() => startNewGame(difficulty)}
          >
            <ArrowClockwise size={18} weight="bold" aria-hidden="true" />
            <span>새 게임</span>
          </button>
        </div>
      )}

      <footer className="site-footer">
        <div className="footer-inner">
          <span>
            <strong>Minesweeper 101</strong> — 2차원 배열 모델링, Fisher-Yates
            셔플, Flood Fill(BFS/DFS), 헤드리스 아키텍처 학습 프로젝트
          </span>
          <span className="mono">MIT License · docs/01~05 Included</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
