import React, { useState } from 'react';
import { PlayerProfile, MultiplayerRoom } from '../types/game';
import { soundEngine } from '../utils/audio';
import {
  Volume2,
  VolumeX,
  Radio,
  Trophy,
  BookOpen,
  ShieldCheck,
  ShieldAlert,
  Coins,
  Camera,
  Users,
  Music,
  Wifi,
  Sliders,
  LogOut,
} from 'lucide-react';

interface TopNavProps {
  profile: PlayerProfile;
  currentRoom: MultiplayerRoom;
  latencyMs: number;
  cameraPreset: 'player' | 'overview' | 'cinematic';
  currentView: 'lobby' | 'table';
  onToggleView: (view: 'lobby' | 'table') => void;
  onCycleCamera: () => void;
  onOpenProfile: () => void;
  onOpenLeaderboard: () => void;
  onOpenLobby: () => void;
  onOpenAntiCheat: () => void;
  onOpenReport: () => void;
  onOpenRules: () => void;
  onSignOut?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  profile,
  currentRoom,
  latencyMs,
  cameraPreset,
  currentView,
  onToggleView,
  onCycleCamera,
  onOpenProfile,
  onOpenLeaderboard,
  onOpenLobby,
  onOpenAntiCheat,
  onOpenReport,
  onOpenRules,
  onSignOut,
}) => {
  const [isMuted, setIsMuted] = useState(soundEngine.getMuted());
  const [isAmbientOn, setIsAmbientOn] = useState(soundEngine.isAmbientActive());
  const [isSpatialOn, setIsSpatialOn] = useState(soundEngine.isSpatialEnabled());

  const handleToggleMute = () => {
    const next = !isMuted;
    soundEngine.setMuted(next);
    setIsMuted(next);
  };

  const handleToggleAmbient = () => {
    soundEngine.playButtonClick();
    const active = soundEngine.toggleAmbient();
    setIsAmbientOn(active);
  };

  const handleToggleSpatial = () => {
    soundEngine.playButtonClick();
    const next = !isSpatialOn;
    soundEngine.setSpatialEnabled(next);
    setIsSpatialOn(next);
  };

  return (
    <header className="w-full bg-slate-950/90 backdrop-blur-xl border-b border-amber-500/20 px-3 sm:px-5 py-2.5 flex items-center justify-between z-30 select-none shadow-xl shadow-black/40">
      {/* Brand & Room Info */}
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 flex items-center justify-center font-cinzel font-black text-slate-950 text-xl shadow-lg ring-2 ring-amber-400/60 chip-rim">
              <span className="drop-shadow-sm">9</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-slate-900 border border-amber-400/80 flex items-center justify-center text-[8px] text-amber-400 font-bold">
              ♠
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-cinzel font-black text-sm sm:text-base text-white tracking-wider flex items-center gap-1">
                LUCKY 9
              </h1>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-400/50 text-amber-300 font-bold font-mono-code tracking-wider">
                3D VIP
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-medium text-slate-300">{currentRoom.name}</span>
              <span className="font-mono-code text-[10px] text-sky-400/90">({latencyMs}ms)</span>
            </div>
          </div>
        </div>

        {/* View Switcher: Lobby vs 3D Table */}
        <div className="flex items-center p-1 rounded-xl bg-slate-900/90 border border-slate-700/70 shadow-inner ml-1 sm:ml-2">
          <button
            id="nav-lobby-btn"
            onClick={() => {
              soundEngine.playButtonClick();
              onToggleView('lobby');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-cinzel font-bold transition-all cursor-pointer ${
              currentView === 'lobby'
                ? 'bg-gradient-to-b from-amber-400 to-amber-600 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Lobby Hub
          </button>
          <button
            id="nav-table-btn"
            onClick={() => {
              soundEngine.playButtonClick();
              onToggleView('table');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-cinzel font-bold transition-all cursor-pointer ${
              currentView === 'table'
                ? 'bg-gradient-to-b from-amber-400 to-amber-600 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            3D Table
          </button>
        </div>
      </div>

      {/* Center Controls: Camera & Audio shortcuts */}
      <div className="hidden md:flex items-center gap-2">
        {/* Camera Preset Switcher */}
        <button
          id="camera-preset-btn"
          onClick={() => {
            soundEngine.playButtonClick();
            onCycleCamera();
          }}
          className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700 hover:border-sky-400/60 text-xs text-slate-200 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:scale-102 active:scale-98"
          title="Switch 3D Viewpoint"
        >
          <Camera className="w-3.5 h-3.5 text-sky-400" />
          <span className="capitalize font-semibold">{cameraPreset} View</span>
        </button>

        {/* 3D Spatial Audio Toggle */}
        <button
          id="spatial-audio-toggle-btn"
          onClick={handleToggleSpatial}
          className={`px-3 py-1.5 rounded-xl border text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
            isSpatialOn
              ? 'bg-amber-500/15 border-amber-400/60 text-amber-300 font-bold'
              : 'bg-slate-900/90 border-slate-700 text-slate-400 hover:text-slate-200'
          }`}
          title="Toggle 3D Spatial Audio"
        >
          <Radio className={`w-3.5 h-3.5 ${isSpatialOn ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} />
          <span>3D Audio: {isSpatialOn ? 'ON' : 'OFF'}</span>
        </button>

        {/* Ambient Lounge Hum */}
        <button
          id="ambient-sound-toggle-btn"
          onClick={handleToggleAmbient}
          className={`p-2 rounded-xl border text-xs flex items-center transition-all cursor-pointer shadow-sm ${
            isAmbientOn
              ? 'bg-emerald-500/15 border-emerald-400/60 text-emerald-300'
              : 'bg-slate-900/90 border-slate-700 text-slate-500 hover:text-slate-300'
          }`}
          title="Ambient Casino Lounge Tone"
        >
          <Music className={`w-3.5 h-3.5 ${isAmbientOn ? 'text-emerald-400 animate-bounce' : ''}`} />
        </button>

        {/* Master Mute */}
        <button
          id="mute-sound-toggle-btn"
          onClick={handleToggleMute}
          className="p-2 rounded-xl bg-slate-900/90 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm"
          title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-slate-300" />}
        </button>
      </div>

      {/* Right Side: Modals and Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Rules */}
        <button
          id="open-rules-btn"
          onClick={() => {
            soundEngine.playButtonClick();
            onOpenRules();
          }}
          className="p-2 rounded-xl bg-slate-900/90 border border-slate-700 hover:border-amber-400/50 text-slate-300 hover:text-amber-300 transition-all cursor-pointer shadow-sm"
          title="Rules of Lucky 9"
        >
          <BookOpen className="w-4 h-4" />
        </button>

        {/* Leaderboard */}
        <button
          id="open-leaderboard-btn"
          onClick={() => {
            soundEngine.playButtonClick();
            onOpenLeaderboard();
          }}
          className="p-2 rounded-xl bg-slate-900/90 border border-slate-700 hover:border-amber-400 text-amber-400 transition-all cursor-pointer shadow-sm hover:scale-105"
          title="Hourly Global Leaderboard"
        >
          <Trophy className="w-4 h-4" />
        </button>

        {/* Anti-Cheat Shield */}
        <button
          id="open-anti-cheat-btn"
          onClick={() => {
            soundEngine.playButtonClick();
            onOpenAntiCheat();
          }}
          className="p-2 rounded-xl bg-slate-900/90 border border-slate-700 hover:border-emerald-400/60 text-emerald-400 transition-all cursor-pointer shadow-sm hover:scale-105"
          title="Aegis Provably Fair Anti-Cheat Verification"
        >
          <ShieldCheck className="w-4 h-4" />
        </button>

        {/* Report Player */}
        <button
          id="open-report-btn"
          onClick={() => {
            soundEngine.playButtonClick();
            onOpenReport();
          }}
          className="p-2 rounded-xl bg-slate-900/90 border border-slate-700 hover:border-rose-400/60 text-rose-400 transition-all cursor-pointer shadow-sm"
          title="Report Suspicious Activity"
        >
          <ShieldAlert className="w-4 h-4" />
        </button>

        {/* Player Profile & Coin Balance Wallet */}
        <button
          id="open-profile-btn"
          onClick={() => {
            soundEngine.playButtonClick();
            onOpenProfile();
          }}
          className="flex items-center gap-2.5 pl-3 pr-1.5 py-1 rounded-xl bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-amber-500/40 hover:border-amber-400 transition-all group shadow-md cursor-pointer hover:scale-102 active:scale-98"
        >
          <div className="flex flex-col text-right">
            <span className="font-mono-code font-black text-xs text-amber-300 flex items-center justify-end gap-1.5">
              <Coins className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              ${profile.coins.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400 group-hover:text-amber-200 font-medium">
              {profile.username}
            </span>
          </div>

          {/* Avatar Thumbnail */}
          <div className="w-8 h-8 rounded-lg overflow-hidden border border-amber-400 bg-slate-800 flex-shrink-0 shadow">
            <img
              src={profile.avatarBase64}
              alt={profile.username}
              className="w-full h-full object-cover"
            />
          </div>
        </button>

        {onSignOut && (
          <button
            id="top-nav-sign-out-btn"
            onClick={() => {
              soundEngine.playButtonClick();
              onSignOut();
            }}
            className="p-2 rounded-xl bg-slate-900/90 border border-slate-700 hover:border-slate-600 text-slate-400 hover:text-rose-400 transition-all cursor-pointer shadow-sm"
            title="Switch Account / Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
