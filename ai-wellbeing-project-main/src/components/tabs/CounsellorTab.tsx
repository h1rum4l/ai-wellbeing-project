import React, { useState, useEffect } from 'react';
import { AlertTriangle, Send, CheckCircle2, Lock } from 'lucide-react';
import { CounsellorRequest, UserAccount } from '../../types';
import { store } from '../../storage/store';
import { triggerHaptic } from '../../utils/haptics';

interface CounsellorTabProps {
  currentUser: UserAccount | null;
  onOpenAuthModal?: () => void;
}

export const CounsellorTab: React.FC<CounsellorTabProps> = ({ currentUser, onOpenAuthModal }) => {
  const [contactMethod, setContactMethod] = useState<string>('Email (demo only)');
  const [preferredTime, setPreferredTime] = useState<string>('No preference');
  const [message, setMessage] = useState<string>('');
  const [consent, setConsent] = useState<boolean>(false);
  const [submittedMessage, setSubmittedMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [requests, setRequests] = useState<CounsellorRequest[]>([]);

  const loadRequests = () => {
    if (currentUser) {
      setRequests(store.listCounsellorRequests(currentUser.id));
    }
  };

  useEffect(() => {
    loadRequests();
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="max-w-xl mx-auto py-8">
        <div className="liquid-glass-glow rounded-3xl p-8 sm:p-10 text-center space-y-4 shadow-lg border border-white">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
            <Lock className="w-7 h-7" />
          </div>
          <h4 className="text-lg font-extrabold text-slate-900 tracking-tight">Protected Counsellor Workflow</h4>
          <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
            Please sign in to test the local demonstration intake workflow and record private support inquiries.
          </p>
          {onOpenAuthModal && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                onOpenAuthModal();
              }}
              className="liquid-button-sage px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider cursor-pointer shadow-md"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) {
      triggerHaptic('warning');
      setErrorMessage('Please confirm acknowledgment of the simulated demonstration nature.');
      return;
    }

    try {
      triggerHaptic('success');
      store.createCounsellorRequest(currentUser.id, contactMethod, preferredTime, message, consent);
      setSubmittedMessage('Demonstration intake inquiry successfully logged in client-side storage.');
      setErrorMessage('');
      setMessage('');
      setConsent(false);
      loadRequests();
      setTimeout(() => setSubmittedMessage(''), 5000);
    } catch (err: any) {
      triggerHaptic('warning');
      setErrorMessage(err.message || 'Failed to submit request');
    }
  };

  return (
    <div className="space-y-6">
      <div className="liquid-glass-card rounded-3xl p-6 sm:p-8 space-y-5 border border-white/90">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800">
            Professional Human Connection
          </span>
          <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
            Talk to a Counsellor (Demonstration Intake)
          </h3>
        </div>

        {/* Clear Educational Disclaimer Banner */}
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs leading-relaxed space-y-2 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-amber-950">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Academic Demonstration Workflow Only</span>
          </div>
          <p>
            This prototype is an academic demonstration and is <strong>not connected</strong> to a real medical professional, hospital, or counselling clinic. Submitting this form saves a local record; <strong>nobody will be contacted</strong>.
          </p>
          <p className="text-[11px] text-amber-800">
            For urgent psychological distress or crisis, immediately contact emergency helplines: <strong>1926</strong> (National Mental Health Helpline) or <strong>1990</strong> (Emergency Ambulance).
          </p>
        </div>

        {submittedMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center gap-2 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">{submittedMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-center gap-2 shadow-xs">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Preferred Contact Channel (Demo)</label>
            <select
              value={contactMethod}
              onChange={(e) => setContactMethod(e.target.value)}
              className="w-full liquid-input px-3.5 py-2.5 rounded-xl text-xs cursor-pointer"
            >
              <option value="Email (demo only)">Email (demo only)</option>
              <option value="Phone call (demo only)">Phone call (demo only)</option>
              <option value="In-person appointment (demo only)">In-person appointment (demo only)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Preferred Time Window</label>
            <select
              value={preferredTime}
              onChange={(e) => setPreferredTime(e.target.value)}
              className="w-full liquid-input px-3.5 py-2.5 rounded-xl text-xs cursor-pointer"
            >
              <option value="Morning (9 AM - 12 PM)">Morning (9 AM - 12 PM)</option>
              <option value="Afternoon (1 PM - 4 PM)">Afternoon (1 PM - 4 PM)</option>
              <option value="Evening (5 PM - 8 PM)">Evening (5 PM - 8 PM)</option>
              <option value="No preference">No preference</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Brief Context / Message (Optional, 500 characters max)
            </label>
            <textarea
              rows={3}
              maxLength={500}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g., Looking for guidance managing exam anxiety and sleep schedule..."
              className="w-full liquid-input p-3.5 rounded-xl text-xs resize-none"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-white/70 border border-slate-200 space-y-2">
            <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-emerald-600 focus:ring-0 cursor-pointer"
              />
              <span>
                I understand this is a simulation. No real counsellor will be contacted.
              </span>
            </label>
          </div>

          <button
            type="submit"
            className="liquid-button-sage px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-md"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit Demo Request</span>
          </button>
        </form>
      </div>

      {/* Historical Intake Requests */}
      {requests.length > 0 && (
        <div className="liquid-glass-card rounded-3xl p-6 border border-white/90 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900">Your Logged Demo Requests</h4>
            <span className="text-xs text-slate-500 font-mono">{requests.length} records</span>
          </div>

          <div className="space-y-2">
            {requests.map((req) => (
              <div
                key={req.id}
                className="p-3.5 rounded-xl bg-white/70 border border-slate-200 text-xs space-y-1 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-800">{req.preferred_contact}</span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {req.created_at.slice(0, 10)}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600">
                  Preferred: {req.preferred_time}
                </div>
                {req.message && (
                  <p className="text-slate-700 text-xs italic bg-white/80 p-2 rounded-lg mt-1 border border-slate-100">
                    "{req.message}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
