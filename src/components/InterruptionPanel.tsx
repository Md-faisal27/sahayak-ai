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
  Languages,
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
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-5">
      {/* Spoken Voice Language Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
          <Languages className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          <span className="text-xs font-extrabold uppercase tracking-wider">
            Spoken Voice Language:
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold">
          {(
            [
              { key: 'ENGLISH', label: 'English' },
              { key: 'HINDI', label: 'Hindi' },
              { key: 'HINGLISH', label: 'Hinglish' },
            ] as const
          ).map((item) => {
            const isActive = currentLanguage === item.key;
            return (
              <button
                key={item.key}
                type="button"
                disabled={disabled}
                onClick={() => onLanguageSwitch && onLanguageSwitch(item.key)}
                className={`px-4 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs font-bold'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

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
