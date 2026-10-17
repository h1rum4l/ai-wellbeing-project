import React, { useState, useEffect } from 'react';
import {
  LogIn,
  UserPlus,
  LogOut,
  Download,
  Trash2,
  Lock,
  Mail,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Sparkles,
  Trophy,
  Flame,
} from 'lucide-react';
import { PrivacyPreferences, UserAccount } from '../../types';
import { store } from '../../storage/store';
import { getLevelInfo, habitsStore } from '../../storage/habitsStore';
import { StressinaPanda } from '../mascot/StressinaPanda';
import { triggerHaptic } from '../../utils/haptics';

interface AccountTabProps {
  currentUser: UserAccount | null;
  onUserChanged: (user: UserAccount | null) => void;
}

export const AccountTab: React.FC<AccountTabProps> = ({ currentUser, onUserChanged }) => {
  // Mode when logged out
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register form
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

  // Profile update
  const [profileName, setProfileName] = useState(currentUser?.display_name || '');
  const [profileMessage, setProfileMessage] = useState('');

  // Privacy preferences
  const [prefs, setPrefs] = useState<PrivacyPreferences>({
    save_assessments: true,
    save_chats: true,
    save_games: true,
  });
  const [prefsMessage, setPrefsMessage] = useState('');

  // Account deletion
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.display_name);
      setPrefs(store.getPreferences(currentUser.id));
    }
  }, [currentUser]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('medium');
    setLoginError('');
    const user = store.authenticateUser(loginEmail, loginPassword);
    if (user) {
      triggerHaptic('success');
      onUserChanged(user);
    } else {
      triggerHaptic('warning');
      setLoginError('Email or password was not recognized. Please check your credentials or register first.');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('medium');
    setRegError('');
    setRegSuccess('');

    if (regPassword !== regConfirm) {
      triggerHaptic('warning');
      setRegError('The passwords do not match.');
      return;
    }

    const res = store.registerUser(regEmail, regName, regPassword);
    if (res.ok && res.user) {
      triggerHaptic('levelUp');
      setRegSuccess(res.message);
      onUserChanged(res.user);
    } else {
      triggerHaptic('warning');
      setRegError(res.message);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      triggerHaptic('success');
      store.updateProfile(currentUser.id, profileName);
      setProfileMessage('Display name updated successfully.');
      onUserChanged({ ...currentUser, display_name: profileName });
      setTimeout(() => setProfileMessage(''), 3000);
    } catch (err: any) {
      triggerHaptic('warning');
      setProfileMessage(err.message || 'Failed to update name.');
    }
  };

  const handleTogglePref = (key: keyof PrivacyPreferences) => {
    if (!currentUser) return;
    triggerHaptic('selection');
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    store.updatePreferences(currentUser.id, updated);
    setPrefsMessage('Privacy preferences saved.');
    setTimeout(() => setPrefsMessage(''), 3000);
  };

  const handleExportData = () => {
    if (!currentUser) return;
    triggerHaptic('light');
    const data = store.exportPersonalData(currentUser.id);
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai_wellbeing_records_${currentUser.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDeleteAccount = () => {
    if (!currentUser || !confirmDelete) return;
    triggerHaptic('heavy');
    store.deleteAccount(currentUser.id);
    onUserChanged(null);
  };

  const handleSignOut = () => {
    triggerHaptic('light');
    store.setCurrentUser(null);
    onUserChanged(null);
  };

  // If user is signed in: show Account Management in light liquid glass
  if (currentUser) {
    return (
      <div className="space-y-6 max-w-3xl">
        <div className="liquid-glass-card rounded-3xl p-6 sm:p-8 space-y-6 relative overflow-hidden border border-white/90">
          
          {/* User Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center font-extrabold text-lg shadow-xs">
                {currentUser.display_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                    {currentUser.display_name}
                  </h3>
                  <span className="text-[10px] text-emerald-900 font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-300">
                    Active Session
                  </span>
                </div>
                <p className="text-xs text-slate-500">{currentUser.email}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              className="px-4 py-2 rounded-xl text-xs font-bold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>

          {/* Wellness Marks & Habits Overview */}
          {(() => {
            const habitProfile = habitsStore.getProfile(currentUser.id);
            const levelInfo = getLevelInfo(habitProfile.totalMarks);
            return (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-white/70 border border-slate-200">
                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-bold text-emerald-800 flex items-center gap-1">
                    <Trophy className="w-3 h-3 text-emerald-700" />
                    <span>Wellness Marks</span>
                  </div>
                  <div className="text-xl font-black text-slate-900 font-mono">
                    {habitProfile.totalMarks} <span className="text-xs text-slate-500 font-sans font-normal">pts</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-bold text-teal-800 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-teal-700" />
                    <span>Rank & Level</span>
                  </div>
                  <div className="text-sm font-bold text-slate-800">
                    Lvl {levelInfo.level} · {levelInfo.title}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-bold text-amber-800 flex items-center gap-1">
                    <Flame className="w-3 h-3 text-amber-600" />
                    <span>Consistency Streak</span>
                  </div>
                  <div className="text-sm font-bold text-amber-700">
                    {habitProfile.currentStreak} {habitProfile.currentStreak === 1 ? 'Day' : 'Days'} Active
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Profile Name Update */}
          <form onSubmit={handleSaveProfile} className="space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Profile Information
            </h4>
            {profileMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs">
                {profileMessage}
              </div>
            )}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full liquid-input px-3.5 py-2.5 rounded-xl text-xs font-medium"
                placeholder="Display Name"
              />
              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl liquid-button-sage text-xs font-bold whitespace-nowrap cursor-pointer shadow-xs"
              >
                Save Name
              </button>
            </div>
          </form>

          {/* Privacy Preferences */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Data Persistence & Privacy Vault
            </h4>
            {prefsMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs">
                {prefsMessage}
              </div>
            )}
            <div className="space-y-2.5">
              {[
                { key: 'save_assessments' as const, label: 'Save my stress assessments to longitudinal timeline' },
                { key: 'save_chats' as const, label: 'Store confidential dialogue with Stressina locally' },
                { key: 'save_games' as const, label: 'Record relaxation games & breathing scores' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center justify-between p-3 rounded-xl bg-white/70 border border-slate-200 cursor-pointer">
                  <span className="text-xs text-slate-700 font-medium">{label}</span>
                  <input
                    type="checkbox"
                    checked={prefs[key]}
                    onChange={() => handleTogglePref(key)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-0 cursor-pointer"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Data Export & Account Deletion */}
          <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleExportData}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl liquid-button-clear text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4 text-emerald-700" />
              <span>Export Personal Data (JSON)</span>
            </button>

            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('warning');
                  setConfirmDelete(true);
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 cursor-pointer"
              >
                Delete Account
              </button>
            ) : (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 cursor-pointer shadow-sm"
                >
                  Confirm Delete
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setConfirmDelete(false);
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-white border border-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // If user is logged out: show Sign-In / Register card in serene light liquid glass
  return (
    <div className="max-w-xl mx-auto space-y-6 text-slate-800">
      <div className="liquid-glass-card rounded-3xl p-6 sm:p-9 relative overflow-hidden border border-white/90 shadow-xl">
        <div className="mb-6 relative z-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/90 border border-emerald-100 flex items-center justify-center mx-auto mb-3 shadow-xs">
            <StressinaPanda
              pose="safe_space"
              expression="empathetic"
              size="xs"
              showLotusPlatform={false}
              showAura={false}
            />
          </div>
          <div className="inline-block mb-1">
            <span className="text-[11px] font-black tracking-wider uppercase bg-gradient-to-r from-emerald-600 via-teal-600 to-lime-600 bg-clip-text text-transparent">
              Stressina.Ai Sanctuary Vault
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {authMode === 'login' ? 'Sign In to Your Sanctuary' : 'Create Wellness Profile'}
          </h3>
          <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
            {authMode === 'login'
              ? 'Enter your credentials to unlock longitudinal stress trend lines and confidential records.'
              : 'Join to preserve your physiological assessments, breathing milestones, and chat logs.'}
          </p>
        </div>

        {/* Sleek Apple iOS Segmented Switch */}
        <div className="flex p-1 rounded-2xl bg-slate-100/90 border border-slate-200/90 mb-6 relative z-10 shadow-inner">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              setAuthMode('login');
              setLoginError('');
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              authMode === 'login'
                ? 'bg-white text-emerald-800 shadow-sm border border-emerald-100 font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-emerald-700" />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              setAuthMode('register');
              setRegError('');
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              authMode === 'register'
                ? 'bg-white text-emerald-800 shadow-sm border border-emerald-100 font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
            <span>Create Profile</span>
            <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[9px] font-mono font-extrabold">+50</span>
          </button>
        </div>

        {/* 1-Tap Quick Demo Login Card */}
        {authMode === 'login' && (
          <div className="mb-5 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50/95 via-teal-50/80 to-emerald-50/95 border border-emerald-200/90 flex items-center justify-between gap-3 shadow-xs relative z-10">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl select-none">🐼</span>
              <div>
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span>Quick Demo Sign-In</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-200 text-emerald-900">Maya Lin</span>
                </div>
                <div className="text-[10px] text-slate-500">Includes saved stress timeline, habits & 120 marks</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('success');
                const user = store.authenticateUser('maya@example.com', 'password123');
                if (user) onUserChanged(user);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white text-xs font-extrabold transition-all shadow-xs shrink-0 cursor-pointer"
            >
              1-Tap In
            </button>
          </div>
        )}

        {/* Login Form */}
        {authMode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4 relative z-10">
            {loginError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 shadow-xs">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-medium">{loginError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-emerald-700" />
                <span>Email Address</span>
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onFocus={() => triggerHaptic('selection')}
                onChange={(e) => {
                  triggerHaptic('selection');
                  setLoginEmail(e.target.value);
                }}
                placeholder="name@example.com (or maya@example.com)"
                className="w-full liquid-input px-3.5 py-2.5 rounded-xl text-xs font-medium border border-white bg-white/80 focus:bg-white text-slate-900"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-700" />
                <span>Password</span>
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onFocus={() => triggerHaptic('selection')}
                onChange={(e) => {
                  triggerHaptic('selection');
                  setLoginPassword(e.target.value);
                }}
                placeholder="•••••••• (or password123)"
                className="w-full liquid-input px-3.5 py-2.5 rounded-xl text-xs font-medium border border-white bg-white/80 focus:bg-white text-slate-900"
              />
            </div>

            <button
              type="submit"
              className="w-full liquid-button-sage py-3.5 rounded-full text-xs font-bold tracking-wide uppercase mt-2 cursor-pointer shadow-md text-white"
            >
              Sign In to Sanctuary
            </button>
          </form>
        )}

        {/* Register Form */}
        {authMode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3 relative z-10">
            {regError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 shadow-xs">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-medium">{regError}</span>
              </div>
            )}
            {regSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center gap-2 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{regSuccess}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-700" />
                <span>Preferred Name</span>
              </label>
              <input
                type="text"
                required
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="Alex"
                className="w-full liquid-input px-3.5 py-2.5 rounded-xl text-xs font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-emerald-700" />
                <span>Email Address</span>
              </label>
              <input
                type="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="alex@example.com"
                className="w-full liquid-input px-3.5 py-2.5 rounded-xl text-xs font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Password</label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Min 6 chars"
                  className="w-full liquid-input px-3.5 py-2 rounded-xl text-xs font-medium"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Confirm</label>
                <input
                  type="password"
                  required
                  value={regConfirm}
                  onChange={(e) => setRegConfirm(e.target.value)}
                  placeholder="Repeat"
                  className="w-full liquid-input px-3.5 py-2 rounded-xl text-xs font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full liquid-button-sage py-3.5 rounded-full text-xs font-bold tracking-wide uppercase mt-2 cursor-pointer shadow-md"
            >
              Create Account (+50 Marks)
            </button>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 relative z-10">
          <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Private Local Storage</span>
          </div>
          <span className="text-slate-400">Zero Third-Party Tracking</span>
        </div>
      </div>
    </div>
  );
};
