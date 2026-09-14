import React from 'react';
import { BetMap, BetType, GamePhase, HandEvaluation } from '../types/game';
import { soundEngine } from '../utils/audio';
import { Coins, RotateCcw, Play, Hand, ShieldAlert, Sparkles, TrendingUp } from 'lucide-react';

interface TableControlsProps {
  phase: GamePhase;
  bets: BetMap;
  selectedChip: number;
  playerCoins: number;
  playerHand: HandEvaluation | null;
  bankerHand: HandEvaluation | null;
  onSelectChip: (amount: number) => void;
  onPlaceBet: (type: BetType) => void;
  onClearBets: () => void;
  onRebet: () => void;
  onDeal: () => void;
  onHit: () => void;
  onStand: () => void;
  canHit: boolean;
  canStand: boolean;
  canDouble: boolean;
  onDouble: () => void;
}

const CHIP_DENOMINATIONS = [
  { value: 10, label: '10', color: 'from-blue-600 via-blue-500 to-blue-700 border-blue-300 text-white shadow-blue-900/60 ring-1 ring-blue-400/40' },
  { value: 50, label: '50', color: 'from-emerald-600 via-emerald-500 to-emerald-700 border-emerald-300 text-white shadow-emerald-900/60 ring-1 ring-emerald-400/40' },
  { value: 100, label: '100', color: 'from-rose-600 via-rose-500 to-rose-700 border-rose-300 text-white shadow-rose-900/60 ring-1 ring-rose-400/40' },
  { value: 500, label: '500', color: 'from-purple-600 via-purple-500 to-purple-700 border-purple-300 text-white shadow-purple-900/60 ring-1 ring-purple-400/40' },
  { value: 1000, label: '1K', color: 'from-amber-600 via-amber-500 to-amber-700 border-amber-300 text-white shadow-amber-900/60 ring-1 ring-amber-400/40' },
  { value: 5000, label: '5K', color: 'from-slate-900 via-neutral-800 to-black border-amber-300 text-amber-300 shadow-black/80 ring-2 ring-amber-400/70' },
];

export const TableControls: React.FC<TableControlsProps> = ({
  phase,
  bets,
  selectedChip,
  playerCoins,
  playerHand,
  bankerHand,
  onSelectChip,
  onPlaceBet,
  onClearBets,
  onRebet,
  onDeal,
  onHit,
  onStand,
  canHit,
  canStand,
  canDouble,
  onDouble,
}) => {
  const totalBet = (Object.values(bets) as number[]).reduce((a, b) => a + b, 0);
  const isBettingPhase = phase === 'BETTING' || phase === 'ROUND_OVER';
  const isPlayerTurn = phase === 'PLAYER_TURN';

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Player Live Hand Score Bar (Visible during dealing & turns) */}
      {playerHand && (
        <div className="px-2">
          <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-slate-950/90 border border-sky-400/60 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-sky-400 animate-ping" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-widest font-extrabold text-sky-400">
                  Player Hand
                </span>
                <span className="text-xs text-slate-400 font-mono-code">
                  {playerHand.cards.length} cards dealt ({playerHand.rawSum} raw)
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-black font-cinzel text-white flex items-center gap-2 pl-3 border-l border-slate-800">
                <span className="text-amber-300">Score: {playerHand.score}</span>
                {playerHand.isNatural9 && (
                  <span className="px-2.5 py-0.5 rounded-lg text-xs bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black tracking-wider shadow-lg animate-pulse">
                    NATURAL 9!
                  </span>
                )}
                {playerHand.isNatural8 && (
                  <span className="px-2.5 py-0.5 rounded-lg text-xs bg-amber-400 text-slate-950 font-black tracking-wider">
                    NATURAL 8
                  </span>
                )}
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-mono-code bg-slate-900/80 px-3 py-1 rounded-xl border border-slate-800">
              <span>Goal: Closest to 9</span>
            </div>
          </div>
        </div>
      )}

      {/* Betting Zone Target Buttons (Touch and Click friendly felt spots) */}
      {isBettingPhase && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 px-2">
          {/* Player Main Bet */}
          <button
            id="bet-player-btn"
            onClick={() => {
              soundEngine.playChipToss();
              onPlaceBet('player');
            }}
            disabled={playerCoins < selectedChip}
            className={`relative p-3.5 rounded-2xl border-2 transition-all text-left flex flex-col justify-between cursor-pointer group select-none shadow-md ${
              bets.player > 0
                ? 'bg-gradient-to-br from-sky-950/90 via-sky-900/50 to-slate-950 border-sky-400 shadow-sky-500/30 scale-[1.02]'
                : 'bg-slate-950/80 border-slate-700/80 hover:border-sky-400/80 hover:bg-slate-900/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                <span className="font-cinzel font-black text-sky-400 text-sm tracking-wider">PLAYER</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-sky-950/80 border border-sky-500/40 text-sky-300 font-mono-code font-bold">
                1:1
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/80">
              <span className="text-xs text-slate-400">Wager</span>
              <span className="font-mono-code font-black text-amber-300 text-sm">
                ${bets.player.toLocaleString()}
              </span>
            </div>
          </button>

          {/* Banker Main Bet */}
          <button
            id="bet-banker-btn"
            onClick={() => {
              soundEngine.playChipToss();
              onPlaceBet('banker');
            }}
            disabled={playerCoins < selectedChip}
            className={`relative p-3.5 rounded-2xl border-2 transition-all text-left flex flex-col justify-between cursor-pointer group select-none shadow-md ${
              bets.banker > 0
                ? 'bg-gradient-to-br from-rose-950/90 via-rose-900/50 to-slate-950 border-rose-400 shadow-rose-500/30 scale-[1.02]'
                : 'bg-slate-950/80 border-slate-700/80 hover:border-rose-400/80 hover:bg-slate-900/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span className="font-cinzel font-black text-rose-400 text-sm tracking-wider">BANKER</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-rose-950/80 border border-rose-500/40 text-rose-300 font-mono-code font-bold">
                1:1
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/80">
              <span className="text-xs text-slate-400">Wager</span>
              <span className="font-mono-code font-black text-amber-300 text-sm">
                ${bets.banker.toLocaleString()}
              </span>
            </div>
          </button>

          {/* Tie Bet */}
          <button
            id="bet-tie-btn"
            onClick={() => {
              soundEngine.playChipToss();
              onPlaceBet('tie');
            }}
            disabled={playerCoins < selectedChip}
            className={`relative p-3.5 rounded-2xl border-2 transition-all text-left flex flex-col justify-between cursor-pointer group select-none shadow-md ${
              bets.tie > 0
                ? 'bg-gradient-to-br from-emerald-950/90 via-emerald-900/50 to-slate-950 border-emerald-400 shadow-emerald-500/30 scale-[1.02]'
                : 'bg-slate-950/80 border-slate-700/80 hover:border-emerald-400/80 hover:bg-slate-900/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="font-cinzel font-black text-emerald-400 text-sm tracking-wider">TIE</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono-code font-black">
                8:1
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/80">
              <span className="text-xs text-slate-400">Wager</span>
              <span className="font-mono-code font-black text-amber-300 text-sm">
                ${bets.tie.toLocaleString()}
              </span>
            </div>
          </button>

          {/* Natural 9 Side Bet */}
          <button
            id="bet-natural9-btn"
            onClick={() => {
              soundEngine.playChipToss();
              onPlaceBet('natural9');
            }}
            disabled={playerCoins < selectedChip}
            className={`relative p-3.5 rounded-2xl border-2 transition-all text-left flex flex-col justify-between cursor-pointer group select-none shadow-md ${
              bets.natural9 > 0
                ? 'bg-gradient-to-br from-amber-950/90 via-amber-900/50 to-slate-950 border-amber-400 shadow-amber-500/30 scale-[1.02]'
                : 'bg-slate-950/80 border-slate-700/80 hover:border-amber-400/80 hover:bg-slate-900/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-cinzel font-black text-amber-400 text-sm flex items-center gap-1.5 tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                NATURAL 9
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-950/80 border border-amber-500/40 text-amber-300 font-mono-code font-black">
                3:1
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/80">
              <span className="text-xs text-slate-400">Wager</span>
              <span className="font-mono-code font-black text-amber-300 text-sm">
                ${bets.natural9.toLocaleString()}
              </span>
            </div>
          </button>
        </div>
      )}

      {/* Chip Selection Bar */}
      {isBettingPhase && (
        <div className="flex items-center justify-between gap-3 px-3 py-2.5 bg-slate-950/90 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md">
          {/* Chips Carousel */}
          <div className="flex items-center gap-2 overflow-x-auto py-1 px-1">
            {CHIP_DENOMINATIONS.map((chip) => {
              const isSelected = selectedChip === chip.value;
              return (
                <button
                  key={chip.value}
                  id={`chip-selector-${chip.value}`}
                  onClick={() => {
                    soundEngine.playButtonClick();
                    soundEngine.playChipClink(0, 1.0 + (chip.value / 5000) * 0.3);
                    onSelectChip(chip.value);
                  }}
                  className={`relative flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full flex flex-col items-center justify-center font-cinzel font-black text-xs shadow-xl border-2 transition-all cursor-pointer select-none chip-rim bg-gradient-to-b ${
                    chip.color
                  } ${
                    isSelected
                      ? 'scale-115 -translate-y-1.5 ring-4 ring-amber-400 border-white shadow-2xl z-10'
                      : 'opacity-90 hover:opacity-100 hover:scale-105'
                  }`}
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-dashed border-white/50 flex flex-col items-center justify-center bg-black/20">
                    <span className="text-[8px] leading-none opacity-80">$</span>
                    <span className="text-[11px] font-black leading-none">{chip.label}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Bet Modifiers */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              id="clear-bets-btn"
              onClick={() => {
                soundEngine.playButtonClick();
                onClearBets();
              }}
              disabled={totalBet === 0}
              className="px-3.5 py-2.5 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none text-slate-300 border border-slate-700 flex items-center gap-1.5 cursor-pointer shadow transition-all active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>

            <button
              id="rebet-btn"
              onClick={() => {
                soundEngine.playButtonClick();
                onRebet();
              }}
              disabled={playerCoins < totalBet || totalBet === 0}
              className="px-3.5 py-2.5 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none text-amber-300 border border-amber-500/40 flex items-center gap-1.5 cursor-pointer shadow transition-all active:scale-95"
            >
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
              <span>2x Bet</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Action Bar (Deal / Hit / Stand) */}
      <div className="flex items-center justify-between gap-3 px-2 pt-1">
        {/* Current Total Bet display */}
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-slate-950/90 border border-amber-500/30 shadow-lg">
          <Coins className="w-4 h-4 text-amber-400 animate-pulse" />
          <div className="text-xs">
            <span className="text-slate-400 font-medium">Total Wager: </span>
            <span className="font-mono-code font-black text-amber-300 text-sm">
              ${totalBet.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Dynamic Buttons based on Phase */}
        <div className="flex items-center gap-2.5">
          {isBettingPhase && (
            <button
              id="deal-cards-btn"
              onClick={() => {
                soundEngine.playButtonClick();
                onDeal();
              }}
              disabled={totalBet === 0}
              className="px-8 py-3.5 rounded-2xl btn-game-gold disabled:opacity-40 disabled:pointer-events-none font-cinzel font-black text-sm uppercase tracking-wider flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>DEAL CARDS</span>
            </button>
          )}

          {isPlayerTurn && (
            <>
              <button
                id="hit-card-btn"
                onClick={() => {
                  soundEngine.playButtonClick();
                  onHit();
                }}
                disabled={!canHit}
                className="px-6 py-3 rounded-2xl btn-game-blue disabled:opacity-40 text-white font-cinzel font-black text-sm tracking-wider flex items-center gap-2 cursor-pointer"
              >
                <Hand className="w-4 h-4" />
                <span>HIT (3rd)</span>
              </button>

              <button
                id="stand-btn"
                onClick={() => {
                  soundEngine.playButtonClick();
                  onStand();
                }}
                disabled={!canStand}
                className="px-6 py-3 rounded-2xl btn-game-dark disabled:opacity-40 text-slate-100 font-cinzel font-bold text-sm tracking-wider border border-slate-600 flex items-center gap-2 cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4 text-emerald-400" />
                <span>STAND</span>
              </button>

              {canDouble && (
                <button
                  id="double-down-btn"
                  onClick={() => {
                    soundEngine.playButtonClick();
                    onDouble();
                  }}
                  className="px-5 py-3 rounded-2xl bg-purple-700 hover:bg-purple-600 text-white font-cinzel font-bold text-sm tracking-wider shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>DOUBLE</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
