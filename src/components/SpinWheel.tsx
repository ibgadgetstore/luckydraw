import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Prize, ThemeMode } from '../types';
import { sounds } from '../utils/audio';
import { pickWeightedWinner } from '../utils/probability';
import { Sparkles, Play } from 'lucide-react';

interface SpinWheelProps {
  prizes: Prize[];
  onWinner: (prize: Prize) => void;
  isSpinning: boolean;
  setIsSpinning: (spinning: boolean) => void;
  isFullscreen?: boolean;
  theme?: ThemeMode;
}

export const SpinWheel: React.FC<SpinWheelProps> = ({
  prizes,
  onWinner,
  isSpinning,
  setIsSpinning,
  isFullscreen = false,
  theme = 'dark',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rotationAngle, setRotationAngle] = useState(0);
  const currentAngleRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const lastSoundSegmentRef = useRef<number>(-1);

  const numSegments = prizes.length;
  const arcSize = (2 * Math.PI) / (numSegments || 1);
  const isDark = theme === 'dark';

  // Draw the wheel onto canvas
  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 22;

    ctx.clearRect(0, 0, width, height);

    // Outer decorative glow & soft purple rim
    ctx.save();
    ctx.shadowColor = isDark ? 'rgba(167, 139, 250, 0.45)' : 'rgba(147, 51, 234, 0.25)';
    ctx.shadowBlur = 24;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 12, 0, 2 * Math.PI);
    ctx.fillStyle = isDark ? '#0F0F14' : '#FFFFFF';
    ctx.fill();
    ctx.restore();

    // Soft Purple metallic border
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 10, 0, 2 * Math.PI);
    ctx.lineWidth = 7;
    ctx.strokeStyle = '#A78BFA';
    ctx.stroke();

    // Decorative studs around the rim
    const numBulbs = 24;
    for (let i = 0; i < numBulbs; i++) {
      const bulbAngle = (i * 2 * Math.PI) / numBulbs;
      const bx = centerX + (radius + 10) * Math.cos(bulbAngle);
      const by = centerY + (radius + 10) * Math.sin(bulbAngle);

      ctx.beginPath();
      ctx.arc(bx, by, 3, 0, 2 * Math.PI);
      ctx.fillStyle = i % 2 === 0 ? '#C4B5FD' : '#7E22CE';
      ctx.shadowColor = '#A78BFA';
      ctx.shadowBlur = 4;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    if (numSegments === 0) {
      // Empty state
      ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
      ctx.font = '16px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Tidak ada hadiah', centerX, centerY);
      return;
    }

    // Slices
    for (let i = 0; i < numSegments; i++) {
      const prize = prizes[i];
      const startAngle = currentAngleRef.current + i * arcSize;
      const endAngle = startAngle + arcSize;

      // Slice background
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();

      // Alternate or custom soft jewel color
      const defaultColors = [
        '#8B5CF6', '#EC4899', '#06B6D4', '#3B82F6',
        '#10B981', '#A78BFA', '#F43F5E', '#6366F1', '#D946EF', '#14B8A6'
      ];
      ctx.fillStyle = prize.color || defaultColors[i % defaultColors.length];
      ctx.fill();

      // Slice border with subtle white tint
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Text and label
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + arcSize / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
      ctx.shadowBlur = 6;

      // Dynamic font size
      const fontSize = numSegments > 10 ? 11 : numSegments > 7 ? 12 : 13;
      ctx.font = `600 ${fontSize}px "Plus Jakarta Sans", sans-serif`;

      // Text label (clean prize name without percentage indicators)
      let text = prize.name;
      if (text.length > 20) {
        text = text.substring(0, 18) + '...';
      }
      ctx.fillText(text, radius - 16, 4);

      ctx.restore();
    }

    // Center Hub Outer Ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, 38, 0, 2 * Math.PI);
    ctx.fillStyle = isDark ? '#0F0F14' : '#FFFFFF';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#A78BFA';
    ctx.stroke();

    // Center Hub Inner Core
    ctx.beginPath();
    ctx.arc(centerX, centerY, 28, 0, 2 * Math.PI);
    const grad = ctx.createRadialGradient(centerX - 4, centerY - 4, 2, centerX, centerY, 28);
    grad.addColorStop(0, '#C4B5FD');
    grad.addColorStop(1, '#7C3AED');
    ctx.fillStyle = grad;
    ctx.fill();

    // Center Hub Text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 10px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('IBGADGET', centerX, centerY - 2);
    ctx.fillText('STORE', centerX, centerY + 10);
  }, [prizes, arcSize, numSegments, isDark]);

  useEffect(() => {
    drawWheel();
  }, [drawWheel, rotationAngle]);

  const spin = () => {
    if (isSpinning || prizes.length === 0) return;

    sounds.playClick();
    setIsSpinning(true);

    // Pick weighted winner based on configured percentages
    const { prize: winningPrize, index: winnerIndex } = pickWeightedWinner(prizes);

    // Pointer is at top (270 degrees / 3*PI/2)
    const targetSliceAngle = winnerIndex * arcSize + arcSize / 2;
    const pointerAngle = (3 * Math.PI) / 2;

    // 6 to 9 full rotations + landing offset
    const fullRotations = Math.floor(Math.random() * 3) + 6;
    const targetAngle =
      currentAngleRef.current +
      fullRotations * 2 * Math.PI +
      (pointerAngle - ((currentAngleRef.current + targetSliceAngle) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

    const startAngle = currentAngleRef.current;
    const distance = targetAngle - startAngle;
    const duration = 4500; // 4.5 seconds
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easeOut = 1 - Math.pow(1 - progress, 3.5);
      const current = startAngle + distance * easeOut;

      currentAngleRef.current = current;
      setRotationAngle(current);

      // Trigger tick sound on segment crossing
      const normalizedAngle = (current % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
      const currentSegment = Math.floor(((pointerAngle - normalizedAngle + 2 * Math.PI) % (2 * Math.PI)) / arcSize);
      if (currentSegment !== lastSoundSegmentRef.current) {
        lastSoundSegmentRef.current = currentSegment;
        sounds.playTick(1 + (1 - progress) * 0.3);
      }

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        onWinner(winningPrize);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div className={`flex flex-col items-center justify-center relative w-full ${isFullscreen ? 'py-1' : 'py-3'}`}>
      {/* Top pointer pin in soft purple & rose - Stable and non-jittering */}
      <div className="relative z-20 -mb-5 flex flex-col items-center pointer-events-none">
        <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[26px] border-t-[#8B5CF6] drop-shadow-[0_2px_8px_rgba(139,92,246,0.6)]" />
        <div className="w-2.5 h-2.5 bg-[#EC4899] rounded-full -mt-6 border-2 border-white shadow-sm" />
      </div>

      {/* Wheel Canvas Container */}
      <div
        className={`relative p-2.5 rounded-full shadow-[0_4px_25px_rgba(0,0,0,0.15)] border border-[#8B5CF6]/30 ${
          isDark ? 'bg-[#16161F]' : 'bg-white'
        }`}
      >
        <canvas
          id="lucky-draw-wheel-canvas"
          ref={canvasRef}
          width={440}
          height={440}
          className={`${
            isFullscreen
              ? 'w-[280px] h-[280px] sm:w-[360px] sm:h-[360px] md:w-[400px] md:h-[400px] lg:w-[440px] lg:h-[440px]'
              : 'w-[280px] h-[280px] sm:w-[340px] sm:h-[340px] md:w-[380px] md:h-[380px]'
          } rounded-full block`}
        />
      </div>

      {/* Spin Action Button */}
      <div className={`${isFullscreen ? 'mt-4' : 'mt-6'} flex items-center justify-center`}>
        <div className="relative group">
          <button
            id="btn-spin-wheel"
            onClick={spin}
            disabled={isSpinning || prizes.length === 0}
            className={`relative px-8 py-3 rounded-full font-bold text-xs tracking-[0.2em] uppercase shadow-lg transition-all duration-150 flex items-center gap-2.5 ${
              isSpinning || prizes.length === 0
                ? isDark
                  ? 'bg-[#262335] text-white/40 cursor-not-allowed opacity-70'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-[#8B5CF6] hover:bg-[#7C3AED] text-white active:scale-95 shadow-[#8B5CF6]/30'
            }`}
          >
            {isSpinning ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-white" />
                <span>Memutar Undian...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white text-white" />
                <span>Putar Roda Hadiah</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
