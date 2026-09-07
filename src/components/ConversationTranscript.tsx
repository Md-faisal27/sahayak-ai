'use client';

import React from 'react';
import { Sparkles, User, Volume2 } from 'lucide-react';

export interface Message {
  id?: string;
  speaker: 'AI' | 'STUDENT' | 'SYSTEM';
  textContent: string;
  intent?: string;
  createdAt?: string;
}

interface ConversationTranscriptProps {
  messages: Message[];
  onReplayAudio?: (text: string) => void;
}

export function ConversationTranscript({ messages, onReplayAudio }: ConversationTranscriptProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4 max-h-[60vh] sm:max-h-[420px] overflow-y-auto scrollbar-thin">
      <h4 className="font-extrabold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
        Conversation History & Transcript
      </h4>

      {messages.length === 0 ? (
        <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs">
          No conversation messages recorded yet.
        </div>
      ) : (
        messages.map((msg, idx) => {
          const isAi = msg.speaker === 'AI';
          const isSystem = msg.speaker === 'SYSTEM';

          if (isSystem) {
            return (
              <div key={msg.id || idx} className="text-center my-2">
                <span className="text-[11px] font-medium px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  {msg.textContent}
                </span>
              </div>
            );
          }

          return (
            <div
              key={msg.id || idx}
              className={`flex gap-3 max-w-[92%] sm:max-w-[88%] ${isAi ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
            >
              {/* Avatar */}
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-white font-bold text-xs shadow-xs ${
                  isAi
                    ? 'bg-brand-700 dark:bg-brand-600'
                    : 'bg-slate-700 dark:bg-slate-600'
                }`}
              >
                {isAi ? 'AI' : <User className="w-3.5 h-3.5" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`rounded-2xl p-4 text-sm leading-relaxed ${
                  isAi
                    ? 'bg-brand-50/80 dark:bg-brand-950/50 text-slate-800 dark:text-slate-100 border border-brand-200/60 dark:border-brand-800/40 rounded-tl-xs'
                    : 'bg-slate-800 dark:bg-slate-700 text-white rounded-tr-xs'
                }`}
              >
                <div className="flex items-center justify-between gap-4 mb-1 text-[11px] font-semibold opacity-70">
                  <span>{isAi ? 'Sahayak AI' : 'Student (You)'}</span>
                  {msg.intent && (
                    <span className="uppercase text-[9px] px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10">
                      {msg.intent}
                    </span>
                  )}
                </div>
                <p className="whitespace-pre-wrap">{msg.textContent}</p>

                {isAi && onReplayAudio && (
                  <button
                    type="button"
                    onClick={() => onReplayAudio(msg.textContent)}
                    className="mt-2 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                  >
                    <Volume2 className="w-3.5 h-3.5" /> Replay Speech
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
