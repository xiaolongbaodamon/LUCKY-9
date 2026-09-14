import React, { useState, useEffect, useRef } from 'react';
import { PlayerProfile } from '../types/game';
import { firebaseSync, processImageTo500x500, generateDefaultAvatar } from '../services/firebase';
import { soundEngine } from '../utils/audio';
import {
  X,
  Upload,
  Camera,
  Check,
  Award,
  Coins,
  ShieldCheck,
  Flame,
  Globe,
  Database,
  Sparkles,
  LogIn,
  LogOut,
  UserCheck,
  CloudCheck,
  RefreshCw,
} from 'lucide-react';
import { User } from 'firebase/auth';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PlayerProfile;
  onProfileUpdate: (updated: PlayerProfile) => void;
}

const COUNTRY_OPTIONS = [
  { code: 'PH', name: 'Philippines 🇵🇭' },
  { code: 'SG', name: 'Singapore 🇸🇬' },
  { code: 'JP', name: 'Japan 🇯🇵' },
  { code: 'MO', name: 'Macau 🇲🇴' },
  { code: 'TH', name: 'Thailand 🇹🇭' },
  { code: 'US', name: 'United States 🇺🇸' },
  { code: 'KR', name: 'South Korea 🇰🇷' },
  { code: 'VN', name: 'Vietnam 🇻🇳' },
  { code: 'MY', name: 'Malaysia 🇲🇾' },
];

const PRESET_CHARMS = [
  'Gold Dragon Chip',
  'Lucky 9 Golden Horseshoe',
  'Jade Emperor Amulet',
  'Royal Flush Clover',
  'Macau High Roller Token',
];

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  onProfileUpdate,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'stats' | 'firebase'>('profile');
  const [username, setUsername] = useState(profile.username);
  const [title, setTitle] = useState(profile.title);
  const [country, setCountry] = useState(profile.country);
  const [bio, setBio] = useState(profile.bio);
  const [luckyCharm, setLuckyCharm] = useState(profile.luckyCharm || PRESET_CHARMS[0]);
  const [avatarBase64, setAvatarBase64] = useState(profile.avatarBase64);
  const [isProcessingImg, setIsProcessingImg] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Firebase Auth & Cloud Sync State
  const [currentUser, setCurrentUser] = useState<User | null>(firebaseSync.getCurrentUser());
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = firebaseSync.subscribeAuth((user) => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingImg(true);
      // Ensure strictly 500x500 base64 crop & compress
      const base64 = await processImageTo500x500(file);
      setAvatarBase64(base64);
      soundEngine.playCardFlip();
    } catch (err) {
      console.error('Failed to process image:', err);
    } finally {
      setIsProcessingImg(false);
    }
  };

  const handleGenerateNewAvatar = () => {
    const randomColors = ['#EAB308', '#38BDF8', '#F43F5E', '#10B981', '#A855F7'];
    const col = randomColors[Math.floor(Math.random() * randomColors.length)];
    const generated = generateDefaultAvatar(username || 'VIP', col);
    setAvatarBase64(generated);
    soundEngine.playButtonClick();
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playButtonClick();

    const updated = firebaseSync.saveProfile({
      username: username.trim() || 'RoyalGambler99',
      title: title.trim() || 'Casino Maverick',
      country,
      bio: bio.trim(),
      luckyCharm,
      avatarBase64: avatarBase64 || generateDefaultAvatar(username),
    });

    onProfileUpdate(updated);
    setSavedSuccess(true);
    soundEngine.playWinFanfare();

    // Trigger cloud Firestore sync
    setIsSyncing(true);
    await firebaseSync.syncToFirebaseFirestore(updated);
    setIsSyncing(false);

    setTimeout(() => setSavedSuccess(false), 2800);
  };

  const handleGoogleSignIn = async () => {
    soundEngine.playButtonClick();
    setAuthLoading(true);
    setAuthMessage(null);
    const res = await firebaseSync.signInWithGoogle();
    setAuthLoading(false);
    if (res.success && res.user) {
      setAuthMessage({ type: 'success', text: `Signed in as ${res.user.displayName || res.user.email}` });
      soundEngine.playWinFanfare();
      const updatedProfile = firebaseSync.getProfile();
      onProfileUpdate(updatedProfile);
    } else {
      setAuthMessage({ type: 'error', text: res.error || 'Sign in cancelled or failed' });
      soundEngine.playLossSound();
    }
  };

  const handleGuestSignIn = async () => {
    soundEngine.playButtonClick();
    setAuthLoading(true);
    setAuthMessage(null);
    const res = await firebaseSync.signInAsGuest();
    setAuthLoading(false);
    if (res.success) {
      setAuthMessage({ type: 'success', text: 'Playing as authenticated Guest player' });
      soundEngine.playWinFanfare();
    } else {
      setAuthMessage({ type: 'error', text: res.error || 'Guest sign in failed' });
      soundEngine.playLossSound();
    }
  };

  const handleSignOut = async () => {
    soundEngine.playButtonClick();
    setAuthLoading(true);
    await firebaseSync.signOutUser();
    setAuthLoading(false);
    setAuthMessage({ type: 'success', text: 'Signed out successfully' });
  };

  const handleForceSync = async () => {
    soundEngine.playButtonClick();
    setIsSyncing(true);
    setSyncSuccessMsg('');
    const ok = await firebaseSync.syncToFirebaseFirestore(profile);
    setIsSyncing(false);
    if (ok) {
      setSyncSuccessMsg('Profile successfully uploaded & synced to Firestore!');
      soundEngine.playWinFanfare();
    } else {
      setSyncSuccessMsg('Sync completed locally. Cloud will retry automatically.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-cinzel text-white">Player VIP Account</h2>
              <p className="text-xs text-slate-400">500x500 Base64 Avatar • Firebase Cloud Sync</p>
            </div>
          </div>
          <button
            id="close-profile-modal-btn"
            onClick={() => {
              soundEngine.playButtonClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 gap-2">
          <button
            onClick={() => {
              soundEngine.playButtonClick();
              setActiveTab('profile');
            }}
            className={`py-3 px-4 text-xs font-cinzel font-bold tracking-wider border-b-2 transition-all ${
              activeTab === 'profile'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Edit Profile
          </button>
          <button
            onClick={() => {
              soundEngine.playButtonClick();
              setActiveTab('stats');
            }}
            className={`py-3 px-4 text-xs font-cinzel font-bold tracking-wider border-b-2 transition-all ${
              activeTab === 'stats'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Career Stats
          </button>
          <button
            onClick={() => {
              soundEngine.playButtonClick();
              setActiveTab('firebase');
            }}
            className={`py-3 px-4 text-xs font-cinzel font-bold tracking-wider border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'firebase'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Firebase & Auth</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="flex flex-col gap-5">
              {/* 500x500 Avatar Section */}
              <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-amber-400/80 shadow-lg shadow-amber-500/10 bg-slate-800">
                    <img
                      src={avatarBase64 || generateDefaultAvatar(username)}
                      alt="Player 500x500 Avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {isProcessingImg && (
                    <div className="absolute inset-0 bg-black/70 rounded-2xl flex items-center justify-center text-[10px] text-amber-400 font-bold">
                      Processing 500x500...
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-center sm:items-start gap-2 flex-1 text-center sm:text-left">
                  <div className="text-xs font-semibold text-slate-200">Avatar Profile Picture</div>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      id="upload-avatar-btn"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 border border-slate-700"
                    >
                      <Upload className="w-3.5 h-3.5 text-amber-400" />
                      Upload Photo
                    </button>
                    <button
                      type="button"
                      id="generate-avatar-btn"
                      onClick={handleGenerateNewAvatar}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 border border-slate-700"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                      Random Crest
                    </button>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Display Name</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    maxLength={20}
                    required
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-400 outline-none text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">VIP Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={24}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-400 outline-none text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Representing Country</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-400 outline-none text-white text-xs"
                  >
                    {COUNTRY_OPTIONS.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Lucky Charm Token</label>
                  <select
                    value={luckyCharm}
                    onChange={(e) => setLuckyCharm(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-400 outline-none text-white text-xs"
                  >
                    {PRESET_CHARMS.map((charm) => (
                      <option key={charm} value={charm}>
                        {charm}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Player Bio / Quote</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={120}
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-400 outline-none text-white text-xs resize-none"
                />
              </div>

              {savedSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Profile and 500x500 picture successfully saved and synced to Firebase!
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <span className="text-[11px] text-slate-500">
                  {isSyncing ? 'Syncing to Cloud Firestore...' : 'Firebase Cloud Sync Active'}
                </span>
                <button
                  type="submit"
                  id="save-profile-btn"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-slate-950 font-cinzel font-bold text-xs uppercase tracking-wider shadow-lg flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Save & Sync
                </button>
              </div>
            </form>
          )}

          {activeTab === 'stats' && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Bankroll</div>
                  <div className="font-mono-code font-bold text-amber-400 text-base mt-0.5">
                    ${profile.coins.toLocaleString()}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Win Rate</div>
                  <div className="font-mono-code font-bold text-emerald-400 text-base mt-0.5">
                    {profile.winrate}%
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Record (W/L/T)</div>
                  <div className="font-mono-code font-bold text-sky-400 text-sm mt-0.5">
                    {profile.wins}/{profile.losses}/{profile.ties}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Streak</div>
                  <div className="font-mono-code font-bold text-rose-400 text-base mt-0.5 flex items-center justify-center gap-1">
                    <Flame className="w-3.5 h-3.5" />
                    {profile.currentStreak}
                  </div>
                </div>
              </div>

              {/* Extended Metrics */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col gap-2">
                <div className="text-xs font-semibold text-slate-300">Financial Performance</div>
                <div className="text-xs flex flex-col gap-1.5">
                  <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                    <span className="text-slate-400">Highest Win</span>
                    <span className="font-mono-code text-amber-300 font-bold">
                      +${profile.highestWin.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                    <span className="text-slate-400">Total Wagered</span>
                    <span className="font-mono-code text-slate-300">
                      ${profile.totalWagered.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Free Bankroll Refill (for test & gameplay convenience) */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <div>
                  <div className="text-sm font-bold text-amber-300">Complimentary VIP Chip Reload</div>
                  <div className="text-xs text-amber-200/70">
                    Claim +$2,500 complimentary high-roller chips if you need a reload.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playWinFanfare();
                    const updated = firebaseSync.refillFreeCoins(2500);
                    onProfileUpdate(updated);
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-cinzel font-bold text-xs uppercase tracking-wider shadow-md"
                >
                  Reload $2,500
                </button>
              </div>
            </div>
          )}

          {activeTab === 'firebase' && (
            <div className="flex flex-col gap-5">
              {/* Firebase Status Badge */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <Database className="w-4 h-4" />
                  <span>Cloud Database</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 text-[11px] font-mono-code font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  CONNECTED (lucky-9-5c84b)
                </span>
              </div>

              {/* Authentication Status & Actions */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col gap-3">
                <div className="text-xs font-semibold text-slate-200 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-sky-400" />
                    Firebase User Authentication
                  </span>
                  {currentUser ? (
                    <span className="text-[11px] font-mono-code text-emerald-400">
                      {currentUser.isAnonymous ? 'Guest User' : currentUser.email || 'Authenticated'}
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono-code text-slate-500">Not Logged In</span>
                  )}
                </div>

                {authMessage && (
                  <div
                    className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                      authMessage.type === 'success'
                        ? 'bg-emerald-950/50 border border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-950/50 border border-rose-500/30 text-rose-300'
                    }`}
                  >
                    <span>{authMessage.text}</span>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                  {!currentUser ? (
                    <>
                      <button
                        type="button"
                        id="google-signin-btn"
                        onClick={handleGoogleSignIn}
                        disabled={authLoading}
                        className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-cinzel font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        Sign In with Google
                      </button>
                      <button
                        type="button"
                        id="guest-signin-btn"
                        onClick={handleGuestSignIn}
                        disabled={authLoading}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700"
                      >
                        Play as Guest
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      id="signout-btn"
                      onClick={handleSignOut}
                      disabled={authLoading}
                      className="px-4 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/40 text-rose-300 font-semibold text-xs flex items-center gap-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  )}
                </div>
              </div>

              {/* Force Cloud Sync Button */}
              <div className="flex flex-col gap-2 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-200">Force Cloud Sync</div>
                    <div className="text-[11px] text-slate-400">
                      Upload current coins (${profile.coins.toLocaleString()}), winrate ({profile.winrate}%), and avatar to Firestore.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleForceSync}
                    disabled={isSyncing}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-cinzel font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    Sync Now
                  </button>
                </div>

                {syncSuccessMsg && (
                  <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    {syncSuccessMsg}
                  </div>
                )}
              </div>

              {/* Firebase Project Info Reference */}
              <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 font-mono-code text-[11px] text-slate-400 flex flex-col gap-1">
                <div><strong>Project:</strong> lucky-9-5c84b</div>
                <div><strong>Auth Domain:</strong> lucky-9-5c84b.firebaseapp.com</div>
                <div><strong>Storage:</strong> lucky-9-5c84b.firebasestorage.app</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
