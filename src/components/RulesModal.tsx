import React from 'react';
import { soundEngine } from '../utils/audio';
import { BookOpen, X, Sparkles, Trophy, HelpCircle, Check, ArrowRight } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-cinzel text-white">How to Play Lucky 9</h2>
              <p className="text-xs text-slate-400">Authentic Card Scoring, Natural Naturals & Drawing Rules</p>
            </div>
          </div>
          <button
            id="close-rules-btn"
            onClick={() => {
              soundEngine.playButtonClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex flex-col gap-6 text-xs text-slate-300 leading-relaxed">
          {/* Objective */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col gap-2">
            <h3 className="font-cinzel font-bold text-amber-400 text-sm flex items-center gap-1.5">
              <Trophy className="w-4 h-4" />
              Game Objective
            </h3>
            <p>
              Lucky 9 is a beloved card game where the goal is to form a hand with a point value closest to{' '}
              <strong className="text-amber-300">9</strong>. The total value is calculated by adding the values of all cards in the hand and taking the last digit (modulo 10).
            </p>
          </div>

          {/* Card Values */}
          <div>
            <h3 className="font-cinzel font-bold text-white text-sm mb-3">Card Point Values</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                <div className="text-amber-400 font-bold font-cinzel text-base">Ace (A)</div>
                <div className="text-slate-400 mt-1">1 Point</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                <div className="text-sky-400 font-bold font-cinzel text-base">2 to 9</div>
                <div className="text-slate-400 mt-1">Face Value (2 - 9 Pts)</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                <div className="text-rose-400 font-bold font-cinzel text-base">10, J, Q, K</div>
                <div className="text-slate-400 mt-1">0 Points</div>
              </div>
            </div>
          </div>

          {/* Naturals: Natural 9 and Natural 8 */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col gap-2">
            <h3 className="font-cinzel font-bold text-amber-300 text-sm flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              Naturals (Instant Win)
            </h3>
            <ul className="list-disc list-inside space-y-1 text-slate-200">
              <li>
                <strong className="text-amber-300">Natural 9:</strong> The first two cards total 9 (e.g. 9+K, 4+5, A+8). Highest hand in the game! Beats any 3-card hand and pays 2:1 on Player bet.
              </li>
              <li>
                <strong className="text-amber-200">Natural 8:</strong> The first two cards total 8 (e.g. 8+10, 3+5, A+7). Beats all non-natural hands.
              </li>
              <li>If either side holds a Natural 8 or 9, no third card is ever drawn.</li>
            </ul>
          </div>

          {/* Third Card Drawing Rules */}
          <div>
            <h3 className="font-cinzel font-bold text-white text-sm mb-2">Third Card Rules</h3>
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col gap-3">
              <div className="flex items-start gap-2">
                <div className="px-2 py-0.5 rounded bg-sky-900 text-sky-200 font-mono-code text-[11px] font-bold">
                  Player Hand
                </div>
                <div className="text-slate-300">
                  Total <strong>0 - 4:</strong> Must draw 3rd card (Hit).<br />
                  Total <strong>5:</strong> Optional (Player choice to Hit or Stand).<br />
                  Total <strong>6 - 7:</strong> Must Stand.
                </div>
              </div>
              <div className="flex items-start gap-2 pt-2 border-t border-slate-800">
                <div className="px-2 py-0.5 rounded bg-rose-900 text-rose-200 font-mono-code text-[11px] font-bold">
                  Banker Hand
                </div>
                <div className="text-slate-300">
                  Banker draws if total is <strong>0 - 5</strong>; stands on <strong>6 - 9</strong>.
                </div>
              </div>
            </div>
          </div>

          {/* Payout Table */}
          <div>
            <h3 className="font-cinzel font-bold text-white text-sm mb-2">Bet Payouts</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between">
                <span>Player Win</span>
                <span className="font-bold text-amber-400">1:1 (Natural: 2:1)</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between">
                <span>Banker Win</span>
                <span className="font-bold text-amber-400">1:1</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between">
                <span>Tie Hand</span>
                <span className="font-bold text-emerald-400">8:1</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between">
                <span>Natural 9 Side Bet</span>
                <span className="font-bold text-amber-400">3:1</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/70 text-right">
          <button
            onClick={() => {
              soundEngine.playButtonClick();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-cinzel font-bold text-xs uppercase"
          >
            Got It, Let's Play
          </button>
        </div>
      </div>
    </div>
  );
};
