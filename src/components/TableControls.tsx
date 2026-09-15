import React, { useState } from 'react';
import { BetMap, BetType, GamePhase, HandEvaluation } from '../types/game';
import { soundEngine } from '../utils/audio';
import { CoinLogo, CoinAmount, formatCoinsCompact } from '../utils/coins';
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
  onSetCustomBet?: (type: BetType, amount: number) => void;
  onClaimBonusChips?: () => void;
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

const COIN_DENOMINATIONS = [
  { value: 1000, label: '1K', color: 'from-blue-600 via-blue-500 to-blue-700 border-blue-300 text-white shadow-blue-900/60 ring-1 ring-blue-400/40' },
  { value: 5000, label: '5K', color: 'from-emerald-600 via-emerald-500 to-emerald-700 border-emerald-300 text-white shadow-emerald-900/60 ring-1 ring-emerald-400/40' },
  { value: 10000, label: '10K', color: 'from-rose-600 via-rose-500 to-rose-700 border-rose-300 text-white shadow-rose-900/60 ring-1 ring-rose-400/40' },
  { value: 25000, label: '25K', color: 'from-purple-600 via-purple-500 to-purple-700 border-purple-300 text-white shadow-purple-900/60 ring-1 ring-purple-400/40' },
  { value: 50000, label: '50K', color: 'from-amber-600 via-amber-500 to-amber-700 border-amber-300 text-white shadow-amber-900/60 ring-1 ring-amber-400/40' },
  { value: 100000, label: '100K', color: 'from-slate-900 via-neutral-800 to-black border-amber-300 text-amber-300 shadow-black/80 ring-2 ring-amber-400/70' },
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
  onSetCustomBet,
  onClaimBonusChips,
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
  const [customBetInput, setCustomBetInput] = useState<string>('1000');
  const totalBet = (Object.values(bets) as number[]).reduce((a, b) => a + b, 0);
  const isBettingPhase = phase === 'BETTING' || phase === 'ROUND_OVER';
  const isPlayerTurn = phase === 'PLAYER_TURN';

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Player Live Hand Spotlight & Actual Cards (Visible during dealing, player turn, and settle) */}
      {playerHand && (
        <div className="px-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-2 border-amber-400 shadow-2xl backdrop-blur-xl">
            {/* Visual Card Fan Display */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {playerHand.cards.map((c, i) => {
                  const isRed = c.suit === 'hearts' || c.suit === 'diamonds';
                  const symbol = c.suit === 'hearts' ? '♥' : c.suit === 'diamonds' ? '♦' : c.suit === 'spades' ? '♠' : '♣';
                  return (
                    <div
                      key={i}
                      className={`w-12 h-16 sm:w-14 sm:h-20 rounded-xl bg-white shadow-2xl border-2 border-slate-200 flex flex-col justify-between p-1.5 transform transition-transform hover:-translate-y-1 ${
                        isRed ? 'text-rose-600' : 'text-slate-950'
                      }`}
                    >
                      <div className="flex items-center justify-between leading-none">
                        <span className="font-cinzel font-black text-xs sm:text-sm">{c.rank}</span>
                        <span className="text-xs">{symbol}</span>
                      </div>
                      <div className="text-lg sm:text-2xl font-black self-center leading-none select-none">
                        {symbol}
                      </div>
                      <div className="flex items-center justify-between leading-none rotate-180">
                        <span className="font-cinzel font-black text-xs sm:text-sm">{c.rank}</span>
                        <span className="text-xs">{symbol}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col pl-2 border-l border-slate-700/80">
                <span className="text-[10px] uppercase tracking-widest font-black text-sky-400">
                  YOUR HAND
                </span>
                <span className="text-xs text-slate-400 font-mono-code">
                  {playerHand.cards.length} cards ({playerHand.rawSum} raw)
                </span>
              </div>
            </div>

            {/* Hand Score & Result */}
            <div className="flex items-center gap-3">
              <div className="text-xl sm:text-2xl font-black font-cinzel text-white flex items-center gap-2">
                <span className="text-amber-300">Score: {playerHand.score}</span>
                {playerHand.isNatural9 && (
                  <span className="px-3 py-1 rounded-xl text-xs bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black tracking-wider shadow-xl animate-bounce">
                    NATURAL 9!
                  </span>
                )}
                {playerHand.isNatural8 && (
                  <span className="px-3 py-1 rounded-xl text-xs bg-amber-400 text-slate-950 font-black tracking-wider shadow-lg">
                    NATURAL 8
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Betting Alert / Ready to Deal Prompt */}
      {isBettingPhase && totalBet > 0 && (
        <div className="px-2 animate-in fade-in slide-in-from-bottom-1">
          <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-gradient-to-r from-amber-950/90 via-amber-900/70 to-amber-950/90 border border-amber-400/60 shadow-lg">
            <div className="flex items-center gap-2 text-xs text-amber-200">
              <span className="text-base animate-pulse">⚡</span>
              <span className="font-bold">
                Wager placed! Click <span className="text-amber-300 font-extrabold uppercase underline">Deal Cards</span> to receive your hand.
              </span>
            </div>
            <button
              onClick={() => {
                soundEngine.playButtonClick();
                onDeal();
              }}
              className="px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider cursor-pointer shadow-md active:scale-95 flex items-center gap-1"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Deal Now</span>
            </button>
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
              <div className="flex items-center gap-1">
                <CoinAmount amount={bets.player} compact={true} size="sm" />
              </div>
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
              <div className="flex items-center gap-1">
                <CoinAmount amount={bets.banker} compact={true} size="sm" />
              </div>
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
              <div className="flex items-center gap-1">
                <CoinAmount amount={bets.tie} compact={true} size="sm" />
              </div>
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
              <div className="flex items-center gap-1">
                <CoinAmount amount={bets.natural9} compact={true} size="sm" />
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Dedicated Player Bet Section (Lowest 1K/5K/10K + Custom Input Box) */}
      {isBettingPhase && (
        <div className="flex flex-col gap-2 p-3 bg-slate-950/95 rounded-2xl border-2 border-amber-500/40 shadow-xl backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-cinzel font-black text-amber-300 uppercase tracking-wider flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>Player Bet Section</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300 font-mono-code">
                Lowest: 1,000
              </span>
            </div>

            {/* Quick Balance Reload if low on coins */}
            {playerCoins < 1000 && onClaimBonusChips && (
              <button
                type="button"
                id="claim-reload-chips-btn"
                onClick={() => {
                  soundEngine.playChipToss();
                  onClaimBonusChips();
                }}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1 shadow animate-pulse cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>Reload +50K Free Chips</span>
              </button>
            )}
          </div>

          {/* Quick Denomination Pills & Custom Input Box */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {/* Direct Input Field */}
            <div className="flex items-center gap-1.5 flex-1 min-w-[180px] bg-slate-900/90 px-2.5 py-1.5 rounded-xl border border-slate-700 focus-within:border-amber-400">
              <span className="text-xs font-bold text-amber-400 font-mono-code">Bet:</span>
              <input
                id="custom-bet-input"
                type="number"
                min={1000}
                step={1000}
                value={customBetInput}
                onChange={(e) => setCustomBetInput(e.target.value)}
                placeholder="Min 1,000"
                className="w-full bg-transparent text-white font-mono-code font-bold text-xs focus:outline-none"
              />
              <button
                type="button"
                id="apply-custom-bet-btn"
                onClick={() => {
                  const val = parseInt(customBetInput, 10);
                  if (!isNaN(val) && val >= 1000 && onSetCustomBet) {
                    soundEngine.playChipToss();
                    onSetCustomBet('player', Math.min(val, playerCoins + (bets.player || 0)));
                  }
                }}
                disabled={!customBetInput || parseInt(customBetInput, 10) < 1000 || playerCoins + (bets.player || 0) < 1000}
                className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:pointer-events-none text-slate-950 text-xs font-black font-cinzel uppercase tracking-wider cursor-pointer shadow whitespace-nowrap"
              >
                Set Bet
              </button>
            </div>

            {/* Quick 1K, 5K, 10K, 25K, 50K, Max Presets */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
              {[
                { label: '1K', amount: 1000 },
                { label: '5K', amount: 5000 },
                { label: '10K', amount: 10000 },
                { label: '25K', amount: 25000 },
                { label: '50K', amount: 50000 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  id={`quick-preset-${preset.label}`}
                  onClick={() => {
                    setCustomBetInput(preset.amount.toString());
                    if (onSetCustomBet) {
                      soundEngine.playChipToss();
                      onSetCustomBet('player', Math.min(preset.amount, playerCoins + (bets.player || 0)));
                    }
                  }}
                  disabled={playerCoins + (bets.player || 0) < preset.amount}
                  className="px-2.5 py-1.5 text-xs font-mono-code font-black rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-30 border border-amber-500/30 text-amber-300 hover:text-white cursor-pointer transition-colors shadow"
                >
                  {preset.label}
                </button>
              ))}

              <button
                type="button"
                id="quick-preset-max"
                onClick={() => {
                  const maxAffordable = playerCoins + (bets.player || 0);
                  if (maxAffordable >= 1000) {
                    setCustomBetInput(maxAffordable.toString());
                    if (onSetCustomBet) {
                      soundEngine.playChipToss();
                      onSetCustomBet('player', maxAffordable);
                    }
                  }
                }}
                disabled={playerCoins + (bets.player || 0) < 1000}
                className="px-2.5 py-1.5 text-xs font-mono-code font-black rounded-lg bg-red-950/70 hover:bg-red-900 border border-red-500/50 text-red-200 cursor-pointer transition-colors shadow"
              >
                ALL-IN
              </button>
            </div>
          </div>

          {/* Rules Reminder Pill */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80 text-[10px] text-slate-400">
            <div className="flex items-center gap-1 text-rose-300">
              <ShieldAlert className="w-3 h-3 text-rose-400" />
              <span>Banker 9 Sweeps: If Banker gets 9, all bets go to Banker!</span>
            </div>
            <div className="flex items-center gap-1 text-amber-300">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>PvP Battle: Winner deducts and collects the loser's bet!</span>
            </div>
          </div>
        </div>
      )}

      {/* Coin Selection Bar */}
      {isBettingPhase && (
        <div className="flex items-center justify-between gap-3 px-3 py-2.5 bg-slate-950/90 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md">
          {/* Coins Carousel */}
          <div className="flex items-center gap-2 overflow-x-auto py-1 px-1">
            {COIN_DENOMINATIONS.map((coin) => {
              const isSelected = selectedChip === coin.value;
              return (
                <button
                  key={coin.value}
                  id={`coin-selector-${coin.value}`}
                  onClick={() => {
                    soundEngine.playButtonClick();
                    soundEngine.playChipClink(0, 1.0 + (coin.value / 5000) * 0.3);
                    onSelectChip(coin.value);
                  }}
                  className={`relative flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full flex flex-col items-center justify-center font-cinzel font-black text-xs shadow-xl border-2 transition-all cursor-pointer select-none chip-rim bg-gradient-to-b ${
                    coin.color
                  } ${
                    isSelected
                      ? 'scale-115 -translate-y-1.5 ring-4 ring-amber-400 border-white shadow-2xl z-10'
                      : 'opacity-90 hover:opacity-100 hover:scale-105'
                  }`}
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-dashed border-white/50 flex flex-col items-center justify-center bg-black/20">
                    <CoinLogo size="xs" className="w-2.5 h-2.5" />
                    <span className="text-[11px] font-black leading-none">{coin.label}</span>
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
          <div className="text-xs flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Total Wager: </span>
            <CoinAmount amount={totalBet} compact={true} size="sm" />
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
              className={`px-8 py-3.5 rounded-2xl btn-game-gold disabled:opacity-40 disabled:pointer-events-none font-cinzel font-black text-sm uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-2xl transition-all ${
                totalBet > 0 ? 'ring-4 ring-amber-400/80 scale-105 shadow-amber-500/50 animate-pulse' : ''
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{totalBet > 0 ? 'DEAL CARDS NOW' : 'DEAL CARDS'}</span>
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
