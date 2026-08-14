import React, { useState, useEffect, useRef } from 'react';
import { Prize, WinnerRecord, ThemeMode } from '../types';
import { sounds } from '../utils/audio';
import confetti from 'canvas-confetti';
import {
  Award,
  Check,
  Copy,
  RotateCcw,
  X,
  Smartphone,
  Banknote,
  TicketPercent,
  Wallet,
  Gift,
  Download,
  ShieldCheck,
  Crown,
  Calendar,
  Sparkles,
  QrCode,
  Share2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface WinnerModalProps {
  winner: WinnerRecord | null;
  prize: Prize | null;
  onClose: () => void;
  onSpinAgain: () => void;
  theme?: ThemeMode;
}

export const WinnerModal: React.FC<WinnerModalProps> = ({
  winner,
  prize,
  onClose,
  onSpinAgain,
  theme = 'light',
}) => {
  const [copied, setCopied] = useState(false);
  const [isGeneratingProof, setIsGeneratingProof] = useState(false);
  const isDark = theme === 'dark';

  // Verification Code generated for the claim ticket
  const verificationCode = useRef(
    `IBG-${Math.floor(100000 + Math.random() * 900000)}`
  ).current;

  useEffect(() => {
    if (winner && prize) {
      // Play celebratory sound
      sounds.playCelebration();

      // Trigger refined confetti with luxury purple, rose, cyan & gold sparks
      const count = 180;
      const defaults = {
        origin: { y: 0.65 },
        colors: ['#8B5CF6', '#A78BFA', '#EC4899', '#10B981', '#F59E0B', '#FFFFFF'],
      };

      const fire = (particleRatio: number, opts: confetti.Options) => {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio),
        });
      };

      fire(0.25, { spread: 26, startVelocity: 50 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.92, scalar: 0.9 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.1 });
      fire(0.1, { spread: 120, startVelocity: 40 });
    }
  }, [winner, prize]);

  if (!winner || !prize) return null;

  const claimText = `*BUKTI KEMENANGAN RESMI IBGADGETSTORE*\n\n` +
    `🏆 *Nama Pemenang*: ${winner.winnerName || 'Pelanggan Setia'}\n` +
    `🎁 *Hadiah*: ${winner.prizeName}\n` +
    `🏷️ *Kategori*: Hadiah ${winner.category.toUpperCase()}\n` +
    `🎮 *Mode Pengundian*: ${winner.gameMode.toUpperCase()}\n` +
    `🔢 *Kode Verifikasi*: ${verificationCode}\n` +
    `📅 *Waktu*: ${new Date(winner.timestamp).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'medium' })}\n\n` +
    `_Tunjukkan pesan atau bukti kemenangan ini ke staf/admin resmi IBGADGETSTORE untuk proses klaim hadiah._`;

  const handleCopy = () => {
    navigator.clipboard.writeText(claimText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const getPrizeIcon = () => {
    const nameLower = prize.name.toLowerCase();
    if (nameLower.includes('android') || nameLower.includes('phone') || nameLower.includes('iphone')) {
      return <Smartphone className="w-8 h-8 text-[#8B5CF6]" />;
    }
    if (nameLower.includes('uang') || nameLower.includes('tunai') || nameLower.includes('cash') || nameLower.includes('rp')) {
      return <Banknote className="w-8 h-8 text-[#10B981]" />;
    }
    if (nameLower.includes('shopeepay') || nameLower.includes('shopepay') || nameLower.includes('saldo') || nameLower.includes('wallet')) {
      return <Wallet className="w-8 h-8 text-[#EC4899]" />;
    }
    if (nameLower.includes('potongan') || nameLower.includes('diskon') || nameLower.includes('voucher')) {
      return <TicketPercent className="w-8 h-8 text-[#06B6D4]" />;
    }
    return <Gift className="w-8 h-8 text-[#8B5CF6]" />;
  };

  // Generate high-resolution digital proof PNG
  const handleDownloadProof = () => {
    setIsGeneratingProof(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 760;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Background Luxury Gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 1200, 760);
      if (isDark) {
        bgGrad.addColorStop(0, '#0F0F14');
        bgGrad.addColorStop(0.5, '#16161F');
        bgGrad.addColorStop(1, '#0B0B0E');
      } else {
        bgGrad.addColorStop(0, '#FFFFFF');
        bgGrad.addColorStop(0.5, '#FAF8FF');
        bgGrad.addColorStop(1, '#F3EEFF');
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1200, 760);

      // Border & Guilloche Frame
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#8B5CF6';
      ctx.strokeRect(30, 30, 1140, 700);

      ctx.lineWidth = 1;
      ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(139,92,246,0.3)';
      ctx.strokeRect(42, 42, 1116, 676);

      // Corner Accents
      const corners = [
        [42, 42],
        [1158, 42],
        [42, 718],
        [1158, 718],
      ];
      corners.forEach(([cx, cy]) => {
        ctx.fillStyle = '#8B5CF6';
        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, Math.PI * 2);
        ctx.fill();
      });

      // Header Brand
      ctx.textAlign = 'center';
      ctx.fillStyle = '#8B5CF6';
      ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('IBGADGETSTORE • BUKTI KEMENANGAN RESMI', 600, 100);

      // Title
      ctx.fillStyle = isDark ? '#FFFFFF' : '#1E1B4B';
      ctx.font = 'bold 36px Georgia, serif';
      ctx.fillText('BUKTI SAH KLAIM HADIAH LUCKY DRAW', 600, 155);

      ctx.fillStyle = isDark ? 'rgba(255,255,255,0.6)' : '#64748B';
      ctx.font = '16px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('Dokumen digital ini diterbitkan sebagai tanda bukti kemenangan yang sah:', 600, 195);

      // Prize Card Box
      ctx.fillStyle = isDark ? '#1C1B29' : '#FFFFFF';
      ctx.strokeStyle = isDark ? '#38334D' : '#E2D9FC';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(160, 230, 880, 200, 16);
      ctx.fill();
      ctx.stroke();

      // Category Tag
      ctx.fillStyle = '#8B5CF6';
      ctx.font = 'bold 15px monospace';
      ctx.fillText(`KATEGORI: HADIAH ${winner.category.toUpperCase()}`, 600, 275);

      // Prize Name
      ctx.fillStyle = isDark ? '#FFFFFF' : '#0F172A';
      ctx.font = 'bold 44px Georgia, serif';
      ctx.fillText(winner.prizeName, 600, 335);

      // Recipient Name
      ctx.fillStyle = isDark ? 'rgba(255,255,255,0.7)' : '#475569';
      ctx.font = 'bold 18px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`Pemenang: ${winner.winnerName || 'Peserta Terpilih'}`, 600, 390);

      // Meta info columns
      ctx.textAlign = 'left';
      ctx.fillStyle = isDark ? 'rgba(255,255,255,0.5)' : '#64748B';
      ctx.font = '14px monospace';
      ctx.fillText(`KODE VERIFIKASI : ${verificationCode}`, 160, 480);
      ctx.fillText(`MODE PENGUNDIAN : ${winner.gameMode.toUpperCase()}`, 160, 510);

      ctx.textAlign = 'right';
      const formattedDate = new Date(winner.timestamp).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      ctx.fillText(`TANGGAL KLAIM  : ${formattedDate}`, 1040, 480);
      ctx.fillText(`STATUS KLAIM   : TERVERIFIKASI SAH`, 1040, 510);

      // Footer divider
      ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
      ctx.beginPath();
      ctx.moveTo(160, 560);
      ctx.lineTo(1040, 560);
      ctx.stroke();

      // Signature & Validation Seal
      ctx.textAlign = 'center';
      ctx.fillStyle = '#8B5CF6';
      ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('TIM MANAJEMEN IBGADGETSTORE', 600, 615);
      ctx.fillStyle = isDark ? 'rgba(255,255,255,0.4)' : '#94A3B8';
      ctx.font = '13px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('Bukti kemenangan elektronik ini sah dan langsung dapat diklaim ke staf toko.', 600, 645);

      // Trigger download
      const link = document.createElement('a');
      link.download = `Bukti-Kemenangan-IBGADGETSTORE-${verificationCode}.png`;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to generate proof image:', err);
    } finally {
      setIsGeneratingProof(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 28, stiffness: 260 }}
          className={`relative w-full max-w-lg rounded-3xl border text-center overflow-hidden transition-all shadow-2xl ${
            isDark
              ? 'bg-[#14141E] border-white/10 shadow-[0_20px_70px_rgba(0,0,0,0.85)] text-white'
              : 'bg-white border-slate-200 shadow-2xl text-slate-900'
          }`}
        >
          {/* Close button */}
          <button
            id="btn-close-winner-modal"
            onClick={onClose}
            className={`absolute top-4 right-4 p-2 rounded-xl transition-all ${
              isDark
                ? 'text-white/40 hover:text-white hover:bg-white/10'
                : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
            }`}
            title="Tutup (ESC)"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="p-6 sm:p-7 pt-8 sm:pt-9">
            {/* Prestige Header Badge */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold tracking-widest uppercase bg-purple-500/10 border border-purple-500/25 text-[#8B5CF6]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#8B5CF6]" />
                <span>BUKTI KLAIM RESMI IBGADGETSTORE</span>
              </span>
            </div>

            {/* Official Winner Name Banner */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <Crown className="w-4 h-4 text-[#F59E0B]" />
              <h3 className="text-sm font-semibold tracking-wide font-sans opacity-90">
                Pemenang:{' '}
                <span className={`font-bold font-serif ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {winner.winnerName || 'Pelanggan Setia'}
                </span>
              </h3>
            </div>

            {/* Central Prize Proof Frame */}
            <div
              className={`relative rounded-2xl border p-5 sm:p-6 transition-all ${
                isDark
                  ? 'bg-[#0B0B11] border-purple-500/30 shadow-inner'
                  : 'bg-purple-50/60 border-purple-200 shadow-sm'
              }`}
            >
              {/* Category & Status Pill */}
              <div className="flex items-center justify-between mb-3">
                <span
                  className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider ${
                    winner.category === 'pusat'
                      ? 'bg-purple-500/15 text-[#8B5CF6] border border-purple-500/30'
                      : 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30'
                  }`}
                >
                  HADIAH {winner.category.toUpperCase()}
                </span>
                <span className={`text-[10px] font-mono ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
                  REF: {verificationCode}
                </span>
              </div>

              {/* Icon & Prize Title */}
              <div className="flex flex-col items-center py-2">
                <div
                  className={`w-14 h-14 rounded-2xl border flex items-center justify-center mb-3 shadow-md ${
                    isDark
                      ? 'bg-[#181824] border-white/10'
                      : 'bg-white border-purple-100'
                  }`}
                >
                  {getPrizeIcon()}
                </div>

                <h2
                  className={`text-2xl sm:text-3xl font-serif font-bold tracking-tight mb-1 ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {winner.prizeName}
                </h2>

                <p className={`text-xs font-sans mt-0.5 ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
                  Selamat! Hadiah ini telah tercatat resmi di sistem undian.
                </p>
              </div>

              {/* Timestamp & Metadata row */}
              <div
                className={`mt-4 pt-3 border-t flex items-center justify-between text-[11px] font-mono ${
                  isDark ? 'border-white/10 text-white/50' : 'border-purple-200/70 text-slate-500'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 opacity-70" />
                  <span>
                    {new Date(winner.timestamp).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </span>
                <span className="flex items-center gap-1 text-[#8B5CF6] font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Sistem Sah</span>
                </span>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-2 gap-2.5 mt-5">
              <button
                id="btn-copy-claim-winner"
                onClick={handleCopy}
                className={`px-3.5 py-2.5 rounded-xl font-semibold text-xs border flex items-center justify-center gap-1.5 transition-all ${
                  isDark
                    ? 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                    : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                }`}
                title="Salin rincian klaim pemenang"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-500 font-bold">Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Rincian</span>
                  </>
                )}
              </button>

              <button
                id="btn-download-proof"
                onClick={handleDownloadProof}
                disabled={isGeneratingProof}
                className={`px-3.5 py-2.5 rounded-xl font-semibold text-xs border flex items-center justify-center gap-1.5 transition-all ${
                  isDark
                    ? 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                    : 'bg-purple-50 border-purple-200 text-[#7C3AED] hover:bg-purple-100'
                }`}
                title="Unduh bukti kemenangan gambar digital"
              >
                <Download className="w-3.5 h-3.5 text-[#8B5CF6]" />
                <span>{isGeneratingProof ? 'Membuat...' : 'Unduh Bukti'}</span>
              </button>
            </div>

            {/* Primary Action Button */}
            <div className="mt-3">
              <button
                id="btn-spin-again"
                onClick={onSpinAgain}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs tracking-wider uppercase bg-[#8B5CF6] hover:bg-[#7C3AED] text-white transition-all shadow-md shadow-[#8B5CF6]/30 flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Undi Pemenang Berikutnya</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
