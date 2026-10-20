import React, { useState, useRef, useEffect } from 'react';
import { Send, PlusCircle, Bookmark, Bot, User, Sparkles, Lock } from 'lucide-react';
import { GREETING, QUICK_PROMPTS, getDemoReply, ChatAssessmentContext } from '../../chat/assistant';
import { detectCrisis, crisisMessage } from '../../chat/safety';
import { ChatMessage, UserAccount } from '../../types';
import { store } from '../../storage/store';
import { triggerHaptic } from '../../utils/haptics';

interface ChatTabProps {
  currentUser?: UserAccount | null;
  assessmentContext?: ChatAssessmentContext | null;
  initialTopic?: string;
  onClearInitialTopic?: () => void;
  onOpenAuthModal?: () => void;
}

export const ChatTab: React.FC<ChatTabProps> = ({
  currentUser,
  assessmentContext,
  initialTopic,
  onClearInitialTopic,
  onOpenAuthModal,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const [shareContext, setShareContext] = useState<boolean>(false);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Handle incoming initial topic from other tabs
  useEffect(() => {
    if (initialTopic) {
      handleSendMessage(`Can you give me more details and steps for: "${initialTopic}"?`);
      if (onClearInitialTopic) {
        onClearInitialTopic();
      }
    }
  }, [initialTopic]);

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text) return;

    triggerHaptic('light');
    const userMessage: ChatMessage = {
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    if (!textToSend) setInput('');
    setIsTyping(true);

    // Crisis detection check
    setTimeout(() => {
      let reply: string;
      if (detectCrisis(text)) {
        triggerHaptic('warning');
        reply = crisisMessage();
      } else {
        triggerHaptic('selection');
        const ctx = shareContext ? assessmentContext : null;
        reply = getDemoReply(newHistory, ctx);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: reply,
          created_at: new Date().toISOString(),
        },
      ]);
      setIsTyping(false);
    }, 450);
  };

  const startNewChat = () => {
    triggerHaptic('medium');
    setMessages([]);
    setSaveSuccessMsg('');
  };

  const handleSaveChat = () => {
    if (!currentUser) {
      triggerHaptic('selection');
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }
    const prefs = store.getPreferences(currentUser.id);
    if (!prefs.save_chats) {
      triggerHaptic('warning');
      setSaveSuccessMsg('Please enable "Save chat conversations" in Account Settings.');
      setTimeout(() => setSaveSuccessMsg(''), 4000);
      return;
    }
    if (messages.length === 0) return;

    triggerHaptic('success');
    const convId = store.saveConversation(currentUser.id, messages);
    if (convId) {
      setSaveSuccessMsg('Conversation saved to your private timeline.');
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    }
  };

  return (
    <div className="space-y-4 text-slate-800">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 liquid-glass-card rounded-2xl p-5 border border-white shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800">
              Wellbeing Companion
            </span>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
              Private & Confidential
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">Talk Through Your Day</h3>
          <p className="text-xs text-slate-600">
            A reflective space to decompress, explore breathing methods, and untangle high workloads.
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={handleSaveChat}
              className="text-xs liquid-button-sage px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs text-white font-bold"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Save Chat</span>
            </button>
          )}
          <button
            type="button"
            onClick={startNewChat}
            disabled={messages.length === 0}
            className={`text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border ${
              messages.length === 0
                ? 'opacity-40 bg-white/50 text-slate-400 border-slate-200 cursor-not-allowed'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 font-semibold shadow-xs'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-700" />
            <span>New Chat</span>
          </button>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs shadow-xs animate-fade-in font-medium">
          {saveSuccessMsg}
        </div>
      )}

      {/* Context sharing toggle */}
      <div className="liquid-glass rounded-2xl px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs border border-white shadow-xs">
        <label className="flex items-center gap-2.5 text-slate-700 font-medium cursor-pointer">
          <input
            type="checkbox"
            checked={shareContext}
            onChange={(e) => setShareContext(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
          />
          <span>Personalize companion advice using my latest fuzzy stress assessment</span>
        </label>
        {assessmentContext && shareContext && (
          <span className="text-[11px] font-mono font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-300">
            {assessmentContext.category} ({assessmentContext.index.toFixed(1)}/100)
          </span>
        )}
      </div>

      {/* Chat messages viewport */}
      <div className="liquid-glass-card rounded-3xl p-5 sm:p-6 min-h-[460px] max-h-[540px] overflow-y-auto flex flex-col space-y-4 shadow-sm relative border border-white">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none" />

        {/* Default Assistant Greeting */}
        <div className="flex items-start gap-3 relative z-10">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center shrink-0 text-emerald-800 shadow-xs">
            <Bot className="w-4 h-4" />
          </div>
          <div className="liquid-glass rounded-2xl rounded-tl-sm px-4 py-3 max-w-xl text-xs text-slate-800 leading-relaxed border border-white shadow-xs">
            {GREETING}
          </div>
        </div>

        {/* Quick starter prompts if conversation is empty */}
        {messages.length === 0 && (
          <div className="pt-2 relative z-10">
            <p className="text-[11px] text-emerald-800 mb-2 font-bold uppercase tracking-wider">Quick suggestions to explore:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {QUICK_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(prompt)}
                  className="text-left p-3 rounded-xl bg-white/80 hover:bg-white border border-slate-200 hover:border-emerald-300 text-xs text-slate-700 hover:text-emerald-900 transition-all cursor-pointer flex items-center gap-2 shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{prompt}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* User and assistant messages */}
        {messages.map((m, idx) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={idx}
              className={`flex items-start gap-3 relative z-10 ${isUser ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                  isUser
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-100 border border-emerald-300 text-emerald-800'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div
                className={`rounded-2xl px-4 py-3 max-w-xl text-xs leading-relaxed whitespace-pre-wrap ${
                  isUser
                    ? 'bg-emerald-700 rounded-tr-sm text-white shadow-xs font-medium'
                    : 'liquid-glass rounded-tl-sm text-slate-800 border border-white shadow-xs'
                }`}
              >
                {m.content}
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-emerald-800 font-medium italic pl-11 relative z-10">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            <span>Companion is reflecting...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="liquid-glass rounded-2xl p-2.5 flex items-center gap-2 border border-white shadow-sm">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder="Ask about breathing, stress alleviation, or share your thoughts..."
          className="flex-1 bg-transparent px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => handleSendMessage()}
          disabled={!input.trim()}
          className="liquid-button-sage p-2.5 rounded-xl text-white disabled:opacity-40 cursor-pointer shadow-xs"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
