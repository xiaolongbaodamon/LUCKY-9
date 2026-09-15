import React from 'react';
import { HandEvaluation, Card, RecentEnemy, LiveMultiplayerTable, PlayerProfile } from '../types/game';
import { Shield, Swords, Users, Radio, Sparkles, Crown, Bot, Flame, UserCheck } from 'lucide-react';
import { CoinAmount, formatCoinsFull } from '../utils/coins';

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
  currentProfile?: PlayerProfile;
  winner: 'player' | 'banker' | 'tie' | null;
  enemyBet?: number;
  playerBet?: number;
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
  currentProfile,
  winner,
  enemyBet = 1000,
  playerBet = 0,
}) => {
  // If in live multiplayer table, extract real opponent seat
  const realOpponentSeat = liveTable
    ? mySeat === 'player1'
      ? liveTable.player2
      : liveTable.player1
    : null;

  const enemyName = realOpponentSeat?.name || activeEnemy?.name || 'Awaiting Opponent...';
  const enemyCountry = realOpponentSeat?.country || activeEnemy?.country || 'PH';
  const enemyCoins = realOpponentSeat?.coins ?? activeEnemy?.coins ?? 1100000;
  const enemyAvatar = realOpponentSeat?.avatar || activeEnemy?.avatar;

  const myName = currentProfile?.username || 'You';
  const myCountry = currentProfile?.country || 'PH';
  const myCoins = currentProfile?.coins ?? 0;
  const myAvatar = currentProfile?.avatarBase64;

  return (
    <>
      {/* 1. SEAT 1: OPPONENT / RIVAL (REAL PLAYER) - Seated across the table (Top Center/Right) */}
      <div className="absolute top-16 sm:top-18 right-2 sm:right-6 z-20 pointer-events-none select-none max-w-[280px] sm:max-w-xs w-full px-2">
        <div className="p-3 rounded-2xl bg-gradient-to-b from-slate-950/95 via-purple-950/40 to-slate-950/95 border-2 border-purple-500/80 shadow-2xl backdrop-blur-xl flex flex-col gap-2 pointer-events-auto transition-all">
          {/* Header Bar */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-900/80 border border-purple-400/60 text-purple-200 font-bold uppercase tracking-wider flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-purple-300" />
              <span>Real Player</span>
            </span>
            <span className="text-[10px] text-purple-300 font-mono-code font-bold uppercase">
              Seat 2 • Opponent
            </span>
          </div>

          {/* Player Identity Row */}
          <div className="flex items-center gap-2.5">
            {/* Comic/Gamer Avatar Card Box */}
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-purple-400 bg-slate-900 shadow-md ring-2 ring-purple-500/40">
                {enemyAvatar ? (
                  <img src={enemyAvatar} alt={enemyName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-800 to-indigo-900 flex items-center justify-center font-bold text-white text-base">
                    {enemyName.substring(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <span className="absolute -bottom-1 -right-1 text-[9px] px-1.5 py-0.2 rounded-md bg-slate-900 text-purple-200 border border-purple-500/50 font-bold shadow">
                {enemyCountry}
              </span>
            </div>

            <div className="flex flex-col min-w-0 flex-1">
              <div className="font-cinzel font-black text-sm text-white truncate tracking-wide">
                {enemyName}
              </div>
              <div
                className="flex items-center gap-1 mt-0.5"
                title={`${formatCoinsFull(enemyCoins)} Total Coins`}
              >
                <CoinAmount amount={enemyCoins} compact={true} size="sm" />
              </div>
              {enemyBet > 0 && (
                <div className="flex items-center gap-1 mt-1 text-[10px] text-purple-300 font-mono-code font-bold">
                  <span className="text-purple-400/80">Wager:</span>
                  <CoinAmount amount={enemyBet} compact={true} size="xs" />
                </div>
              )}
            </div>

            {/* Hand Score Tag */}
            {enemyHand && (
              <div className="flex flex-col items-end">
                <div className="text-[10px] text-purple-300 font-bold uppercase tracking-wider">Score</div>
                <div className="text-xl font-black font-cinzel text-purple-300 flex items-center gap-1">
                  <span>{enemyHand.score}</span>
                  {enemyHand.isNatural9 && (
                    <span className="text-[8px] px-1 py-0.5 rounded bg-amber-400 text-slate-950 font-black">N9</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Cards Display Row */}
          {enemyCards.length > 0 ? (
            <div className="flex items-center justify-between pt-2 border-t border-purple-500/30">
              <div className="flex items-center gap-1.5">
                {enemyCards.map((c, i) => {
                  const isRed = c.suit === 'hearts' || c.suit === 'diamonds';
                  const symbol = c.suit === 'hearts' ? '♥' : c.suit === 'diamonds' ? '♦' : c.suit === 'spades' ? '♠' : '♣';
                  return (
                    <div
                      key={i}
                      className={`w-7 h-10 rounded-md bg-white shadow-md border border-slate-300 flex flex-col justify-between p-0.5 select-none ${
                        isRed ? 'text-rose-600' : 'text-slate-900'
                      }`}
                    >
                      <span className="text-[9px] font-black leading-none">{c.rank}</span>
                      <span className="text-[10px] self-center leading-none">{symbol}</span>
                    </div>
                  );
                })}
              </div>
              <span className="text-[10px] text-purple-200 font-mono-code font-bold">
                {enemyCards.length} cards in hand
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 pt-2 border-t border-purple-500/20">
              <div className="w-6 h-8 rounded border border-dashed border-purple-400/40 bg-purple-950/30 flex items-center justify-center text-[9px] text-purple-400 font-mono-code">1</div>
              <div className="w-6 h-8 rounded border border-dashed border-purple-400/40 bg-purple-950/30 flex items-center justify-center text-[9px] text-purple-400 font-mono-code">2</div>
              <span className="text-[10px] text-purple-300/70 font-mono-code italic pl-1">Waiting for deal...</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. SEAT 2: THE BANKER (PROVIDED BY SYSTEM) - House Dealer Station (Top Left) */}
      <div className="absolute top-16 sm:top-18 left-2 sm:left-6 z-20 pointer-events-none select-none max-w-[280px] sm:max-w-xs w-full px-2">
        <div className="p-3 rounded-2xl bg-gradient-to-b from-slate-950/95 via-rose-950/40 to-slate-950/95 border-2 border-rose-500/80 shadow-2xl backdrop-blur-xl flex flex-col gap-2 pointer-events-auto">
          {/* Header Bar: Prominently specifies Provided by the System */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-900/90 border border-rose-400/60 text-rose-200 font-black uppercase tracking-wider flex items-center gap-1 shadow">
              <Bot className="w-3 h-3 text-rose-300 animate-pulse" />
              <span>Provided by System</span>
            </span>
            <span className="text-[10px] text-rose-300 font-mono-code font-bold uppercase">
              House Dealer
            </span>
          </div>

          {/* Banker Identity Row */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-rose-400 bg-slate-900 shadow-md ring-2 ring-rose-500/40 flex items-center justify-center bg-gradient-to-br from-rose-950 to-slate-950">
                <Shield className="w-7 h-7 text-rose-400" />
              </div>
              <span className="absolute -bottom-1 -right-1 text-[8px] px-1 py-0.2 rounded-md bg-rose-950 text-rose-200 border border-rose-500/60 font-black shadow">
                HOUSE
              </span>
            </div>

            <div className="flex flex-col min-w-0 flex-1">
              <div className="font-cinzel font-black text-sm text-white tracking-wide">
                BANKER
              </div>
              <div className="text-[11px] text-rose-300 font-mono-code font-semibold">
                Automated Shoe Dealer
              </div>
              <div className="flex items-center gap-1 mt-0.5 text-[9px] text-amber-300 font-mono-code font-bold bg-rose-950/80 px-1.5 py-0.5 rounded border border-rose-500/40 w-fit">
                <span>Sweeps on 9</span>
              </div>
            </div>

            {/* Hand Score Tag */}
            <div className="flex flex-col items-end">
              <div className="text-[10px] text-rose-300 font-bold uppercase tracking-wider">Score</div>
              <div className="text-xl font-black font-cinzel text-white flex items-center gap-1">
                <span className="text-rose-200">{bankerHand ? bankerHand.score : '-'}</span>
                {bankerHand?.isNatural9 && (
                  <span className="text-[8px] px-1 py-0.5 rounded bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black animate-pulse">
                    NATURAL 9
                  </span>
                )}
                {bankerHand?.isNatural8 && (
                  <span className="text-[8px] px-1 py-0.5 rounded bg-amber-400 text-slate-950 font-bold">
                    NATURAL 8
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Banker Cards Display */}
          {bankerCards.length > 0 ? (
            <div className="flex items-center justify-between pt-2 border-t border-rose-500/30">
              <div className="flex items-center gap-1.5">
                {bankerCards.map((c, i) => {
                  const isRed = c.suit === 'hearts' || c.suit === 'diamonds';
                  const symbol = c.suit === 'hearts' ? '♥' : c.suit === 'diamonds' ? '♦' : c.suit === 'spades' ? '♠' : '♣';
                  return (
                    <div
                      key={i}
                      className={`w-7 h-10 rounded-md bg-white shadow-md border border-slate-300 flex flex-col justify-between p-0.5 select-none ${
                        isRed ? 'text-rose-600' : 'text-slate-900'
                      }`}
                    >
                      <span className="text-[9px] font-black leading-none">{c.rank}</span>
                      <span className="text-[10px] self-center leading-none">{symbol}</span>
                    </div>
                  );
                })}
              </div>
              <span className="text-[10px] text-rose-200 font-mono-code font-bold">
                {bankerCards.length} cards
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 pt-2 border-t border-rose-500/20">
              <div className="w-6 h-8 rounded border border-dashed border-rose-400/40 bg-rose-950/30 flex items-center justify-center text-[9px] text-rose-400 font-mono-code">1</div>
              <div className="w-6 h-8 rounded border border-dashed border-rose-400/40 bg-rose-950/30 flex items-center justify-center text-[9px] text-rose-400 font-mono-code">2</div>
              <span className="text-[10px] text-rose-300/70 font-mono-code italic pl-1">House cards...</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. CENTER 1v1 MATCHUP BADGE: Real Players Battling Head to Head */}
      <div className="absolute top-16 sm:top-18 left-1/2 -translate-x-1/2 z-20 pointer-events-none select-none hidden lg:flex flex-col items-center">
        <div className="px-3.5 py-1.5 rounded-full bg-slate-950/95 border-2 border-amber-500/50 shadow-xl backdrop-blur-xl flex items-center gap-2 pointer-events-auto">
          <Swords className="w-4 h-4 text-amber-400 animate-pulse" />
          <span className="font-cinzel font-black text-xs text-amber-300 tracking-wider">
            1v1 DUEL • REAL PLAYERS
          </span>
        </div>
      </div>

      {/* 4. SEAT 3: YOU (REAL PLAYER 1) - Bottom Left Tabletop Seat (Like Defy in the Uno screenshot) */}
      <div className="absolute bottom-28 sm:bottom-32 left-2 sm:left-6 z-20 pointer-events-none select-none max-w-[280px] sm:max-w-xs w-full px-2">
        <div className="p-3 rounded-2xl bg-gradient-to-b from-slate-950/95 via-sky-950/40 to-slate-950/95 border-2 border-amber-400 shadow-2xl backdrop-blur-xl flex flex-col gap-2 pointer-events-auto">
          {/* Header Bar */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/60 text-amber-300 font-black uppercase tracking-wider flex items-center gap-1 shadow">
              <Crown className="w-3 h-3 text-amber-400" />
              <span>Real Player</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono-code font-black border border-sky-500/40">
              YOU
            </span>
          </div>

          {/* Player Identity Row */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-amber-400 bg-slate-900 shadow-md ring-2 ring-amber-400/50">
                {myAvatar ? (
                  <img src={myAvatar} alt={myName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-sky-800 to-indigo-900 flex items-center justify-center font-bold text-white text-base">
                    {myName[0]}
                  </div>
                )}
              </div>
              <span className="absolute -bottom-1 -right-1 text-[9px] px-1.5 py-0.2 rounded-md bg-slate-900 text-amber-300 border border-amber-400 font-bold shadow">
                {myCountry}
              </span>
            </div>

            <div className="flex flex-col min-w-0 flex-1">
              <div className="font-cinzel font-black text-sm text-white truncate tracking-wide">
                {myName}
              </div>
              <div
                className="flex items-center gap-1 mt-0.5"
                title={`${formatCoinsFull(myCoins)} Total Coins`}
              >
                <CoinAmount amount={myCoins} compact={true} size="sm" />
              </div>
              {playerBet > 0 && (
                <div className="flex items-center gap-1 mt-1 text-[10px] text-amber-300 font-mono-code font-bold">
                  <span className="text-amber-400/80">Wager:</span>
                  <CoinAmount amount={playerBet} compact={true} size="xs" />
                </div>
              )}
            </div>

            {/* Hand Score Tag */}
            {playerHand && (
              <div className="flex flex-col items-end">
                <div className="text-[10px] text-sky-300 font-bold uppercase tracking-wider">Score</div>
                <div className="text-xl font-black font-cinzel text-sky-300 flex items-center gap-1">
                  <span>{playerHand.score}</span>
                  {playerHand.isNatural9 && (
                    <span className="text-[8px] px-1 py-0.5 rounded bg-amber-400 text-slate-950 font-black animate-pulse">
                      NATURAL 9
                    </span>
                  )}
                  {playerHand.isNatural8 && (
                    <span className="text-[8px] px-1 py-0.5 rounded bg-amber-400 text-slate-950 font-black">
                      NATURAL 8
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Cards Display Row */}
          {playerCards.length > 0 ? (
            <div className="flex items-center justify-between pt-2 border-t border-sky-500/30">
              <div className="flex items-center gap-1.5">
                {playerCards.map((c, i) => {
                  const isRed = c.suit === 'hearts' || c.suit === 'diamonds';
                  const symbol = c.suit === 'hearts' ? '♥' : c.suit === 'diamonds' ? '♦' : c.suit === 'spades' ? '♠' : '♣';
                  return (
                    <div
                      key={i}
                      className={`w-8 h-11 rounded-md bg-white shadow-lg border border-slate-300 flex flex-col justify-between p-1 select-none animate-in fade-in zoom-in duration-200 ${
                        isRed ? 'text-rose-600' : 'text-slate-900'
                      }`}
                    >
                      <span className="text-[10px] font-black leading-none">{c.rank}</span>
                      <span className="text-xs self-center leading-none">{symbol}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[11px] text-amber-300 font-mono-code font-bold">
                  {playerCards.length} CARDS
                </span>
                <span className="text-[9px] text-sky-300 font-medium">In your hand</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 pt-2 border-t border-sky-500/20">
              <div className="w-7 h-9 rounded border-2 border-dashed border-sky-400/50 bg-sky-950/40 flex items-center justify-center text-[10px] text-sky-400 font-mono-code font-bold">1</div>
              <div className="w-7 h-9 rounded border-2 border-dashed border-sky-400/50 bg-sky-950/40 flex items-center justify-center text-[10px] text-sky-400 font-mono-code font-bold">2</div>
              <span className="text-[10px] text-sky-200/80 font-mono-code italic pl-1">Place bet & hit Deal</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

