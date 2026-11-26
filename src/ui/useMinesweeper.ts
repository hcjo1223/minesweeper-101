import { useCallback, useEffect, useState } from 'react';
import { MinesweeperEngine } from '../core/MinesweeperEngine';
import {
  DIFFICULTY_PRESETS,
  type Coordinate,
  type DifficultyKey,
  type FloodFillAlgorithm,
  type GameSnapshot,
} from '../core/types';

export type ClickActionMode = 'reveal' | 'flag';
export type ThemeMode = 'dark' | 'light';
export type MobileWorkspaceTab = 'game' | 'lab';
export type BoardScaleMode = 'fit' | 'comfort';

const THEME_STORAGE_KEY = 'minesweeper-101-theme';

function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
  } catch {
    // ignore storage errors
  }
  return 'dark';
}

export function useMinesweeper(initialDifficulty: DifficultyKey = 'beginner') {
  const [engine] = useState(
    () =>
      new MinesweeperEngine({
        config: DIFFICULTY_PRESETS[initialDifficulty],
        algorithm: 'bfs',
      })
  );

  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  const [mobileTab, setMobileTab] = useState<MobileWorkspaceTab>('game');
  const [boardScale, setBoardScale] = useState<BoardScaleMode>('fit');
  const [difficulty, setDifficulty] =
    useState<DifficultyKey>(initialDifficulty);
  const [snapshot, setSnapshot] = useState<GameSnapshot>(() =>
    engine.getSnapshot()
  );
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [actionMode, setActionMode] = useState<ClickActionMode>('reveal');
  const [showTraversalOrder, setShowTraversalOrder] = useState<boolean>(true);
  const [hintCoord, setHintCoord] = useState<Coordinate | null>(null);

  // Sync theme attribute to <html> and meta theme-color
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute(
        'content',
        theme === 'dark' ? '#0B1120' : '#F1F5F9'
      );
    }
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore storage errors
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  // 게임 진행 중일 때만 동작하는 1초 타이머 (Step 04: 타이머 상태 관리)
  useEffect(() => {
    if (snapshot.status !== 'playing') {
      return;
    }

    const intervalId = window.setInterval(() => {
      setElapsedSeconds((prev) => Math.min(prev + 1, 999));
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [snapshot.status]);

  const startNewGame = useCallback(
    (nextDifficulty: DifficultyKey = difficulty) => {
      const preset = DIFFICULTY_PRESETS[nextDifficulty];
      setDifficulty(nextDifficulty);
      setElapsedSeconds(0);
      setHintCoord(null);
      const nextSnap = engine.reset(preset);
      setSnapshot(nextSnap);
    },
    [difficulty, engine]
  );

  const handleCellPrimaryAction = useCallback(
    (row: number, col: number) => {
      setHintCoord(null);
      const currentCell = snapshot.board[row]?.[col];
      if (!currentCell) return;

      // 이미 열린 숫자 셀을 클릭하면 Chording(주변 한 번에 열기) 시도
      if (currentCell.isRevealed && currentCell.neighborMines > 0) {
        setSnapshot(engine.chord(row, col));
        return;
      }

      if (actionMode === 'flag') {
        setSnapshot(engine.toggleFlag(row, col));
      } else {
        setSnapshot(engine.reveal(row, col));
      }
    },
    [actionMode, engine, snapshot.board]
  );

  const handleCellSecondaryAction = useCallback(
    (row: number, col: number) => {
      setHintCoord(null);
      setSnapshot(engine.toggleFlag(row, col));
    },
    [engine]
  );

  const handleCellChord = useCallback(
    (row: number, col: number) => {
      setHintCoord(null);
      setSnapshot(engine.chord(row, col));
    },
    [engine]
  );

  const handleAlgorithmChange = useCallback(
    (nextAlgorithm: FloodFillAlgorithm) => {
      setSnapshot(engine.setAlgorithm(nextAlgorithm));
    },
    [engine]
  );

  const requestSafeHint = useCallback(() => {
    const coord = engine.getSafeHint();
    setHintCoord(coord);
  }, [engine]);

  return {
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
  };
}
