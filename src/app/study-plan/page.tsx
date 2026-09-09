'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Calendar, CheckCircle2, AlertCircle, Sparkles, BookOpen, ArrowLeft, Loader2, Play, Upload } from 'lucide-react';

export default function StudyPlanPage() {
  const [studyPlan, setStudyPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadStudyPlan();
  }, []);

  const loadStudyPlan = async (docId?: string) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const url = docId ? `/api/study-plan?documentId=${docId}` : '/api/study-plan';
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Unable to generate your study plan.');
      }

      if (data?.studyPlan) {
        setStudyPlan(data.studyPlan);
      } else {
        throw new Error('Study plan content is empty.');
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Unable to generate your study plan.');
      setStudyPlan(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-foreground/15 selection:text-foreground w-full max-w-full overflow-x-hidden">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-brand-700 dark:hover:text-brand-300 flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <span className="text-xs font-bold text-slate-500">
            Syllabus Milestones
          </span>
        </div>

        {/* Header */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-sm space-y-1.5 w-full min-w-0">
          <span className="text-xs uppercase font-bold tracking-wider text-brand-700 dark:text-brand-400 block truncate">
            {studyPlan?.subject ? `${studyPlan.subject} • ${studyPlan.pdfName}` : 'Preparation Schedule'}
          </span>
          <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white break-words">5-Day Syllabus Preparation Schedule</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Targeted daily revision milestones calibrated to your topic mastery and document chapters
          </p>
        </div>

        {/* Schedule Grid */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" />
            <span className="text-xs font-semibold text-slate-500">Generating AI Study Schedule...</span>
          </div>
        ) : errorMessage ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-12 text-center text-slate-500 space-y-4 shadow-sm w-full min-w-0">
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto opacity-80" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 break-words">{errorMessage}</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Upload a course syllabus or textbook PDF from your dashboard to construct a 5-day study plan.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => loadStudyPlan()}
                className="px-5 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-all"
              >
                Try Again
              </button>
              <Link
                href="/upload"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-brand-700 transition-all"
              >
                <Upload className="w-4 h-4" /> Upload PDF Now
              </Link>
            </div>
          </div>
        ) : !studyPlan || !studyPlan.schedule || studyPlan.schedule.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border p-6 sm:p-12 text-center text-slate-400 space-y-4 w-full min-w-0">
            <BookOpen className="w-12 h-12 mx-auto opacity-50" />
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">No Study Plan Generated Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Upload a PDF from your dashboard to create a personalized study schedule.
            </p>
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-bold shadow-sm"
            >
              Upload PDF Now
            </Link>
          </div>
        ) : (
          <div className="space-y-4 w-full min-w-0">
            {studyPlan.schedule.map((dayItem: any) => (
              <div
                key={dayItem.day}
                className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6 w-full min-w-0"
              >
                <div className="space-y-3 flex-1 w-full min-w-0">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-black text-xs flex items-center justify-center shrink-0">
                      D{dayItem.day}
                    </span>
                    <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 break-words flex-1 min-w-[120px]">
                      {dayItem.title}
                    </h3>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded shrink-0 ${
                        dayItem.priority === 'HIGH'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {dayItem.priority} Priority
                    </span>
                  </div>

                  <ul className="space-y-1.5 pl-2 text-xs text-slate-600 dark:text-slate-400">
                    {dayItem.tasks.map((task: string, tIdx: number) => (
                      <li key={tIdx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 shrink-0 mt-0.5" />
                        <span className="break-words min-w-0">{task}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href="/dashboard"
                  className="w-full md:w-auto justify-center px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shrink-0"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Start Practice
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
