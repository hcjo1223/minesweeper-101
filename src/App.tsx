import { useEffect } from 'react';
import {
  ArrowClockwise,
  Bomb,
  BookOpen,
  CursorClick,
  Flag,
  GameController,
  Lightbulb,
  Moon,
  ShieldCheck,
  Sun,
} from '@phosphor-icons/react';
import { DIFFICULTY_PRESETS } from './core/types';
import { GameControls } from './ui/GameControls';
import { MinesweeperBoard } from './ui/MinesweeperBoard';
import { PlayerGuidePanel } from './ui/PlayerGuidePanel';
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
    showNeighborGuide,
    questionMarkEnabled,
    playerHint,
    bestTimes,
    isNewRecord,
    toggleTheme,
    setMobileTab,
    setBoardScale,
    setActionMode,
    setShowNeighborGuide,
    setQuestionMarkEnabled,
    startNewGame,
    retrySameBoard,
    handleCellPrimaryAction,
    handleCellSecondaryAction,
    handleCellChord,
    requestPlayerHint,
    applyPlayerHint,
  } = useMinesweeper('beginner');

  // Global keyboard shortcuts: R (Reset), H (Hint)
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
          requestPlayerHint();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [difficulty, requestPlayerHint, snapshot.status, startNewGame]);

  const currentPreset = DIFFICULTY_PRESETS[difficulty];

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="header-inner">
          <div className="brand-block">
            <div className="brand-emblem" aria-hidden="true">
              <Bomb size={22} weight="duotone" />
            </div>
            <div className="brand-copy">
              <span className="brand-tag mono">MINESWEEPER 101</span>
              <h1 className="site-title">
                Minesweeper 101
                <span className="site-subtitle">
                  누구나 논리로 쉽게 푸는 클래식 지뢰찾기 &amp; 실전 공략 가이드
                </span>
              </h1>
            </div>
          </div>

          <div className="header-meta">
            <div className="architecture-indicator desktop-only-pill">
              <ShieldCheck size={14} weight="bold" aria-hidden="true" />
              <span className="arch-label">첫 클릭</span>
              <code className="mono">100% 안전</code>
            </div>

            <div className="architecture-indicator">
              <span className="arch-label">난이도</span>
              <code className="mono">{currentPreset.label.split(' ')[0]}</code>
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
        aria-label="모바일 화면 전환"
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
          id="mobile-tab-guide"
          type="button"
          className={`mobile-view-tab ${mobileTab === 'guide' ? 'active' : ''}`}
          onClick={() => {
            setMobileTab('guide');
            window.scrollTo({ top: 0 });
          }}
          aria-pressed={mobileTab === 'guide'}
        >
          <BookOpen size={18} weight="bold" aria-hidden="true" />
          <span>지뢰 찾는 법</span>
          {playerHint && (
            <span className="mobile-tab-badge mono">힌트</span>
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
            showNeighborGuide={showNeighborGuide}
            questionMarkEnabled={questionMarkEnabled}
            bestTimes={bestTimes}
            onSelectDifficulty={(key) => startNewGame(key)}
            onReset={() => startNewGame(difficulty)}
            onToggleActionMode={setActionMode}
            onToggleNeighborGuide={() =>
              setShowNeighborGuide((prev) => !prev)
            }
            onToggleQuestionMark={() =>
              setQuestionMarkEnabled((prev) => !prev)
            }
            onRequestHint={requestPlayerHint}
          />

          <MinesweeperBoard
            snapshot={snapshot}
            showNeighborGuide={showNeighborGuide}
            playerHint={playerHint}
            isNewRecord={isNewRecord}
            elapsedSeconds={elapsedSeconds}
            boardScale={boardScale}
            onChangeBoardScale={setBoardScale}
            onCellPrimary={handleCellPrimaryAction}
            onCellSecondary={handleCellSecondaryAction}
            onCellChord={handleCellChord}
            onApplyHint={applyPlayerHint}
            onRetrySameBoard={retrySameBoard}
            onReset={() => startNewGame(difficulty)}
          />
        </div>

        <div
          className={`lab-column-wrapper ${mobileTab === 'guide' ? 'mobile-visible' : 'mobile-hidden'}`}
        >
          <PlayerGuidePanel
            snapshot={snapshot}
            difficulty={difficulty}
            bestTimes={bestTimes}
            playerHint={playerHint}
            onRequestHint={requestPlayerHint}
            onApplyHint={applyPlayerHint}
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
            onClick={requestPlayerHint}
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
            <strong>Minesweeper 101</strong> — 누구나 쉽게 배우고 즐기는 클래식
            지뢰찾기 &amp; 실전 추론 공략 가이드
          </span>
          <span className="mono">First-Click Safe · 3BV · Logic Coach</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
