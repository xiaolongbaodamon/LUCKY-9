import React, { useState, useEffect } from 'react';
import { PlayerProfile, SuspiciousActivityReport, AdminCoinGrant, LeaderboardUser } from '../types/game';
import { firebaseSync } from '../services/firebase';
import { soundEngine } from '../utils/audio';
import { formatCoinsCompact, formatCoinsFull, CoinLogo, CoinAmount } from '../utils/coins';
import {
  ShieldAlert,
  Coins,
  Users,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  X,
  Plus,
  Minus,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Send,
  History,
  Lock,
} from 'lucide-react';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: PlayerProfile;
  onCoinsUpdated: (newCoins: number) => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  currentProfile,
  onCoinsUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'reports' | 'coins' | 'players'>('reports');

  // Reports state
  const [reports, setReports] = useState<SuspiciousActivityReport[]>([]);
  const [reportFilter, setReportFilter] = useState<'ALL' | 'PENDING' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED'>('ALL');
  const [reportSearch, setReportSearch] = useState('');
  const [isRefreshingReports, setIsRefreshingReports] = useState(false);

  // Coin grant state
  const [targetPlayer, setTargetPlayer] = useState<string>(currentProfile.username);
  const [coinAmountInput, setCoinAmountInput] = useState<string>('100000');
  const [grantMode, setGrantMode] = useState<'ADD' | 'SET' | 'DEDUCT'>('ADD');
  const [grantReason, setGrantReason] = useState<string>('Admin Treasury Distribution');
  const [recentGrants, setRecentGrants] = useState<AdminCoinGrant[]>([]);
  const [isGranting, setIsGranting] = useState<boolean>(false);
  const [grantNotice, setGrantNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Players state
  const [playersList, setPlayersList] = useState<LeaderboardUser[]>([]);
  const [playerSearch, setPlayerSearch] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    loadAllData();
  }, [isOpen]);

  const loadAllData = async () => {
    // Load reports
    const repList = firebaseSync.getReports();
    setReports(repList);
    try {
      const cloudReports = await firebaseSync.fetchReportsFromFirestore();
      if (cloudReports && cloudReports.length > 0) {
        setReports(cloudReports);
      }
    } catch {
      // Ignore
    }

    // Load grants
    setRecentGrants(firebaseSync.getAdminGrants());

    // Load players
    const lbData = firebaseSync.getLeaderboard();
    setPlayersList(lbData.users);
  };

  if (!isOpen) return null;

  const handleRefreshReports = async () => {
    soundEngine.playButtonClick();
    setIsRefreshingReports(true);
    try {
      const cloudReports = await firebaseSync.fetchReportsFromFirestore();
      setReports(cloudReports);
    } finally {
      setIsRefreshingReports(false);
    }
  };

  const handleUpdateReportStatus = async (
    reportId: string,
    status: SuspiciousActivityReport['status']
  ) => {
    soundEngine.playButtonClick();
    await firebaseSync.updateReportStatus(reportId, status);
    setReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, status } : r))
    );
  };

  const handleQuickGrantFromReport = (targetName: string) => {
    setTargetPlayer(targetName);
    setActiveTab('coins');
    setCoinAmountInput('50000');
    setGrantReason(`Compensation / Review for report`);
  };

  const handleExecuteCoinGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseInt(coinAmountInput.replace(/,/g, ''), 10);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setGrantNotice({ type: 'error', message: 'Please specify a valid coin quantity.' });
      return;
    }
    if (!targetPlayer.trim()) {
      setGrantNotice({ type: 'error', message: 'Please select or type a recipient player.' });
      return;
    }

    setIsGranting(true);
    setGrantNotice(null);
    soundEngine.playChipStack();

    try {
      let finalAmount = parsedAmount;
      if (grantMode === 'DEDUCT') {
        finalAmount = -parsedAmount;
      }

      const res = await firebaseSync.giveUserCoins(targetPlayer.trim(), finalAmount, grantReason);
      if (res.success) {
        soundEngine.playWinFanfare();
        setGrantNotice({
          type: 'success',
          message: `Successfully transferred ${grantMode === 'DEDUCT' ? '-' : '+'}${formatCoinsFull(parsedAmount)} coins to ${res.targetName}! New balance: ${formatCoinsFull(res.newBalance)} 🪙`,
        });

        // If granted to current user, notify parent
        const isSelf =
          targetPlayer.trim().toLowerCase() === currentProfile.username.toLowerCase() ||
          targetPlayer.trim() === currentProfile.id ||
          targetPlayer.trim().toLowerCase() === 'me' ||
          targetPlayer.trim().toLowerCase() === 'admin';

        if (isSelf) {
          onCoinsUpdated(res.newBalance);
        }

        // Refresh grants and players
        setRecentGrants(firebaseSync.getAdminGrants());
        const lbData = firebaseSync.getLeaderboard();
        setPlayersList(lbData.users);
      }
    } catch (err: any) {
      setGrantNotice({ type: 'error', message: err?.message || 'Coin distribution failed' });
    } finally {
      setIsGranting(false);
    }
  };

  // Filtered reports
  const filteredReports = reports.filter((r) => {
    const matchesFilter = reportFilter === 'ALL' || r.status === reportFilter;
    const matchesSearch =
      r.targetPlayerName.toLowerCase().includes(reportSearch.toLowerCase()) ||
      r.reporterId.toLowerCase().includes(reportSearch.toLowerCase()) ||
      r.reason.toLowerCase().includes(reportSearch.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(reportSearch.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const pendingCount = reports.filter((r) => r.status === 'PENDING').length;

  const filteredPlayers = playersList.filter((p) =>
    p.username.toLowerCase().includes(playerSearch.toLowerCase()) ||
    p.title.toLowerCase().includes(playerSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl h-[90vh] max-h-[820px] bg-slate-900 border-2 border-amber-500/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-3.5 border-b border-amber-500/30 bg-slate-950/90 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-500/30 text-slate-950">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black font-cinzel text-white tracking-wider">
                  ADMIN CONTROL CENTER
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-400/40">
                  xiaolongbao312006@gmail.com
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Security Reports Monitor & Global Coin Treasury Management
              </p>
            </div>
          </div>

          <button
            id="close-admin-modal-btn"
            onClick={() => {
              soundEngine.playButtonClick();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 px-5 sm:px-7 py-2.5 bg-slate-950/50 border-b border-slate-800 flex-shrink-0 overflow-x-auto">
          <button
            id="admin-tab-reports"
            onClick={() => {
              soundEngine.playButtonClick();
              setActiveTab('reports');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-cinzel font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'reports'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>User Reports</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white font-mono-code text-[10px] font-bold">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            id="admin-tab-coins"
            onClick={() => {
              soundEngine.playButtonClick();
              setActiveTab('coins');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-cinzel font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'coins'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>Give Users Coins</span>
          </button>

          <button
            id="admin-tab-players"
            onClick={() => {
              soundEngine.playButtonClick();
              setActiveTab('players');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-cinzel font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'players'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Player Registry ({playersList.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 custom-scrollbar">
          {/* TAB 1: USER REPORTS */}
          {activeTab === 'reports' && (
            <div className="flex flex-col gap-4">
              {/* Filter bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(['ALL', 'PENDING', 'INVESTIGATING', 'RESOLVED', 'DISMISSED'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => {
                        soundEngine.playButtonClick();
                        setReportFilter(filter);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-mono-code font-bold transition-all cursor-pointer ${
                        reportFilter === filter
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1 sm:w-60">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={reportSearch}
                      onChange={(e) => setReportSearch(e.target.value)}
                      placeholder="Search reports..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none focus:border-amber-400"
                    />
                  </div>

                  <button
                    onClick={handleRefreshReports}
                    disabled={isRefreshingReports}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                    title="Refresh reports from Cloud"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshingReports ? 'animate-spin text-amber-400' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Reports List */}
              {filteredReports.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-slate-800 rounded-2xl">
                  <ShieldCheck className="w-12 h-12 text-emerald-400/60 mb-2" />
                  <h3 className="text-base font-cinzel font-bold text-white">No Reports Found</h3>
                  <p className="text-xs text-slate-400 max-w-sm mt-1">
                    No suspicious player activity reported matching current filters. All game rounds verified clean by Aegis Anti-Cheat.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {filteredReports.map((report) => (
                    <div
                      key={report.id}
                      className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col gap-3"
                    >
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`p-2 rounded-xl ${
                              report.status === 'PENDING'
                                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                : report.status === 'INVESTIGATING'
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            <ShieldAlert className="w-4 h-4" />
                          </div>

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-white">
                                Target: <span className="text-rose-400 font-mono-code">{report.targetPlayerName}</span>
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
                                Reason: {report.reason.replace(/_/g, ' ')}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                              <span>By: {report.reporterId}</span>
                              <span>•</span>
                              <span>{new Date(report.reportedAt).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-mono-code font-bold px-2.5 py-1 rounded-full uppercase ${
                              report.status === 'PENDING'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                                : report.status === 'INVESTIGATING'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            }`}
                          >
                            {report.status}
                          </span>
                        </div>
                      </div>

                      {/* Description & Round Hash */}
                      <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/80 text-xs text-slate-300">
                        <p className="leading-relaxed">{report.description || 'No additional details provided.'}</p>
                        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800/60 pt-1.5 font-mono-code">
                          <span>Attached Signature Hash: {report.roundHash}</span>
                          <span>Case ID: {report.id}</span>
                        </div>
                      </div>

                      {/* Admin Actions Bar */}
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleUpdateReportStatus(report.id, 'INVESTIGATING')}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-[11px] font-semibold cursor-pointer"
                          >
                            Mark Investigating
                          </button>
                          <button
                            onClick={() => handleUpdateReportStatus(report.id, 'RESOLVED')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-[11px] font-semibold cursor-pointer"
                          >
                            Mark Resolved
                          </button>
                          <button
                            onClick={() => handleUpdateReportStatus(report.id, 'DISMISSED')}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-[11px] font-semibold cursor-pointer"
                          >
                            Dismiss
                          </button>
                        </div>

                        <button
                          onClick={() => handleQuickGrantFromReport(report.targetPlayerName)}
                          className="px-3 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 text-[11px] font-cinzel font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          <Coins className="w-3.5 h-3.5" />
                          <span>Manage Coins for {report.targetPlayerName}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: GIVE USERS COINS */}
          {activeTab === 'coins' && (
            <div className="flex flex-col gap-6">
              {grantNotice && (
                <div
                  className={`p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
                    grantNotice.type === 'success'
                      ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300'
                      : 'bg-rose-950/80 border border-rose-500/50 text-rose-300'
                  }`}
                >
                  {grantNotice.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  <span>{grantNotice.message}</span>
                </div>
              )}

              {/* Coin Treasury Dispatcher */}
              <form onSubmit={handleExecuteCoinGrant} className="p-5 rounded-2xl bg-slate-950/70 border border-amber-500/30 flex flex-col gap-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
                      <Coins className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-cinzel font-bold text-white">Direct Coin Distribution</h3>
                      <p className="text-[11px] text-slate-400">Instant database & live wallet update</p>
                    </div>
                  </div>

                  {/* Quick Give to Admin Button */}
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playButtonClick();
                      setTargetPlayer(currentProfile.username);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-300 text-xs font-bold font-cinzel flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Select My Account ({currentProfile.username})</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Recipient Input */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                      <span>Target Recipient (Username or ID)</span>
                      <span className="text-[10px] text-amber-400 font-mono-code">
                        Current Profile: {currentProfile.username}
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        id="admin-input-recipient"
                        type="text"
                        value={targetPlayer}
                        onChange={(e) => setTargetPlayer(e.target.value)}
                        placeholder="e.g. DragonEmperor or xiaolongbao"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-amber-400 text-white text-xs outline-none"
                      />
                    </div>
                  </div>

                  {/* Operation Mode */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-300">Action Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setGrantMode('ADD')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          grantMode === 'ADD'
                            ? 'bg-emerald-500 text-slate-950 font-black shadow'
                            : 'bg-slate-900 text-slate-400 border border-slate-700 hover:text-white'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Coins (+)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setGrantMode('DEDUCT')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          grantMode === 'DEDUCT'
                            ? 'bg-rose-600 text-white font-black shadow'
                            : 'bg-slate-900 text-slate-400 border border-slate-700 hover:text-white'
                        }`}
                      >
                        <Minus className="w-3.5 h-3.5" />
                        <span>Deduct (-)</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Coin Amount Input and Presets */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">Amount of Coins</label>
                    <div className="text-xs font-mono-code font-bold text-amber-300 flex items-center gap-1">
                      <span>Preview:</span>
                      <CoinAmount amount={parseInt(coinAmountInput.replace(/,/g, '') || '0', 10)} compact={true} />
                      <span className="text-slate-400 text-[10px]">
                        ({parseInt(coinAmountInput.replace(/,/g, '') || '0', 10).toLocaleString()} full)
                      </span>
                    </div>
                  </div>

                  <div className="relative">
                    <input
                      id="admin-input-amount"
                      type="text"
                      value={coinAmountInput}
                      onChange={(e) => setCoinAmountInput(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="Amount in coins..."
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-amber-400 text-white font-mono-code text-sm font-bold outline-none"
                    />
                  </div>

                  {/* Preset Buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 mr-1">Presets:</span>
                    {[
                      { label: '+10K', value: 10000 },
                      { label: '+50K', value: 50000 },
                      { label: '+100K', value: 100000 },
                      { label: '+500K', value: 500000 },
                      { label: '+1.1M', value: 1100000 },
                      { label: '+5M', value: 5000000 },
                      { label: '+10M', value: 10000000 },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          soundEngine.playButtonClick();
                          setCoinAmountInput(preset.value.toString());
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-amber-400/50 text-amber-300 font-mono-code text-xs font-bold transition-all cursor-pointer"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reason */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-300">Grant Justification / Ledger Reason</label>
                  <input
                    type="text"
                    value={grantReason}
                    onChange={(e) => setGrantReason(e.target.value)}
                    placeholder="e.g. Compensation, High Roller Tournament Reward, Admin Test..."
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none focus:border-amber-400"
                  />
                </div>

                {/* Submit button */}
                <button
                  id="admin-execute-grant-btn"
                  type="submit"
                  disabled={isGranting}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 hover:brightness-110 active:scale-[0.99] text-slate-950 font-cinzel font-black text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
                >
                  <Coins className="w-4 h-4 text-slate-950" />
                  <span>
                    {isGranting
                      ? 'Executing Treasury Transfer...'
                      : `Transfer ${formatCoinsCompact(parseInt(coinAmountInput || '0', 10))} Coins to ${targetPlayer}`}
                  </span>
                </button>
              </form>

              {/* Recent Grants History */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-cinzel font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-amber-400" />
                    <span>Recent Treasury Grant Logs</span>
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono-code">
                    {recentGrants.length} logged actions
                  </span>
                </div>

                {recentGrants.length === 0 ? (
                  <div className="p-6 text-center rounded-2xl bg-slate-950/40 border border-slate-800 text-xs text-slate-500">
                    No coins have been granted during this session yet.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800 rounded-2xl bg-slate-950/60 border border-slate-800 overflow-hidden">
                    {recentGrants.map((grant) => (
                      <div key={grant.id} className="p-3 sm:px-4 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                            <Coins className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span>{grant.targetPlayerName}</span>
                              <span className="text-[10px] text-slate-400 font-normal">({grant.reason})</span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono-code">
                              {new Date(grant.grantedAt).toLocaleTimeString()} • By {grant.grantedBy}
                            </div>
                          </div>
                        </div>

                        <div className="text-right font-mono-code font-bold">
                          <span className={grant.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {grant.amount >= 0 ? '+' : ''}
                            {formatCoinsCompact(grant.amount)} 🪙
                          </span>
                          <div className="text-[10px] text-slate-500">
                            Balance: {formatCoinsCompact(grant.newBalance)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PLAYERS REGISTRY */}
          {activeTab === 'players' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={playerSearch}
                    onChange={(e) => setPlayerSearch(e.target.value)}
                    placeholder="Search player by name..."
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none focus:border-amber-400"
                  />
                </div>
                <div className="text-xs text-slate-400 font-mono-code">
                  Showing {filteredPlayers.length} active players
                </div>
              </div>

              <div className="divide-y divide-slate-800 rounded-2xl bg-slate-950/70 border border-slate-800 overflow-hidden">
                {filteredPlayers.map((player) => (
                  <div key={player.id} className="p-3 sm:px-4 flex items-center justify-between gap-3 hover:bg-slate-900/50 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl overflow-hidden border border-amber-400/40 bg-slate-800 flex-shrink-0 shadow">
                        <img src={player.avatarBase64} alt={player.username} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{player.username}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-medium">
                            {player.title}
                          </span>
                          {player.country && <span className="text-xs">{player.country}</span>}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>Winrate: {player.winrate}%</span>
                          <span>•</span>
                          <span>{player.wins} Wins</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <CoinAmount amount={player.coins} compact={true} size="sm" />
                        <div className="text-[10px] text-slate-400 font-mono-code">
                          {formatCoinsFull(player.coins)}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setTargetPlayer(player.username);
                          setActiveTab('coins');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-400/40 text-xs font-cinzel font-bold transition-all cursor-pointer shadow-sm"
                      >
                        + Give Coins
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
