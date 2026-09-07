'use client';

import React from 'react';
import { InterruptionIntent } from '@/lib/state-machine';
import { AppLanguage } from '@/lib/language';
import {
  RotateCcw,
  Lightbulb,
  HelpCircle,
  ChevronsRight,
  Compass,
} from 'lucide-react';

interface InterruptionPanelProps {
  onTrigger: (intent: InterruptionIntent) => void;
  onLanguageSwitch?: (lang: AppLanguage) => void;
  currentLanguage?: AppLanguage;
  disabled?: boolean;
}

export function InterruptionPanel({
  onTrigger,
  onLanguageSwitch,
  currentLanguage = 'ENGLISH',
  disabled,
}: InterruptionPanelProps) {
  const actions: {
    intent: InterruptionIntent;
    label: string;
    description: string;
    icon: any;
    color: string;
  }[] = [
    {
      intent: 'HINT_5_WORD',
      label: '5-Word Hint',
      description: '5-word recall clue',
      icon: Lightbulb,
      color: 'bg-[#243348] text-white hover:bg-[#1d2a3d] shadow-xs',
    },
    {
      intent: 'REPEAT',
      label: 'Repeat Question',
      description: '"Repeat question"',
      icon: RotateCcw,
      color: 'bg-[#f3f6f9] dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-[#e9edf2] dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700',
    },
    {
      intent: 'SIMPLIFY',
      label: 'Explain Simply',
      description: 'Simpler terms & analogy',
      icon: HelpCircle,
      color: 'bg-[#0d766e] text-white hover:bg-[#0f6b64] shadow-xs',
    },
    {
      intent: 'EXAMPLE',
      label: 'Give Example',
      description: 'Practical scenario',
      icon: Compass,
      color: 'bg-[#f3f6f9] dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-[#e9edf2] dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700',
    },
    {
      intent: 'HINT_FULL',
      label: 'Detailed Hint',
      description: 'Broader concept hint',
      icon: Lightbulb,
      color: 'bg-[#d97706] text-white hover:bg-[#c26700] shadow-xs',
    },
    {
      intent: 'SKIP',
      label: 'Skip Question',
      description: 'Move to next item',
      icon: ChevronsRight,
      color: 'bg-[#f3f6f9] dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-[#e9edf2] dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700',
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-sm">
      {/* 6 Action Buttons Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.intent}
              type="button"
              disabled={disabled}
              onClick={() => onTrigger(act.intent)}
              className={`flex flex-col justify-between p-4 rounded-2xl text-left transition-all ${
                act.color
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
            >
              <div className="flex items-center justify-between w-full mb-3">
                <span className="font-extrabold text-xs leading-tight">{act.label}</span>
                <Icon className="w-4 h-4 shrink-0 ml-1 opacity-90" />
              </div>
              <span className="text-[11px] opacity-80 line-clamp-1">{act.description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
