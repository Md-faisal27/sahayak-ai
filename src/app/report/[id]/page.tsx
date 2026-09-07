'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { TopicBadge } from '@/components/TopicBadge';
import {
  Award,
  Download,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  FileText,
  ArrowLeft,
  Loader2,
  BookOpen,
  Sparkles,
  HelpCircle,
  BarChart3,
  Layers,
} from 'lucide-react';

export default function ReportPage() {
  const { id: sessionId } = useParams() as { id: string };
  const router = useRouter();

  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/sessions/${sessionId}/report`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.report) {
          setReport(data.report);
        } else {
          router.push('/dashboard');
        }
      })
      .finally(() => setLoading(false));
  }, [sessionId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-foreground/15 selection:text-foreground">
        <Navbar />
        <div className="flex-1 flex items-center justify-center space-y-3 flex-col">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          <span className="text-sm font-semibold text-slate-500">Compiling Assessment Report...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-foreground/15 selection:text-foreground">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-brand-600 flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>

          {/* Export Downloads */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <a
              href={`/api/export/report/${sessionId}`}
              download
              className="flex-1 sm:flex-initial px-4 py-3 sm:py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-all min-h-[44px] sm:min-h-0"
            >
              <Download className="w-3.5 h-3.5" /> <span className="sm:inline">Download Report PDF</span>
            </a>
            <a
              href={`/api/export/questions/${sessionId}`}
              download
              className="flex-1 sm:flex-initial px-4 py-3 sm:py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all min-h-[44px] sm:min-h-0"
            >
              <Download className="w-3.5 h-3.5" /> <span className="sm:inline">Question List PDF</span>
            </a>
          </div>
        </div>

        {/* Report Overview Banner */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-7 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-xs uppercase font-bold tracking-wider text-brand-700 dark:text-brand-400 block">
              {report.mode === 'INTERVIEW' ? 'AI Technical Interview Report' : 'Practice Examination Report'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {report.pdfName}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Subject: <strong>{report.detectedSubject || 'Study Material'}</strong> • Completed on {report.date} •{' '}
              {report.answeredCount} Questions Answered
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-center bg-slate-50 dark:bg-slate-800/80 p-5 rounded-xl border border-slate-200 dark:border-slate-700 min-w-[130px]">
              <span className="text-3xl font-extrabold text-brand-700 dark:text-brand-400 block">
                {report.scoreOutOf10 || (report.overallScore / 10).toFixed(1)}
                <span className="text-base text-slate-400 font-normal">/10</span>
              </span>
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mt-0.5">
                Evaluation Score
              </span>
            </div>

            <div className="text-center bg-slate-50 dark:bg-slate-800/80 p-5 rounded-xl border border-slate-200 dark:border-slate-700 min-w-[110px]">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white block">
                {report.overallScore}%
              </span>
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mt-0.5">
                Accuracy
              </span>
            </div>
          </div>
        </div>

        {/* Key Metrics Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
            <span className="text-xl font-extrabold text-slate-900 dark:text-white block">
              {report.answeredCount} / {report.totalQuestions}
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Attempted</span>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
            <span className="text-xl font-extrabold text-emerald-600 block">
              {report.correctCount ?? 0}
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Correct (8-10)</span>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
            <span className="text-xl font-extrabold text-amber-600 block">
              {report.partialCount ?? 0}
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Partial (5-7)</span>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
            <span className="text-xl font-extrabold text-rose-600 block">
              {report.incorrectCount ?? 0}
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Needs Work (&lt;5)</span>
          </div>
        </div>

        {/* Topic Breakdown Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Strong */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-3">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Strong Topics
            </h3>
            <div className="flex flex-wrap gap-2 pt-1">
              {report.strongTopics?.length > 0 ? (
                report.strongTopics.map((t: string) => <TopicBadge key={t} topic={t} classification="STRONG" />)
              ) : (
                <span className="text-xs text-slate-400 italic">None identified in this session</span>
              )}
            </div>
          </div>

          {/* Average */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-3">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Average Topics
            </h3>
            <div className="flex flex-wrap gap-2 pt-1">
              {report.averageTopics?.length > 0 ? (
                report.averageTopics.map((t: string) => <TopicBadge key={t} topic={t} classification="AVERAGE" />)
              ) : (
                <span className="text-xs text-slate-400 italic">None identified</span>
              )}
            </div>
          </div>

          {/* Weak */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-3">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> Weak Topics (Needs Work)
            </h3>
            <div className="flex flex-wrap gap-2 pt-1">
              {report.weakTopics?.length > 0 ? (
                report.weakTopics.map((t: string) => <TopicBadge key={t} topic={t} classification="WEAK" />)
              ) : (
                <span className="text-xs text-slate-400 italic">No weak topics! Excellent work.</span>
              )}
            </div>
          </div>
        </div>

        {/* Difficulty Performance Breakdown */}
        {report.difficultyPerformance && report.difficultyPerformance.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-brand-600" /> Difficulty Level Performance
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {report.difficultyPerformance.map((dp: any, idx: number) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-700 dark:text-slate-300">{dp.difficulty}</span>
                    <span className="font-mono text-brand-700 dark:text-brand-400">{dp.averageScore}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        dp.averageScore >= 80 ? 'bg-emerald-500' : dp.averageScore >= 55 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${dp.averageScore}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono block">
                    {dp.questionsCount} questions tested
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Prioritized Topics to Revise */}
        {report.topicsToRevise && report.topicsToRevise.length > 0 && (
          <div className="bg-brand-50/40 dark:bg-brand-950/20 rounded-3xl border border-brand-200 dark:border-brand-900/60 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-brand-800 dark:text-brand-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-600" /> Prioritized Topics to Revise
            </h3>
            <div className="space-y-3">
              {report.topicsToRevise.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          item.priority === 'HIGH'
                            ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                            : item.priority === 'MEDIUM'
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {item.priority} Priority
                      </span>
                      <strong className="text-sm font-bold text-slate-900 dark:text-white">{item.topic}</strong>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{item.reason}</p>
                    <p className="text-xs text-brand-700 dark:text-brand-300 font-medium">
                      Action: {item.recommendation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Question-Wise Performance Breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
          <h3 className="text-lg font-bold">Comprehensive Question & Answer Breakdown</h3>

          <div className="space-y-4">
            {report.answersBreakdown?.map((ans: any, idx: number) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">
                    Q{idx + 1}. {ans.topic} ({ans.difficulty}) • Format: {ans.questionType || 'Core concept'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                      Score: {ans.scoreOutOf10 ?? Math.round(ans.score / 10)}/10
                    </span>
                    <TopicBadge topic={ans.classification} classification={ans.classification} score={ans.score} />
                  </div>
                </div>

                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-relaxed">
                  {ans.questionText}
                </h4>

                <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300">
                  <span className="font-bold block text-slate-500 uppercase tracking-wider text-[10px] mb-1">
                    Student Response:
                  </span>
                  "{ans.studentResponse}"
                </div>

                {ans.expectedKeyPoints && ans.expectedKeyPoints.length > 0 && (
                  <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 p-2.5 rounded-lg">
                    <span className="font-bold text-slate-700 dark:text-slate-200">Expected Key Points: </span>
                    <span>{ans.expectedKeyPoints.join(' • ')}</span>
                  </div>
                )}

                <div className="text-xs text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-200/70 dark:border-slate-700">
                  <strong>Teacher Feedback:</strong> {ans.feedback}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
