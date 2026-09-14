import React from 'react';
import { HandEvaluation, Card, RecentEnemy, LiveMultiplayerTable } from '../types/game';
import { Flame, Shield, Swords, Sparkles, Radio } from 'lucide-react';

interface TableSeatsHudProps {
  bankerCards: Card[];
  bankerHand: HandEvaluation | null;
  enemyCards?: Card[];
  enemyHand?: HandEvaluation | null;
  playerCards: Card[];
  playerHand: HandEvaluation | null;
  activeEnemy?: RecentEnemy | null;
  liveTable?: LiveMultiplayerTable | null;
  mySeat?: 'player1' | 'player2';
  winner: 'player' | 'banker' | 'tie' | null;
}

export const TableSeatsHud: React.FC<TableSeatsHudProps> = ({
  bankerCards,
  bankerHand,
  enemyCards = [],
  enemyHand,
  playerCards,
  playerHand,
  activeEnemy,
  liveTable,
  mySeat = 'player1',
  winner,
}) => {
  // If in live multiplayer table, extract real opponent seat
  const realOpponentSeat = liveTable
    ? mySeat === 'player1'
      ? liveTable.player2
      : liveTable.player1
    : null;

  const hasOpponent = !!realOpponentSeat;
  const enemyName = realOpponentSeat?.name || 'Awaiting Player 2...';
  const enemyCountry = realOpponentSeat?.country || '🌐';
  const enemyCoins = realOpponentSeat?.coins ?? 0;
  const enemyAvatar = realOpponentSeat?.avatar;

  return (
    <>
      {/* 1. BANKER WING: Pinned to the Left Side of the Table */}
      <div className="absolute left-3 sm:left-6 top-20 sm:top-24 z-20 flex flex-col gap-2 max-w-[210px] sm:max-w-[240px] pointer-events-none select-none">
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-b from-slate-950/95 via-rose-950/40 to-slate-950/95 border-2 border-rose-500/60 shadow-2xl backdrop-blur-xl flex flex-col gap-2.5 pointer-events-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-rose-600/30 border border-rose-500/50 flex items-center justify-center text-rose-300">
                <Shield className="w-3.5 h-3.5" />
              </div>
              <span className="font-cinzel font-black text-xs text-rose-300 tracking-wider">
                BANKER
              </span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-900/60 border border-rose-400/50 text-rose-200 font-mono-code font-black">
              HOUSE
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-1 border-t border-rose-500/20">
            <div className="text-2xl font-cinzel font-black text-white flex items-center gap-2">
              <span className="text-rose-200">{bankerHand ? bankerHand.score : '-'}</span>
              {bankerHand?.isNatural9 && (
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black tracking-wider animate-pulse shadow">
                  NATURAL 9
                </span>
              )}
              {bankerHand?.isNatural8 && (
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 font-bold">
                  NATURAL 8
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-400 font-mono-code font-semibold">
              {bankerCards.length > 0 ? `${bankerCards.length} cards` : 'Waiting'}
            </span>
          </div>

          {bankerCards.length > 0 && (
            <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-800">
              {bankerCards.map((c, i) => (
                <span
                  key={i}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-mono-code font-black shadow-sm ${
                    c.suit === 'hearts' || c.suit === 'diamonds'
                      ? 'bg-rose-950/90 text-rose-300 border border-rose-600/40'
                      : 'bg-slate-900 text-slate-100 border border-slate-700'
                  }`}
                >
                  {c.rank}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. ENEMY / OPPONENT: Top Center (Directly in front across the table) */}
      <div className="absolute top-16 sm:top-18 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none select-none">
        <div className="px-4 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-b from-slate-950/95 via-purple-950/40 to-slate-950/95 border-2 border-purple-500/60 shadow-2xl backdrop-blur-xl flex items-center gap-3.5 pointer-events-auto">
          {/* Enemy Avatar */}
          <div className="relative">
            <div className="w-11 h-11 rounded-xl overflow-hidden border-2 border-purple-400/80 bg-slate-900 shadow-md">
              {enemyAvatar ? (
                <img
                  src={enemyAvatar}
                  alt={enemyName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-purple-900/70 flex items-center justify-center font-black text-sm text-purple-200">
                  {hasOpponent ? enemyName.substring(0, 2).toUpperCase() : 'P2'}
                </div>
              )}
            </div>
            {hasOpponent && (
              <span className="absolute -bottom-1 -right-1 text-[9px] px-1.5 py-0.2 rounded-full bg-purple-600 text-white font-bold border border-slate-900 shadow">
                {enemyCountry}
              </span>
            )}
          </div>

          {/* Enemy Info */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-cinzel font-black text-white tracking-wide">
                {enemyName}
              </span>
              {hasOpponent ? (
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-400/60 text-emerald-300 font-mono-code font-bold flex items-center gap-1 shadow">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  REAL 1v1
                </span>
              ) : (
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/50 text-amber-300 font-mono-code font-bold flex items-center gap-1 shadow">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  WAITING
                </span>
              )}
            </div>
            <div className="text-[11px] font-mono-code text-amber-300 font-bold flex items-center gap-2 mt-0.5">
              {hasOpponent ? (
                <>
                  <span className="text-amber-300 font-black">${enemyCoins.toLocaleString()}</span>
                  {realOpponentSeat?.bet ? (
                    <span className="text-[10px] text-slate-300 font-medium bg-purple-900/40 px-1.5 py-0.2 rounded border border-purple-500/30">
                      Bet: ${realOpponentSeat.bet}
                    </span>
                  ) : null}
                </>
              ) : (
                <span className="text-[11px] text-slate-400 font-normal">
                  Open Seat • Live Matchmaking
                </span>
              )}
            </div>
          </div>

          {/* Enemy Hand Score */}
          <div className="pl-3.5 border-l border-slate-800 text-right">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Opponent</div>
            <div className="text-xl font-cinzel font-black text-purple-300 flex items-center gap-1.5 justify-end">
              <span>{enemyHand ? enemyHand.score : (enemyCards.length > 0 ? '?' : '-')}</span>
              {enemyHand?.isNatural9 && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-400 text-slate-950 font-black">
                  NATURAL 9
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
