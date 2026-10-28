import React, { useState } from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  KeyRound,
  ShieldCheck,
  Zap,
  Layers,
  Film,
  Bot,
  Loader2,
} from 'lucide-react';
import {
  activateLicenseKey,
  deactivateLicense,
  STORE_CHECKOUT_URL,
} from '../../utils/licenseManager';
import type { LicenseState } from '../../types';

interface ProModalProps {
  isOpen: boolean;
  onClose: () => void;
  license: LicenseState;
  onLicenseUpdated: () => void;
}

export const ProModal: React.FC<ProModalProps> = ({
  isOpen,
  onClose,
  license,
  onLicenseUpdated,
}) => {
  const [licenseKeyInput, setLicenseKeyInput] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleActivate = async () => {
    if (!licenseKeyInput.trim()) {
      setFeedback({ type: 'error', text: 'Please enter your license key.' });
      return;
    }

    setIsActivating(true);
    setFeedback(null);

    const result = await activateLicenseKey(licenseKeyInput);
    setIsActivating(false);

    if (result.success) {
      setFeedback({ type: 'success', text: result.message });
      onLicenseUpdated();
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      setFeedback({ type: 'error', text: result.message });
    }
  };

  const handleDeactivate = async () => {
    await deactivateLicense();
    onLicenseUpdated();
    setFeedback({ type: 'success', text: 'License deactivated on this device.' });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm rounded-2xl border border-white/[0.14] bg-[#181716] shadow-2xl overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3 bg-[#1c1b1a]">
          <div className="flex items-center gap-2">
            <span className="flex h-5 items-center gap-1 rounded bg-gradient-to-r from-amber-500 to-amber-600 px-1.5 text-[10px] font-bold text-black uppercase tracking-wider shadow-xs">
              <Sparkles className="h-3 w-3 fill-black" />
              PRO
            </span>
            <h3 className="text-xs font-semibold text-[#faf9f5]">
              {license.isPro ? 'Zippix Pro Membership' : 'Upgrade to Zippix Pro'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded-md text-[#a8a29e] hover:bg-white/[0.08] hover:text-[#faf9f5] transition"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-4 max-h-[80vh] overflow-y-auto no-scrollbar">
          {license.isPro ? (
            /* Active Pro State */
            <div className="space-y-3.5 text-center py-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#faf9f5]">Zippix Pro is Active</h4>
                <p className="text-[11px] text-[#a8a29e] mt-0.5">
                  Registered to: <span className="font-mono text-[#faf9f5]">{license.customerEmail || 'Verified Owner'}</span>
                </p>
                <p className="text-[10px] font-mono text-[#78716c] mt-1">
                  License: {license.licenseKey ? `${license.licenseKey.slice(0, 10)}...` : 'Lifetime VIP'}
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-[#141413] p-3 text-left space-y-2 text-[11px] text-[#a8a29e]">
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Unlimited 1:1 Page Cloning Active</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>All Videos & Lotties Batch ZIP Export</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Full Tailwind & Design Token Generator</span>
                </div>
              </div>

              <button
                onClick={handleDeactivate}
                className="w-full rounded-lg border border-red-500/20 bg-red-950/20 hover:bg-red-950/40 py-2 text-[11px] font-medium text-red-300 transition"
              >
                Deactivate License on this Device
              </button>
            </div>
          ) : (
            /* Free Tier -> Pro Pitch */
            <>
              {/* Value Features */}
              <div className="space-y-2">
                <div className="flex items-start gap-2.5 rounded-lg border border-white/[0.06] bg-[#141413] p-2.5">
                  <Zap className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-[#faf9f5]">Unlimited 1:1 Page Cloning</div>
                    <div className="text-[10px] text-[#a8a29e]">Clone entire websites into production HTML & styles.css with zero restrictions.</div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 rounded-lg border border-white/[0.06] bg-[#141413] p-2.5">
                  <Film className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-[#faf9f5]">Batch Video, Lottie & SVG Export</div>
                    <div className="text-[10px] text-[#a8a29e]">One-click ZIP download of all video streams, animations, and icons.</div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 rounded-lg border border-white/[0.06] bg-[#141413] p-2.5">
                  <Bot className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-[#faf9f5]">AI Component Prompts</div>
                    <div className="text-[10px] text-[#a8a29e]">Generate ready-to-paste prompts for Claude, ChatGPT & Cursor to recreate any UI element.</div>
                  </div>
                </div>
              </div>

              {/* Purchase Button */}
              <a
                href={STORE_CHECKOUT_URL}
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 py-2.5 text-xs font-bold text-black shadow-lg shadow-amber-500/20 transition active:scale-[0.99]"
              >
                <span>Get Zippix Pro — Lifetime Deal</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>

              {/* License Key Activation Divider */}
              <div className="relative flex items-center justify-center my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/[0.08]" />
                </div>
                <span className="relative bg-[#181716] px-2 text-[10px] uppercase font-mono text-[#78716c]">
                  or activate key
                </span>
              </div>

              {/* License Key Form */}
              <div className="space-y-2">
                <div className="relative">
                  <KeyRound className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#78716c]" />
                  <input
                    type="text"
                    value={licenseKeyInput}
                    onChange={(e) => setLicenseKeyInput(e.target.value)}
                    placeholder="Enter License Key (e.g. LEMON-...)"
                    className="w-full rounded-lg border border-white/[0.1] bg-[#141413] py-2 pl-8 pr-3 text-xs text-[#faf9f5] placeholder-[#78716c] outline-none transition focus:border-amber-400"
                  />
                </div>

                <button
                  onClick={handleActivate}
                  disabled={isActivating || !licenseKeyInput.trim()}
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-white/[0.12] bg-white/[0.08] hover:bg-white/[0.15] py-2 text-xs font-semibold text-[#faf9f5] transition disabled:opacity-40"
                >
                  {isActivating ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Verifying license...</span>
                    </>
                  ) : (
                    <span>Activate License</span>
                  )}
                </button>
              </div>

              {/* Feedback Alert */}
              {feedback && (
                <div
                  className={`rounded-lg p-2.5 text-xs ${
                    feedback.type === 'success'
                      ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300'
                      : 'bg-red-950/40 border border-red-500/30 text-red-300'
                  }`}
                >
                  {feedback.text}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
