import React, { useState } from 'react';
import { PlayerProfile } from '../types/game';
import { firebaseSync } from '../services/firebase';
import { soundEngine } from '../utils/audio';
import { ALL_COUNTRIES } from '../data/countries';
import {
  Crown,
  RefreshCw,
  Globe2,
  ChevronRight,
  Mail,
  Lock,
  User,
  LogIn,
  UserPlus,
} from 'lucide-react';

interface AuthScreenProps {
  onAuthenticated: (profile: PlayerProfile) => void;
}

const DEFAULT_VIP_NAMES = [
  'DragonEmperor',
  'ManilaAce',
  'GoldenNine',
  'HighRollerVIP',
  'LuckyStriker',
  'CebuCardShark',
  'SolarMaverick',
  'DiamondBaccarat',
];

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated }) => {
  const [authMode, setAuthMode] = useState<'register' | 'login'>('register');

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState(
    DEFAULT_VIP_NAMES[Math.floor(Math.random() * DEFAULT_VIP_NAMES.length)]
  );
  const [country, setCountry] = useState('PH');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRandomizeName = () => {
    soundEngine.playButtonClick();
    const randomName =
      DEFAULT_VIP_NAMES[Math.floor(Math.random() * DEFAULT_VIP_NAMES.length)] +
      Math.floor(Math.random() * 90 + 10);
    setUsername(randomName);
  };

  // Register Handler
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorMessage('Please enter your player name.');
      return;
    }
    if (!email.trim() || !password) {
      setErrorMessage('Please enter your email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    soundEngine.playChipStack();

    try {
      const res = await firebaseSync.registerWithEmailPassword(
        email,
        password,
        username,
        country,
        'Player'
      );
      if (res.success && res.profile) {
        soundEngine.playWinFanfare(false);
        onAuthenticated(res.profile);
      } else {
        setErrorMessage(res.error || 'Registration failed. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  // Login Handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('Please enter your email or username and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    soundEngine.playChipStack();

    try {
      const res = await firebaseSync.loginWithEmailPassword(email, password);
      if (res.success && res.profile) {
        soundEngine.playWinFanfare(false);
        onAuthenticated(res.profile);
      } else {
        setErrorMessage(res.error || 'Invalid credentials. Please verify your details.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Login error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  // Google / Gmail Sign In Handler
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    soundEngine.playButtonClick();

    try {
      const res = await firebaseSync.signInWithGoogle();
      if (res.success && res.profile) {
        soundEngine.playWinFanfare(false);
        onAuthenticated(res.profile);
      } else {
        setErrorMessage(res.error || 'Google sign-in was cancelled or unavailable.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Google sign-in failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-y-auto bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 text-slate-100 select-none">
      {/* Subtle ambient lighting */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[550px] h-[550px] bg-amber-500/10 rounded-full blur-[130px]" />
        <div className="absolute bottom-0 left-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md flex flex-col items-center gap-5 my-auto">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center gap-1.5">
          <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 p-[2px] shadow-xl shadow-amber-500/20">
            <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center">
              <Crown className="w-8 h-8 text-amber-400" />
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black font-cinzel tracking-wider text-white mt-2">
            LUCKY 9 ROYALE
          </h1>
        </div>

        {/* Casino Entrance Card */}
        <div className="w-full p-5 sm:p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl flex flex-col gap-4">
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-950 border border-slate-800">
            <button
              id="auth-tab-register"
              type="button"
              onClick={() => {
                soundEngine.playButtonClick();
                setAuthMode('register');
                setErrorMessage(null);
              }}
              className={`py-2 rounded-lg font-cinzel font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                authMode === 'register'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register</span>
            </button>
            <button
              id="auth-tab-login"
              type="button"
              onClick={() => {
                soundEngine.playButtonClick();
                setAuthMode('login');
                setErrorMessage(null);
              }}
              className={`py-2 rounded-lg font-cinzel font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                authMode === 'login'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login</span>
            </button>
          </div>

          {/* Connect to Gmail Button */}
          <button
            id="auth-connect-gmail-btn"
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-white text-xs font-semibold flex items-center justify-center gap-2.5 transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Connect with Gmail</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-slate-800" />
            <span className="absolute px-2.5 bg-slate-900 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
              OR
            </span>
          </div>

          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs">
              {errorMessage}
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={authMode === 'register' ? handleRegister : handleLogin}
            className="flex flex-col gap-3.5"
          >
            {/* Email Field */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{authMode === 'register' ? 'Email Address' : 'Email or Username'}</span>
              </label>
              <input
                id="auth-input-email"
                type={authMode === 'register' ? 'email' : 'text'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder={authMode === 'register' ? 'youremail@example.com' : 'Enter email or username'}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-400 focus:outline-none text-white text-xs placeholder-slate-500"
              />
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Password</span>
              </label>
              <input
                id="auth-input-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter password..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-400 focus:outline-none text-white text-xs placeholder-slate-500"
              />
            </div>

            {/* Register Specific Fields */}
            {authMode === 'register' && (
              <>
                {/* Username Input */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Player name</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleRandomizeName}
                      className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-mono-code cursor-pointer"
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      Randomize
                    </button>
                  </div>
                  <input
                    id="auth-input-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    maxLength={24}
                    required
                    placeholder="Enter player name..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-400 focus:outline-none text-white text-xs placeholder-slate-500"
                  />
                </div>

                {/* Country Selector */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Globe2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Country</span>
                  </label>

                  <select
                    id="auth-select-country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-amber-400 focus:outline-none cursor-pointer"
                  >
                    {ALL_COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Submit Button */}
            <button
              id="auth-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full mt-3 py-3.5 rounded-2xl btn-game-gold text-slate-950 font-cinzel font-black text-sm tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Connecting...</span>
                </div>
              ) : (
                <>
                  <span>{authMode === 'register' ? 'Register & Enter Table' : 'Sign In & Enter Table'}</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
