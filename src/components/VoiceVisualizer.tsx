'use client';

import React from 'react';
import { VoiceState } from '@/lib/state-machine';
import { Volume2, Mic, Hourglass, PauseCircle, HelpCircle, Lightbulb, CheckCircle } from 'lucide-react';

interface VoiceVisualizerProps {
  state: VoiceState;
  currentSpeakerText?: string;
  onInterruptClick?: () => void;
}

export function VoiceVisualizer({ state, currentSpeakerText }: VoiceVisualizerProps) {
  const getStatusConfig = () => {
    switch (state) {
      case 'ASKING':
        return {
          label: 'AI Speaking',
          subLabel: 'Listen to the question or interrupt anytime',
          bgColor: 'bg-brand-50/70 border-brand-200 dark:bg-brand-950/40 dark:border-brand-800 text-brand-900 dark:text-brand-200',
          indicatorBg: 'bg-brand-700 dark:bg-brand-600',
          icon: Volume2,
          pulse: true,
          badgeText: 'Speaking'
        };
      case 'LISTENING':
        return {
          label: 'Listening to Student',
          subLabel: "Speak clearly into your microphone...",
          bgColor: 'bg-teal-50/70 border-teal-200 dark:bg-teal-950/40 dark:border-teal-800 text-teal-900 dark:text-teal-200',
          indicatorBg: 'bg-teal-700 dark:bg-teal-600',
          icon: Mic,
          pulse: true,
          badgeText: 'Listening'
        };
      case 'PROCESSING':
      case 'EVALUATING':
        return {
          label: 'Processing & Evaluating Answer',
          subLabel: 'Analyzing semantic understanding against document material...',
          bgColor: 'bg-amber-50/70 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800 text-amber-900 dark:text-amber-200',
          indicatorBg: 'bg-amber-600',
          icon: Hourglass,
          pulse: true,
          badgeText: 'Evaluating'
        };
      case 'HINTING':
        return {
          label: 'Providing 5-Word Hint',
          subLabel: 'Focus on key recall terms without full answer',
          bgColor: 'bg-brand-50/70 border-brand-200 dark:bg-brand-950/40 dark:border-brand-800 text-brand-900 dark:text-brand-200',
          indicatorBg: 'bg-brand-700 dark:bg-brand-600',
          icon: Lightbulb,
          pulse: false,
          badgeText: 'Hint Active'
        };
      case 'CLARIFYING':
        return {
          label: 'Rephrasing / Clarifying Question',
          subLabel: 'AI is simplifying the prompt context for you',
          bgColor: 'bg-slate-100 border-slate-300 dark:bg-slate-900 dark:border-slate-700 text-slate-900 dark:text-slate-100',
          indicatorBg: 'bg-slate-700 dark:bg-slate-600',
          icon: HelpCircle,
          pulse: false,
          badgeText: 'Rephrasing'
        };
      case 'INTERRUPTED':
        return {
          label: 'Session Interrupted / Paused',
          subLabel: 'Current speech stopped. Say "Continue" or click resume',
          bgColor: 'bg-rose-50/70 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800 text-rose-900 dark:text-rose-200',
          indicatorBg: 'bg-rose-600',
          icon: PauseCircle,
          pulse: false,
          badgeText: 'Interrupted'
        };
      case 'COMPLETED':
        return {
          label: 'Voice Session Completed',
          subLabel: 'Review overall performance and progress report below',
          bgColor: 'bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200',
          indicatorBg: 'bg-emerald-600',
          icon: CheckCircle,
          pulse: false,
          badgeText: 'Completed'
        };
      default:
        return {
          label: 'Ready for Input',
          subLabel: 'Press start to interact',
          bgColor: 'bg-slate-100 border-slate-300 dark:bg-slate-900 dark:border-slate-800 text-slate-800 dark:text-slate-200',
          indicatorBg: 'bg-slate-700 dark:bg-slate-600',
          icon: Mic,
          pulse: false,
          badgeText: 'Ready'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={`rounded-3xl border p-6 transition-all shadow-sm ${config.bgColor}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className={`w-12 h-12 rounded-2xl ${config.indicatorBg} text-white flex items-center justify-center shadow-md`}>
              <Icon className="w-6 h-6" />
            </div>
            {config.pulse && (
              <span className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full ${config.indicatorBg} animate-ping`} />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-extrabold text-base tracking-tight">{config.label}</h4>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/80 dark:bg-slate-800/80 shadow-xs border border-current">
                {config.badgeText}
              </span>
            </div>
            <p className="text-xs opacity-80 mt-0.5">{config.subLabel}</p>
          </div>
        </div>

        {/* Dynamic Voice Sound Waves Graphic */}
        {config.pulse && (
          <div className="hidden sm:flex items-center gap-1 h-8">
            <span className="w-1.5 h-4 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-7 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-5 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            <span className="w-1.5 h-8 bg-current rounded-full animate-bounce" style={{ animationDelay: '450ms' }} />
            <span className="w-1.5 h-3 bg-current rounded-full animate-bounce" style={{ animationDelay: '600ms' }} />
          </div>
        )}
      </div>

      {currentSpeakerText && (
        <div className="mt-4 pt-3 border-t border-current/15 text-sm font-medium italic opacity-90 line-clamp-2">
          "{currentSpeakerText}"
        </div>
      )}
    </div>
  );
}
