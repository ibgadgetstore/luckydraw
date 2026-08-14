import React, { useState } from 'react';
import { WinnerRecord, CategoryType, ThemeMode } from '../types';
import { Trophy, Download, Trash2, Filter, Copy, Check, AlertTriangle, X } from 'lucide-react';

interface WinnerHistoryProps {
  history: WinnerRecord[];
  onClearHistory: () => void;
  onDeleteRecord?: (id: string) => void;
  theme?: ThemeMode;
}

export const WinnerHistory: React.FC<WinnerHistoryProps> = ({
  history,
  onClearHistory,
  onDeleteRecord,
  theme = 'dark',
}) => {
  const [filterCategory, setFilterCategory] = useState<'all' | CategoryType>('all');
  const [copied, setCopied] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const isDark = theme === 'dark';

  const filteredHistory = history.filter((item) => {
    if (filterCategory === 'all') return true;
    return item.category === filterCategory;
  });

  const exportToCSV = () => {
    if (history.length === 0) return;

    const headers = ['No', 'Nama Pemenang', 'Hadiah', 'Kategori', 'Mode Game', 'Waktu Pengundian'];
    const rows = history.map((item, index) => [
      index + 1,
      `"${item.winnerName.replace(/"/g, '""')}"`,
      `"${item.prizeName.replace(/"/g, '""')}"`,
      item.category.toUpperCase(),
      item.gameMode.toUpperCase(),
      `"${new Date(item.timestamp).toLocaleString('id-ID')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `rekap-pemenang-ibgadgetstore-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copySummary = () => {
    if (history.length === 0) return;
    const text = history
      .map(
        (h, i) =>
          `${i + 1}. ${h.winnerName || 'Peserta'} - ${h.prizeName} (${h.category.toUpperCase()}) [${new Date(h.timestamp).toLocaleTimeString('id-ID')}]`
      )
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmClear = () => {
    onClearHistory();
    setShowClearConfirm(false);
  };

  return (
    <div
      className={`rounded-2xl border p-5 sm:p-6 shadow-xl relative transition-colors ${
        isDark ? 'bg-[#16161F] border-white/10' : 'bg-white border-purple-100 shadow-purple-500/5'
      }`}
    >
      {/* Header */}
      <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
        <div>
          <h3 className={`text-base sm:text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <Trophy className="w-5 h-5 text-[#8B5CF6]" />
            <span>Riwayat Pemenang Undian</span>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-[#8B5CF6] text-[11px] font-mono font-bold border border-purple-500/20">
              {history.length} Pemenang
            </span>
          </h3>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
            Daftar seluruh pemenang yang berhasil mendapatkan hadiah secara resmi
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
          {history.length > 0 && (
            <>
              <button
                id="btn-copy-history"
                onClick={copySummary}
                className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-colors flex-1 sm:flex-initial ${
                  isDark
                    ? 'bg-[#0F0F14] border-white/10 text-white/80 hover:bg-white/5'
                    : 'bg-purple-50 border-purple-200 text-slate-700 hover:bg-purple-100'
                }`}
                title="Salin rekap teks"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Tersalin' : 'Salin'}</span>
              </button>

              <button
                id="btn-export-csv"
                onClick={exportToCSV}
                className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold bg-[#8B5CF6] hover:bg-[#7C3AED] text-white flex items-center justify-center gap-1.5 transition-colors shadow-sm flex-1 sm:flex-initial"
                title="Unduh file Excel CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>

              <button
                id="btn-clear-history"
                onClick={() => setShowClearConfirm(true)}
                className={`px-3 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-colors flex-1 sm:flex-initial ${
                  isDark
                    ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border-rose-500/30'
                    : 'bg-rose-50 text-rose-600 hover:bg-rose-100 border-rose-200'
                }`}
                title="Hapus riwayat pemenang"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className={`flex items-center gap-2 py-3 border-b ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
        <Filter className={`w-3.5 h-3.5 ${isDark ? 'text-white/40' : 'text-slate-400'}`} />
        <span className={`text-xs mr-1 font-mono ${isDark ? 'text-white/50' : 'text-slate-500'}`}>Filter:</span>
        <button
          onClick={() => setFilterCategory('all')}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
            filterCategory === 'all'
              ? 'bg-[#8B5CF6] text-white font-bold shadow-sm'
              : isDark
              ? 'text-white/60 hover:text-white'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Semua ({history.length})
        </button>
        <button
          onClick={() => setFilterCategory('pusat')}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
            filterCategory === 'pusat'
              ? 'bg-[#8B5CF6] text-white font-bold shadow-sm'
              : isDark
              ? 'text-white/60 hover:text-white'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Pusat ({history.filter((h) => h.category === 'pusat').length})
        </button>
        <button
          onClick={() => setFilterCategory('cabang')}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
            filterCategory === 'cabang'
              ? 'bg-[#8B5CF6] text-white font-bold shadow-sm'
              : isDark
              ? 'text-white/60 hover:text-white'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Cabang ({history.filter((h) => h.category === 'cabang').length})
        </button>
      </div>

      {/* History Table / List */}
      <div className="mt-3 max-h-[360px] overflow-y-auto space-y-2 pr-1">
        {filteredHistory.length === 0 ? (
          <div className={`text-center py-10 text-xs ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
            Belum ada data pemenang untuk kategori ini.
          </div>
        ) : (
          filteredHistory.map((item, index) => (
            <div
              key={item.id}
              className={`flex items-center justify-between p-3.5 rounded-xl border transition-all group ${
                isDark
                  ? 'bg-[#0F0F14] border-white/10 hover:border-[#8B5CF6]/40'
                  : 'bg-purple-50/50 border-purple-100 hover:border-purple-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full border text-xs font-mono font-bold flex items-center justify-center shrink-0 ${
                  isDark ? 'bg-[#16161F] border-white/10 text-[#A78BFA]' : 'bg-white border-purple-200 text-[#7C3AED]'
                }`}>
                  {filteredHistory.length - index}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-serif font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.prizeName}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                        item.category === 'pusat'
                          ? 'bg-purple-500/10 border border-purple-500/30 text-[#8B5CF6]'
                          : 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-500'
                      }`}
                    >
                      {item.category}
                    </span>
                    <span className={`hidden sm:inline-block text-[10px] font-mono opacity-60 ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
                      [{item.gameMode}]
                    </span>
                  </div>
                  <div className={`text-xs mt-0.5 flex items-center gap-2 font-mono ${isDark ? 'text-white/40' : 'text-slate-500'}`}>
                    {item.winnerName && <span className={`font-sans font-medium ${isDark ? 'text-white/80' : 'text-slate-700'}`}>Oleh: {item.winnerName}</span>}
                    {item.winnerName && <span>•</span>}
                    <span>{new Date(item.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right font-mono">
                  <span className={`text-[11px] ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
                    {new Date(item.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>

                {onDeleteRecord && (
                  <button
                    onClick={() => onDeleteRecord(item.id)}
                    className={`p-1.5 rounded-lg opacity-60 hover:opacity-100 transition-all ${
                      isDark
                        ? 'hover:bg-rose-500/20 text-white/40 hover:text-rose-400'
                        : 'hover:bg-rose-100 text-slate-400 hover:text-rose-600'
                    }`}
                    title="Hapus baris pemenang ini"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Confirmation Modal for Clear All History */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className={`w-full max-w-sm rounded-2xl border p-5 sm:p-6 shadow-2xl relative ${
              isDark ? 'bg-[#16161F] border-rose-500/40 text-white' : 'bg-white border-rose-200 text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold">Hapus Riwayat?</h4>
                <p className={`text-xs ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
                  Tindakan ini akan menghapus {history.length} data pemenang secara permanen.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold ${
                  isDark ? 'bg-white/10 hover:bg-white/15 text-white/80' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmClear}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/30 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
