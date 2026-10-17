import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  X,
  LogOut,
  ChevronDown,
  Layers,
  LineChart,
  Network,
  Database,
  Settings,
  User,
} from 'lucide-react';
import { APP_METADATA, UNIVERSE_CONFIG } from './engine/fuzzyConfig';
import { SoffitBackground } from './components/common/SoffitBackground';
import { PandaSoundscapesPlayer } from './components/soundscapes/PandaSoundscapesPlayer';
import { HomeView } from './components/views/HomeView';
import { AssessmentTab } from './components/tabs/AssessmentTab';
import { HistoryTab } from './components/tabs/HistoryTab';
import { StressinaCornerView } from './components/views/StressinaCornerView';
import { HelpCareView } from './components/views/HelpCareView';
import { MembershipTab } from './components/tabs/MembershipTab';
import { ArchitectureDiagram } from './components/visualizations/ArchitectureDiagram';
import { DatasetTab } from './components/tabs/DatasetTab';
import { AccountTab } from './components/tabs/AccountTab';
import { FloatingChat } from './components/FloatingChat';
import { FloatingStressinaDock } from './components/mascot/FloatingStressinaDock';
import { AuthModal } from './components/auth/AuthModal';
import { FuturisticGreenButton } from './components/common/FuturisticGreenButton';
import { triggerHaptic } from './utils/haptics';
import { companionVoice } from './utils/companionVoice';
import {
  CopingRecommendation,
  ExplanationPayload,
  InferenceResult,
  StressCategory,
  UserAccount,
} from './types';
import { store } from './storage/store';

export const App: React.FC = () => {
  // Navigation: 5 core views matching mockup + advanced tools
  const [activeTab, setActiveTab] = useState<string>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState<boolean>(false);
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState<boolean>(false);
  const [floatingChatOpen, setFloatingChatOpen] = useState<boolean>(false);

  // User State
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);

  // Global Auth Modal state
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('register');
  const [authPromptReason, setAuthPromptReason] = useState<string>('');

  // Physiological inputs
  const [hrv, setHrv] = useState<number>(UNIVERSE_CONFIG.hrv.default);
  const [screenTime, setScreenTime] = useState<number>(UNIVERSE_CONFIG.screen_time.default);
  const [sleep, setSleep] = useState<number>(UNIVERSE_CONFIG.sleep_duration.default);
  const [timeOption, setTimeOption] = useState<string>('5 minutes');
  const [contextOption, setContextOption] = useState<string>('Home');

  // Last Assessment Result
  const [lastAssessment, setLastAssessment] = useState<{
    inference: InferenceResult;
    category: StressCategory;
    recommendation: CopingRecommendation;
    explanation: ExplanationPayload;
  } | null>(null);

  // Chat incoming topic bridge
  const [chatTopic, setChatTopic] = useState<string>('');

  // Toast / notification
  const [toastMessage, setToastMessage] = useState<string>('');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Bumped whenever server data is pulled in, so tabs re-read their (now fresh) records
  const [dataVersion, setDataVersion] = useState(0);

  useEffect(() => {
    setCurrentUser(store.getCurrentUser()); // instant, from the on-device copy
    let cancelled = false;
    store.restoreSession().then((user) => {
      if (cancelled) return;
      setCurrentUser(user);
      setDataVersion((v) => v + 1);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setToolsDropdownOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const openAuthWithPrompt = (reason?: string, mode: 'login' | 'register' = 'register') => {
    triggerHaptic('selection');
    setAuthPromptReason(reason || '');
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const loadPreset = (h: number, sc: number, sl: number, name: string) => {
    triggerHaptic('medium');
    setHrv(h);
    setScreenTime(sc);
    setSleep(sl);
    setActiveTab('checkin');
    setMobileMenuOpen(false);
    showToast(`${name} scenario loaded into sliders`);
  };

  // 5 Core navigation items strictly matching the user reference blueprint
  const mainNavItems = [
    { id: 'home', label: 'Home' },
    { id: 'checkin', label: 'Daily Check-in' },
    { id: 'analytics', label: 'Stress Analytics' },
    { id: 'corner', label: 'Stressina’s Corner' },
    { id: 'help', label: 'Help' },
  ];

  const advancedToolItems = [
    { id: 'visuals', label: 'Membership Curves', icon: LineChart, desc: 'Fuzzy sets & universe' },
    { id: 'arch', label: 'System Architecture', icon: Network, desc: '8-stage Mamdani pipeline' },
    { id: 'dataset', label: 'Batch Dataset', icon: Database, desc: 'Validation & CSV testing' },
    { id: 'account', label: 'Account & Security', icon: Settings, desc: 'Profile & privacy vault' },
  ];

  return (
    <div className="min-h-screen text-slate-800 flex flex-col antialiased relative selection:bg-emerald-200 selection:text-emerald-950 font-sans">
      {/* Soffit — Plain WebGL2 Fullscreen Animated Gradient Background */}
      <SoffitBackground />

      {/* Reusable Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        promptReason={authPromptReason}
        onClose={() => setAuthModalOpen(false)}
        onUserChanged={(user) => {
          setCurrentUser(user);
          setDataVersion((v) => v + 1);
          if (user) {
            showToast(`Welcome, ${user.display_name}!`);
            companionVoice.speak(`Welcome to your sanctuary, ${user.display_name}!`);
          }
        }}
      />

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 liquid-glass-glow text-slate-800 text-xs font-bold px-4 py-2.5 rounded-full shadow-2xl border-white animate-fade-in flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 
        TOP NAVIGATION BAR:
        Matching Blueprint Specification:
        - Left: "Stressina.Ai" in green gradient color
        - Center: Home, Daily Check-in, Stress Analytics, Stressina's Corner, Help
        - Right: Tools dropdown, User Profile icon, and Logout glass button
      */}
      {/* 
        TOP NAVIGATION BAR:
        Matching Blueprint Specification:
        - Left: "Stressina.Ai" in green gradient color
        - Center: Home, Daily Check-in, Stress Analytics, Stressina's Corner, Help
        - Right: Tools dropdown, User Profile icon, and Logout glass button
      */}
      <header className="sticky top-0 z-40 liquid-nav-bar px-2.5 sm:px-4 lg:px-8 py-1.5 sm:py-2.5 w-full">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-1.5 sm:gap-4">
          
          {/* Left: Hamburger (mobile) & Brand Title */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-xl bg-white/75 text-slate-700 hover:bg-white border border-white shadow-2xs cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4 text-emerald-700" /> : <Menu className="w-4 h-4 text-emerald-700" />}
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setActiveTab('home');
              }}
              className="flex items-center gap-1.5 sm:gap-2.5 text-left cursor-pointer group"
            >
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-lime-400 p-0.5 shadow-2xs flex items-center justify-center shrink-0">
                <div className="w-full h-full bg-white/95 rounded-[6px] sm:rounded-[9px] flex items-center justify-center shadow-inner">
                  <span className="text-xs sm:text-base select-none leading-none">🐼</span>
                </div>
              </div>
              <span className="text-base sm:text-2xl font-black tracking-tight bg-gradient-to-r from-emerald-600 via-teal-600 to-lime-600 bg-clip-text text-transparent group-hover:opacity-90 transition-opacity drop-shadow-xs">
                Stressina.Ai
              </span>
            </button>
          </div>

          {/* Center: 5 Core Navigation Items */}
          <nav className="hidden lg:flex items-center gap-1.5 shrink-0">
            {mainNavItems.map((item) => {
              const isActive =
                activeTab === item.id ||
                (item.id === 'checkin' && activeTab === 'assessment') ||
                (item.id === 'analytics' && activeTab === 'history') ||
                (item.id === 'corner' && ['breathing', 'candy_crush', 'chat'].includes(activeTab)) ||
                (item.id === 'help' && ['counsellor', 'quests'].includes(activeTab));

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    setActiveTab(item.id);
                  }}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-700 text-white shadow-sm font-bold'
                      : 'text-slate-700 hover:text-emerald-800 hover:bg-white/60'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Controls: Soundscapes, Tools, Single Auth Button */}
          <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
            {/* Panda Soundscapes Player (Compact & Touch-friendly) */}
            <PandaSoundscapesPlayer compact className="shrink-0" />

            {/* Scientific Tools Dropdown (Desktop & Tablets) */}
            <div className="relative hidden md:block" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setToolsDropdownOpen(!toolsDropdownOpen);
                }}
                className={`text-xs px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer border ${
                  toolsDropdownOpen || ['visuals', 'arch', 'dataset', 'account'].includes(activeTab)
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-xs font-bold'
                    : 'bg-white/75 text-slate-700 border-white/90 hover:bg-white font-semibold'
                }`}
                title="Scientific Tools & Diagrams"
              >
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tools</span>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              {/* Glass Dropdown Menu */}
              {toolsDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl liquid-glass p-2 shadow-2xl border border-white animate-fade-in z-50">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800 border-b border-slate-200">
                    Scientific & System Tools
                  </div>
                  <div className="py-1 space-y-1">
                    {advancedToolItems.map((tool) => {
                      const Icon = tool.icon;
                      const isToolActive = activeTab === tool.id;
                      return (
                        <button
                          key={tool.id}
                          type="button"
                          onClick={() => {
                            triggerHaptic('selection');
                            setActiveTab(tool.id);
                            setToolsDropdownOpen(false);
                          }}
                          className={`w-full p-2 rounded-xl text-left flex items-start gap-2.5 transition-colors cursor-pointer ${
                            isToolActive
                              ? 'bg-emerald-100 text-emerald-900 font-bold'
                              : 'hover:bg-white/80 text-slate-700'
                          }`}
                        >
                          <div className="p-1 rounded-lg bg-emerald-50 border border-emerald-200 shrink-0 text-emerald-700">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold leading-tight">{tool.label}</div>
                            <div className="text-[10px] text-slate-500">{tool.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Exactly ONE User Profile / Sign In Button (Zero duplication, zero mobile overflow) */}
            {currentUser ? (
              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    setProfileDropdownOpen(!profileDropdownOpen);
                  }}
                  className="h-7 sm:h-8 px-2 sm:px-3 rounded-full bg-white/85 hover:bg-white border border-white flex items-center gap-1.5 cursor-pointer text-slate-800 shadow-2xs transition-transform active:scale-95"
                  title={`Logged in as ${currentUser.display_name}`}
                >
                  <div className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] sm:text-[10px] font-bold">
                    {currentUser.display_name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline text-xs font-bold max-w-[80px] truncate">
                    {currentUser.display_name.split(' ')[0]}
                  </span>
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl liquid-glass p-3 shadow-2xl border border-white animate-fade-in z-50 text-xs">
                    <div className="border-b border-slate-200 pb-2 mb-2">
                      <p className="font-bold text-slate-800 truncate">{currentUser.display_name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{currentUser.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('selection');
                        setActiveTab('account');
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full text-left py-1.5 px-2 rounded-lg hover:bg-white text-slate-700 font-medium cursor-pointer flex items-center gap-2"
                    >
                      <Settings className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Account & Settings</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        void store.signOut();
                        setCurrentUser(null);
                        setProfileDropdownOpen(false);
                        showToast('Logged out');
                      }}
                      className="w-full text-left py-1.5 px-2 rounded-lg hover:bg-rose-50 text-rose-600 font-semibold cursor-pointer flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <FuturisticGreenButton
                variant="compact"
                onClick={() => {
                  triggerHaptic('selection');
                  openAuthWithPrompt('Sign in to save your assessments and habits.', 'login');
                }}
                ariaLabel="Sign In"
                className="shrink-0 text-[11px] sm:text-xs px-2.5 sm:px-3.5 py-1 sm:py-1.5"
              >
                <User className="w-3 h-3 text-white" />
                <span className="text-[11px] sm:text-xs">Sign In</span>
              </FuturisticGreenButton>
            )}
          </div>
        </div>

        {/* Mobile Navigation Drawer with Full Tools, Soundscapes & Auth */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-2.5 pt-2.5 border-t border-slate-200/60 space-y-2.5 animate-fade-in">
            {/* User Session Banner in Mobile Drawer */}
            <div className="p-2.5 rounded-2xl bg-white/80 border border-white flex items-center justify-between">
              {currentUser ? (
                <div className="flex items-center justify-between w-full">
                  <div>
                    <p className="text-xs font-bold text-slate-900">{currentUser.display_name}</p>
                    <p className="text-[10px] text-slate-500">{currentUser.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      void store.signOut();
                      setCurrentUser(null);
                      setMobileMenuOpen(false);
                      showToast('Logged out');
                    }}
                    className="text-xs font-bold text-rose-600 px-3 py-1 rounded-lg bg-rose-50 border border-rose-200 cursor-pointer"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <div>
                    <p className="text-xs font-bold text-slate-900">Guest Session</p>
                    <p className="text-[10px] text-slate-500">Sign in to sync your data</p>
                  </div>
                  <FuturisticGreenButton
                    variant="compact"
                    onClick={() => {
                      triggerHaptic('selection');
                      openAuthWithPrompt('Sign in to save your assessments and habits.', 'login');
                      setMobileMenuOpen(false);
                    }}
                    ariaLabel="Sign In"
                    className="shrink-0"
                  >
                    <span>Sign In</span>
                  </FuturisticGreenButton>
                </div>
              )}
            </div>

            {/* Mobile Soundscapes Section */}
            <div className="p-2.5 rounded-2xl bg-white/80 border border-white space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-900 flex items-center gap-1.5">
                  <span>🎋</span>
                  <span>Nature Soundscapes</span>
                </span>
                <PandaSoundscapesPlayer compact />
              </div>
            </div>

            {/* Main Navigation Items */}
            <div className="space-y-1">
              {mainNavItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full px-3.5 py-2 rounded-xl text-left text-xs font-semibold flex items-center justify-between cursor-pointer ${
                    activeTab === item.id
                      ? 'bg-emerald-700 text-white font-bold shadow-xs'
                      : 'text-slate-700 hover:bg-white/60'
                  }`}
                >
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            {/* Mobile Tools Section */}
            <div className="pt-2 border-t border-slate-200/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 px-2 mb-1 block">
                Tools & Diagnostics
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {advancedToolItems.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic('selection');
                        setActiveTab(tool.id);
                        setMobileMenuOpen(false);
                      }}
                      className="p-2 rounded-xl bg-white/60 hover:bg-white text-left flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer"
                    >
                      <Icon className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span className="truncate">{tool.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Viewport */}
      <main key={dataVersion} className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
        {/* 1. Home View (Central Hero Section with Zen Panda & Side Panels) */}
        {activeTab === 'home' && (
          <HomeView
            lastAssessment={lastAssessment}
            onNavigate={(viewId) => {
              if (['breathing', 'candy_crush', 'chat'].includes(viewId)) {
                setActiveTab('corner');
              } else {
                setActiveTab(viewId);
              }
            }}
            onQuickScan={() => {
              setActiveTab('checkin');
              showToast('Launching real-time stress scanner...');
            }}
            onSelectPreset={loadPreset}
          />
        )}

        {/* 2. Daily Check-in View (Physiological Sliders, Mamdani Inference, Analyzing Mascot) */}
        {(activeTab === 'checkin' || activeTab === 'assessment') && (
          <AssessmentTab
            hrv={hrv}
            setHrv={setHrv}
            screenTime={screenTime}
            setScreenTime={setScreenTime}
            sleep={sleep}
            setSleep={setSleep}
            timeOption={timeOption}
            setTimeOption={setTimeOption}
            contextOption={contextOption}
            setContextOption={setContextOption}
            currentUser={currentUser}
            onOpenAuthModal={() =>
              openAuthWithPrompt('Sign in or register to record this assessment to your timeline.', 'register')
            }
            onAssessmentCompleted={(result) => setLastAssessment(result)}
            onOpenChatWithTopic={(topic) => {
              setChatTopic(topic);
              setActiveTab('corner');
            }}
            onNavigateToTab={(t) => {
              if (['breathing', 'candy_crush', 'chat'].includes(t)) {
                setActiveTab('corner');
              } else {
                setActiveTab(t);
              }
            }}
          />
        )}

        {/* 3. Stress Analytics & Timeline View */}
        {(activeTab === 'analytics' || activeTab === 'history') && (
          <HistoryTab
            currentUser={currentUser}
            lastAssessment={lastAssessment}
            onOpenAuthModal={() =>
              openAuthWithPrompt('Sign in to unlock your private stress records and longitudinal timeline.', 'login')
            }
          />
        )}

        {/* 4. Stressina’s Corner (Breathing Sanctuary, Stress Crush Match-3, Companion Chat) */}
        {(activeTab === 'corner' || activeTab === 'breathing' || activeTab === 'candy_crush' || activeTab === 'chat') && (
          <StressinaCornerView
            initialSubTab={
              activeTab === 'candy_crush'
                ? 'game'
                : activeTab === 'chat'
                ? 'chat'
                : 'breathing'
            }
            chatTopic={chatTopic}
            onNavigateToTab={(t) => setActiveTab(t)}
          />
        )}

        {/* 5. Help & Care (Support hotlines, counsellor demo, daily quests) */}
        {(activeTab === 'help' || activeTab === 'counsellor' || activeTab === 'quests') && (
          <HelpCareView
            currentUser={currentUser}
            onNavigateToTab={(t) => setActiveTab(t)}
            onOpenAuthModal={(mode) => openAuthWithPrompt(undefined, mode || 'register')}
          />
        )}

        {/* Submenu Tool: Membership Curves Visualizer */}
        {activeTab === 'visuals' && (
          <div className="space-y-6 animate-fade-in">
            <div className="liquid-glass p-6">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                Mathematical Modeling
              </span>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                Fuzzy Membership Curves & Universe
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Visual representation of triangular and trapezoidal membership functions across autonomic HRV, screen exposure, and sleep universes.
              </p>
            </div>
            <MembershipTab
              hrv={hrv}
              screenTime={screenTime}
              sleep={sleep}
              inferenceResult={lastAssessment?.inference}
            />
          </div>
        )}

        {/* Submenu Tool: Architecture Diagram */}
        {activeTab === 'arch' && (
          <div className="space-y-6 animate-fade-in">
            <div className="liquid-glass p-6">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                System Engineering
              </span>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                Eight-Stage Mamdani System Pipeline
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Decoupled architecture detailing data acquisition, fuzzification, rule evaluation, defuzzification, and adaptive coping recommendation dispatch.
              </p>
            </div>
            <ArchitectureDiagram />
          </div>
        )}

        {/* Submenu Tool: Batch Dataset Validation */}
        {activeTab === 'dataset' && (
          <div className="space-y-6 animate-fade-in">
            <div className="liquid-glass p-6">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                Validation Benchmark
              </span>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                Batch Dataset Normalization & Accuracy
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Empirical validation of Mamdani fuzzy inference against synthetic and benchmark clinical stress records.
              </p>
            </div>
            <DatasetTab />
          </div>
        )}

        {/* Submenu Tool: Account & Security */}
        {activeTab === 'account' && (
          <div className="animate-fade-in">
            <AccountTab currentUser={currentUser} onUserChanged={(u) => { setCurrentUser(u); setDataVersion((v) => v + 1); }} />
          </div>
        )}
      </main>

      {/* Tranquil Liquid Glass Footer */}
      <footer className="border-t border-white/60 liquid-nav-bar py-7 px-4 text-center text-xs text-slate-600 mt-12">
        <div className="max-w-4xl mx-auto space-y-2.5 flex flex-col items-center">
          <p className="text-slate-600 max-w-2xl leading-relaxed text-[11px]">
            {APP_METADATA.disclaimer}
          </p>
          <div className="flex items-center gap-3 text-[11px] text-emerald-800 font-semibold">
            <span>Mamdani Fuzzy Logic</span>
            <span>·</span>
            <span>Liquid Glass Interface</span>
            <span>·</span>
            <span>Adaptive Stress Coping</span>
          </div>
        </div>
      </footer>

      {/* Floating Chat Companion: Only show floating launcher button on Home view */}
      <FloatingChat
        isOpenControlled={floatingChatOpen}
        onToggleOpen={(open) => setFloatingChatOpen(open)}
        showLauncher={activeTab === 'home'}
        onNavigateToTab={(t) => {
          if (['breathing', 'candy_crush', 'chat'].includes(t)) {
            setActiveTab('corner');
          } else {
            setActiveTab(t);
          }
          setFloatingChatOpen(false);
        }}
      />

      {/* Floating Stressina Companion Dock on Secondary Tabs: Never overlaps Corner, Breathing or Games */}
      {activeTab !== 'home' && !['corner', 'breathing', 'candy_crush', 'chat'].includes(activeTab) && (
        <FloatingStressinaDock
          currentTab={activeTab}
          onNavigate={(tab) => {
            setActiveTab(tab);
          }}
          onOpenChat={() => setFloatingChatOpen(true)}
        />
      )}
    </div>
  );
};
