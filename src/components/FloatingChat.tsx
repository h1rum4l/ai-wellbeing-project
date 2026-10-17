import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Trash2, Bot, Sparkles, ChevronDown } from 'lucide-react';
import { getDemoReply } from '../chat/assistant';
import { detectCrisis, crisisMessage } from '../chat/safety';
import { ChatMessage } from '../types';
import { StressinaLogo } from './common/StressinaLogo';
import { StressinaPanda } from './mascot/StressinaPanda';
import { triggerHaptic } from '../utils/haptics';

interface FloatingChatProps {
  onNavigateToTab?: (tab: string) => void;
  isOpenControlled?: boolean;
  onToggleOpen?: (open: boolean) => void;
}

export const FloatingChat: React.FC<FloatingChatProps> = ({
  onNavigateToTab,
  isOpenControlled,
  onToggleOpen,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isChatOpen = isOpenControlled !== undefined ? isOpenControlled : internalOpen;

  const setChatOpen = (open: boolean) => {
    triggerHaptic('selection');
    if (onToggleOpen) {
      onToggleOpen(open);
    }
    setInternalOpen(open);
  };

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = ['Help me relax', 'Exam stress', "I can't sleep", 'Breathing exercise'];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isChatOpen) {
      scrollToBottom();
    }
  }, [messages, isChatOpen]);

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text) return;

    triggerHaptic('light');
    const userMsg: ChatMessage = { role: 'user', content: text };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    if (!textToSend) setInput('');

    setTimeout(() => {
      let reply: string;
      if (detectCrisis(text)) {
        triggerHaptic('warning');
        reply = crisisMessage();
      } else if (text === 'Breathing exercise') {
        triggerHaptic('medium');
        reply =
          'You can switch to Stressina’s Corner for our guided breathing pacer. Inhale slowly as the lotus aura expands, hold gently, and exhale as it settles.';
        if (onNavigateToTab) {
          onNavigateToTab('breathing');
        }
      } else {
        triggerHaptic('selection');
        reply = getDemoReply(nextHistory, null);
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    }, 300);
  };

  return (
    <>
      {/* Mobile backdrop dimming */}
      {isChatOpen && (
        <div
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-[75] sm:hidden transition-opacity duration-200"
          onClick={() => setChatOpen(false)}
        />
      )}

      {/* Floating Widget Container */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[80] pointer-events-none">
        {/* Floating Launcher Button with Mascot */}
        {!isChatOpen && (
          <button
            type="button"
            onClick={() => setChatOpen(true)}
            aria-label="Open stressina.AI Companion"
            className="pointer-events-auto liquid-button-primary rounded-full pl-3 pr-4 py-2.5 shadow-lg flex items-center gap-2.5 font-bold text-xs border border-white/80 transition-all hover:scale-105 active:scale-95 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
              <StressinaPanda
                pose="safe_space"
                expression="empathetic"
                size="xs"
                showLotusPlatform={false}
                showAura={false}
              />
            </div>
            <span className="tracking-wide text-white font-semibold">
              <span className="inline sm:hidden">Chat with Stressina</span>
              <span className="hidden sm:inline">Stressina Companion</span>
            </span>
          </button>
        )}
      </div>

      {/* Responsive Floating Popup Window */}
      {isChatOpen && (
        <div className="fixed inset-x-3 bottom-3 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-96 max-w-sm w-auto liquid-glass-hero shadow-2xl overflow-hidden flex flex-col h-[520px] max-h-[85vh] border border-white/95 z-[80] animate-fade-in">
          {/* Header */}
          <div className="px-4 py-3.5 flex items-center justify-between border-b border-slate-100 bg-white/80">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white border border-emerald-100 flex items-center justify-center shadow-xs overflow-hidden">
                <StressinaPanda
                  pose="hero_zen"
                  expression="calm"
                  size="xs"
                  showLotusPlatform={false}
                  showAura={false}
                />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span>Stressina Companion</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </div>
                <p className="text-[10px] text-emerald-800">Mindful Support & Guidance</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setChatOpen(false)}
              className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              title="Close Companion"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          {/* Quick Prompts */}
          <div className="p-2.5 bg-white/60 border-b border-slate-100 flex flex-wrap gap-1.5">
            {quickPrompts.map((q, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSend(q)}
                className="text-[11px] font-medium bg-white/80 border border-slate-200 text-slate-700 hover:text-slate-900 px-2.5 py-1 rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Message History */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 text-xs bg-white/40">
            {messages.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-white border border-emerald-100 flex items-center justify-center mx-auto shadow-xs">
                  <StressinaPanda
                    pose="safe_space"
                    expression="empathetic"
                    size="xs"
                    showLotusPlatform={false}
                    showAura={false}
                  />
                </div>
                <p className="font-bold text-slate-800">How can I support you right now?</p>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  Ask about breathing pacing, stress management, exams, or grounding techniques.
                </p>
              </div>
            ) : (
              messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl whitespace-pre-wrap leading-relaxed ${
                    m.role === 'user'
                      ? 'liquid-button-primary text-white ml-6 rounded-tr-xs shadow-xs'
                      : 'bg-white/90 text-slate-800 mr-6 rounded-tl-xs border border-slate-100 shadow-xs'
                  }`}
                >
                  {m.content}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input & Footer */}
          <div className="p-3 bg-white/90 border-t border-slate-100 space-y-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Share your thoughts or questions..."
                className="flex-1 liquid-input rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="liquid-button-primary p-2.5 rounded-xl text-white disabled:opacity-40 cursor-pointer shadow-xs shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <div className="flex items-center justify-between text-[10px] text-slate-500 px-1">
              <span>National Crisis Helpline: 1926</span>
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={() => setMessages([])}
                  className="text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer font-medium"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
