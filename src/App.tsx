import { AlgorithmInspector } from './ui/AlgorithmInspector';
import { GameControls } from './ui/GameControls';
import { MinesweeperBoard } from './ui/MinesweeperBoard';
import { useMinesweeper } from './ui/useMinesweeper';

export function App() {
  const {
    difficulty,
    snapshot,
    elapsedSeconds,
    actionMode,
    showTraversalOrder,
    hintCoord,
    setActionMode,
    setShowTraversalOrder,
    startNewGame,
    handleCellPrimaryAction,
    handleCellSecondaryAction,
    handleCellChord,
    handleAlgorithmChange,
    requestSafeHint,
  } = useMinesweeper('beginner');

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="header-inner">
          <div className="brand-block">
            <span className="brand-tag mono">MINESWEEPER 101 · LAB</span>
            <h1 className="site-title">
              💣 Minesweeper 101{' '}
              <span className="site-subtitle">
                Play the classic game, master the underlying algorithms
              </span>
            </h1>
          </div>

          <div className="header-meta">
            <div className="architecture-indicator">
              <span className="arch-label">Core Engine</span>
              <code className="mono">Headless TypeScript</code>
            </div>
            <div className="architecture-indicator">
              <span className="arch-label">Active Flood Fill</span>
              <code className="mono">{snapshot.algorithm.toUpperCase()}</code>
            </div>
          </div>
        </div>
      </header>

      <main className="workspace-container">
        <div className="game-column">
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
            onCellPrimary={handleCellPrimaryAction}
            onCellSecondary={handleCellSecondaryAction}
            onCellChord={handleCellChord}
            onReset={() => startNewGame(difficulty)}
          />
        </div>

        <AlgorithmInspector
          snapshot={snapshot}
          onSelectAlgorithm={handleAlgorithmChange}
        />
      </main>

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
