import React from 'react';
import { RoundResult } from '../types/game';
import { soundEngine } from '../utils/audio';
import { Sparkles, Trophy, ShieldCheck, Play, RotateCcw } from 'lucide-react';

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
  const hasNatural9 = result.playerHand.isNatural9 || result.bankerHand.isNatural9;

  return (
    <div className="fixed inset-0 pointer-events-none z-40 flex items-center justify-center p-4">
      <div className="pointer-events-auto w-full max-w-md bg-gradient-to-b from-slate-950/95 via-slate-900/95 to-slate-950/95 border-2 border-amber-400/90 rounded-3xl shadow-2xl p-6 sm:p-7 text-center backdrop-blur-xl animate-in zoom-in-95 duration-200 flex flex-col gap-4">
        {/* Title Badge */}
        <div>
          {hasNatural9 && (
            <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-yellow-400/30 to-amber-500/20 border border-amber-400 text-amber-300 font-black text-xs uppercase tracking-widest mb-3 animate-bounce shadow-lg">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>NATURAL 9 HIT!</span>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 mb-1">
            {isWin && <Trophy className="w-6 h-6 text-amber-400 animate-pulse" />}
            <h2 className="text-2xl sm:text-3xl font-black font-cinzel text-white tracking-wide">
              {result.winner === 'player'
                ? 'PLAYER WINS!'
                : result.winner === 'banker'
                ? 'BANKER WINS!'
                : 'TIE HAND!'}
            </h2>
          </div>

          <div className="text-xs text-slate-300 mt-2 flex items-center justify-center gap-4 bg-slate-950/60 py-1.5 px-4 rounded-xl border border-slate-800/80 mx-auto w-fit">
            <span className="flex items-center gap-1 font-mono-code">
              Player: <strong className="text-sky-400 font-black text-sm">{result.playerHand.score}</strong>
            </span>
            <span className="text-slate-600 font-bold">vs</span>
            <span className="flex items-center gap-1 font-mono-code">
              Banker: <strong className="text-rose-400 font-black text-sm">{result.bankerHand.score}</strong>
            </span>
          </div>
        </div>

        {/* Payout Outcome */}
        <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800 shadow-inner">
          <div className="text-[11px] text-slate-400 uppercase tracking-widest font-bold">Round Outcome</div>
          <div
            className={`text-3xl font-black font-mono-code mt-1 ${
              isWin ? 'text-emerald-400' : isLoss ? 'text-rose-400' : 'text-slate-200'
            }`}
          >
            {result.netProfit >= 0 ? `+$${result.netProfit.toLocaleString()}` : `-$${Math.abs(result.netProfit).toLocaleString()}`}
          </div>
          <div className="text-xs text-slate-400 mt-1 font-mono-code">
            Total Won: <span className="text-amber-300 font-bold">${result.totalWon.toLocaleString()}</span> (Wager: ${result.totalBet.toLocaleString()})
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
