import React, { useState } from 'react';
import { Prize, ThemeMode } from '../types';
import { sounds } from '../utils/audio';
import { pickWeightedWinner } from '../utils/probability';
import { Package, Sparkles, Shuffle, CheckCircle, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MysteryBoxesProps {
  prizes: Prize[];
  onWinner: (prize: Prize) => void;
  isSpinning: boolean;
  setIsSpinning: (spinning: boolean) => void;
  isFullscreen?: boolean;
  theme?: ThemeMode;
}

export const MysteryBoxes: React.FC<MysteryBoxesProps> = ({
  prizes,
  onWinner,
  isSpinning,
  setIsSpinning,
  isFullscreen = false,
  theme = 'light',
}) => {
  const [selectedBoxIndex, setSelectedBoxIndex] = useState<number | null>(null);
  const [revealedPrize, setRevealedPrize] = useState<Prize | null>(null);
  const isDark = theme === 'dark';

  // Generate boxes matching the number of prizes (or min 6)
  const boxCount = Math.max(prizes.length, 6);

  const handleOpenBox = (boxIndex: number) => {
    if (isSpinning || prizes.length === 0) return;

    setSelectedBoxIndex(boxIndex);
    setIsSpinning(true);
    setRevealedPrize(null);
    sounds.playMysteryShaking();

    // Pick weighted winner based on configured percentages
    const { prize: randomPrize } = pickWeightedWinner(prizes);

    // 2.0-second suspense animation before reveal
    setTimeout(() => {
      setRevealedPrize(randomPrize);
      setIsSpinning(false);
      onWinner(randomPrize);
    }, 2000);
  };

  const handleRandomPick = () => {
    if (isSpinning || prizes.length === 0) return;
    const randomBoxIndex = Math.floor(Math.random() * boxCount);
    handleOpenBox(randomBoxIndex);
  };

  return (
    <div className={`flex flex-col items-center w-full max-w-4xl mx-auto ${isFullscreen ? 'py-1' : 'py-3'}`}>
      <div className="text-center mb-5">
        <p className={`text-xs sm:text-sm max-w-md mx-auto ${isDark ? 'text-white/60' : 'text-slate-600'}`}>
          Pilih salah satu kotak eksklusif di bawah ini untuk membuka hadiah kejutan spesial Anda
        </p>
      </div>

      {/* Grid of Mystery Boxes */}
      <div className={`grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 ${isFullscreen ? 'gap-3 sm:gap-5' : 'gap-3 sm:gap-4'} w-full px-2`}>
        {Array.from({ length: boxCount }).map((_, index) => {
          const isSelected = selectedBoxIndex === index;
          const isOpened = isSelected && revealedPrize !== null;

          return (
            <motion.button
              key={index}
              id={`mystery-box-${index}`}
              onClick={() => handleOpenBox(index)}
              disabled={isSpinning}
              whileHover={!isSpinning ? { y: -3 } : {}}
              whileTap={!isSpinning ? { scale: 0.98 } : {}}
              className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center p-3 sm:p-4 border transition-all duration-200 ${
                isSelected
                  ? isDark
                    ? 'bg-[#1C1A29] border-[#8B5CF6] shadow-lg shadow-[#8B5CF6]/20'
                    : 'bg-purple-50 border-[#8B5CF6] shadow-md shadow-purple-500/15'
                  : isDark
                  ? 'bg-[#14141E] border-white/10 hover:border-[#8B5CF6]/40 shadow-sm'
                  : 'bg-white border-purple-100 hover:border-purple-300 shadow-sm hover:shadow'
              }`}
            >
              {/* Box Number Tag */}
              <div
                className={`absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold ${
                  isDark
                    ? 'bg-[#0F0F14] border-white/10 text-[#A78BFA]'
                    : 'bg-white border-purple-200 text-[#7C3AED]'
                }`}
              >
                #{index + 1}
              </div>

              {/* Shaking & opening animation */}
              <AnimatePresence mode="wait">
                {isSelected && isSpinning ? (
                  <motion.div
                    key="shaking"
                    animate={{
                      rotate: [-6, 6, -6, 6, 0],
                      scale: [1, 1.08, 1, 1.08, 1.04],
                    }}
                    transition={{ repeat: Infinity, duration: 0.35 }}
                    className="flex flex-col items-center justify-center"
                  >
                    <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                      <Package className="w-8 h-8 text-[#8B5CF6] animate-pulse" />
                    </div>
                    <span className="text-[10px] font-semibold text-[#8B5CF6] mt-2 font-mono tracking-wider">
                      MEMBUKA...
                    </span>
                  </motion.div>
                ) : isOpened && revealedPrize ? (
                  <motion.div
                    key="revealed"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center text-center justify-center px-1"
                  >
                    <CheckCircle className="w-7 h-7 text-[#10B981] mb-1.5" />
                    <span className={`text-xs font-bold font-serif line-clamp-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {revealedPrize.name}
                    </span>
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center group">
                    <div
                      className={`p-3 rounded-2xl border transition-all ${
                        isDark
                          ? 'bg-purple-500/10 border-white/10 text-[#A78BFA] group-hover:border-[#8B5CF6]/40'
                          : 'bg-purple-50 border-purple-100 text-[#7C3AED] group-hover:bg-purple-100'
                      }`}
                    >
                      <Gift className="w-6 h-6 sm:w-8 sm:h-8 text-[#8B5CF6]" />
                    </div>
                    <span className={`text-[11px] mt-2 font-medium tracking-wide ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                      Buka Kotak
                    </span>
                  </div>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      {/* Auto Random Button */}
      <div className={`${isFullscreen ? 'mt-4' : 'mt-6'} flex items-center justify-center`}>
        <button
          id="btn-random-mystery-box"
          onClick={handleRandomPick}
          disabled={isSpinning || prizes.length === 0}
          className={`px-7 py-3 rounded-full font-bold text-xs tracking-wider uppercase transition-all shadow-md flex items-center gap-2.5 ${
            isSpinning || prizes.length === 0
              ? isDark
                ? 'bg-[#222230] text-white/30 cursor-not-allowed'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-[#8B5CF6] hover:bg-[#7C3AED] text-white shadow-purple-500/25 active:scale-95'
          }`}
        >
          <Shuffle className="w-4 h-4" />
          <span>Pilih Kotak Acak Otomatis</span>
        </button>
      </div>
    </div>
  );
};
