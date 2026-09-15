import React from 'react';
import { RoundResult } from '../types/game';
import { soundEngine } from '../utils/audio';
import { Sparkles, Trophy, ShieldCheck, Play, RotateCcw, Swords, Landmark, Skull } from 'lucide-react';
import { CoinAmount, CoinLogo, formatCoinsCompact } from '../utils/coins';

interface RoundResultBannerProps {
  result: RoundResult | null;
  onNextRound: () => void;
  onRebet: () => void;
  onOpenAntiCheat: () => void;
}

export const RoundResultBanner: React.FC<RoundResultBannerProps> = ({
  result,
  onNextRound,
  onRebet,
  onOpenAntiCheat,
}) => {
  if (!result) return null;

  const isWin = result.netProfit > 0;
  const isLoss = result.netProfit < 0;
  const isTie = result.winner === 'tie';
  const hasNatural9 = result.playerHand.isNatural9 || result.bankerHand.isNatural9 || (result.enemyHand?.isNatural9 ?? false);

  return (
    <div className="fixed inset-0 pointer-events-none z-40 flex items-center justify-center p-4">
      <div className="pointer-events-auto w-full max-w-md bg-gradient-to-b from-slate-950/98 via-slate-900/98 to-slate-950/98 border-2 border-amber-400/90 rounded-3xl shadow-2xl p-6 sm:p-7 text-center backdrop-blur-2xl animate-in zoom-in-95 duration-200 flex flex-col gap-4">
        {/* Title Badge */}
        <div>
          {/* Natural 9 Alert */}
          {hasNatural9 && (
            <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-yellow-400/30 to-amber-500/20 border border-amber-400 text-amber-300 font-black text-xs uppercase tracking-widest mb-3 animate-bounce shadow-lg">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>NATURAL 9 HIT!</span>
            </div>
          )}

          {/* Banker 9 Sweep Alert */}
          {result.bankerSwept9 ? (
            <div className="mb-2 p-3 rounded-2xl bg-gradient-to-r from-rose-950 via-red-900/60 to-rose-950 border-2 border-rose-500 shadow-xl">
              <div className="flex items-center justify-center gap-2 text-rose-300 font-black font-cinzel text-lg tracking-wider">
                <Landmark className="w-6 h-6 text-rose-400 animate-pulse" />
                <span>BANKER GOT 9 • HOUSE SWEEPS!</span>
              </div>
              <p className="text-xs text-rose-200 mt-1 font-sans">
                Banker scored 9! All bets of both players were collected by the House.
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 mb-1">
              {isWin && <Trophy className="w-6 h-6 text-amber-400 animate-pulse" />}
              {result.winner === 'enemy' && <Skull className="w-6 h-6 text-purple-400 animate-pulse" />}
              <h2 className="text-2xl sm:text-3xl font-black font-cinzel text-white tracking-wide">
                {result.winner === 'player'
                  ? 'YOU WON THE HAND!'
                  : result.winner === 'enemy'
                  ? 'OPPONENT WON!'
                  : result.winner === 'banker'
                  ? 'BANKER WINS!'
                  : 'ROUND PUSH (TIE)!'}
              </h2>
            </div>
          )}

          {/* 1v1 PvP Transfer Pill if players battled */}
          {!result.bankerSwept9 && result.pvpWinner && result.pvpWinner !== 'tie' && (
            <div className={`mt-2 py-1.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 ${
              result.pvpWinner === 'player'
                ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-300'
                : 'bg-purple-950/70 border-purple-500/60 text-purple-300'
            }`}>
              <Swords className="w-3.5 h-3.5" />
              <span>
                {result.pvpWinner === 'player'
                  ? `PvP Win! Opponent's bet of ${formatCoinsCompact(result.pvpCoinsTransferred || 0)} was deducted & added to you!`
                  : `PvP Loss! Your bet of ${formatCoinsCompact(result.pvpCoinsTransferred || 0)} was deducted & given to opponent!`}
              </span>
            </div>
          )}

          {/* 3-Way Hand Scores */}
          <div className="text-xs text-slate-300 mt-2.5 flex items-center justify-center gap-3 bg-slate-950/80 py-2 px-4 rounded-xl border border-slate-800/80 mx-auto w-full">
            <span className="flex items-center gap-1 font-mono-code">
              You: <strong className="text-sky-400 font-black text-sm">{result.playerHand.score}</strong>
            </span>
            {result.enemyHand && (
              <>
                <span className="text-slate-600 font-bold">•</span>
                <span className="flex items-center gap-1 font-mono-code">
                  Rival: <strong className="text-purple-300 font-black text-sm">{result.enemyHand.score}</strong>
                </span>
              </>
            )}
            <span className="text-slate-600 font-bold">•</span>
            <span className="flex items-center gap-1 font-mono-code">
              Banker: <strong className="text-rose-400 font-black text-sm">{result.bankerHand.score}</strong>
            </span>
          </div>
        </div>

        {/* Payout Outcome */}
        <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800 shadow-inner flex flex-col items-center">
          <div className="text-[11px] text-slate-400 uppercase tracking-widest font-bold">Your Net Balance Change</div>
          <div
            className={`text-3xl font-black font-mono-code mt-1 flex items-center justify-center gap-1.5 ${
              isWin ? 'text-emerald-400' : isLoss ? 'text-rose-400' : 'text-slate-200'
            }`}
          >
            <span>{result.netProfit >= 0 ? `+${formatCoinsCompact(result.netProfit)}` : `-${formatCoinsCompact(Math.abs(result.netProfit))}`}</span>
            <CoinLogo size="md" />
          </div>
          <div className="text-xs text-slate-400 mt-1 font-mono-code flex items-center justify-center gap-1.5">
            <span>Total Returned:</span>
            <CoinAmount amount={result.totalWon} compact={true} size="xs" />
            <span className="text-slate-600">•</span>
            <span>Your Wager:</span>
            <CoinAmount amount={result.totalBet} compact={true} size="xs" />
          </div>
        </div>

        {/* Anti-Cheat Hash verification pill */}
        <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
          <span className="font-mono-code text-slate-400 truncate max-w-[200px]">Hash: {result.roundHash.substring(0, 16)}...</span>
          <button
            onClick={() => {
              soundEngine.playButtonClick();
              onOpenAntiCheat();
            }}
            className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Verify Fair</span>
          </button>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            id="round-result-rebet-btn"
            onClick={() => {
              soundEngine.playButtonClick();
              onRebet();
            }}
            className="px-4 py-3 rounded-2xl btn-game-dark text-amber-300 font-cinzel font-bold text-xs uppercase tracking-wider border border-amber-500/40 flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Rebet Same</span>
          </button>

          <button
            id="round-result-next-btn"
            onClick={() => {
              soundEngine.playButtonClick();
              onNextRound();
            }}
            className="px-4 py-3 rounded-2xl btn-game-gold text-slate-950 font-cinzel font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>New Hand</span>
          </button>
        </div>
      </div>
    </div>
  );
};
