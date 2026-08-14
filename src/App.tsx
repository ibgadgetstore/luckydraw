import React, { useState, useEffect, useRef } from 'react';
import { CategoryType, GameMode, Prize, WinnerRecord, ThemeMode, HeaderConfig } from './types';
import { INITIAL_HADIAH_PUSAT, INITIAL_HADIAH_CABANG, INITIAL_HEADER_CONFIG } from './data/initialPrizes';
import { SpinWheel } from './components/SpinWheel';
import { MysteryBoxes } from './components/MysteryBoxes';
import { SlotMachine } from './components/SlotMachine';
import { WinnerModal } from './components/WinnerModal';
import { PrizeManager } from './components/PrizeManager';
import { WinnerHistory } from './components/WinnerHistory';
import { IBLogo } from './components/IBLogo';
import { sounds } from './utils/audio';
import {
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Trophy,
  Gift,
  Disc,
  Boxes,
  Dices,
  Settings2,
  History,
  Building2,
  Store,
  UserCheck,
  Moon,
  Sun,
  Edit3,
  Check,
  X,
  Sparkles,
} from 'lucide-react';

export default function App() {
  // Theme Mode ('dark' or 'light') - Default to light mode
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('ibgadget_theme');
    return (saved as ThemeMode) || 'light';
  });

  // Header / Navbar Text Configuration (Editable & Persisted)
  const [headerConfig, setHeaderConfig] = useState<HeaderConfig>(() => {
    const saved = localStorage.getItem('ibgadget_header_config');
    return saved ? JSON.parse(saved) : INITIAL_HEADER_CONFIG;
  });
  const [showHeaderEditModal, setShowHeaderEditModal] = useState(false);
  const [tempHeaderConfig, setTempHeaderConfig] = useState<HeaderConfig>(headerConfig);

  // Category Selection ('pusat' or 'cabang')
  const [category, setCategory] = useState<CategoryType>('pusat');

  // Game Mode Selection
  const [gameMode, setGameMode] = useState<GameMode>('wheel');

  // Active View Tab: 'game' | 'prizes' | 'history'
  const [activeTab, setActiveTab] = useState<'game' | 'prizes' | 'history'>('game');

  // Participant / Candidate Name
  const [participantName, setParticipantName] = useState<string>('');

  // Sound Mute Toggle
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Dedicated Game-Only Fullscreen State
  const [isGameFullscreen, setIsGameFullscreen] = useState<boolean>(false);

  // Remove prize on win toggle
  const [removeOnWin, setRemoveOnWin] = useState<boolean>(() => {
    const saved = localStorage.getItem('ibgadget_remove_on_win');
    return saved === 'true';
  });

  // Spinning / Rolling state
  const [isSpinning, setIsSpinning] = useState<boolean>(false);

  // Active Winner for celebratory modal
  const [currentWinner, setCurrentWinner] = useState<WinnerRecord | null>(null);
  const [currentWinningPrize, setCurrentWinningPrize] = useState<Prize | null>(null);

  // Prize Pools (Persisted in localStorage & Real-time synchronized)
  const [pusatPrizes, setPusatPrizes] = useState<Prize[]>(() => {
    const saved = localStorage.getItem('undian_prizes_pusat');
    return saved ? JSON.parse(saved) : INITIAL_HADIAH_PUSAT;
  });

  const [cabangPrizes, setCabangPrizes] = useState<Prize[]>(() => {
    const saved = localStorage.getItem('undian_prizes_cabang');
    return saved ? JSON.parse(saved) : INITIAL_HADIAH_CABANG;
  });

  // Winner History (Persisted in localStorage & Real-time synchronized)
  const [winnerHistory, setWinnerHistory] = useState<WinnerRecord[]>(() => {
    const saved = localStorage.getItem('undian_winner_history');
    return saved ? JSON.parse(saved) : [];
  });

  const clientIdRef = useRef<string>(Math.random().toString(36).substring(2, 12));
  const isIncomingSyncRef = useRef<boolean>(false);

  // Initial fetch from server state + Server-Sent Events (SSE) for real-time live synchronization between 2+ users
  useEffect(() => {
    // 1. Initial State Sync from server
    fetch('/api/sync/state')
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((data) => {
        if (data && typeof data === 'object') {
          isIncomingSyncRef.current = true;
          if (Array.isArray(data.pusatPrizes) && data.pusatPrizes.length > 0) {
            setPusatPrizes(data.pusatPrizes);
            localStorage.setItem('undian_prizes_pusat', JSON.stringify(data.pusatPrizes));
          }
          if (Array.isArray(data.cabangPrizes) && data.cabangPrizes.length > 0) {
            setCabangPrizes(data.cabangPrizes);
            localStorage.setItem('undian_prizes_cabang', JSON.stringify(data.cabangPrizes));
          }
          if (Array.isArray(data.winnerHistory)) {
            setWinnerHistory(data.winnerHistory);
            localStorage.setItem('undian_winner_history', JSON.stringify(data.winnerHistory));
          }
          if (data.headerConfig) {
            setHeaderConfig(data.headerConfig);
            localStorage.setItem('ibgadget_header_config', JSON.stringify(data.headerConfig));
          }
          if (data.theme) {
            setTheme(data.theme);
            localStorage.setItem('ibgadget_theme', data.theme);
          }
          if (typeof data.removeOnWin === 'boolean') {
            setRemoveOnWin(data.removeOnWin);
            localStorage.setItem('ibgadget_remove_on_win', String(data.removeOnWin));
          }
          setTimeout(() => {
            isIncomingSyncRef.current = false;
          }, 300);
        }
      })
      .catch((err) => {
        console.warn('Initial server state fetch skipped or unavailable:', err);
      });

    // 2. Connect to Server-Sent Events (SSE) for real-time push updates across different devices / users
    let eventSource: EventSource | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

    const setupSSE = () => {
      try {
        eventSource = new EventSource('/api/sync/events');

        eventSource.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            if (payload && payload.state) {
              if (payload.senderClientId === clientIdRef.current) {
                // Ignore self-originating updates
                return;
              }
              isIncomingSyncRef.current = true;
              const s = payload.state;
              if (Array.isArray(s.pusatPrizes)) {
                setPusatPrizes(s.pusatPrizes);
                localStorage.setItem('undian_prizes_pusat', JSON.stringify(s.pusatPrizes));
              }
              if (Array.isArray(s.cabangPrizes)) {
                setCabangPrizes(s.cabangPrizes);
                localStorage.setItem('undian_prizes_cabang', JSON.stringify(s.cabangPrizes));
              }
              if (Array.isArray(s.winnerHistory)) {
                setWinnerHistory(s.winnerHistory);
                localStorage.setItem('undian_winner_history', JSON.stringify(s.winnerHistory));
              }
              if (s.headerConfig) {
                setHeaderConfig(s.headerConfig);
                localStorage.setItem('ibgadget_header_config', JSON.stringify(s.headerConfig));
              }
              if (s.theme) {
                setTheme(s.theme);
                localStorage.setItem('ibgadget_theme', s.theme);
              }
              if (typeof s.removeOnWin === 'boolean') {
                setRemoveOnWin(s.removeOnWin);
                localStorage.setItem('ibgadget_remove_on_win', String(s.removeOnWin));
              }
              setTimeout(() => {
                isIncomingSyncRef.current = false;
              }, 300);
            }
          } catch (e) {
            console.error('Failed to parse SSE payload:', e);
          }
        };

        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          // Auto reconnect after 3 seconds
          if (!reconnectTimeout) {
            reconnectTimeout = setTimeout(() => {
              reconnectTimeout = null;
              setupSSE();
            }, 3000);
          }
        };
      } catch (err) {
        console.warn('SSE connection error:', err);
      }
    };

    setupSSE();

    // 3. Broadcast channel for instantaneous same-browser multi-tab synchronization
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        channel = new BroadcastChannel('ibgadget_realtime_sync');
        channel.onmessage = (event) => {
          const { type, data } = event.data || {};
          isIncomingSyncRef.current = true;
          if (type === 'SYNC_PUSAT_PRIZES') {
            setPusatPrizes(data);
          } else if (type === 'SYNC_CABANG_PRIZES') {
            setCabangPrizes(data);
          } else if (type === 'SYNC_WINNER_HISTORY') {
            setWinnerHistory(data);
          } else if (type === 'SYNC_HEADER_CONFIG') {
            setHeaderConfig(data);
          } else if (type === 'SYNC_THEME') {
            setTheme(data);
          } else if (type === 'SYNC_REMOVE_ON_WIN') {
            setRemoveOnWin(data);
          }
          setTimeout(() => {
            isIncomingSyncRef.current = false;
          }, 300);
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel error:', e);
    }

    const handleStorage = (e: StorageEvent) => {
      if (!e.key || !e.newValue) return;
      try {
        isIncomingSyncRef.current = true;
        if (e.key === 'undian_prizes_pusat') {
          setPusatPrizes(JSON.parse(e.newValue));
        } else if (e.key === 'undian_prizes_cabang') {
          setCabangPrizes(JSON.parse(e.newValue));
        } else if (e.key === 'undian_winner_history') {
          setWinnerHistory(JSON.parse(e.newValue));
        } else if (e.key === 'ibgadget_header_config') {
          setHeaderConfig(JSON.parse(e.newValue));
        } else if (e.key === 'ibgadget_theme') {
          setTheme(e.newValue as ThemeMode);
        } else if (e.key === 'ibgadget_remove_on_win') {
          setRemoveOnWin(e.newValue === 'true');
        }
        setTimeout(() => {
          isIncomingSyncRef.current = false;
        }, 300);
      } catch (err) {
        console.error('Failed to parse storage sync:', err);
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      if (channel) channel.close();
      if (eventSource) eventSource.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  const broadcastChange = (type: string, data: any, updatesObj?: Record<string, any>) => {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const channel = new BroadcastChannel('ibgadget_realtime_sync');
        channel.postMessage({ type, data });
        channel.close();
      }
    } catch {
      // Ignore
    }

    // Push update to server for instant cross-device broadcast
    if (updatesObj && !isIncomingSyncRef.current) {
      try {
        fetch('/api/sync/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            updates: updatesObj,
            clientId: clientIdRef.current,
          }),
        }).catch(() => {});
      } catch {
        // Ignore network errors
      }
    }
  };

  // Save theme
  useEffect(() => {
    localStorage.setItem('ibgadget_theme', theme);
    broadcastChange('SYNC_THEME', theme, { theme });
  }, [theme]);

  // Save header config
  useEffect(() => {
    localStorage.setItem('ibgadget_header_config', JSON.stringify(headerConfig));
    broadcastChange('SYNC_HEADER_CONFIG', headerConfig, { headerConfig });
  }, [headerConfig]);

  // Save remove on win
  useEffect(() => {
    localStorage.setItem('ibgadget_remove_on_win', String(removeOnWin));
    broadcastChange('SYNC_REMOVE_ON_WIN', removeOnWin, { removeOnWin });
  }, [removeOnWin]);

  // Save prize pools
  useEffect(() => {
    localStorage.setItem('undian_prizes_pusat', JSON.stringify(pusatPrizes));
    broadcastChange('SYNC_PUSAT_PRIZES', pusatPrizes, { pusatPrizes });
  }, [pusatPrizes]);

  useEffect(() => {
    localStorage.setItem('undian_prizes_cabang', JSON.stringify(cabangPrizes));
    broadcastChange('SYNC_CABANG_PRIZES', cabangPrizes, { cabangPrizes });
  }, [cabangPrizes]);

  // Save winner history
  useEffect(() => {
    localStorage.setItem('undian_winner_history', JSON.stringify(winnerHistory));
    broadcastChange('SYNC_WINNER_HISTORY', winnerHistory, { winnerHistory });
  }, [winnerHistory]);

  const toggleTheme = () => {
    const nextTheme: ThemeMode = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    sounds.playClick();
  };

  const toggleSound = () => {
    const newVal = !soundEnabled;
    setSoundEnabled(newVal);
    sounds.soundEnabled = newVal;
    if (newVal) sounds.playClick();
  };

  // Keyboard shortcut listener (ESC to exit fullscreen) and body scroll lock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isGameFullscreen) {
        setIsGameFullscreen(false);
      }
    };

    if (isGameFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isGameFullscreen]);

  const currentPrizes = category === 'pusat' ? pusatPrizes : cabangPrizes;
  const setCurrentPrizes = category === 'pusat' ? setPusatPrizes : setCabangPrizes;

  // Handle winning event
  const handleWinner = (prize: Prize) => {
    const record: WinnerRecord = {
      id: 'win-' + Date.now(),
      timestamp: Date.now(),
      winnerName: participantName.trim() || 'Peserta Beruntung',
      prizeName: prize.name,
      category: category,
      gameMode: gameMode,
    };

    setWinnerHistory((prev) => [record, ...prev]);
    setCurrentWinner(record);
    setCurrentWinningPrize(prize);

    // If removeOnWin is active, remove from current category pool
    if (removeOnWin) {
      setCurrentPrizes((prev) => prev.filter((p) => p.id !== prize.id));
    }
  };

  const handleSpinAgain = () => {
    setCurrentWinner(null);
    setCurrentWinningPrize(null);
  };

  const handleClearHistory = () => {
    setWinnerHistory([]);
    localStorage.removeItem('undian_winner_history');
  };

  const handleDeleteSingleWinner = (id: string) => {
    setWinnerHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSaveHeaderConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setHeaderConfig(tempHeaderConfig);
    setShowHeaderEditModal(false);
  };

  const isDark = theme === 'dark';

  return (
    <div
      className={`min-h-screen flex flex-col relative transition-colors duration-200 ${
        isDark
          ? 'bg-[#0F0F14] text-[#E5E5E5] selection:bg-[#A78BFA] selection:text-[#0F0F14]'
          : 'bg-[#F8F9FD] text-slate-800 selection:bg-[#8B5CF6] selection:text-white'
      }`}
    >
      {/* Radial ambient soft purple backdrop */}
      <div
        className={`fixed inset-0 pointer-events-none transition-opacity duration-300 ${
          isDark
            ? 'bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(167,139,250,0.14),rgba(255,255,255,0))] opacity-100'
            : 'bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(139,92,246,0.08),rgba(255,255,255,0))] opacity-80'
        }`}
      />

      {/* Top Navbar / Header Bar */}
      <header
        className={`border-b sticky top-0 z-30 px-3 sm:px-6 py-2.5 sm:py-3 transition-colors backdrop-blur ${
          isDark
            ? 'border-white/10 bg-[#16161F]/85 text-white'
            : 'border-purple-100 bg-white/85 text-slate-900 shadow-sm'
        }`}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center shrink-0">
              <IBLogo size={34} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-base sm:text-xl font-serif font-bold tracking-wider truncate">
                  {headerConfig.title}
                </h1>
                <span
                  className={`hidden md:inline-block px-2 py-0.5 rounded text-[10px] font-mono font-semibold tracking-wider uppercase border shrink-0 ${
                    isDark
                      ? 'bg-purple-500/10 text-[#A78BFA] border-purple-500/30'
                      : 'bg-purple-50 text-[#7C3AED] border-purple-200'
                  }`}
                >
                  {headerConfig.badge}
                </span>

                {/* Quick Edit Header Button */}
                <button
                  onClick={() => {
                    setTempHeaderConfig(headerConfig);
                    setShowHeaderEditModal(true);
                  }}
                  className={`p-1 rounded opacity-50 hover:opacity-100 transition-opacity shrink-0 ${
                    isDark ? 'text-white/60 hover:text-white' : 'text-slate-400 hover:text-slate-700'
                  }`}
                  title="Atur / Ganti Teks Header & Navbar"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p
                className={`text-[10px] sm:text-[11px] font-medium hidden sm:block tracking-wide truncate ${
                  isDark ? 'text-white/50' : 'text-slate-500'
                }`}
              >
                {headerConfig.subtitle}
              </p>
            </div>
          </div>

          {/* Quick Utility Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* System Status Pill */}
            <div
              className={`hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono ${
                isDark
                  ? 'bg-[#1F1F2C] border-white/10 text-white/70'
                  : 'bg-purple-50/80 border-purple-100 text-slate-600'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10B981] animate-pulse" />
              <span className="text-[11px] uppercase tracking-wider font-semibold">
                {headerConfig.systemStatusText}
              </span>
            </div>

            {/* Dark / Light Mode Toggle */}
            <button
              id="btn-toggle-theme"
              onClick={toggleTheme}
              className={`p-2 sm:p-2.5 rounded-xl border transition-all flex items-center justify-center ${
                isDark
                  ? 'bg-[#1F1F2C] border-white/10 text-amber-300 hover:bg-[#28273A]'
                  : 'bg-purple-50 border-purple-200 text-[#7C3AED] hover:bg-purple-100'
              }`}
              title={isDark ? 'Ganti ke Mode Terang (Light Mode)' : 'Ganti ke Mode Gelap (Dark Mode)'}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Sound Mute/Unmute */}
            <button
              id="btn-toggle-sound"
              onClick={toggleSound}
              className={`p-2 sm:p-2.5 rounded-xl border transition-all ${
                soundEnabled
                  ? isDark
                    ? 'bg-[#1F1F2C] border-[#A78BFA]/40 text-[#A78BFA] hover:bg-[#28273A]'
                    : 'bg-purple-50 border-purple-200 text-[#7C3AED] hover:bg-purple-100'
                  : isDark
                  ? 'bg-[#16161F] border-white/10 text-white/40'
                  : 'bg-gray-100 border-gray-200 text-gray-400'
              }`}
              title={soundEnabled ? 'Matikan Suara' : 'Nyalakan Suara'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Fullscreen Game Launcher */}
            <button
              id="btn-launch-fullscreen-header"
              onClick={() => {
                setActiveTab('game');
                setIsGameFullscreen(true);
                sounds.playClick();
              }}
              className={`p-2 sm:p-2.5 sm:px-3 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-semibold ${
                isDark
                  ? 'bg-[#1F1F2C] border-white/10 text-white/80 hover:text-white hover:border-[#A78BFA]/40'
                  : 'bg-purple-50 border-purple-200 text-[#6D28D9] hover:bg-purple-100'
              }`}
              title="Tampilkan Permainan Layar Penuh (Fullscreen)"
            >
              <Maximize2 className="w-4 h-4 text-[#8B5CF6]" />
              <span className="hidden md:inline">Layar Penuh</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-3 sm:p-6 flex flex-col gap-4 sm:gap-6 relative z-10 overflow-x-hidden">
        {/* Navigation Tabs & Category Selector */}
        <div
          className={`flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 sm:gap-3 p-1.5 sm:p-2 rounded-2xl border shadow-lg transition-colors ${
            isDark ? 'bg-[#16161F]/90 border-white/10' : 'bg-white border-purple-100 shadow-purple-500/5'
          }`}
        >
          {/* Main View Tabs */}
          <div className="grid grid-cols-3 sm:flex sm:flex-wrap items-center gap-1 w-full md:w-auto">
            <button
              id="tab-view-game"
              onClick={() => setActiveTab('game')}
              className={`px-2 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs md:text-sm font-semibold tracking-wide flex items-center justify-center gap-1.5 transition-all duration-200 truncate ${
                activeTab === 'game'
                  ? 'bg-[#8B5CF6] text-white font-bold shadow-md shadow-[#8B5CF6]/25'
                  : isDark
                  ? 'text-white/70 hover:text-white hover:bg-white/5'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-purple-50'
              }`}
            >
              <Gift className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>Main</span>
            </button>

            <button
              id="tab-view-prizes"
              onClick={() => setActiveTab('prizes')}
              className={`px-2 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs md:text-sm font-semibold tracking-wide flex items-center justify-center gap-1.5 transition-all duration-200 truncate ${
                activeTab === 'prizes'
                  ? 'bg-[#8B5CF6] text-white font-bold shadow-md shadow-[#8B5CF6]/25'
                  : isDark
                  ? 'text-white/70 hover:text-white hover:bg-white/5'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-purple-50'
              }`}
            >
              <Settings2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>Hadiah ({pusatPrizes.length + cabangPrizes.length})</span>
            </button>

            <button
              id="tab-view-history"
              onClick={() => setActiveTab('history')}
              className={`px-2 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs md:text-sm font-semibold tracking-wide flex items-center justify-center gap-1.5 transition-all duration-200 truncate ${
                activeTab === 'history'
                  ? 'bg-[#8B5CF6] text-white font-bold shadow-md shadow-[#8B5CF6]/25'
                  : isDark
                  ? 'text-white/70 hover:text-white hover:bg-white/5'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-purple-50'
              }`}
            >
              <History className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>Riwayat ({winnerHistory.length})</span>
            </button>
          </div>

          {/* Category Switcher Pill (Hadiah Pusat vs Hadiah Cabang) */}
          <div
            className={`grid grid-cols-2 sm:flex items-center gap-1 p-1 rounded-xl border w-full md:w-auto ${
              isDark ? 'bg-[#0F0F14] border-white/10' : 'bg-purple-50/70 border-purple-100'
            }`}
          >
            <button
              id="btn-select-pusat"
              onClick={() => {
                setCategory('pusat');
                sounds.playClick();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide flex items-center justify-center gap-1.5 transition-all truncate ${
                category === 'pusat'
                  ? 'bg-[#8B5CF6] text-white font-bold shadow-sm'
                  : isDark
                  ? 'text-white/60 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 shrink-0" />
              <span>Pusat ({pusatPrizes.length})</span>
            </button>

            <button
              id="btn-select-cabang"
              onClick={() => {
                setCategory('cabang');
                sounds.playClick();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide flex items-center justify-center gap-1.5 transition-all truncate ${
                category === 'cabang'
                  ? 'bg-[#8B5CF6] text-white font-bold shadow-sm'
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

        {/* Tab View 1: Main Game Canvas */}
        {activeTab === 'game' && (
          <div className="flex flex-col gap-6">
            {/* Top Control Bar: Candidate Name & Game Mode Selector */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Participant Input */}
              <div
                className={`rounded-2xl border p-4 flex flex-col justify-center shadow-lg transition-colors ${
                  isDark ? 'bg-[#16161F] border-white/10' : 'bg-white border-purple-100 shadow-purple-500/5'
                }`}
              >
                <label className="text-[11px] font-bold text-[#8B5CF6] uppercase tracking-[0.15em] mb-2 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-[#8B5CF6]" />
                  <span>Nama Peserta / No. Undian</span>
                </label>
                <div className="relative">
                  <input
                    id="input-participant-name"
                    type="text"
                    placeholder="Masukkan nama peserta, misal: Budi / Tim Penjualan"
                    value={participantName}
                    onChange={(e) => setParticipantName(e.target.value)}
                    disabled={isSpinning}
                    className={`w-full px-4 py-2.5 border rounded-xl text-sm transition-colors focus:outline-none focus:border-[#8B5CF6] ${
                      isDark
                        ? 'bg-[#0F0F14] border-white/10 text-white placeholder-white/30'
                        : 'bg-purple-50/50 border-purple-200 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                  {participantName && (
                    <button
                      onClick={() => setParticipantName('')}
                      className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-xs px-2 py-0.5 rounded transition-colors ${
                        isDark ? 'text-white/40 hover:text-white bg-white/5' : 'text-slate-400 hover:text-slate-700 bg-slate-100'
                      }`}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Game Mode Selector (Roda Putar vs Kotak Misteri vs Slot Acak) */}
              <div
                className={`rounded-2xl border p-4 flex flex-col justify-center shadow-lg transition-colors ${
                  isDark ? 'bg-[#16161F] border-white/10' : 'bg-white border-purple-100 shadow-purple-500/5'
                }`}
              >
                <span className="text-[11px] font-bold text-[#8B5CF6] uppercase tracking-[0.15em] mb-2">
                  Pilih Mode Permainan
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    id="mode-wheel"
                    onClick={() => {
                      setGameMode('wheel');
                      sounds.playClick();
                    }}
                    disabled={isSpinning}
                    className={`py-2.5 px-2 rounded-xl text-xs font-semibold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all ${
                      gameMode === 'wheel'
                        ? 'bg-[#8B5CF6] text-white font-bold shadow-md shadow-[#8B5CF6]/25'
                        : isDark
                        ? 'bg-[#0F0F14] text-white/70 hover:text-white border border-white/5'
                        : 'bg-purple-50/70 text-slate-600 hover:text-slate-900 border border-purple-100'
                    }`}
                  >
                    <Disc className="w-4 h-4" />
                    <span>Roda Putar</span>
                  </button>

                  <button
                    id="mode-mystery"
                    onClick={() => {
                      setGameMode('mystery');
                      sounds.playClick();
                    }}
                    disabled={isSpinning}
                    className={`py-2.5 px-2 rounded-xl text-xs font-semibold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all ${
                      gameMode === 'mystery'
                        ? 'bg-[#8B5CF6] text-white font-bold shadow-md shadow-[#8B5CF6]/25'
                        : isDark
                        ? 'bg-[#0F0F14] text-white/70 hover:text-white border border-white/5'
                        : 'bg-purple-50/70 text-slate-600 hover:text-slate-900 border border-purple-100'
                    }`}
                  >
                    <Boxes className="w-4 h-4" />
                    <span>Kotak Misteri</span>
                  </button>

                  <button
                    id="mode-slot"
                    onClick={() => {
                      setGameMode('slot');
                      sounds.playClick();
                    }}
                    disabled={isSpinning}
                    className={`py-2.5 px-2 rounded-xl text-xs font-semibold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all ${
                      gameMode === 'slot'
                        ? 'bg-[#8B5CF6] text-white font-bold shadow-md shadow-[#8B5CF6]/25'
                        : isDark
                        ? 'bg-[#0F0F14] text-white/70 hover:text-white border border-white/5'
                        : 'bg-purple-50/70 text-slate-600 hover:text-slate-900 border border-purple-100'
                    }`}
                  >
                    <Dices className="w-4 h-4" />
                    <span>Roll Cepat</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Game Canvas Card with Fullscreen Toggle in Top Corner */}
            <div
              className={`rounded-2xl sm:rounded-3xl border p-3 sm:p-6 md:p-8 relative min-h-[420px] sm:min-h-[500px] flex items-center justify-center overflow-hidden transition-colors ${
                isDark
                  ? 'bg-[#16161F] border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)]'
                  : 'bg-white border-purple-100 shadow-xl'
              }`}
            >
              {/* Category Badge & Live Pulse */}
              <div className="absolute top-2.5 sm:top-4 left-2.5 sm:left-4 z-10">
                <span
                  className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider border shadow-sm flex items-center gap-1.5 sm:gap-2 ${
                    isDark
                      ? 'bg-[#0F0F14]/90 border-purple-500/40 text-[#A78BFA]'
                      : 'bg-purple-50 border-purple-200 text-[#6D28D9]'
                  }`}
                >
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10B981]" />
                  <span>
                    {category === 'pusat' ? `Pusat (${pusatPrizes.length})` : `Cabang (${cabangPrizes.length})`}
                  </span>
                </span>
              </div>

              {/* Dedicated Card Fullscreen Trigger Button */}
              <div className="absolute top-2.5 sm:top-4 right-2.5 sm:right-4 z-10">
                <button
                  id="btn-card-fullscreen"
                  onClick={() => {
                    setIsGameFullscreen(true);
                    sounds.playClick();
                  }}
                  className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full border transition-all flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-semibold shadow-md ${
                    isDark
                      ? 'bg-[#0F0F14]/90 hover:bg-[#8B5CF6] text-white/70 hover:text-white border-white/10 hover:border-[#8B5CF6]'
                      : 'bg-purple-50 hover:bg-[#8B5CF6] text-slate-700 hover:text-white border-purple-200 hover:border-[#8B5CF6]'
                  }`}
                  title="Fokuskan Permainan Layar Penuh"
                >
                  <Maximize2 className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-[#8B5CF6]" />
                  <span className="hidden xs:inline">Layar Penuh</span>
                </button>
              </div>

              {/* Active Mode Render */}
              <div className="w-full flex items-center justify-center pt-8 sm:pt-4">
                {gameMode === 'wheel' && (
                  <SpinWheel
                    prizes={currentPrizes}
                    onWinner={handleWinner}
                    isSpinning={isSpinning}
                    setIsSpinning={setIsSpinning}
                    theme={theme}
                  />
                )}

                {gameMode === 'mystery' && (
                  <MysteryBoxes
                    prizes={currentPrizes}
                    onWinner={handleWinner}
                    isSpinning={isSpinning}
                    setIsSpinning={setIsSpinning}
                    theme={theme}
                  />
                )}

                {gameMode === 'slot' && (
                  <SlotMachine
                    prizes={currentPrizes}
                    onWinner={handleWinner}
                    isSpinning={isSpinning}
                    setIsSpinning={setIsSpinning}
                    theme={theme}
                  />
                )}
              </div>
            </div>

            {/* Recent Winners Preview Strip */}
            {winnerHistory.length > 0 && (
              <div
                className={`rounded-2xl border p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors ${
                  isDark ? 'bg-[#16161F]/80 border-white/10' : 'bg-white border-purple-100 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-2.5 text-xs">
                  <Trophy className="w-4 h-4 text-[#8B5CF6] shrink-0" />
                  <span className="font-mono text-[#8B5CF6] uppercase tracking-wider font-bold">Pemenang Terakhir:</span>
                  <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{winnerHistory[0].prizeName}</span>
                  {winnerHistory[0].winnerName && (
                    <span className={isDark ? 'text-[#A78BFA]' : 'text-purple-600 font-medium'}>
                      ({winnerHistory[0].winnerName})
                    </span>
                  )}
                </div>

                <button
                  onClick={() => setActiveTab('history')}
                  className="text-xs font-semibold text-[#8B5CF6] hover:text-[#7C3AED] transition-colors"
                >
                  Lihat Semua Riwayat ({winnerHistory.length}) &rarr;
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab View 2: Prize Manager */}
        {activeTab === 'prizes' && (
          <PrizeManager
            pusatPrizes={pusatPrizes}
            setPusatPrizes={setPusatPrizes}
            cabangPrizes={cabangPrizes}
            setCabangPrizes={setCabangPrizes}
            activeCategory={category}
            setActiveCategory={setCategory}
            removeOnWin={removeOnWin}
            setRemoveOnWin={setRemoveOnWin}
            theme={theme}
          />
        )}

        {/* Tab View 3: Winner History */}
        {activeTab === 'history' && (
          <WinnerHistory
            history={winnerHistory}
            onClearHistory={handleClearHistory}
            onDeleteRecord={handleDeleteSingleWinner}
            theme={theme}
          />
        )}
      </main>

      {/* Dedicated Immersive Fullscreen Game Card Overlay */}
      {isGameFullscreen && (
        <div
          className={`fixed inset-0 z-50 flex flex-col justify-between p-3 sm:p-5 md:p-6 backdrop-blur-2xl w-screen h-screen overflow-hidden ${
            isDark ? 'bg-[#0F0F14] text-white' : 'bg-[#F8F9FD] text-slate-900'
          }`}
        >
          {/* Ambient glow in fullscreen */}
          <div
            className={`fixed inset-0 pointer-events-none ${
              isDark
                ? 'bg-[radial-gradient(ellipse_90%_70%_at_50%_10%,rgba(167,139,250,0.16),transparent_80%)]'
                : 'bg-[radial-gradient(ellipse_90%_70%_at_50%_10%,rgba(139,92,246,0.09),transparent_80%)]'
            }`}
          />

          {/* Fullscreen Top Header */}
          <div
            className={`relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 p-2.5 sm:p-4 rounded-2xl border shadow-xl backdrop-blur shrink-0 ${
              isDark ? 'bg-[#16161F]/90 border-white/10' : 'bg-white/90 border-purple-100'
            }`}
          >
            {/* Top row in mobile: Brand Logo & Exit Button */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <IBLogo size={32} />
                <div className="min-w-0">
                  <h2 className="text-sm sm:text-base md:text-lg font-serif font-bold tracking-wider truncate">
                    {headerConfig.title}
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] sm:text-[11px] font-mono text-[#8B5CF6] font-semibold truncate">
                      {category === 'pusat' ? `HADIAH PUSAT (${pusatPrizes.length})` : `HADIAH CABANG (${cabangPrizes.length})`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Exit Fullscreen Button in top right */}
              <button
                id="btn-exit-fullscreen"
                onClick={() => {
                  setIsGameFullscreen(false);
                  sounds.playClick();
                }}
                className="px-3 py-1.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shrink-0 sm:hidden"
                title="Keluar Layar Penuh (ESC)"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Tutup</span>
              </button>
            </div>

            {/* Middle row in mobile: Game Mode Switcher */}
            <div
              className={`flex items-center justify-center gap-1 p-1 rounded-xl border ${
                isDark ? 'bg-[#0F0F14] border-white/10' : 'bg-purple-50 border-purple-100'
              }`}
            >
              <button
                onClick={() => {
                  setGameMode('wheel');
                  sounds.playClick();
                }}
                disabled={isSpinning}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  gameMode === 'wheel'
                    ? 'bg-[#8B5CF6] text-white font-bold shadow-sm'
                    : isDark
                    ? 'text-white/60 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Disc className="w-3.5 h-3.5" />
                <span>Roda</span>
              </button>

              <button
                onClick={() => {
                  setGameMode('mystery');
                  sounds.playClick();
                }}
                disabled={isSpinning}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  gameMode === 'mystery'
                    ? 'bg-[#8B5CF6] text-white font-bold shadow-sm'
                    : isDark
                    ? 'text-white/60 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Boxes className="w-3.5 h-3.5" />
                <span>Kotak</span>
              </button>

              <button
                onClick={() => {
                  setGameMode('slot');
                  sounds.playClick();
                }}
                disabled={isSpinning}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  gameMode === 'slot'
                    ? 'bg-[#8B5CF6] text-white font-bold shadow-sm'
                    : isDark
                    ? 'text-white/60 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Dices className="w-3.5 h-3.5" />
                <span>Roll</span>
              </button>
            </div>

            {/* Bottom row in mobile: Input & Utility buttons (Desktop layout intact) */}
            <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <input
                type="text"
                placeholder="Nama Peserta..."
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                disabled={isSpinning}
                className={`px-3 py-1.5 border rounded-xl text-xs flex-1 sm:w-44 focus:outline-none focus:border-[#8B5CF6] ${
                  isDark ? 'bg-[#0F0F14] border-white/10 text-white placeholder-white/40' : 'bg-white border-purple-200 text-slate-900'
                }`}
              />

              {/* Theme toggle in fullscreen */}
              <button
                onClick={toggleTheme}
                className={`p-1.5 sm:p-2 rounded-xl border shrink-0 ${
                  isDark ? 'bg-[#0F0F14] border-white/10 text-amber-300' : 'bg-purple-50 border-purple-200 text-[#7C3AED]'
                }`}
                title="Ganti Tema"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Sound toggle in fullscreen */}
              <button
                onClick={toggleSound}
                className={`p-1.5 sm:p-2 rounded-xl border shrink-0 ${
                  isDark ? 'bg-[#0F0F14] border-white/10 text-white/70 hover:text-[#8B5CF6]' : 'bg-purple-50 border-purple-200 text-slate-700'
                }`}
                title={soundEnabled ? 'Matikan Suara' : 'Nyalakan Suara'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-[#8B5CF6]" /> : <VolumeX className="w-4 h-4" />}
              </button>

              {/* Exit Fullscreen Button on Tablet / Desktop */}
              <button
                id="btn-exit-fullscreen-desktop"
                onClick={() => {
                  setIsGameFullscreen(false);
                  sounds.playClick();
                }}
                className="hidden sm:flex px-3.5 py-2 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-xs items-center gap-1.5 transition-all shadow-md shrink-0"
                title="Keluar Layar Penuh (ESC)"
              >
                <Minimize2 className="w-4 h-4" />
                <span>Tutup Layar Penuh (ESC)</span>
              </button>
            </div>
          </div>

          {/* Fullscreen Center Stage */}
          <div className="relative z-10 flex-1 min-h-0 flex items-center justify-center py-2 sm:py-4 overflow-y-auto">
            {gameMode === 'wheel' && (
              <SpinWheel
                prizes={currentPrizes}
                onWinner={handleWinner}
                isSpinning={isSpinning}
                setIsSpinning={setIsSpinning}
                isFullscreen={true}
                theme={theme}
              />
            )}

            {gameMode === 'mystery' && (
              <MysteryBoxes
                prizes={currentPrizes}
                onWinner={handleWinner}
                isSpinning={isSpinning}
                setIsSpinning={setIsSpinning}
                isFullscreen={true}
                theme={theme}
              />
            )}

            {gameMode === 'slot' && (
              <SlotMachine
                prizes={currentPrizes}
                onWinner={handleWinner}
                isSpinning={isSpinning}
                setIsSpinning={setIsSpinning}
                isFullscreen={true}
                theme={theme}
              />
            )}
          </div>

          {/* Fullscreen Footer info */}
          <div className={`relative z-10 text-center text-xs font-mono shrink-0 py-1 ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
            {category === 'pusat' ? 'UNDIAN HADIAH PUSAT' : 'UNDIAN HADIAH CABANG'} • TEKAN ESC ATAU TOMBOL TUTUP UNTUK KEMBALI
          </div>
        </div>
      )}

      {/* Footer */}
      <footer
        className={`border-t py-5 px-4 text-center text-xs relative z-10 transition-colors ${
          isDark ? 'border-white/10 text-white/40' : 'border-purple-100 text-slate-500 bg-white/50'
        }`}
      >
        Created By IBGADGETSTORE
      </footer>

      {/* Celebratory Winner Modal */}
      <WinnerModal
        winner={currentWinner}
        prize={currentWinningPrize}
        onClose={() => {
          setCurrentWinner(null);
          setCurrentWinningPrize(null);
        }}
        onSpinAgain={handleSpinAgain}
        theme={theme}
      />

      {/* Header / Navbar Text Settings Modal */}
      {showHeaderEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div
            className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl relative transition-colors ${
              isDark ? 'bg-[#16161F] border-[#8B5CF6]/40 text-white' : 'bg-white border-purple-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-purple-500/20">
              <h4 className="text-sm font-serif font-bold flex items-center gap-2 text-[#8B5CF6]">
                <Edit3 className="w-4 h-4" />
                <span>Pengaturan Teks Header & Navbar</span>
              </h4>
              <button
                onClick={() => setShowHeaderEditModal(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveHeaderConfig} className="flex flex-col gap-3 pt-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                  Nama Brand / Judul Utama:
                </label>
                <input
                  type="text"
                  value={tempHeaderConfig.title}
                  onChange={(e) => setTempHeaderConfig({ ...tempHeaderConfig, title: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg text-xs font-semibold focus:outline-none focus:border-[#8B5CF6] ${
                    isDark ? 'bg-[#0F0F14] border-white/10 text-white' : 'bg-purple-50/50 border-purple-200 text-slate-900'
                  }`}
                  placeholder="IBGADGETSTORE"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                  Label Badge Kecil:
                </label>
                <input
                  type="text"
                  value={tempHeaderConfig.badge}
                  onChange={(e) => setTempHeaderConfig({ ...tempHeaderConfig, badge: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg text-xs font-semibold focus:outline-none focus:border-[#8B5CF6] ${
                    isDark ? 'bg-[#0F0F14] border-white/10 text-white' : 'bg-purple-50/50 border-purple-200 text-slate-900'
                  }`}
                  placeholder="OFFICIAL LUCKY DRAW"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                  Deskripsi / Subtitle:
                </label>
                <input
                  type="text"
                  value={tempHeaderConfig.subtitle}
                  onChange={(e) => setTempHeaderConfig({ ...tempHeaderConfig, subtitle: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg text-xs font-semibold focus:outline-none focus:border-[#8B5CF6] ${
                    isDark ? 'bg-[#0F0F14] border-white/10 text-white' : 'bg-purple-50/50 border-purple-200 text-slate-900'
                  }`}
                  placeholder="Sistem Undian Eksklusif • Hadiah Pusat & Hadiah Cabang"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                  Status Sistem:
                </label>
                <input
                  type="text"
                  value={tempHeaderConfig.systemStatusText}
                  onChange={(e) => setTempHeaderConfig({ ...tempHeaderConfig, systemStatusText: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg text-xs font-semibold focus:outline-none focus:border-[#8B5CF6] ${
                    isDark ? 'bg-[#0F0F14] border-white/10 text-white' : 'bg-purple-50/50 border-purple-200 text-slate-900'
                  }`}
                  placeholder="SYSTEM READY"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowHeaderEditModal(false)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs ${
                    isDark ? 'bg-white/10 text-white/70 hover:text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-xs flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
