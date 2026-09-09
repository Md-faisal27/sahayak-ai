'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import {
  History,
  FileText,
  Download,
  Play,
  RotateCcw,
  Search,
  Filter,
  ArrowUpRight,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

export default function HistoryPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<string>('ALL');

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sessions');
      const data = await res.json();
      if (res.ok) setSessions(data.sessions || []);
    } catch (e) {
      console.error('Failed to fetch sessions history:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredSessions = sessions.filter((s) => {
    if (filterMode !== 'ALL' && s.mode !== filterMode) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-foreground/15 selection:text-foreground w-full max-w-full overflow-x-hidden">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 min-w-0">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full min-w-0">
          <div className="min-w-0">
            <span className="text-xs uppercase font-bold tracking-wider text-brand-700 dark:text-brand-400 block mb-1">
              Assessment Archive
            </span>
            <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white break-words">Session History and Records</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Reopen past oral exam sessions, download question banks, and review performance reports
            </p>
          </div>

          {/* Mode Filter */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-xs font-bold w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 ml-2 shrink-0" />
            {['ALL', 'INTERVIEW', 'SUMMARIZE'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setFilterMode(m)}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl transition-all ${
                  filterMode === m
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Sessions List */}
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" />
            <span className="text-xs font-semibold text-slate-500">Loading your history...</span>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-12 text-center text-slate-400 dark:text-slate-500 space-y-4 w-full min-w-0">
            <FileText className="w-12 h-12 mx-auto opacity-50" />
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">No sessions match your filter</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Start an Interview or Summarize session from your dashboard to save performance records here.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-brand-700"
            >
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <div className="space-y-4 w-full min-w-0">
            {filteredSessions.map((s) => {
              const isCompleted = s.status === 'COMPLETED';
              return (
                <div
                  key={s.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6 hover:border-brand-300 transition-all w-full min-w-0"
                >
                  <div className="space-y-2 w-full md:w-auto min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 shrink-0">
                        {s.mode}
                      </span>
                      <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded shrink-0 ${
                        isCompleted ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        {s.status}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(s.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 break-words">{s.pdfName}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Total Questions: {s.questionCount} • Progress: Question {s.currentQuestionIndex} of {s.questionCount}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 sm:gap-4 w-full md:w-auto justify-between md:justify-end pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                    <div className="text-left md:text-right shrink-0">
                      <span className="text-xl sm:text-2xl font-black text-brand-600 dark:text-brand-400">{s.score}%</span>
                      <span className="block text-[10px] uppercase font-bold text-slate-400">Score</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={`/api/export/questions/${s.id}`}
                        download
                        title="Download Question List PDF"
                        className="p-2 sm:p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-brand-600 transition-colors flex items-center justify-center shrink-0"
                      >
                        <Download className="w-4 h-4" />
                      </a>

                      <Link
                        href={isCompleted ? `/report/${s.id}` : `/session/${s.id}`}
                        className="px-3.5 sm:px-4 py-2 sm:py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-all shrink-0"
                      >
                        {isCompleted ? 'View Report' : 'Resume'} <ArrowUpRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
