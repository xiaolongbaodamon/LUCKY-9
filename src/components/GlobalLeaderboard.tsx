import React, { useState, useEffect } from 'react';
import { LeaderboardUser, PlayerProfile } from '../types/game';
import { firebaseSync } from '../services/firebase';
import { soundEngine } from '../utils/audio';
import {
  Trophy,
  RefreshCw,
  Clock,
  ShieldCheck,
  Coins,
  Medal,
  Award,
  X,
  Flame,
} from 'lucide-react';

interface GlobalLeaderboardProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: PlayerProfile;
}

export const GlobalLeaderboard: React.FC<GlobalLeaderboardProps> = ({
  isOpen,
  onClose,
  currentProfile,
}) => {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [nextRefreshMs, setNextRefreshMs] = useState<number>(3600000);
  const [filterBy, setFilterBy] = useState<'coins' | 'winrate' | 'wins'>('coins');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;

    const loadData = () => {
      const data = firebaseSync.getLeaderboard();
      setUsers(data.users);
      setNextRefreshMs(data.nextRefreshMs);
    };

    loadData();

    // Timer countdown update every second
    const interval = setInterval(() => {
      setNextRefreshMs((prev) => {
        if (prev <= 1000) {
          // Trigger hourly auto-refresh
          loadData();
          return 3600000;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleManualRefresh = () => {
    soundEngine.playButtonClick();
    setIsRefreshing(true);
    setTimeout(() => {
      const fresh = firebaseSync.forceRefreshLeaderboard();
      setUsers(fresh.users);
      setNextRefreshMs(fresh.nextRefreshMs);
      setIsRefreshing(false);
    }, 600);
  };

  // Format remaining countdown time (e.g. 52m 14s)
  const formatCountdown = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  // Sort according to active filter
  const sortedUsers = [...users].sort((a, b) => {
    if (filterBy === 'winrate') return b.winrate - a.winrate;
    if (filterBy === 'wins') return b.wins - a.wins;
    return b.coins - a.coins;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-2 border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 shadow">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black font-cinzel text-white flex items-center gap-2">
                GLOBAL LEADERBOARD
                <span className="text-[10px] font-mono-code px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold">
                  HOURLY
                </span>
              </h2>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1 font-mono-code text-amber-300 font-bold">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Next Cycle In: {formatCountdown(nextRefreshMs)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="refresh-leaderboard-btn"
              onClick={handleManualRefresh}
              className={`p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-all cursor-pointer ${
                isRefreshing ? 'animate-spin text-amber-400' : ''
              }`}
              title="Refresh Leaderboard"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              id="close-leaderboard-btn"
              onClick={() => {
                soundEngine.playButtonClick();
                onClose();
              }}
              className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <button
              id="filter-coins-btn"
              onClick={() => setFilterBy('coins')}
              className={`px-3.5 py-2 rounded-xl text-xs font-cinzel font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                filterBy === 'coins'
                  ? 'btn-game-gold text-slate-950'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              Highest Bankroll
            </button>
            <button
              id="filter-winrate-btn"
              onClick={() => setFilterBy('winrate')}
              className={`px-3.5 py-2 rounded-xl text-xs font-cinzel font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                filterBy === 'winrate'
                  ? 'btn-game-gold text-slate-950'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              Top Win Rate
            </button>
            <button
              id="filter-wins-btn"
              onClick={() => setFilterBy('wins')}
              className={`px-3.5 py-2 rounded-xl text-xs font-cinzel font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                filterBy === 'wins'
                  ? 'btn-game-gold text-slate-950'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              Most Wins
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-mono-code font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Anti-Cheat Verified</span>
          </div>
        </div>

        {/* List of Players */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-2">
          {sortedUsers.map((user, idx) => {
            const isMe = user.id === currentProfile.id;
            const rankNumber = idx + 1;

            return (
              <div
                key={user.id}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                  isMe
                    ? 'bg-amber-500/15 border-amber-400/80 ring-1 ring-amber-400/40 shadow-lg'
                    : rankNumber === 1
                    ? 'bg-gradient-to-r from-amber-950/40 to-slate-900/80 border-amber-500/40 shadow-md'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Rank & Player Info */}
                <div className="flex items-center gap-3.5">
                  <div className="w-7 text-center font-cinzel font-bold text-sm">
                    {rankNumber === 1 ? (
                      <span className="text-amber-400 text-lg">🥇</span>
                    ) : rankNumber === 2 ? (
                      <span className="text-slate-300 text-lg">🥈</span>
                    ) : rankNumber === 3 ? (
                      <span className="text-amber-600 text-lg">🥉</span>
                    ) : (
                      <span className="text-slate-500">#{rankNumber}</span>
                    )}
                  </div>

                  {/* 500x500 Avatar Thumbnail */}
                  <div className="w-10 h-10 rounded-xl overflow-hidden border border-amber-400/50 bg-slate-800 flex-shrink-0">
                    <img
                      src={user.avatarBase64}
                      alt={user.username}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white text-sm">
                        {user.username} {isMe && '(You)'}
                      </span>
                      <span className="text-xs">{user.country === 'PH' ? '🇵🇭' : user.country === 'SG' ? '🇸🇬' : user.country === 'JP' ? '🇯🇵' : '🌏'}</span>
                      {user.verified && (
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" title="Aegis Anti-Cheat Verified" />
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400">{user.title}</div>
                  </div>
                </div>

                {/* Scores */}
                <div className="flex items-center gap-5 text-right">
                  <div>
                    <div className="text-[11px] text-slate-400">Win Rate</div>
                    <div className="font-mono-code font-bold text-emerald-400 text-sm">
                      {user.winrate}%
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-slate-400">Wins</div>
                    <div className="font-mono-code font-semibold text-sky-400 text-sm">
                      {user.wins}
                    </div>
                  </div>

                  <div className="min-w-[100px]">
                    <div className="text-[11px] text-slate-400">Bankroll</div>
                    <div className="font-mono-code font-bold text-amber-400 text-sm">
                      ${user.coins.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/70 text-xs text-slate-500 flex items-center justify-between">
          <span>Rankings compute every 60 minutes based on real game rounds.</span>
          <span>Aegis Anti-Cheat Protocol 2.4</span>
        </div>
      </div>
    </div>
  );
};
