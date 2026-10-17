import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Mail,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Eye,
  EyeOff,
  BookOpen,
  Dumbbell,
  Flower2,
  Utensils,
  Award,
  ArrowRight,
} from 'lucide-react';
import { UserAccount } from '../../types';
import { store } from '../../storage/store';
import { StressinaPanda } from '../mascot/StressinaPanda';
import { triggerHaptic } from '../../utils/haptics';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserChanged: (user: UserAccount | null) => void;
  initialMode?: 'login' | 'register';
  promptReason?: string;
}

const AVATAR_OPTIONS = [
  { id: 'lotus', label: 'Zen Lotus', emoji: '🪷' },
  { id: 'wave', label: 'Ocean Flow', emoji: '🌊' },
  { id: 'pulse', label: 'Neural Wave', emoji: '✨' },
  { id: 'garden', label: 'Botanical', emoji: '🌿' },
];

const GOAL_OPTIONS = [
  { id: 'reading', label: 'Reading (30m/day)', icon: BookOpen, marks: '+25' },
  { id: 'gym', label: 'Gym & Fitness', icon: Dumbbell, marks: '+30' },
  { id: 'yoga', label: 'Yoga & Somatics', icon: Flower2, marks: '+25' },
  { id: 'cooking', label: 'Mindful Cooking', icon: Utensils, marks: '+20' },
  { id: 'gardening', label: 'Gardening & Flora', icon: Flower2, marks: '+20' },
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onUserChanged,
  initialMode = 'login',
  promptReason,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  // Sync mode with incoming initialMode when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setLoginError('');
      setRegError('');
    }
  }, [isOpen, initialMode]);

  // Registration state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState('lotus');
  const [selectedGoals, setSelectedGoals] = useState<string[]>(['reading', 'gym']);
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  if (!isOpen) return null;

  // Real-time password strength calculation (4-bar indicator)
  const calculatePasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: 'Enter passcode', color: 'bg-slate-200' };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd) || /[A-Z]/.test(pwd)) score++;

    if (score === 1) return { score: 1, label: 'Basic', color: 'bg-amber-500' };
    if (score === 2) return { score: 2, label: 'Moderate', color: 'bg-amber-400' };
    if (score === 3) return { score: 3, label: 'Strong', color: 'bg-emerald-400' };
    return { score: 4, label: 'Fortress Vault', color: 'bg-emerald-600' };
  };

  const strength = calculatePasswordStrength(regPassword);

  const toggleGoal = (goalId: string) => {
    triggerHaptic('selection');
    setSelectedGoals((prev) =>
      prev.includes(goalId) ? prev.filter((g) => g !== goalId) : [...prev, goalId]
    );
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('medium');
    setRegError('');

    if (regPassword.length < 6) {
      triggerHaptic('warning');
      setRegError('Password must contain at least 6 characters.');
      return;
    }

    if (regPassword !== regConfirm) {
      triggerHaptic('warning');
      setRegError('Passwords do not match. Please verify your passcode.');
      return;
    }

    const res = store.registerUser(regEmail, regName, regPassword);
    if (res.ok && res.user) {
      triggerHaptic('levelUp');
      setRegSuccess(true);
      onUserChanged(res.user);
      setTimeout(() => {
        onClose();
        setRegSuccess(false);
      }, 1400);
    } else {
      triggerHaptic('warning');
      setRegError(res.message);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('medium');
    setLoginError('');
    const user = store.authenticateUser(loginEmail, loginPassword);
    if (user) {
      triggerHaptic('success');
      onUserChanged(user);
      onClose();
    } else {
      triggerHaptic('warning');
      setLoginError('Email or password was not recognized. Please check your credentials or use the 1-Tap Demo Login.');
    }
  };

  const handleQuickDemoLogin = (email = 'maya@example.com', pwd = 'password123') => {
    triggerHaptic('success');
    setLoginError('');
    const user = store.authenticateUser(email, pwd);
    if (user) {
      onUserChanged(user);
      onClose();
    } else {
      // Fallback register
      const res = store.registerUser(email, 'Maya Lin', pwd);
      if (res.user) {
        onUserChanged(res.user);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg liquid-glass-hero bg-white/94 backdrop-blur-2xl rounded-[2.25rem] p-6 sm:p-8 overflow-hidden shadow-2xl border-2 border-white max-h-[92vh] overflow-y-auto text-slate-800">
        
        {/* Soft Ambient Sunlight & Eucalyptus Halos */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-emerald-200/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-teal-100/35 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            onClose();
          }}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100/80 transition-colors cursor-pointer z-20"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Branding with Stressina Panda */}
        <div className="relative z-10 mb-5 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/95 border border-emerald-100 flex items-center justify-center shadow-xs shrink-0">
              <StressinaPanda
                pose="safe_space"
                expression="empathetic"
                size="xs"
                showLotusPlatform={false}
                showAura={false}
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <span className="text-[11px] font-black tracking-wider uppercase bg-gradient-to-r from-emerald-600 via-teal-600 to-lime-600 bg-clip-text text-transparent">
                  Stressina.Ai Sanctuary Vault
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100/80 border border-emerald-300 text-[10px] font-mono font-bold text-emerald-900 shadow-2xs">
                  <Sparkles className="w-3 h-3 text-emerald-700" />
                  +50 Marks
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {mode === 'login' ? 'Sign In to Your Sanctuary' : 'Create Wellness Profile'}
              </h3>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                {mode === 'login'
                  ? 'Sign in to access your saved timeline, private assessments, and active habits streak.'
                  : (promptReason || 'Register to claim 50 welcome marks, save longitudinal stress timeline, and earn daily habits.')}
              </p>
            </div>
          </div>
        </div>

        {/* Apple iOS Translucent Segmented Control */}
        <div className="flex p-1 rounded-2xl bg-slate-100/90 border border-slate-200/90 mb-5 relative z-10 shadow-inner">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              setMode('login');
              setLoginError('');
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              mode === 'login'
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
              setMode('register');
              setRegError('');
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              mode === 'register'
                ? 'bg-white text-emerald-800 shadow-sm border border-emerald-100 font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
            <span>Create Profile</span>
            <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[9px] font-mono font-extrabold">+50</span>
          </button>
        </div>

        {/* ============================================================== */}
        {/* LOGIN FORM                                                     */}
        {/* ============================================================== */}
        {mode === 'login' && (
          <div className="space-y-4 relative z-10">
            {/* 1-Tap Quick Demo Account Card */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50/95 via-teal-50/80 to-emerald-50/95 border border-emerald-200/90 flex items-center justify-between gap-3 shadow-xs">
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
                onClick={() => handleQuickDemoLogin()}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white text-xs font-extrabold transition-all shadow-xs shrink-0 cursor-pointer flex items-center gap-1"
              >
                <span>1-Tap In</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {loginError && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 animate-fade-in shadow-xs">
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
                  className="w-full liquid-input px-3.5 py-2.5 rounded-2xl text-xs font-medium border border-white bg-white/80 focus:bg-white text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Password</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setShowLoginPassword(!showLoginPassword);
                    }}
                    className="text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showLoginPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onFocus={() => triggerHaptic('selection')}
                  onChange={(e) => {
                    triggerHaptic('selection');
                    setLoginPassword(e.target.value);
                  }}
                  placeholder="•••••••• (or password123)"
                  className="w-full liquid-input px-3.5 py-2.5 rounded-2xl text-xs font-medium border border-white bg-white/80 focus:bg-white text-slate-900"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-full text-xs font-extrabold tracking-wider uppercase cursor-pointer liquid-button-sage shadow-md flex items-center justify-center gap-2 mt-2"
              >
                <Lock className="w-4 h-4 text-white" />
                <span>Sign In to Sanctuary</span>
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    setMode('register');
                  }}
                  className="text-xs text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer"
                >
                  Don't have an account yet? Create your profile (+50 Marks)
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ============================================================== */}
        {/* REGISTRATION FORM                                              */}
        {/* ============================================================== */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4 relative z-10">
            {regError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 animate-fade-in shadow-xs">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-medium">{regError}</span>
              </div>
            )}

            {regSuccess && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center gap-3 animate-fade-in shadow-xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold text-sm">Welcome to Stressina.Ai!</p>
                  <p className="text-[11px] text-emerald-700">+50 Welcome Marks Awarded · Vault Initialized</p>
                </div>
              </div>
            )}

            {/* Avatar Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 block">
                Select Your Avatar
              </label>
              <div className="grid grid-cols-4 gap-2">
                {AVATAR_OPTIONS.map((av) => (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection');
                      setSelectedAvatar(av.id);
                    }}
                    className={`py-2 px-1 rounded-2xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      selectedAvatar === av.id
                        ? 'bg-emerald-50 border-emerald-500 shadow-sm'
                        : 'bg-white/80 border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <span className="text-xl">{av.emoji}</span>
                    <span className="text-[10px] font-bold truncate max-w-full text-slate-800">{av.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Preferred Name & Email Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Preferred Name</span>
                </label>
                <input
                  type="text"
                  required
                  value={regName}
                  onFocus={() => triggerHaptic('selection')}
                  onChange={(e) => {
                    triggerHaptic('selection');
                    setRegName(e.target.value);
                  }}
                  placeholder="e.g. Maya"
                  className="w-full liquid-input px-3.5 py-2.5 rounded-2xl text-xs font-medium border border-white bg-white/80 focus:bg-white text-slate-900"
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
                  onFocus={() => triggerHaptic('selection')}
                  onChange={(e) => {
                    triggerHaptic('selection');
                    setRegEmail(e.target.value);
                  }}
                  placeholder="name@example.com"
                  className="w-full liquid-input px-3.5 py-2.5 rounded-2xl text-xs font-medium border border-white bg-white/80 focus:bg-white text-slate-900"
                />
              </div>
            </div>

            {/* Primary Stress Management Tasks Focus */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-emerald-800">
                <span>Preferred Wellness Activities</span>
                <span className="text-[10px] text-slate-500 font-normal">Tap to customize</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {GOAL_OPTIONS.map((g) => {
                  const Icon = g.icon;
                  const isSelected = selectedGoals.includes(g.id);
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => toggleGoal(g.id)}
                      className={`p-2 rounded-2xl text-left border flex items-center justify-between gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-900 shadow-xs'
                          : 'bg-white/80 border-slate-200 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-emerald-700' : 'text-slate-400'}`} />
                        <span className="text-[11px] font-bold truncate">{g.label}</span>
                      </div>
                      <span className="text-[9px] font-mono font-bold text-emerald-800 bg-emerald-100/60 px-1 py-0.5 rounded">
                        {g.marks}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Password Credentials */}
            <div className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Password</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setShowPassword(!showPassword);
                      }}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={regPassword}
                    onFocus={() => triggerHaptic('selection')}
                    onChange={(e) => {
                      triggerHaptic('selection');
                      setRegPassword(e.target.value);
                    }}
                    placeholder="Min 6 characters"
                    className="w-full liquid-input px-3.5 py-2.5 rounded-2xl text-xs font-medium border border-white bg-white/80 focus:bg-white text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Confirm Password</span>
                    {regConfirm && regPassword === regConfirm && (
                      <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Matched
                      </span>
                    )}
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={regConfirm}
                    onFocus={() => triggerHaptic('selection')}
                    onChange={(e) => {
                      triggerHaptic('selection');
                      setRegConfirm(e.target.value);
                    }}
                    placeholder="Repeat password"
                    className="w-full liquid-input px-3.5 py-2.5 rounded-2xl text-xs font-medium border border-white bg-white/80 focus:bg-white text-slate-900"
                  />
                </div>
              </div>

              {/* Password Strength */}
              {regPassword && (
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                    <span>Security Strength</span>
                    <span className="font-bold text-emerald-800">{strength.label}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          step <= strength.score ? strength.color : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Tactile Submit Button */}
            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-full text-xs font-extrabold tracking-wider uppercase cursor-pointer liquid-button-sage shadow-md flex items-center justify-center gap-2 mt-2"
            >
              <Award className="w-4 h-4 text-white" />
              <span>Create Profile & Claim 50 Marks</span>
            </button>
          </form>
        )}

        {/* Security & Client-Side Privacy Guarantee */}
        <div className="mt-5 pt-3.5 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500 relative z-10">
          <div className="flex items-center gap-1.5 text-emerald-800 font-semibold text-[10px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>Encrypted Client Storage</span>
          </div>
          <span className="text-slate-400 text-[10px]">Private & Local</span>
        </div>
      </div>
    </div>
  );
};
