import React, { useState, useEffect } from 'react';
import { PlayerProfile, RecentEnemy } from '../types/game';
import { multiplayerSync } from '../services/multiplayerSync';
import { soundEngine } from '../utils/audio';
import { CoinAmount, CoinLogo } from '../utils/coins';
import {
  Swords,
  X,
  Radio,
  Clock,
  Shield,
  ExternalLink,
  Users,
  Sparkles,
} from 'lucide-react';

interface MatchmakingModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PlayerProfile;
  onMatchFound: (tableId: string, seat: 'player1' | 'player2', opponentProfile?: any) => void;
}

export const MatchmakingModal: React.FC<MatchmakingModalProps> = ({
  isOpen,
  onClose,
  profile,
  onMatchFound,
}) => {
  const [statusMessage, setStatusMessage] = useState('Initializing matchmaking...');
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSecondsElapsed(0);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    soundEngine.playTensionPulse();

    // Timer
    const timer = setInterval(() => {
      setSecondsElapsed((s) => s + 1);
    }, 1000);

    let isCancelled = false;

    // Launch real multiplayer matchmaking in Firestore
    multiplayerSync
      .findRealPlayerMatch(profile, (msg) => {
        if (!isCancelled) {
          setStatusMessage(msg);
        }
      })
      .then((res) => {
        if (!isCancelled) {
          soundEngine.playWinFanfare(false);
          onMatchFound(res.tableId, res.seat);
        }
      })
      .catch((err) => {
        console.warn('Matchmaking error/cancelled:', err);
        if (!isCancelled) {
          setStatusMessage('Waiting for opponent to connect...');
        }
      });

    return () => {
      isCancelled = true;
      clearInterval(timer);
      multiplayerSync.cancelMatchmaking();
    };
  }, [isOpen, profile]);

  if (!isOpen) return null;

  const handleCancel = () => {
    soundEngine.playButtonClick();
    multiplayerSync.cancelMatchmaking();
    onClose();
  };

  const handleOpenSecondWindow = () => {
    soundEngine.playChipStack();
    window.open(window.location.href, '_blank');
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md p-6 sm:p-7 rounded-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-2 border-amber-500/50 shadow-2xl flex flex-col items-center text-center gap-6">
        {/* Close Button */}
        <button
          onClick={handleCancel}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Radar Animation */}
        <div className="relative flex items-center justify-center w-32 h-32 mt-2">
          <div className="absolute inset-0 rounded-full border-2 border-amber-500/30 animate-ping" />
          <div className="absolute inset-2 rounded-full border border-amber-400/50 animate-pulse" />
          <div className="absolute inset-4 rounded-full border border-dashed border-amber-500/40 animate-spin" style={{ animationDuration: '8s' }} />
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-amber-500/30 to-yellow-600/20 border-2 border-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Swords className="w-10 h-10 text-amber-300 animate-bounce" />
          </div>
        </div>

        {/* Matchmaking Info */}
        <div className="flex flex-col gap-1.5">
          <h2 className="text-xl sm:text-2xl font-black font-cinzel text-white tracking-wider">
            1v1 MATCHMAKING
          </h2>
          {/* User Profile Preview */}
          <div className="flex items-center justify-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-950/80 border border-amber-500/30 w-fit mx-auto mt-1">
            <div className="w-5 h-5 rounded-full overflow-hidden border border-amber-400 bg-slate-800 flex-shrink-0">
              <img src={profile.avatarBase64} alt={profile.username} className="w-full h-full object-cover" />
            </div>
            <span className="text-xs font-cinzel font-bold text-white">{profile.username}</span>
            <span className="text-slate-500">•</span>
            <CoinAmount amount={profile.coins} compact={true} size="xs" />
          </div>

          <p className="text-xs text-amber-300 font-mono-code font-bold flex items-center justify-center gap-2 mt-2">
            <Radio className="w-4 h-4 animate-pulse text-amber-400" />
            <span>{statusMessage}</span>
          </p>
        </div>

        {/* Searching Stats Plate */}
        <div className="w-full grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-inner">
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" /> Time Elapsed
            </span>
            <span className="font-mono-code text-xl font-black text-white mt-0.5">
              {formatTime(secondsElapsed)}
            </span>
          </div>

          <div className="flex flex-col items-center border-l border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-emerald-400" /> Fair Play
            </span>
            <span className="font-mono-code text-xs font-black text-emerald-400 mt-1">
              100% Real Players
            </span>
          </div>
        </div>

        {/* Tip for Testing: Open second window */}
        <div className="w-full p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-left flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-300 font-bold flex items-center gap-1.5">
              <Users className="w-4 h-4 text-amber-400" /> Testing Multiplayer?
            </span>
            <button
              onClick={handleOpenSecondWindow}
              className="text-[11px] font-mono-code font-bold text-amber-400 hover:text-amber-300 underline flex items-center gap-1 cursor-pointer"
            >
              <span>Open 2nd Window</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Open a second browser tab or window to test two real players seating across from each other simultaneously!
          </p>
        </div>

        {/* Cancel Button */}
        <button
          onClick={handleCancel}
          className="w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 active:translate-y-0.5 border-b-4 border-slate-950 text-slate-200 text-xs font-cinzel font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg"
        >
          Cancel Matchmaking
        </button>
      </div>
    </div>
  );
};
