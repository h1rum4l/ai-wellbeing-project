import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  RotateCcw,
  Volume2,
  VolumeX,
  Trophy,
  Flame,
  Wind,
  Heart,
  Zap,
  Award,
  Play,
  ArrowRight,
  Smile,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { UserAccount } from '../../types';
import { store } from '../../storage/store';
import { habitsStore } from '../../storage/habitsStore';
import { triggerHaptic } from '../../utils/haptics';

interface StressCrushGameProps {
  currentUser?: UserAccount | null;
  onOpenAuthModal?: () => void;
  onNavigateToBreathing?: () => void;
}

const BOARD_SIZE = 8;

export type SpecialType = 'striped_h' | 'striped_v' | 'wrapped' | 'color_bomb' | null;

export interface CandyItem {
  id: string;
  type: number; // 0 to 5
  special?: SpecialType;
  isMatched?: boolean;
}

interface FloatingScore {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
}

// 6 Soothing Candy Types with beautiful gradients and symbols
const CANDY_CONFIG = [
  {
    name: 'Ruby Calm',
    emoji: '🍓',
    gradient: 'from-rose-500 via-rose-600 to-pink-700',
    border: 'border-rose-400/50',
    glow: 'rgba(244, 63, 94, 0.45)',
    accent: '#f43f5e',
  },
  {
    name: 'Citrus Energy',
    emoji: '🍊',
    gradient: 'from-amber-400 via-orange-500 to-orange-600',
    border: 'border-amber-300/50',
    glow: 'rgba(245, 158, 11, 0.45)',
    accent: '#f59e0b',
  },
  {
    name: 'Lemon Radiance',
    emoji: '🍋',
    gradient: 'from-yellow-300 via-amber-400 to-yellow-500',
    border: 'border-yellow-200/50',
    glow: 'rgba(234, 179, 8, 0.45)',
    accent: '#eab308',
  },
  {
    name: 'Mint Serenity',
    emoji: '🍏',
    gradient: 'from-emerald-400 via-emerald-500 to-teal-700',
    border: 'border-emerald-300/50',
    glow: 'rgba(16, 185, 129, 0.45)',
    accent: '#10b981',
  },
  {
    name: 'Teal River Flow',
    emoji: '🌊',
    gradient: 'from-teal-400 via-emerald-500 to-teal-700',
    border: 'border-teal-300/50',
    glow: 'rgba(20, 184, 166, 0.45)',
    accent: '#14b8a6',
  },
  {
    name: 'Lavender Zen',
    emoji: '🍇',
    gradient: 'from-purple-400 via-fuchsia-500 to-indigo-700',
    border: 'border-purple-300/50',
    glow: 'rgba(168, 85, 247, 0.45)',
    accent: '#a855f7',
  },
];

const COMBO_TITLES = [
  '',
  'Sweet Match!',
  'Serenity Flow!',
  'Mindful Cascade!',
  'Stress Cleared!',
  'Zen Awakening!',
  'Pure Equilibrium!',
];

let globalCandyCounter = 0;
function createRandomCandy(excludeTypes: number[] = [], special: SpecialType = null): CandyItem {
  let type = Math.floor(Math.random() * CANDY_CONFIG.length);
  if (excludeTypes.length > 0) {
    const candidates = CANDY_CONFIG.map((_, i) => i).filter((i) => !excludeTypes.includes(i));
    if (candidates.length > 0) {
      type = candidates[Math.floor(Math.random() * candidates.length)];
    }
  }
  globalCandyCounter += 1;
  return {
    id: `candy_${Date.now()}_${globalCandyCounter}_${Math.random().toString(36).substring(2, 6)}`,
    type,
    special,
  };
}

export const StressCrushGame: React.FC<StressCrushGameProps> = ({
  currentUser,
  onOpenAuthModal,
  onNavigateToBreathing,
}) => {
  // Game mode: 'zen' (infinite relaxation) vs 'challenge' (25 moves target)
  const [gameMode, setGameMode] = useState<'zen' | 'challenge'>('zen');
  const [board, setBoard] = useState<CandyItem[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(null);
  const [isSwapping, setIsSwapping] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('stressina_crush_highscore') || '0', 10);
    } catch {
      return 0;
    }
  });
  const [movesLeft, setMovesLeft] = useState<number>(25);
  const [movesMade, setMovesMade] = useState<number>(0);
  const [comboCount, setComboCount] = useState<number>(0);
  const [celebrationText, setCelebrationText] = useState<string>('');
  const [floatingScores, setFloatingScores] = useState<FloatingScore[]>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [marksEarnedToday, setMarksEarnedToday] = useState<number>(0);
  const [bonusEarnedMessage, setBonusEarnedMessage] = useState<string>('');

  // Power-up booster states
  const [activeBooster, setActiveBooster] = useState<'hammer' | 'bomb' | null>(null);
  const [hammersLeft, setHammersLeft] = useState<number>(3);
  const [bombsLeft, setBombsLeft] = useState<number>(2);

  // Audio Context Ref
  const audioCtxRef = useRef<AudioContext | null>(null);
  const touchStartRef = useRef<{ r: number; c: number; x: number; y: number } | null>(null);

  // Synthesize musical chime using Web Audio API
  const playChime = useCallback((frequencies: number[], duration = 0.35) => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      frequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.05);

        gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + idx * 0.05 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.05 + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + idx * 0.05);
        osc.stop(ctx.currentTime + idx * 0.05 + duration + 0.05);
      });
    } catch {
      // Audio autoplay gracefully handled
    }
  }, [soundEnabled]);

  // Create initial board guaranteed free of 3-in-a-row matches
  const generateInitialBoard = useCallback((): CandyItem[][] => {
    const newBoard: CandyItem[][] = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      const row: CandyItem[] = [];
      for (let c = 0; c < BOARD_SIZE; c++) {
        const forbidden: number[] = [];
        // Check 2 to the left
        if (c >= 2 && row[c - 1].type === row[c - 2].type) {
          forbidden.push(row[c - 1].type);
        }
        // Check 2 above
        if (r >= 2 && newBoard[r - 1][c].type === newBoard[r - 2][c].type) {
          forbidden.push(newBoard[r - 1][c].type);
        }
        row.push(createRandomCandy(forbidden));
      }
      newBoard.push(row);
    }
    return newBoard;
  }, []);

  // Initialize board on mount
  useEffect(() => {
    const init = generateInitialBoard();
    setBoard(init);
  }, [generateInitialBoard]);

  // Trigger floating score animation
  const addFloatingScore = (text: string, r: number, c: number, color = '#22d3ee') => {
    const id = `score_${Date.now()}_${Math.random()}`;
    setFloatingScores((prev) => [...prev, { id, text, x: c, y: r, color }]);
    setTimeout(() => {
      setFloatingScores((prev) => prev.filter((item) => item.id !== id));
    }, 1100);
  };

  // Check for matches on the board
  const findMatches = (currentBoard: CandyItem[][]) => {
    const matchedCells = new Set<string>();
    const horizontalMatches: { r: number; c: number; length: number; type: number }[] = [];
    const verticalMatches: { r: number; c: number; length: number; type: number }[] = [];

    // Horizontal check
    for (let r = 0; r < BOARD_SIZE; r++) {
      let matchLength = 1;
      for (let c = 0; c < BOARD_SIZE; c++) {
        const isLastInRow = c === BOARD_SIZE - 1;
        const isSameType = !isLastInRow && currentBoard[r][c].type === currentBoard[r][c + 1].type;

        if (isSameType) {
          matchLength += 1;
        } else {
          if (matchLength >= 3) {
            horizontalMatches.push({
              r,
              c: c - matchLength + 1,
              length: matchLength,
              type: currentBoard[r][c].type,
            });
            for (let i = 0; i < matchLength; i++) {
              matchedCells.add(`${r},${c - matchLength + 1 + i}`);
            }
          }
          matchLength = 1;
        }
      }
    }

    // Vertical check
    for (let c = 0; c < BOARD_SIZE; c++) {
      let matchLength = 1;
      for (let r = 0; r < BOARD_SIZE; r++) {
        const isLastInCol = r === BOARD_SIZE - 1;
        const isSameType = !isLastInCol && currentBoard[r][c].type === currentBoard[r + 1][c].type;

        if (isSameType) {
          matchLength += 1;
        } else {
          if (matchLength >= 3) {
            verticalMatches.push({
              r: r - matchLength + 1,
              c,
              length: matchLength,
              type: currentBoard[r][c].type,
            });
            for (let i = 0; i < matchLength; i++) {
              matchedCells.add(`${r - matchLength + 1 + i},${c}`);
            }
          }
          matchLength = 1;
        }
      }
    }

    return { matchedCells, horizontalMatches, verticalMatches };
  };

  // Award stress marks when reaching milestones
  const checkMilestoneRewards = (newScore: number) => {
    let bonusMarks = 0;
    if (newScore >= 2000 && marksEarnedToday < 35) {
      bonusMarks = 35 - marksEarnedToday;
      setMarksEarnedToday(35);
      setBonusEarnedMessage('Achievement Unlocked: Master Crusher! +35 Stress Quests Marks');
    } else if (newScore >= 1000 && marksEarnedToday < 20) {
      bonusMarks = 20 - marksEarnedToday;
      setMarksEarnedToday(20);
      setBonusEarnedMessage('Great Job: Serenity Seeker! +20 Stress Quests Marks');
    } else if (newScore >= 500 && marksEarnedToday < 10) {
      bonusMarks = 10 - marksEarnedToday;
      setMarksEarnedToday(10);
      setBonusEarnedMessage('First Milestone! +10 Stress Quests Marks');
    }

    if (bonusMarks > 0) {
      habitsStore.addMarks(bonusMarks);
      habitsStore.toggleHabit('habit_stress_crush');
      triggerHaptic('levelUp');
      setTimeout(() => setBonusEarnedMessage(''), 5000);
    }
  };

  // Cascade and refill routine
  const processCascades = useCallback(async (initialBoard: CandyItem[][], combo = 1) => {
    const { matchedCells, horizontalMatches, verticalMatches } = findMatches(initialBoard);

    if (matchedCells.size === 0) {
      setIsSwapping(false);
      setComboCount(0);
      return;
    }

    // Determine special candies to create
    const specialsToSpawn: { r: number; c: number; special: SpecialType; type: number }[] = [];

    // 5 in a row -> Rainbow Color Bomb
    horizontalMatches.forEach((m) => {
      if (m.length >= 5) {
        specialsToSpawn.push({ r: m.r, c: m.c + 2, special: 'color_bomb', type: m.type });
      } else if (m.length === 4) {
        specialsToSpawn.push({ r: m.r, c: m.c + 1, special: 'striped_h', type: m.type });
      }
    });

    verticalMatches.forEach((m) => {
      if (m.length >= 5) {
        specialsToSpawn.push({ r: m.r + 2, c: m.c, special: 'color_bomb', type: m.type });
      } else if (m.length === 4) {
        specialsToSpawn.push({ r: m.r + 1, c: m.c, special: 'striped_v', type: m.type });
      }
    });

    // Expand special matches (e.g., striped blasts, wrapped bombs)
    const expandedCells = new Set<string>(matchedCells);
    matchedCells.forEach((key) => {
      const [r, c] = key.split(',').map(Number);
      const item = initialBoard[r]?.[c];
      if (!item) return;

      if (item.special === 'striped_h') {
        for (let col = 0; col < BOARD_SIZE; col++) expandedCells.add(`${r},${col}`);
      } else if (item.special === 'striped_v') {
        for (let row = 0; row < BOARD_SIZE; row++) expandedCells.add(`${row},${c}`);
      } else if (item.special === 'wrapped') {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
              expandedCells.add(`${nr},${nc}`);
            }
          }
        }
      }
    });

    // Score calculation
    const pointsPerCell = 20 * combo;
    const gainedScore = expandedCells.size * pointsPerCell;
    setScore((prev) => {
      const nextScore = prev + gainedScore;
      if (nextScore > highScore) {
        setHighScore(nextScore);
        try {
          localStorage.setItem('stressina_crush_highscore', nextScore.toString());
        } catch {
          // ignore
        }
      }
      checkMilestoneRewards(nextScore);
      return nextScore;
    });

    // Pick cell for floating score
    const firstMatched = Array.from(expandedCells)[0];
    if (firstMatched) {
      const [fr, fc] = firstMatched.split(',').map(Number);
      addFloatingScore(`+${gainedScore}`, fr, fc, combo > 1 ? '#38bdf8' : '#22d3ee');
    }

    // Sound & Haptic
    if (combo >= 2) {
      const title = COMBO_TITLES[Math.min(combo, COMBO_TITLES.length - 1)];
      setCelebrationText(title);
      setTimeout(() => setCelebrationText(''), 1500);
      playChime([392, 523, 659, 784, 1046], 0.45);
      triggerHaptic('medium');
    } else {
      playChime([523, 659], 0.25);
      triggerHaptic('light');
    }

    // Mark board as matched for brief visual pop
    const poppingBoard = initialBoard.map((row, r) =>
      row.map((item, c) => ({
        ...item,
        isMatched: expandedCells.has(`${r},${c}`),
      }))
    );
    setBoard(poppingBoard);

    await new Promise((res) => setTimeout(res, 260));

    // Drop logic & refill
    const nextBoard: CandyItem[][] = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      nextBoard.push([...initialBoard[r]]);
    }

    // Remove matched cells and drop remaining down
    for (let c = 0; c < BOARD_SIZE; c++) {
      const surviving: CandyItem[] = [];
      for (let r = 0; r < BOARD_SIZE; r++) {
        if (!expandedCells.has(`${r},${c}`)) {
          surviving.push(initialBoard[r][c]);
        }
      }

      // Check if a special candy spawned in this column
      const specialHere = specialsToSpawn.find((s) => s.c === c);

      const missingCount = BOARD_SIZE - surviving.length;
      const newItems: CandyItem[] = [];
      for (let i = 0; i < missingCount; i++) {
        newItems.push(createRandomCandy());
      }

      const fullColumn = [...newItems, ...surviving];
      for (let r = 0; r < BOARD_SIZE; r++) {
        nextBoard[r][c] = fullColumn[r];
      }

      // Place any created special candies
      if (specialHere && specialHere.r < BOARD_SIZE) {
        nextBoard[specialHere.r][specialHere.c] = createRandomCandy(
          [],
          specialHere.special
        );
      }
    }

    setBoard(nextBoard);
    await new Promise((res) => setTimeout(res, 220));

    // Recursively check for cascades
    setComboCount(combo + 1);
    await processCascades(nextBoard, combo + 1);
  }, [playChime, highScore]);

  // Execute swap between two cells
  const executeSwap = async (r1: number, c1: number, r2: number, c2: number) => {
    if (isSwapping) return;
    setIsSwapping(true);
    setSelectedCell(null);

    const item1 = board[r1][c1];
    const item2 = board[r2][c2];

    // Check Rainbow Color Bomb swap
    if (item1.special === 'color_bomb' || item2.special === 'color_bomb') {
      const bombTargetType = item1.special === 'color_bomb' ? item2.type : item1.type;
      playChime([440, 554, 659, 880, 1108], 0.6);
      triggerHaptic('heavy');
      setCelebrationText('Rainbow Harmony Bomb!');
      setTimeout(() => setCelebrationText(''), 2000);

      // Vaporize all candies of this color
      const clearedBoard = board.map((row, r) =>
        row.map((cand, c) => ({
          ...cand,
          isMatched: cand.type === bombTargetType || (r === r1 && c === c1) || (r === r2 && c === c2),
        }))
      );
      setBoard(clearedBoard);
      await new Promise((res) => setTimeout(res, 300));

      const points = 500;
      setScore((s) => s + points);
      addFloatingScore(`+${points}`, r2, c2, '#e879f9');

      // Refill
      const afterBomb: CandyItem[][] = [];
      for (let c = 0; c < BOARD_SIZE; c++) {
        const surviving: CandyItem[] = [];
        for (let r = 0; r < BOARD_SIZE; r++) {
          if (clearedBoard[r][c].type !== bombTargetType && !(r === r1 && c === c1) && !(r === r2 && c === c2)) {
            surviving.push(clearedBoard[r][c]);
          }
        }
        const needed = BOARD_SIZE - surviving.length;
        const newCandies = Array.from({ length: needed }, () => createRandomCandy());
        const fullCol = [...newCandies, ...surviving];
        for (let r = 0; r < BOARD_SIZE; r++) {
          if (!afterBomb[r]) afterBomb[r] = [];
          afterBomb[r][c] = fullCol[r];
        }
      }
      setBoard(afterBomb);
      await processCascades(afterBomb, 1);
      return;
    }

    // Normal swap
    const swappedBoard = board.map((row) => [...row]);
    swappedBoard[r1][c1] = item2;
    swappedBoard[r2][c2] = item1;
    setBoard(swappedBoard);

    // Decrement moves in challenge mode
    setMovesMade((m) => m + 1);
    if (gameMode === 'challenge') {
      setMovesLeft((m) => Math.max(0, m - 1));
    }

    await new Promise((res) => setTimeout(res, 180));

    // Verify if move created matches
    const { matchedCells } = findMatches(swappedBoard);
    if (matchedCells.size > 0) {
      // Valid move!
      await processCascades(swappedBoard, 1);
    } else {
      // Invalid move -> Bounce back!
      playChime([220, 196], 0.2);
      triggerHaptic('warning');
      const reverted = board.map((row) => [...row]);
      setBoard(reverted);
      setIsSwapping(false);
    }
  };

  // Handle cell click / selection
  const handleCellClick = (r: number, c: number) => {
    if (isSwapping) return;

    // Handle Active Booster: Hammer
    if (activeBooster === 'hammer') {
      if (hammersLeft <= 0) return;
      triggerHaptic('heavy');
      playChime([659, 880], 0.3);
      setHammersLeft((h) => h - 1);
      setActiveBooster(null);

      const modified = board.map((row) => [...row]);
      modified[r][c] = { ...modified[r][c], isMatched: true };
      setBoard(modified);
      addFloatingScore('+50 Hammer Smash!', r, c, '#f59e0b');
      setScore((s) => s + 50);

      setTimeout(() => {
        const next = board.map((row) => [...row]);
        next[r][c] = createRandomCandy();
        setBoard(next);
        processCascades(next, 1);
      }, 250);
      return;
    }

    // Handle Active Booster: Bomb
    if (activeBooster === 'bomb') {
      if (bombsLeft <= 0) return;
      triggerHaptic('heavy');
      playChime([330, 440, 659, 880], 0.4);
      setBombsLeft((b) => b - 1);
      setActiveBooster(null);

      const modified = board.map((row, rowIdx) =>
        row.map((item, colIdx) => ({
          ...item,
          isMatched: Math.abs(rowIdx - r) <= 1 && Math.abs(colIdx - c) <= 1,
        }))
      );
      setBoard(modified);
      addFloatingScore('+250 Stress Buster!', r, c, '#f43f5e');
      setScore((s) => s + 250);

      setTimeout(() => {
        const next: CandyItem[][] = [];
        for (let col = 0; col < BOARD_SIZE; col++) {
          const surviving: CandyItem[] = [];
          for (let row = 0; row < BOARD_SIZE; row++) {
            if (!(Math.abs(row - r) <= 1 && Math.abs(col - c) <= 1)) {
              surviving.push(board[row][col]);
            }
          }
          const needed = BOARD_SIZE - surviving.length;
          const newCandies = Array.from({ length: needed }, () => createRandomCandy());
          const fullCol = [...newCandies, ...surviving];
          for (let row = 0; row < BOARD_SIZE; row++) {
            if (!next[row]) next[row] = [];
            next[row][col] = fullCol[row];
          }
        }
        setBoard(next);
        processCascades(next, 1);
      }, 300);
      return;
    }

    // Regular Candy Selection & Swap
    if (!selectedCell) {
      triggerHaptic('selection');
      setSelectedCell({ r, c });
    } else {
      const dr = Math.abs(selectedCell.r - r);
      const dc = Math.abs(selectedCell.c - c);

      if (dr + dc === 1) {
        // Adjacent cell clicked -> Attempt swap
        executeSwap(selectedCell.r, selectedCell.c, r, c);
      } else {
        // Not adjacent -> change selection
        triggerHaptic('selection');
        setSelectedCell({ r, c });
      }
    }
  };

  // Touch Swipe Gesture for direct fluid mobile dragging
  const handleTouchStart = (r: number, c: number, e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { r, c, x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || isSwapping) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const { r, c } = touchStartRef.current;
    touchStartRef.current = null;

    if (Math.abs(dx) > 30 || Math.abs(dy) > 30) {
      let targetR = r;
      let targetC = c;

      if (Math.abs(dx) > Math.abs(dy)) {
        targetC = dx > 0 ? c + 1 : c - 1;
      } else {
        targetR = dy > 0 ? r + 1 : r - 1;
      }

      if (targetR >= 0 && targetR < BOARD_SIZE && targetC >= 0 && targetC < BOARD_SIZE) {
        executeSwap(r, c, targetR, targetC);
      }
    }
  };

  // Reshuffle board
  const handleShuffle = () => {
    triggerHaptic('medium');
    playChime([440, 523, 659], 0.3);
    const newBoard = generateInitialBoard();
    setBoard(newBoard);
    setSelectedCell(null);
    setCelebrationText('Mindful Board Shuffle');
    setTimeout(() => setCelebrationText(''), 1500);
  };

  // Reset Game
  const handleResetGame = () => {
    triggerHaptic('light');
    setBoard(generateInitialBoard());
    setScore(0);
    setMovesLeft(25);
    setMovesMade(0);
    setSelectedCell(null);
    setComboCount(0);
  };

  // Save session when user finishes
  const handleSaveSession = () => {
    if (currentUser) {
      store.saveGameSession(
        currentUser.id,
        'Stress Crush Match-3',
        Math.max(60, movesMade * 4),
        `Score: ${score} · Moves: ${movesMade} · Mode: ${gameMode}`
      );
      habitsStore.addMarks(15);
      habitsStore.toggleHabit('habit_stress_crush');
      triggerHaptic('levelUp');
      setBonusEarnedMessage('Game session archived to your private timeline! (+15 Marks)');
      setTimeout(() => setBonusEarnedMessage(''), 4000);
    }
  };

  return (
    <div className="space-y-6 text-slate-800">
      {/* Header & Game Stats Bar */}
      <div className="liquid-glass-card rounded-3xl p-5 sm:p-7 relative overflow-hidden border border-white shadow-sm">
        {/* Ambient radial blur backlight */}
        <div className="absolute -top-12 -right-12 w-80 h-80 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-80 h-80 bg-pink-100/30 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 border-b border-slate-200/80 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Stress Relief Mini-Game
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Stress Crush</span>
              <span className="text-sm font-semibold text-slate-500">· Pop the Tension</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mt-0.5 leading-relaxed">
              Swap adjacent soothing gems to form 3 or more in a row. Trigger cascades, explosive color bombs, and mindful harmonic chimes to clear cortisol.
            </p>
          </div>

          {/* Quick Shortcuts: Switch to Breathing & Sound Toggle */}
          <div className="flex items-center gap-2.5 shrink-0">
            {onNavigateToBreathing && (
              <button
                type="button"
                onClick={onNavigateToBreathing}
                className="px-3.5 py-2 rounded-xl bg-emerald-100/80 hover:bg-emerald-200/80 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ios-tactile-button"
              >
                <Wind className="w-4 h-4 text-emerald-700" />
                <span>Guided Breathing</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-xl bg-white/80 hover:bg-white border border-slate-200 text-slate-700 cursor-pointer shadow-xs"
              title={soundEnabled ? 'Mute sound' : 'Enable calming chimes'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-700" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>
          </div>
        </div>

        {/* Milestone Bonus Banner */}
        {bonusEarnedMessage && (
          <div className="relative z-10 mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs font-bold flex items-center gap-2 shadow-xs animate-fade-in">
            <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
            <span>{bonusEarnedMessage}</span>
          </div>
        )}

        {/* Dynamic Game Status Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10">
          <div className="liquid-glass rounded-2xl p-3 border border-white flex flex-col shadow-xs">
            <span className="text-[10px] uppercase font-bold text-slate-500">Score</span>
            <span className="text-xl font-black text-slate-900 font-mono tracking-tight">
              {score.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5">High: {highScore.toLocaleString()}</span>
          </div>

          <div className="liquid-glass rounded-2xl p-3 border border-white flex flex-col shadow-xs">
            <span className="text-[10px] uppercase font-bold text-slate-500">
              {gameMode === 'challenge' ? 'Moves Remaining' : 'Moves Relaxed'}
            </span>
            <span className="text-xl font-black text-slate-900 font-mono">
              {gameMode === 'challenge' ? movesLeft : movesMade}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5">
              {gameMode === 'challenge' ? 'Target: 2,500' : 'Endless Calm'}
            </span>
          </div>

          <div className="liquid-glass rounded-2xl p-3 border border-white flex flex-col shadow-xs">
            <span className="text-[10px] uppercase font-bold text-slate-500">Stress Quests</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span className="text-base font-bold text-amber-700 font-mono">+{marksEarnedToday} Marks</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5">Max +35 Marks/Day</span>
          </div>

          <div className="liquid-glass rounded-2xl p-3 border border-white flex flex-col justify-between shadow-xs">
            <span className="text-[10px] uppercase font-bold text-slate-500">Mode</span>
            <div className="flex items-center gap-1.5 mt-1">
              <button
                type="button"
                onClick={() => setGameMode('zen')}
                className={`px-2.5 py-0.5 text-[11px] font-bold rounded-lg transition-all ${
                  gameMode === 'zen'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Zen
              </button>
              <button
                type="button"
                onClick={() => setGameMode('challenge')}
                className={`px-2.5 py-0.5 text-[11px] font-bold rounded-lg transition-all ${
                  gameMode === 'challenge'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Target
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Game Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Candy Match Board */}
        <div className="lg:col-span-8 flex flex-col items-center">
          <div className="w-full max-w-lg liquid-glass-card rounded-3xl p-3 sm:p-5 relative shadow-md border border-white">
            {/* Combo Celebration Overlay */}
            {celebrationText && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none text-center animate-bounce">
                <div className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-lime-600 text-white font-black text-lg sm:text-2xl shadow-xl border border-white/50 tracking-wider">
                  {celebrationText}
                </div>
              </div>
            )}

            {/* 8x8 Grid Container */}
            <div className="grid grid-cols-8 gap-1 sm:gap-2 select-none relative touch-none bg-slate-900/10 p-2 sm:p-3 rounded-2xl border border-slate-200 aspect-square">
              {board.map((row, r) =>
                row.map((item, c) => {
                  const cfg = CANDY_CONFIG[item.type] || CANDY_CONFIG[0];
                  const isSelected = selectedCell?.r === r && selectedCell?.c === c;

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleCellClick(r, c)}
                      onTouchStart={(e) => handleTouchStart(r, c, e)}
                      onTouchEnd={handleTouchEnd}
                      className={`relative aspect-square rounded-xl sm:rounded-2xl flex items-center justify-center cursor-pointer transition-all duration-150 transform active:scale-90 ${
                        item.isMatched ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
                      } ${
                        isSelected
                          ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-white scale-105 z-20 shadow-md'
                          : 'hover:scale-[1.04]'
                      }`}
                      style={{
                        background: `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.7), transparent 60%), linear-gradient(135deg, ${cfg.accent}, rgba(255,255,255,0.85))`,
                        boxShadow: isSelected ? `0 0 15px ${cfg.accent}` : `inset 0 1px 2px rgba(255,255,255,0.8), 0 2px 6px rgba(0,0,0,0.1)`,
                      }}
                    >
                      {/* Inner Glossy Specular Dot */}
                      <div className="absolute top-1 left-1.5 w-2 h-1 rounded-full bg-white/80 blur-[0.4px] pointer-events-none" />

                      {/* Candy Glyph / Emoji */}
                      <span className="text-base sm:text-xl md:text-2xl drop-shadow-xs pointer-events-none select-none">
                        {item.special === 'color_bomb' ? '🌈' : cfg.emoji}
                      </span>

                      {/* Special Indicator: Striped Beam */}
                      {item.special === 'striped_h' && (
                        <div className="absolute inset-x-0 h-1 bg-white shadow-xs rounded-full pointer-events-none animate-pulse" />
                      )}
                      {item.special === 'striped_v' && (
                        <div className="absolute inset-y-0 w-1 bg-white shadow-xs rounded-full pointer-events-none animate-pulse" />
                      )}
                      {item.special === 'wrapped' && (
                        <div className="absolute inset-1 rounded-lg border-2 border-white pointer-events-none animate-pulse" />
                      )}
                    </div>
                  );
                })
              )}

              {/* Floating score badges */}
              {floatingScores.map((fs) => (
                <div
                  key={fs.id}
                  className="absolute pointer-events-none font-black text-sm sm:text-base font-mono z-30 animate-float-up"
                  style={{
                    left: `${(fs.x / BOARD_SIZE) * 100 + 4}%`,
                    top: `${(fs.y / BOARD_SIZE) * 100}%`,
                    color: fs.color,
                    textShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  }}
                >
                  {fs.text}
                </div>
              ))}
            </div>

            {/* Bottom Controls inside Board Box */}
            <div className="flex items-center justify-between mt-3 px-1">
              <span className="text-[11px] text-slate-500 font-medium">
                Tap or swipe adjacent gems to match 3+
              </span>
              <button
                type="button"
                onClick={handleShuffle}
                className="text-xs px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 flex items-center gap-1 cursor-pointer shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5 text-emerald-700" />
                <span>Shuffle Board</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Stress Relief Power-Ups & Wellness Integration */}
        <div className="lg:col-span-4 space-y-4">
          {/* Calming Power-ups */}
          <div className="liquid-glass-card rounded-2xl p-5 border border-white shadow-sm space-y-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 block">
              Mindful Boosters
            </span>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setActiveBooster(activeBooster === 'hammer' ? null : 'hammer');
                }}
                disabled={hammersLeft <= 0}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer disabled:opacity-40 ${
                  activeBooster === 'hammer'
                    ? 'bg-amber-100 border-amber-400 text-amber-900 shadow-xs'
                    : 'bg-white/80 border-slate-200 text-slate-700 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xl">🔨</span>
                  <span className="text-xs font-bold font-mono px-1.5 py-0.5 rounded bg-white text-amber-800 border border-amber-200">
                    {hammersLeft}
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-800">Zen Hammer</div>
                <div className="text-[10px] text-slate-500">Smash 1 gem</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setActiveBooster(activeBooster === 'bomb' ? null : 'bomb');
                }}
                disabled={bombsLeft <= 0}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer disabled:opacity-40 ${
                  activeBooster === 'bomb'
                    ? 'bg-rose-100 border-rose-400 text-rose-900 shadow-xs'
                    : 'bg-white/80 border-slate-200 text-slate-700 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xl">💥</span>
                  <span className="text-xs font-bold font-mono px-1.5 py-0.5 rounded bg-white text-rose-800 border border-rose-200">
                    {bombsLeft}
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-800">Stress Bomb</div>
                <div className="text-[10px] text-slate-500">Clear 3x3 blast</div>
              </button>
            </div>

            {activeBooster && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="font-medium">
                  {activeBooster === 'hammer' ? 'Tap any gem to smash it.' : 'Tap any gem to trigger 3x3 blast.'}
                </span>
              </div>
            )}
          </div>

          {/* Special Candies Guide */}
          <div className="liquid-glass-card rounded-2xl p-5 border border-white shadow-sm space-y-2.5">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 block">
              Special Combos
            </span>

            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/70 border border-slate-200">
                <span className="text-lg">⚡</span>
                <div>
                  <strong className="text-emerald-800">Match 4 in a line:</strong>
                  <p className="text-[11px] text-slate-600">Creates a Striped Beam that clears an entire row or column.</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/70 border border-slate-200">
                <span className="text-lg">🌈</span>
                <div>
                  <strong className="text-pink-700">Match 5 in a row:</strong>
                  <p className="text-[11px] text-slate-600">Creates Rainbow Color Bomb! Swap with any color to clear them all.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Account Save / History Integration */}
          <div className="liquid-glass-card rounded-2xl p-5 border border-white shadow-sm space-y-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 block">
              Session Archive
            </span>

            {currentUser ? (
              <div className="space-y-2.5">
                <p className="text-xs text-slate-600">
                  Ready to conclude your session? Save your stress relief score into your longitudinal private history:
                </p>
                <button
                  type="button"
                  onClick={handleSaveSession}
                  className="w-full py-2.5 rounded-full liquid-button-sage text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ios-tactile-button"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Game to Timeline (+15 Marks)</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                <p className="text-xs text-slate-600">
                  Register or sign in to permanently save your high score and daily stress marks across devices.
                </p>
                {onOpenAuthModal && (
                  <button
                    type="button"
                    onClick={onOpenAuthModal}
                    className="w-full py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ios-tactile-button"
                  >
                    <span>Register to Save Marks (+50 Bonus)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={handleResetGame}
              className="w-full py-1.5 rounded-xl text-slate-500 hover:text-slate-800 text-xs text-center hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Start New Fresh Game
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
