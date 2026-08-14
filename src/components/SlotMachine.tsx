import React, { useState, useEffect, useRef } from 'react';
import { Prize, ThemeMode } from '../types';
import { sounds } from '../utils/audio';
import { pickWeightedWinner } from '../utils/probability';
import { Play, Sparkles, RefreshCw, Zap } from 'lucide-react';
import { motion } from 'motion/react';

interface SlotMachineProps {
  prizes: Prize[];
  onWinner: (prize: Prize) => void;
  isSpinning: boolean;
  setIsSpinning: (spinning: boolean) => void;
  isFullscreen?: boolean;
  theme?: ThemeMode;
}

export const SlotMachine: React.FC<SlotMachineProps> = ({
  prizes,
  onWinner,
  isSpinning,
  setIsSpinning,
  isFullscreen = false,
  theme = 'light',
}) => {
  const [displayedPrize, setDisplayedPrize] = useState<Prize | null>(prizes[0] || null);
  const intervalRef = useRef<number | null>(null);
  const isDark = theme === 'dark';

  useEffect(() => {
    if (prizes.length > 0 && !displayedPrize) {
      setDisplayedPrize(prizes[0]);
    }
  }, [prizes, displayedPrize]);

  const handleRoll = () => {
    if (isSpinning || prizes.length === 0) return;

    sounds.playClick();
    setIsSpinning(true);

    // Pick weighted winner based on configured percentage
    const { prize: winningPrize } = pickWeightedWinner(prizes);

    let speed = 50;
    let stepCount = 0;
    const totalSteps = 32;

    const rollStep = () => {
      stepCount++;
      const randomPrize = prizes[Math.floor(Math.random() * prizes.length)];
      setDisplayedPrize(randomPrize);
      sounds.playTick(1.2);

      if (stepCount < totalSteps) {
        if (stepCount > 22) {
          speed += 25; // Gradual slowing
        }
        intervalRef.current = window.setTimeout(rollStep, speed);
      } else {
        setDisplayedPrize(winningPrize);
        setIsSpinning(false);
        onWinner(winningPrize);
      }
    };

    rollStep();
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className={`flex flex-col items-center w-full max-w-xl mx-auto ${isFullscreen ? 'py-1' : 'py-3'}`}>
      {/* Rapid Draw Terminal Container */}
      <div
        className={`w-full border rounded-3xl ${
          isFullscreen ? 'p-6 sm:p-8' : 'p-5 sm:p-7'
        } relative overflow-hidden transition-colors ${
          isDark
            ? 'bg-[#14141E] border-white/10 shadow-xl'
            : 'bg-white border-purple-100 shadow-xl shadow-purple-500/5'
        }`}
      >
        {/* Top Terminal Status Bar */}
        <div className={`flex items-center justify-between px-1 pb-4 border-b ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#EC4899]" />
          </div>
          <span className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[#8B5CF6] flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" />
            <span>RAPID DRAW TERMINAL</span>
          </span>
          <div className="text-[10px] font-mono opacity-50">READY</div>
        </div>

        {/* Display Screen */}
        <div
          className={`my-5 rounded-2xl p-6 sm:p-8 border flex flex-col items-center justify-center min-h-[175px] shadow-inner relative transition-colors ${
            isDark ? 'bg-[#0B0B11] border-white/10' : 'bg-purple-50/50 border-purple-100'
          }`}
        >
          {displayedPrize ? (
            <motion.div
              key={displayedPrize.id + (isSpinning ? Math.random() : '')}
              initial={isSpinning ? { y: -12, opacity: 0.6 } : { scale: 0.98 }}
              animate={isSpinning ? { y: 0, opacity: 1 } : { scale: 1 }}
              className="flex flex-col items-center text-center z-10"
            >
              <span className="text-[10px] uppercase font-mono font-semibold text-[#8B5CF6] tracking-wider mb-2 px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20">
                HADIAH {displayedPrize.category.toUpperCase()} • {displayedPrize.percentage ?? 10}% PELUANG
              </span>
              <h3 className={`text-2xl sm:text-3xl font-serif font-bold tracking-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                {displayedPrize.name}
              </h3>
            </motion.div>
          ) : (
            <span className={`${isDark ? 'text-white/40' : 'text-slate-400'} text-xs font-sans`}>
              Tidak ada hadiah tersedia
            </span>
          )}
        </div>

        {/* Action Button */}
        <div className="flex justify-center pt-1">
          <button
            id="btn-slot-roll"
            onClick={handleRoll}
            disabled={isSpinning || prizes.length === 0}
            className={`w-full sm:w-auto px-9 py-3 rounded-full font-bold text-xs tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2.5 ${
              isSpinning || prizes.length === 0
                ? isDark
                  ? 'bg-[#222230] text-white/30 cursor-not-allowed'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-[#8B5CF6] hover:bg-[#7C3AED] text-white shadow-purple-500/25 active:scale-95'
            }`}
          >
            {isSpinning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Mengundi Hadiah...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Mulai Roll Cepat</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
