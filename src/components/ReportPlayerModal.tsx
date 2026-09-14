import React, { useState } from 'react';
import { firebaseSync } from '../services/firebase';
import { soundEngine } from '../utils/audio';
import { ShieldAlert, Send, Check, X, AlertOctagon } from 'lucide-react';

interface ReportPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRoundHash?: string;
  reporterId: string;
  initialPlayerName?: string;
}

const VIOLATION_REASONS = [
  { value: 'SCORE_MANIPULATION', label: 'Score & Chip Manipulation Exploit' },
  { value: 'BOT_ACTIVITY', label: 'Automated Bot / Third-Party Macro Script' },
  { value: 'SPEED_HACK', label: 'Speed Hacking / Rapid Action Flooding' },
  { value: 'HARASSMENT', label: 'Offensive Table Conduct / Chat Harassment' },
  { value: 'OTHER', label: 'Other Suspicious Unfair Activity' },
];

export const ReportPlayerModal: React.FC<ReportPlayerModalProps> = ({
  isOpen,
  onClose,
  currentRoundHash = 'L9-A78F-M42B91',
  reporterId,
  initialPlayerName,
}) => {
  const [targetName, setTargetName] = useState(initialPlayerName || 'DragonEmperor');
  const [reason, setReason] = useState<any>('SCORE_MANIPULATION');
  const [description, setDescription] = useState('');
  const [submittedCaseId, setSubmittedCaseId] = useState<string | null>(null);

  React.useEffect(() => {
    if (initialPlayerName) {
      setTargetName(initialPlayerName);
    }
  }, [initialPlayerName]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playButtonClick();

    const report = firebaseSync.submitReport({
      targetPlayerId: `usr_${targetName.toLowerCase()}`,
      targetPlayerName: targetName,
      reporterId,
      reason,
      description: description || 'Flagged for suspicious gameplay pattern and score anomalies.',
      roundHash: currentRoundHash,
    });

    soundEngine.playWinFanfare();
    setSubmittedCaseId(report.id);
  };

  const handleResetAndClose = () => {
    soundEngine.playButtonClick();
    setSubmittedCaseId(null);
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-rose-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-cinzel text-white">Report Suspicious Activity</h2>
              <p className="text-xs text-slate-400">Aegis Fair Play Review Board</p>
            </div>
          </div>
          <button
            id="close-report-modal-btn"
            onClick={handleResetAndClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {submittedCaseId ? (
            <div className="flex flex-col items-center text-center gap-4 py-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/15 border-2 border-emerald-400 flex items-center justify-center text-emerald-400">
                <Check className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-cinzel text-white">Report Successfully Filed</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Case File Reference ID:{' '}
                  <span className="font-mono-code text-amber-400 font-bold">{submittedCaseId}</span>
                </p>
              </div>
              <p className="text-xs text-slate-300 max-w-sm leading-relaxed">
                The round logs, cryptographic seed verification, and packet timestamps have been securely archived for the Aegis Fair Play Board. Thank you for protecting the integrity of Lucky 9.
              </p>
              <button
                onClick={handleResetAndClose}
                className="mt-2 px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Close Window
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Player</label>
                <input
                  type="text"
                  value={targetName}
                  onChange={(e) => setTargetName(e.target.value)}
                  placeholder="Player username"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none focus:border-rose-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Violation Category</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none focus:border-rose-400"
                >
                  {VIOLATION_REASONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Attached Round Signature Hash
                </label>
                <div className="px-3.5 py-2 rounded-xl bg-slate-950/90 border border-slate-800 font-mono-code text-[11px] text-amber-400">
                  {currentRoundHash}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Detailed Description (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Describe the suspicious action, score jump, or abnormal timing..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none focus:border-rose-400 resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                  <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
                  <span>Submissions are permanent</span>
                </div>
                <button
                  type="submit"
                  id="submit-report-btn"
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-cinzel font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-rose-600/30"
                >
                  <Send className="w-3.5 h-3.5" />
                  Submit Report
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
