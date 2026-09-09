'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import {
  Award,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  RotateCcw,
  ArrowLeft,
  Loader2,
  ChevronDown,
  Layers,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/sessions/${sessionId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.session) {
          setSession(data.session);
        } else {
          router.push('/dashboard');
        }
      })
      .catch((e) => {
        console.error(e);
        router.push('/dashboard');
      })
      .finally(() => setLoading(false));
  }, [sessionId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center space-y-3 flex-col min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          <span className="text-sm font-semibold text-slate-500">Compiling Evaluation Report...</span>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const answers = session.answers || [];
  const strongAnswers = answers.filter((a: any) => a.classification === 'STRONG');
  const averageAnswers = answers.filter((a: any) => a.classification === 'AVERAGE');
  const weakAnswers = answers.filter((a: any) => a.classification === 'WEAK');

  const strongTopics = Array.from(new Set(strongAnswers.map((a: any) => {
    const q = session.questions?.find((quest: any) => quest.id === a.questionId);
    return q?.topic || 'Core Concept';
  })));

  const weakTopics = Array.from(new Set(weakAnswers.map((a: any) => {
    const q = session.questions?.find((quest: any) => quest.id === a.questionId);
    return q?.topic || 'Core Concept';
  })));

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-background text-foreground flex flex-col font-sans selection:bg-foreground/15 selection:text-foreground">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8 min-w-0">
        {/* Breadcrumb Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-brand-700 dark:hover:text-brand-300 flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <a
              href={`/api/export/report/${session.id}`}
              download
              className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Download Report PDF
            </a>
          </div>
        </div>

        {/* Score Banner */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <span className="text-xs font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-brand-50 dark:bg-brand-950 text-brand-800 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
              {session.mode} Performance Summary
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {session.pdfName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Evaluated strictly against extracted textbook page chunks.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-brand-50/50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-900 min-w-[140px]">
            <span className="text-3xl sm:text-4xl font-extrabold text-brand-700 dark:text-brand-300">
              {session.totalScore}%
            </span>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-1">
              Overall Mastery
            </span>
          </div>
        </div>

        {/* Diagnostic Breakdown Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl p-4 sm:p-5 space-y-1">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4" /> Strong Topics ({strongTopics.length})
            </div>
            <p className="text-xs text-emerald-900 dark:text-emerald-200">
              {strongTopics.length > 0 ? strongTopics.join(', ') : 'None marked strong'}
            </p>
          </div>

          <div className="bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 rounded-2xl p-4 sm:p-5 space-y-1">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4" /> Partial Understanding ({averageAnswers.length})
            </div>
            <p className="text-xs text-amber-900 dark:text-amber-200">
              Questions needing minor concept refinement.
            </p>
          </div>

          <div className="bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/80 rounded-2xl p-4 sm:p-5 space-y-2">
            <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-xs uppercase tracking-wider">
              <XCircle className="w-4 h-4" /> Weak Topics ({weakTopics.length})
            </div>
            <p className="text-xs text-rose-900 dark:text-rose-200">
              {weakTopics.length > 0 ? weakTopics.join(', ') : 'No weak topics detected'}
            </p>
            {weakTopics.length > 0 && (
              <Link
                href={`/weak-coach?topic=${encodeURIComponent(weakTopics[0])}`}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-rose-700 dark:text-rose-300 underline"
              >
                <Sparkles className="w-3 h-3" /> Practice with Weak Topic Coach
              </Link>
            )}
          </div>
        </div>

        {/* Detailed Question By Question Analysis */}
        <div className="space-y-4">
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
            Question & Response Analysis
          </h2>

          <div className="space-y-4">
            {session.questions?.map((q: any, idx: number) => {
              const answer = answers.find((a: any) => a.questionId === q.id) || answers[idx];

              return (
                <div
                  key={q.id || idx}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <span className="text-xs font-mono font-bold text-slate-500">
                      Question {idx + 1} • {q.topic}
                    </span>
                    {answer && (
                      <span
                        className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                          answer.classification === 'STRONG'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200'
                            : answer.classification === 'AVERAGE'
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200'
                            : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200'
                        }`}
                      >
                        {answer.classification} ({answer.evaluationScore}%)
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {q.questionText}
                  </h3>

                  {answer?.studentResponse && (
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-xs space-y-1">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Your Answer:</span>
                      <p className="text-slate-600 dark:text-slate-300 italic">{answer.studentResponse}</p>
                    </div>
                  )}

                  {answer?.feedback && (
                    <div className="p-3.5 rounded-xl bg-brand-50/50 dark:bg-brand-950/40 border border-brand-200/80 dark:border-brand-900 text-xs space-y-1">
                      <span className="font-bold text-brand-800 dark:text-brand-300">AI Examiner Feedback:</span>
                      <p className="text-slate-700 dark:text-slate-200 leading-relaxed">{answer.feedback}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
