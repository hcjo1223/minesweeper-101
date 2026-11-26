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

export function useMinesweeper(initialDifficulty: DifficultyKey = 'beginner') {
  const [engine] = useState(
    () =>
      new MinesweeperEngine({
        config: DIFFICULTY_PRESETS[initialDifficulty],
        algorithm: 'bfs',
      })
  );

  const [difficulty, setDifficulty] =
    useState<DifficultyKey>(initialDifficulty);
  const [snapshot, setSnapshot] = useState<GameSnapshot>(() =>
    engine.getSnapshot()
  );
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [actionMode, setActionMode] = useState<ClickActionMode>('reveal');
  const [showTraversalOrder, setShowTraversalOrder] = useState<boolean>(true);
  const [hintCoord, setHintCoord] = useState<Coordinate | null>(null);

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
  };
}
