import { useCallback, useEffect, useState } from 'react';
import { MinesweeperEngine } from '../core/MinesweeperEngine';
import { getLogicalPlayerHint, type PlayerHint } from '../core/solverHint';
import {
  DIFFICULTY_PRESETS,
  type DifficultyKey,
  type GameSnapshot,
} from '../core/types';

export type ClickActionMode = 'reveal' | 'flag';
export type ThemeMode = 'dark' | 'light';
export type MobileWorkspaceTab = 'game' | 'guide';
export type BoardScaleMode = 'fit' | 'comfort';
export type BestTimesMap = Partial<Record<DifficultyKey, number>>;

const THEME_STORAGE_KEY = 'minesweeper-101-theme';
const BEST_TIMES_STORAGE_KEY = 'minesweeper-101-best-times';

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

function getInitialBestTimes(): BestTimesMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(BEST_TIMES_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as BestTimesMap;
    }
  } catch {
    // ignore storage errors
  }
  return {};
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
  const [showNeighborGuide, setShowNeighborGuide] = useState<boolean>(true);
  const [questionMarkEnabled, setQuestionMarkEnabled] = useState<boolean>(true);
  const [playerHint, setPlayerHint] = useState<PlayerHint | null>(null);
  const [bestTimes, setBestTimes] = useState<BestTimesMap>(getInitialBestTimes);
  const [isNewRecord, setIsNewRecord] = useState<boolean>(false);

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

  // 게임 진행 중일 때만 동작하는 1초 타이머
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

  const recordWinIfNeeded = useCallback(
    (nextSnap: GameSnapshot, currentElapsed: number) => {
      if (nextSnap.status !== 'won') return;
      const clearTime = Math.max(1, currentElapsed);
      setBestTimes((prev) => {
        const previousBest = prev[difficulty];
        if (previousBest === undefined || clearTime < previousBest) {
          const updated = { ...prev, [difficulty]: clearTime };
          setIsNewRecord(true);
          try {
            window.localStorage.setItem(
              BEST_TIMES_STORAGE_KEY,
              JSON.stringify(updated)
            );
          } catch {
            // ignore storage errors
          }
          return updated;
        }
        return prev;
      });
    },
    [difficulty]
  );

  const startNewGame = useCallback(
    (nextDifficulty: DifficultyKey = difficulty) => {
      const preset = DIFFICULTY_PRESETS[nextDifficulty];
      setDifficulty(nextDifficulty);
      setElapsedSeconds(0);
      setPlayerHint(null);
      setIsNewRecord(false);
      const nextSnap = engine.reset(preset);
      setSnapshot(nextSnap);
    },
    [difficulty, engine]
  );

  const retrySameBoard = useCallback(() => {
    setElapsedSeconds(0);
    setPlayerHint(null);
    setIsNewRecord(false);
    setSnapshot(engine.retrySameBoard());
  }, [engine]);

  const handleCellPrimaryAction = useCallback(
    (row: number, col: number) => {
      setPlayerHint(null);
      const currentCell = snapshot.board[row]?.[col];
      if (!currentCell) return;

      let nextSnap: GameSnapshot;
      if (currentCell.isRevealed && currentCell.neighborMines > 0) {
        nextSnap = engine.chord(row, col);
      } else if (actionMode === 'flag') {
        nextSnap = engine.toggleFlag(row, col, questionMarkEnabled);
      } else {
        nextSnap = engine.reveal(row, col);
      }

      setSnapshot(nextSnap);
      recordWinIfNeeded(nextSnap, elapsedSeconds);
    },
    [
      actionMode,
      elapsedSeconds,
      engine,
      questionMarkEnabled,
      recordWinIfNeeded,
      snapshot.board,
    ]
  );

  const handleCellSecondaryAction = useCallback(
    (row: number, col: number) => {
      setPlayerHint(null);
      const nextSnap = engine.toggleFlag(row, col, questionMarkEnabled);
      setSnapshot(nextSnap);
    },
    [engine, questionMarkEnabled]
  );

  const handleCellChord = useCallback(
    (row: number, col: number) => {
      setPlayerHint(null);
      const nextSnap = engine.chord(row, col);
      setSnapshot(nextSnap);
      recordWinIfNeeded(nextSnap, elapsedSeconds);
    },
    [elapsedSeconds, engine, recordWinIfNeeded]
  );

  const requestPlayerHint = useCallback(() => {
    const snap = engine.getSnapshot();
    if (snap.status === 'won' || snap.status === 'lost') {
      return;
    }
    const fallback = engine.getSafeHint();
    const hint = getLogicalPlayerHint(
      snap.board,
      snap.config,
      snap.minesGenerated,
      fallback
    );
    setPlayerHint(hint);
  }, [engine]);

  const applyPlayerHint = useCallback(() => {
    if (!playerHint) return;
    const { coord, action } = playerHint;
    let nextSnap: GameSnapshot;

    if (action === 'flag' || action === 'check_flag') {
      // 힌트 적용 시에는 물음표 없이 바로 깃발을 꽂거나 잘못된 깃발을 해제
      nextSnap = engine.toggleFlag(coord.row, coord.col, false);
    } else {
      nextSnap = engine.reveal(coord.row, coord.col);
    }

    setPlayerHint(null);
    setSnapshot(nextSnap);
    recordWinIfNeeded(nextSnap, elapsedSeconds);
  }, [elapsedSeconds, engine, playerHint, recordWinIfNeeded]);

  return {
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
  };
}
