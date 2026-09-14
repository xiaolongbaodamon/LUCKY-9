import React, { useState, useEffect } from 'react';
import { MultiplayerRoom } from '../types/game';
import { soundEngine } from '../utils/audio';
import {
  Users,
  Activity,
  Wifi,
  Sparkles,
  Play,
  X,
  ShieldCheck,
  Radio,
} from 'lucide-react';

interface MultiplayerLobbyProps {
  isOpen: boolean;
  onClose: () => void;
  currentRoom: MultiplayerRoom;
  onSelectRoom: (room: MultiplayerRoom) => void;
  latencyMs: number;
}

const AVAILABLE_ROOMS: MultiplayerRoom[] = [
  {
    id: 'room_manila',
    name: 'Manila Solaire VIP Lounge',
    minBet: 50,
    maxBet: 5000,
    location: 'Manila, Philippines 🇵🇭',
    tier: 'High Roller',
    activePlayersCount: 5,
    maxPlayers: 7,
  },
  {
    id: 'room_macau',
    name: 'Macau Dragon 9 Suite',
    minBet: 100,
    maxBet: 10000,
    location: 'Macau SAR 🇲🇴',
    tier: 'VIP Diamond',
    activePlayersCount: 6,
    maxPlayers: 7,
  },
  {
    id: 'room_boracay',
    name: 'Boracay Sands Casual Table',
    minBet: 10,
    maxBet: 1000,
    location: 'Boracay Island 🇵🇭',
    tier: 'Casual',
    activePlayersCount: 4,
    maxPlayers: 7,
  },
  {
    id: 'room_tokyo',
    name: 'Tokyo Ginza Royal Club',
    minBet: 100,
    maxBet: 8000,
    location: 'Tokyo, Japan 🇯🇵',
    tier: 'High Roller',
    activePlayersCount: 5,
    maxPlayers: 7,
  },
];

export const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({
  isOpen,
  onClose,
  currentRoom,
  onSelectRoom,
  latencyMs,
}) => {
  const [isMatchmaking, setIsMatchmaking] = useState(false);
  const [matchmakingProgress, setMatchmakingProgress] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isMatchmaking) {
      interval = setInterval(() => {
        setMatchmakingProgress((prev) => {
          if (prev >= 100) {
            setIsMatchmaking(false);
            soundEngine.playWinFanfare();
            return 0;
          }
          return prev + 25;
        });
      }, 400);
    }
    return () => clearInterval(interval);
  }, [isMatchmaking]);

  if (!isOpen) return null;

  const handleQuickMatch = () => {
    soundEngine.playButtonClick();
    setIsMatchmaking(true);
    setMatchmakingProgress(10);
  };

  const getLatencyBadge = (ping: number) => {
    if (ping < 45) {
      return { text: 'EXCELLENT', color: 'text-emerald-400 bg-emerald-950/70 border-emerald-500/30' };
    }
    if (ping < 90) {
      return { text: 'GOOD', color: 'text-sky-400 bg-sky-950/70 border-sky-500/30' };
    }
    return { text: 'FAIR', color: 'text-amber-400 bg-amber-950/70 border-amber-500/30' };
  };

  const latencyBadge = getLatencyBadge(latencyMs);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-cinzel text-white">Multiplayer Tables & Matchmaking</h2>
              <p className="text-xs text-slate-400">Real-Time Latency Handled • Global Cross-Platform Rooms</p>
            </div>
          </div>
          <button
            id="close-lobby-btn"
            onClick={() => {
              soundEngine.playButtonClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Real-time Network Latency Header Card */}
        <div className="mx-6 mt-4 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-800 text-sky-400">
              <Wifi className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                <span>Latency Compensation Engine</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${latencyBadge.color}`}>
                  {latencyBadge.text} ({latencyMs}ms)
                </span>
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                <span>Zero-jitter tick interpolation • Anti-rollback lockstep active</span>
              </div>
            </div>
          </div>

          <button
            id="quick-match-btn"
            onClick={handleQuickMatch}
            disabled={isMatchmaking}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-cinzel font-bold text-xs uppercase tracking-wider shadow-md flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isMatchmaking ? `Searching... ${matchmakingProgress}%` : 'Quick Match'}
          </button>
        </div>

        {/* Room List */}
        <div className="p-6 overflow-y-auto flex flex-col gap-3">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Available Casino Rooms ({AVAILABLE_ROOMS.length})
          </div>

          {AVAILABLE_ROOMS.map((room) => {
            const isCurrent = room.id === currentRoom.id;
            return (
              <div
                key={room.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isCurrent
                    ? 'bg-amber-500/10 border-amber-400/70 ring-1 ring-amber-400/30'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-cinzel font-bold text-white text-sm">{room.name}</h3>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        room.tier === 'VIP Diamond'
                          ? 'bg-purple-900/60 text-purple-300 border border-purple-500/40'
                          : room.tier === 'High Roller'
                          ? 'bg-amber-900/60 text-amber-300 border border-amber-500/40'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {room.tier}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                    <span>{room.location}</span>
                    <span>•</span>
                    <span className="text-amber-300 font-mono-code font-semibold">
                      ${room.minBet} - ${room.maxBet.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-0 border-slate-800">
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Users className="w-3.5 h-3.5 text-sky-400" />
                    <span>
                      {room.activePlayersCount}/{room.maxPlayers} Seated
                    </span>
                  </div>

                  <button
                    id={`join-room-${room.id}`}
                    onClick={() => {
                      soundEngine.playButtonClick();
                      soundEngine.playChipClink();
                      onSelectRoom(room);
                      onClose();
                    }}
                    disabled={isCurrent}
                    className={`px-4 py-2 rounded-xl text-xs font-cinzel font-bold uppercase tracking-wider transition-all ${
                      isCurrent
                        ? 'bg-slate-800 text-amber-400 border border-amber-500/30 cursor-default'
                        : 'bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 text-white shadow-md'
                    }`}
                  >
                    {isCurrent ? 'Current Table' : 'Join Table'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/70 text-xs text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1 text-emerald-400 font-mono-code text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5" />
            Synchronized Multiplayer State Engine
          </span>
          <span className="text-slate-500">Cross-Platform Sync Active</span>
        </div>
      </div>
    </div>
  );
};
