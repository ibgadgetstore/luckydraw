import React, { useState } from 'react';
import { Prize, CategoryType, ThemeMode } from '../types';
import { COLOR_PALETTE, INITIAL_HADIAH_PUSAT, INITIAL_HADIAH_CABANG } from '../data/initialPrizes';
import { calculateTotalPercentage, equalizePercentages } from '../utils/probability';
import {
  Plus,
  Trash2,
  RotateCcw,
  Tag,
  Smartphone,
  Banknote,
  Wallet,
  Gift,
  Check,
  ShieldAlert,
  Edit2,
  Building2,
  Store,
  Layers,
  Sparkles,
  ListPlus,
  Palette,
  Percent,
  Sliders,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface PrizeManagerProps {
  pusatPrizes: Prize[];
  setPusatPrizes: React.Dispatch<React.SetStateAction<Prize[]>>;
  cabangPrizes: Prize[];
  setCabangPrizes: React.Dispatch<React.SetStateAction<Prize[]>>;
  activeCategory: CategoryType;
  setActiveCategory: (category: CategoryType) => void;
  removeOnWin: boolean;
  setRemoveOnWin: (remove: boolean) => void;
  theme?: ThemeMode;
}

export const PrizeManager: React.FC<PrizeManagerProps> = ({
  pusatPrizes,
  setPusatPrizes,
  cabangPrizes,
  setCabangPrizes,
  activeCategory,
  setActiveCategory,
  removeOnWin,
  setRemoveOnWin,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  // Tab within prize manager: 'pusat' or 'cabang'
  const [selectedTab, setSelectedTab] = useState<CategoryType>(activeCategory);

  // Add form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [newPrizeName, setNewPrizeName] = useState('');
  const [newPrizePercentage, setNewPrizePercentage] = useState<number>(10);
  const [newPrizeColor, setNewPrizeColor] = useState(COLOR_PALETTE[0]);
  const [newPrizeIcon, setNewPrizeIcon] = useState<'phone' | 'cash' | 'voucher' | 'wallet' | 'gift'>('gift');
  const [bulkText, setBulkText] = useState('');

  // Editing state
  const [editingPrizeId, setEditingPrizeId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPercentage, setEditPercentage] = useState<number>(10);
  const [editColor, setEditColor] = useState('');
  const [editIcon, setEditIcon] = useState<'phone' | 'cash' | 'voucher' | 'wallet' | 'gift'>('gift');

  // Confirm dialog states
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Determine current active list and setter
  const currentList = selectedTab === 'pusat' ? pusatPrizes : cabangPrizes;
  const setCurrentList = selectedTab === 'pusat' ? setPusatPrizes : setCabangPrizes;

  const totalPercentage = calculateTotalPercentage(currentList);
  const isHundredPercent = Math.abs(totalPercentage - 100) < 0.1;

  const handleAddPrize = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrizeName.trim()) return;

    const newPrize: Prize = {
      id: `${selectedTab}-${Date.now()}`,
      name: newPrizeName.trim(),
      category: selectedTab,
      percentage: Math.max(Number(newPrizePercentage) || 1, 0.1),
      color: newPrizeColor || COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)],
      iconType: newPrizeIcon,
    };

    setCurrentList((prev) => [...prev, newPrize]);
    setNewPrizeName('');
    setNewPrizePercentage(10);
    setShowAddForm(false);
  };

  const handleBulkAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkText.trim()) return;

    const lines = bulkText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const autoPercentage = Math.max(Math.floor((100 / (lines.length || 1)) * 10) / 10, 1);

    const newPrizes: Prize[] = lines.map((name, index) => {
      const color = COLOR_PALETTE[index % COLOR_PALETTE.length];
      const nameLower = name.toLowerCase();
      let icon: 'phone' | 'cash' | 'voucher' | 'wallet' | 'gift' = 'gift';
      if (nameLower.includes('android') || nameLower.includes('phone') || nameLower.includes('hp')) icon = 'phone';
      else if (nameLower.includes('uang') || nameLower.includes('tunai') || nameLower.includes('cash')) icon = 'cash';
      else if (nameLower.includes('shopee') || nameLower.includes('pay') || nameLower.includes('saldo')) icon = 'wallet';
      else if (nameLower.includes('potongan') || nameLower.includes('diskon') || nameLower.includes('voucher')) icon = 'voucher';

      return {
        id: `${selectedTab}-${Date.now()}-${index}`,
        name,
        category: selectedTab,
        color,
        percentage: autoPercentage,
        iconType: icon,
      };
    });

    setCurrentList((prev) => [...prev, ...newPrizes]);
    setBulkText('');
    setShowBulkAdd(false);
  };

  const handleDeletePrize = (id: string) => {
    setCurrentList((prev) => prev.filter((p) => p.id !== id));
  };

  const handleStartEdit = (prize: Prize) => {
    setEditingPrizeId(prize.id);
    setEditName(prize.name);
    setEditPercentage(prize.percentage ?? 10);
    setEditColor(prize.color || COLOR_PALETTE[0]);
    setEditIcon(prize.iconType || 'gift');
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) return;
    setCurrentList((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              name: editName.trim(),
              percentage: Math.max(Number(editPercentage) || 1, 0.1),
              color: editColor,
              iconType: editIcon,
            }
          : p
      )
    );
    setEditingPrizeId(null);
  };

  const handleUpdatePercentageDirect = (id: string, newPct: number) => {
    const validVal = Math.max(Number(newPct) || 0, 0);
    setCurrentList((prev) =>
      prev.map((p) => (p.id === id ? { ...p, percentage: validVal } : p))
    );
  };

  const handleEqualize = () => {
    setCurrentList((prev) => equalizePercentages(prev));
  };

  const handleNormalize = () => {
    if (currentList.length === 0 || totalPercentage <= 0) return;
    setCurrentList((prev) => {
      const factor = 100 / totalPercentage;
      return prev.map((p) => ({
        ...p,
        percentage: Math.round((p.percentage ?? 10) * factor * 10) / 10,
      }));
    });
  };

  const handleResetToDefault = () => {
    if (selectedTab === 'pusat') {
      setPusatPrizes([...INITIAL_HADIAH_PUSAT]);
    } else {
      setCabangPrizes([...INITIAL_HADIAH_CABANG]);
    }
    setShowResetConfirm(false);
  };

  const handleClearCurrent = () => {
    setCurrentList([]);
    setShowClearConfirm(false);
  };

  const renderIcon = (type?: string, name?: string) => {
    const checkName = (name || '').toLowerCase();
    if (type === 'phone' || checkName.includes('android') || checkName.includes('phone')) {
      return <Smartphone className="w-4 h-4 text-[#8B5CF6]" />;
    }
    if (type === 'cash' || checkName.includes('uang') || checkName.includes('tunai')) {
      return <Banknote className="w-4 h-4 text-[#10B981]" />;
    }
    if (type === 'wallet' || checkName.includes('shopee') || checkName.includes('saldo')) {
      return <Wallet className="w-4 h-4 text-[#EC4899]" />;
    }
    if (type === 'voucher' || checkName.includes('potongan') || checkName.includes('diskon')) {
      return <Tag className="w-4 h-4 text-[#06B6D4]" />;
    }
    return <Gift className="w-4 h-4 text-[#8B5CF6]" />;
  };

  return (
    <div
      className={`rounded-2xl border p-5 sm:p-6 shadow-xl transition-colors ${
        isDark ? 'bg-[#16161F] border-white/10' : 'bg-white border-purple-100 shadow-purple-500/5'
      }`}
    >
      {/* Top Header */}
      <div className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-4 border-b ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
        <div>
          <h3 className={`text-base sm:text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <Layers className="w-5 h-5 text-[#8B5CF6] shrink-0" />
            <span>Pengaturan & Persentase Hadiah</span>
          </h3>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
            Sesuaikan bobot persentase kemenangan (%) setiap hadiah untuk Pusat & Cabang
          </p>
        </div>

        {/* Category Switcher Tabs */}
        <div className={`grid grid-cols-2 sm:flex items-center gap-1.5 p-1 rounded-xl border w-full sm:w-auto shrink-0 ${isDark ? 'bg-[#0F0F14] border-white/10' : 'bg-purple-50/70 border-purple-100'}`}>
          <button
            id="tab-mgr-pusat"
            onClick={() => {
              setSelectedTab('pusat');
              setActiveCategory('pusat');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide flex items-center justify-center gap-1.5 transition-all truncate ${
              selectedTab === 'pusat'
                ? 'bg-[#8B5CF6] text-white font-bold shadow-md shadow-[#8B5CF6]/25'
                : isDark
                ? 'text-white/60 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 shrink-0" />
            <span>Pusat ({pusatPrizes.length})</span>
          </button>

          <button
            id="tab-mgr-cabang"
            onClick={() => {
              setSelectedTab('cabang');
              setActiveCategory('cabang');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide flex items-center justify-center gap-1.5 transition-all truncate ${
              selectedTab === 'cabang'
                ? 'bg-[#8B5CF6] text-white font-bold shadow-md shadow-[#8B5CF6]/25'
                : isDark
                ? 'text-white/60 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Store className="w-3.5 h-3.5 shrink-0" />
            <span>Cabang ({cabangPrizes.length})</span>
          </button>
        </div>
      </div>

      {/* Percentage Controls Bar */}
      <div className={`my-3 p-3 rounded-xl border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 sm:gap-3 ${
        isDark ? 'bg-[#0F0F14] border-white/10' : 'bg-purple-50/50 border-purple-100'
      }`}>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-between sm:justify-start">
          <div className="flex items-center gap-1.5">
            <Percent className="w-4 h-4 text-[#8B5CF6]" />
            <span className={`text-xs font-semibold ${isDark ? 'text-white/80' : 'text-slate-700'}`}>
              Total:
            </span>
          </div>

          <div
            className={`px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 border ${
              isHundredPercent
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
            }`}
          >
            {isHundredPercent ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5" />
            )}
            <span>{totalPercentage}%</span>
            {!isHundredPercent && (
              <span className="text-[10px] opacity-80">(Target: 100%)</span>
            )}
          </div>
        </div>

        {/* Balance / Equalize Tools */}
        <div className="grid grid-cols-2 sm:flex items-center gap-2">
          <button
            onClick={handleEqualize}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 transition-all truncate ${
              isDark
                ? 'bg-[#16161F] border-[#8B5CF6]/40 text-[#A78BFA] hover:bg-[#8B5CF6]/15'
                : 'bg-white border-purple-200 text-[#7C3AED] hover:bg-purple-100/50'
            }`}
            title="Bagi rata persentase semua hadiah secara otomatis (total 100%)"
          >
            <Sliders className="w-3.5 h-3.5 shrink-0" />
            <span>Ratakan 100%</span>
          </button>

          {!isHundredPercent && totalPercentage > 0 && (
            <button
              onClick={handleNormalize}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 transition-all truncate ${
                isDark
                  ? 'bg-[#16161F] border-amber-500/40 text-amber-300 hover:bg-amber-500/10'
                  : 'bg-white border-amber-300 text-amber-700 hover:bg-amber-50'
              }`}
              title="Skalakan persentase yang ada agar pas menjadi 100%"
            >
              <span>Normalisasi 100%</span>
            </button>
          )}
        </div>
      </div>

      {/* Action Toolbar & Stock Rule */}
      <div className={`flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 py-3 border-b ${isDark ? 'border-white/10' : 'border-slate-100'} text-xs`}>
        {/* Remove on win checkbox */}
        <label className={`flex items-center gap-2 cursor-pointer select-none transition-colors ${isDark ? 'text-white/70 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}>
          <input
            id="toggle-remove-on-win"
            type="checkbox"
            checked={removeOnWin}
            onChange={(e) => setRemoveOnWin(e.target.checked)}
            className="w-4 h-4 rounded border-purple-300 text-[#8B5CF6] focus:ring-[#8B5CF6]/30 shrink-0"
          />
          <span className="text-[11px] sm:text-xs">Hapus hadiah setelah dimenangkan (Stok 1x)</span>
        </label>

        {/* Add Actions & Reset */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            id="btn-open-add-form"
            onClick={() => {
              setShowAddForm(!showAddForm);
              setShowBulkAdd(false);
            }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 truncate ${
              showAddForm
                ? 'bg-[#8B5CF6] text-white'
                : isDark
                ? 'bg-[#0F0F14] border border-white/10 text-[#A78BFA] hover:bg-[#8B5CF6]/10'
                : 'bg-purple-50 border border-purple-200 text-[#6D28D9] hover:bg-purple-100'
            }`}
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span>Tambah</span>
          </button>

          <button
            id="btn-open-bulk-add"
            onClick={() => {
              setShowBulkAdd(!showBulkAdd);
              setShowAddForm(false);
            }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 truncate ${
              showBulkAdd
                ? 'bg-[#8B5CF6] text-white'
                : isDark
                ? 'bg-[#0F0F14] border border-white/10 text-white/70 hover:text-white'
                : 'bg-purple-50 border border-purple-200 text-slate-700 hover:text-slate-900'
            }`}
          >
            <ListPlus className="w-3.5 h-3.5 shrink-0" />
            <span>Impor Teks</span>
          </button>

          <button
            id="btn-reset-default"
            onClick={() => setShowResetConfirm(true)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center justify-center gap-1.5 truncate ${
              isDark
                ? 'bg-[#0F0F14] border-white/10 text-white/60 hover:text-white hover:border-[#8B5CF6]/40'
                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
            title="Kembalikan ke susunan hadiah standar"
          >
            <RotateCcw className="w-3.5 h-3.5 shrink-0" />
            <span>Reset</span>
          </button>

          <button
            id="btn-clear-all"
            onClick={() => setShowClearConfirm(true)}
            className={`px-2.5 py-1.5 rounded-lg border transition-colors flex items-center justify-center gap-1 text-xs truncate ${
              isDark
                ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border-rose-500/30'
                : 'bg-rose-50 text-rose-600 hover:bg-rose-100 border-rose-200'
            }`}
            title="Kosongkan daftar hadiah saat ini"
          >
            <Trash2 className="w-3.5 h-3.5 shrink-0" />
            <span>Kosongkan</span>
          </button>
        </div>
      </div>

      {/* Add Single Prize Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddPrize}
          className={`my-3 p-4 rounded-xl border flex flex-col gap-3 ${
            isDark ? 'bg-[#0F0F14] border-[#8B5CF6]/30' : 'bg-purple-50 border-purple-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#8B5CF6] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tambah Hadiah Baru ({selectedTab === 'pusat' ? 'Pusat' : 'Cabang'})</span>
            </span>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className={`text-xs ${isDark ? 'text-white/40 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}
            >
              Batal
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input
              id="input-new-prize-name"
              type="text"
              placeholder="Nama Hadiah (misal: iPhone 15 Pro / Voucher 200K)"
              value={newPrizeName}
              onChange={(e) => setNewPrizeName(e.target.value)}
              className={`sm:col-span-2 px-3.5 py-2 border rounded-lg text-xs focus:outline-none focus:border-[#8B5CF6] ${
                isDark
                  ? 'bg-[#16161F] border-white/10 text-white placeholder-white/30'
                  : 'bg-white border-purple-200 text-slate-900 placeholder-slate-400'
              }`}
              autoFocus
            />

            {/* Percentage Input */}
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-mono font-medium shrink-0 ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
                Peluang:
              </span>
              <div className="relative w-full">
                <input
                  type="number"
                  min="0.1"
                  max="100"
                  step="0.5"
                  value={newPrizePercentage}
                  onChange={(e) => setNewPrizePercentage(Number(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-[#8B5CF6] ${
                    isDark
                      ? 'bg-[#16161F] border-white/10 text-[#A78BFA]'
                      : 'bg-white border-purple-200 text-[#7C3AED]'
                  }`}
                />
                <span className={`absolute right-3 top-2 text-xs font-bold ${isDark ? 'text-white/40' : 'text-slate-400'}`}>%</span>
              </div>
            </div>

            {/* Icon Type Selection */}
            <select
              value={newPrizeIcon}
              onChange={(e) => setNewPrizeIcon(e.target.value as any)}
              className={`px-3 py-2 border rounded-lg text-xs focus:outline-none focus:border-[#8B5CF6] ${
                isDark ? 'bg-[#16161F] border-white/10 text-white' : 'bg-white border-purple-200 text-slate-800'
              }`}
            >
              <option value="gift">🎁 Hadiah Umum</option>
              <option value="phone">📱 Gadget / Handphone</option>
              <option value="cash">💵 Uang Tunai / Cash</option>
              <option value="wallet">👛 E-Wallet / ShopeePay</option>
              <option value="voucher">🏷️ Voucher / Diskon</option>
            </select>
          </div>

          {/* Color Picker Swatches */}
          <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
            <div className="flex items-center gap-2">
              <span className={`text-[11px] flex items-center gap-1 font-mono ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                <Palette className="w-3 h-3" /> Warna Slice:
              </span>
              <div className="flex items-center gap-1.5">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewPrizeColor(c)}
                    className={`w-5 h-5 rounded-full border transition-transform ${
                      newPrizeColor === c ? 'scale-125 border-white shadow-md' : 'border-transparent opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <button
              id="btn-submit-add-prize"
              type="submit"
              className="px-5 py-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Simpan Hadiah</span>
            </button>
          </div>
        </form>
      )}

      {/* Bulk Add Form */}
      {showBulkAdd && (
        <form
          onSubmit={handleBulkAdd}
          className={`my-3 p-4 rounded-xl border flex flex-col gap-3 ${
            isDark ? 'bg-[#0F0F14] border-[#8B5CF6]/30' : 'bg-purple-50 border-purple-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#8B5CF6] uppercase tracking-wider flex items-center gap-1.5">
              <ListPlus className="w-3.5 h-3.5" />
              <span>Tambah Banyak Hadiah Sekaligus (1 Baris = 1 Hadiah)</span>
            </span>
            <button
              type="button"
              onClick={() => setShowBulkAdd(false)}
              className={`text-xs ${isDark ? 'text-white/40 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}
            >
              Batal
            </button>
          </div>

          <textarea
            rows={4}
            placeholder="Contoh:&#10;iPhone 15 Pro&#10;Uang Tunai 500K&#10;Voucher Belanja 250K&#10;Shopeepay 150K"
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            className={`w-full px-3.5 py-2 border rounded-lg text-xs font-mono leading-relaxed focus:outline-none focus:border-[#8B5CF6] ${
              isDark
                ? 'bg-[#16161F] border-white/10 text-white placeholder-white/30'
                : 'bg-white border-purple-200 text-slate-900 placeholder-slate-400'
            }`}
          />

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Impor Semua Baris (Persentase Dibagi Rata)</span>
            </button>
          </div>
        </form>
      )}

      {/* Prize Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-3 max-h-[440px] overflow-y-auto pr-1">
        {currentList.map((prize, idx) => {
          const isEditing = editingPrizeId === prize.id;

          if (isEditing) {
            return (
              <div
                key={prize.id}
                className={`p-3.5 rounded-xl border shadow-md col-span-1 sm:col-span-2 lg:col-span-1 flex flex-col gap-2.5 ${
                  isDark ? 'bg-[#0F0F14] border-[#8B5CF6]' : 'bg-purple-50 border-purple-300'
                }`}
              >
                <div className="flex flex-col gap-1.5">
                  <label className={`text-[10px] font-bold uppercase ${isDark ? 'text-white/60' : 'text-slate-600'}`}>
                    Nama Hadiah:
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className={`px-2.5 py-1.5 border rounded-lg text-xs focus:outline-none focus:border-[#8B5CF6] ${
                      isDark ? 'bg-[#16161F] border-white/20 text-white' : 'bg-white border-purple-200 text-slate-900'
                    }`}
                    autoFocus
                  />
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <label className={`text-[10px] font-bold uppercase ${isDark ? 'text-white/60' : 'text-slate-600'}`}>
                      Peluang (%):
                    </label>
                    <input
                      type="number"
                      min="0.1"
                      max="100"
                      step="0.5"
                      value={editPercentage}
                      onChange={(e) => setEditPercentage(Number(e.target.value))}
                      className={`w-16 px-2 py-1 border rounded text-xs font-mono font-bold text-center ${
                        isDark ? 'bg-[#16161F] border-white/20 text-[#A78BFA]' : 'bg-white border-purple-200 text-[#7C3AED]'
                      }`}
                    />
                  </div>

                  <div className="flex items-center gap-1">
                    {COLOR_PALETTE.slice(0, 5).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setEditColor(c)}
                        className={`w-4 h-4 rounded-full border ${editColor === c ? 'scale-125 border-white' : 'border-transparent opacity-75'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-1.5 pt-1">
                  <button
                    onClick={() => handleSaveEdit(prize.id)}
                    className="px-3 py-1 rounded-lg bg-[#8B5CF6] text-white hover:bg-[#7C3AED] text-xs font-bold flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Simpan</span>
                  </button>
                  <button
                    onClick={() => setEditingPrizeId(null)}
                    className={`px-3 py-1 rounded-lg text-xs ${isDark ? 'bg-white/10 text-white/70 hover:text-white' : 'bg-slate-200 text-slate-700'}`}
                  >
                    Batal
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div
              key={prize.id}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all group ${
                isDark
                  ? 'bg-[#0F0F14] border-white/10 hover:border-[#8B5CF6]/50'
                  : 'bg-slate-50/70 border-slate-200/80 hover:border-purple-300 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <span
                  className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: prize.color || '#8B5CF6' }}
                />
                <div className={`p-1.5 rounded-lg border shrink-0 ${isDark ? 'bg-[#16161F] border-white/10' : 'bg-white border-purple-100'}`}>
                  {renderIcon(prize.iconType, prize.name)}
                </div>
                <div className="min-w-0 flex-1 pr-1">
                  <span className={`text-xs font-semibold truncate block ${isDark ? 'text-white' : 'text-slate-900'}`} title={prize.name}>
                    {prize.name}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] font-mono ${isDark ? 'text-white/40' : 'text-slate-400'}`}>#{idx + 1}</span>
                    <span className="text-[10px] font-mono font-bold text-[#8B5CF6] bg-purple-500/10 px-1.5 py-0.2 rounded">
                      {prize.percentage ?? 10}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Direct Percentage input on Card & Actions */}
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                <div className="flex items-center" title="Ubah persentase kemenangan langsung">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={prize.percentage ?? 10}
                    onChange={(e) => handleUpdatePercentageDirect(prize.id, Number(e.target.value))}
                    className={`w-12 px-1.5 py-0.5 border rounded text-xs font-mono font-bold text-center focus:outline-none focus:border-[#8B5CF6] ${
                      isDark
                        ? 'bg-[#16161F] border-white/15 text-[#A78BFA]'
                        : 'bg-white border-purple-200 text-[#7C3AED]'
                    }`}
                  />
                  <span className={`text-[10px] font-bold ml-1 ${isDark ? 'text-white/40' : 'text-slate-400'}`}>%</span>
                </div>

                <button
                  onClick={() => handleStartEdit(prize)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isDark
                      ? 'text-white/40 hover:text-[#8B5CF6] hover:bg-[#8B5CF6]/10'
                      : 'text-slate-400 hover:text-[#7C3AED] hover:bg-purple-100'
                  }`}
                  title="Ubah nama, warna, dan ikon"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  id={`btn-delete-prize-${idx}`}
                  onClick={() => handleDeletePrize(prize.id)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isDark
                      ? 'text-white/40 hover:text-rose-400 hover:bg-rose-500/10'
                      : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                  }`}
                  title="Hapus hadiah"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {currentList.length === 0 && (
        <div className={`text-center py-10 text-xs flex flex-col items-center gap-2 ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
          <ShieldAlert className="w-6 h-6 text-[#8B5CF6]/50" />
          <span>Daftar hadiah pada {selectedTab === 'pusat' ? 'Hadiah Pusat' : 'Hadiah Cabang'} masih kosong.</span>
          <button
            onClick={handleResetToDefault}
            className="mt-1 px-4 py-1.5 rounded-lg bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/30 hover:bg-[#8B5CF6]/30 transition-colors text-xs font-semibold"
          >
            Muat Ulang Hadiah Standar
          </button>
        </div>
      )}

      {/* Confirmation Modal: Clear Prizes */}
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
                <h4 className="text-sm font-bold">Kosongkan Semua Hadiah?</h4>
                <p className={`text-xs ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
                  Semua hadiah di kategori {selectedTab === 'pusat' ? 'Hadiah Pusat' : 'Hadiah Cabang'} akan dihapus.
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
                onClick={handleClearCurrent}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/30 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Kosongkan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Reset Default */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className={`w-full max-w-sm rounded-2xl border p-5 sm:p-6 shadow-2xl relative ${
              isDark ? 'bg-[#16161F] border-[#8B5CF6]/40 text-white' : 'bg-white border-purple-200 text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-[#8B5CF6] border border-purple-500/20">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold">Reset ke Hadiah Standar?</h4>
                <p className={`text-xs ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
                  Daftar hadiah {selectedTab === 'pusat' ? 'Hadiah Pusat' : 'Hadiah Cabang'} akan dikembalikan ke susunan bawaan.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold ${
                  isDark ? 'bg-white/10 hover:bg-white/15 text-white/80' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleResetToDefault}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#8B5CF6] hover:bg-[#7C3AED] text-white shadow-md shadow-[#8B5CF6]/30 flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Ya, Reset</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
