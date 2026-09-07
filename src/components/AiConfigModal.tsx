'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, X, Check, Key, Loader2, Volume2 } from 'lucide-react';

export function AiConfigModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [config, setConfig] = useState<{
    hasGemini: boolean;
    hasOpenai: boolean;
    hasRime: boolean;
    activeProvider: string;
    activeTts: string;
  } | null>(null);
  const [geminiKey, setGeminiKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [rimeKey, setRimeKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetch('/api/ai/config')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) setConfig(data);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');

    try {
      const res = await fetch('/api/ai/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          geminiKey: geminiKey || undefined,
          openaiKey: openaiKey || undefined,
          rimeKey: rimeKey || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg('AI & Rime Voice keys updated successfully!');
        setConfig((prev) => ({
          ...prev!,
          hasGemini: data.hasGemini,
          hasOpenai: data.hasOpenai,
          hasRime: data.hasRime,
          activeProvider: data.hasGemini
            ? 'Google Gemini (2.0/1.5 Flash)'
            : data.hasOpenai
            ? 'OpenAI (GPT-4o mini)'
            : 'Offline Document Extractor',
          activeTts: data.hasRime ? 'Rime AI (Natural Conversational Voice)' : 'Text Mode / Fallback',
        }));
        setTimeout(() => {
          onClose();
          setSuccessMsg('');
        }, 1200);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-background border border-foreground/15 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              LLM &amp; Voice Configuration
            </span>
          </div>
          <h2 className="text-xl font-display text-foreground">AI Intelligence &amp; Voice</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Configure Google Gemini or OpenAI for intelligent PDF questioning, and Rime AI for the interviewer's natural voice.
          </p>
        </div>

        {config && (
          <div className="p-3.5 rounded-2xl bg-muted/40 border border-foreground/10 text-xs font-mono space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">AI ENGINE:</span>
              <span className="text-foreground font-bold">{config.activeProvider}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">INTERVIEW VOICE:</span>
              <span className="text-foreground font-bold">{config.activeTts}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-foreground/5">
              <span>Gemini: {config.hasGemini ? '✓ Connected' : 'Optional'}</span>
              <span>OpenAI: {config.hasOpenai ? '✓ Connected' : 'Optional'}</span>
              <span>Rime: {config.hasRime ? '✓ Active' : 'Fallback'}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-foreground mb-1.5">
              Rime AI API Key (Interviewer TTS Voice)
            </label>
            <input
              type="password"
              value={rimeKey}
              onChange={(e) => setRimeKey(e.target.value)}
              placeholder={config?.hasRime ? '•••••••••••••••• (Key Configured)' : 'rime_...'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-foreground/15 bg-background text-foreground text-xs font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground"
            />
            <span className="text-[10px] text-muted-foreground block mt-1">
              Provides the natural conversational interviewer voice in AI Interview mode.
            </span>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-foreground mb-1.5">
              Google Gemini API Key
            </label>
            <input
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder={config?.hasGemini ? '•••••••••••••••• (Key Configured)' : 'AIzaSy...'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-foreground/15 bg-background text-foreground text-xs font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground"
            />
            <span className="text-[10px] text-muted-foreground block mt-1">
              Supports Gemini 2.0 Flash &amp; 1.5 Flash (Free tier at aistudio.google.com)
            </span>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-foreground mb-1.5">
              OpenAI API Key (Optional Alternative)
            </label>
            <input
              type="password"
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              placeholder={config?.hasOpenai ? '•••••••••••••••• (Key Configured)' : 'sk-proj-...'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-foreground/15 bg-background text-foreground text-xs font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground"
            />
          </div>

          {successMsg && (
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-mono flex items-center gap-1.5">
              <Check className="w-4 h-4" /> {successMsg}
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-mono uppercase tracking-wider text-background bg-foreground hover:bg-foreground/90 rounded-full font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
              <span>Save &amp; Connect</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
