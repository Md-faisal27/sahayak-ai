'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { PdfUploader } from '@/components/PdfUploader';
import { TopicBadge } from '@/components/TopicBadge';
import {
  Sparkles,
  Upload,
  BookOpen,
  History,
  TrendingUp,
  Award,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileText,
  ChevronRight,
  ArrowUpRight,
  BarChart2,
  Layers,
  Calendar,
  Zap,
  Mic,
  X,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'UPLOAD'>('OVERVIEW');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) {
          router.push('/login');
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
          loadDashboardData();
        }
      });
  }, [router]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [sessRes, anaRes, docsRes] = await Promise.all([
        fetch('/api/sessions'),
        fetch('/api/analytics'),
        fetch('/api/pdf'),
      ]);

      if (sessRes.ok) {
        const sData = await sessRes.json();
        setSessions(sData.sessions || []);
      }

      if (anaRes.ok) {
        const aData = await anaRes.json();
        setAnalytics(aData.analytics || null);
      }

      if (docsRes.ok) {
        const dData = await docsRes.json();
        setDocuments(dData.documents || []);
      }
    } catch (e) {
      console.error('Failed loading dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePdfUploadSuccess = (doc: { id: string; filename: string; topics: string[] }) => {
    router.push(`/mode-selection?docId=${doc.id}`);
  };

  const [dismissedSessionIds, setDismissedSessionIds] = useState<string[]>([]);

  const handleDismissSession = async (sessionId: string) => {
    setDismissedSessionIds((prev) => [...prev, sessionId]);
    try {
      await fetch(`/api/sessions/${sessionId}/cancel`, { method: 'POST' });
    } catch (e) {}
  };

  const unfinishedSession = sessions.find(
    (s) =>
      s.status === 'IN_PROGRESS' &&
      (s.answeredCount ?? 0) < s.questionCount &&
      !dismissedSessionIds.includes(s.id)
  );
  const weakTopic = analytics?.weakTopics?.[0]?.name;
  const hasAnyTopics =
    (analytics?.strongTopics?.length || 0) +
    (analytics?.averageTopics?.length || 0) +
    (analytics?.weakTopics?.length || 0) > 0;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-foreground/15 selection:text-foreground w-full max-w-full overflow-x-hidden">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 min-w-0">
        {/* Workspace Banner */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-7 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6 transition-colors w-full min-w-0">
          <div className="space-y-1.5 min-w-0 flex-1">
            <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white break-words">
              Welcome back, <span className="text-brand-600 dark:text-brand-400">{user?.name || 'Student'}</span>
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm max-w-xl leading-relaxed">
              Turn your study materials into adaptive AI technical interviews, active recall flashcards, and comprehensive study summaries.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => setActiveTab(activeTab === 'UPLOAD' ? 'OVERVIEW' : 'UPLOAD')}
              className="w-full md:w-auto justify-center px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl text-xs sm:text-sm transition-colors flex items-center gap-2 shadow-xs"
            >
              {activeTab === 'UPLOAD' ? <X className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
              <span>{activeTab === 'UPLOAD' ? 'Close Upload' : 'Upload New PDF'}</span>
            </button>
          </div>
        </div>

        {/* Upload Section - Appears directly below the banner */}
        {activeTab === 'UPLOAD' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-brand-200 dark:border-brand-900/60 p-6 sm:p-8 shadow-md space-y-6 relative transition-all animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Upload New Study Material</h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Upload your chapter PDF, exam guide, or course syllabus to generate interactive practice material.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('OVERVIEW')}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <PdfUploader onSuccess={handlePdfUploadSuccess} />
          </div>
        )}

        {/* Targeted Weak Topic Alert (only if weak topic exists) */}
        {weakTopic && (
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Focus Area: {weakTopic}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Targeted practice questions based on previous assessment mistakes.
                </p>
              </div>
            </div>
            <Link
              href={`/weak-coach?topic=${encodeURIComponent(weakTopic)}`}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shrink-0"
            >
              <span>Practice Weak Topic</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Quick Action Study Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href={documents.length > 0 ? `/mode-selection?docId=${documents[0].id}` : '/upload'}
            className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-sm hover:border-brand-500/50 transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Mic className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Voice Interview</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Adaptive oral technical interviews with spoken voice evaluation.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-brand-600 dark:text-brand-400">
              <span>Start Interview</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>

          <Link
            href="/flashcards"
            className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-sm hover:border-brand-500/50 transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Flashcards</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Active recall review of formulas, definitions, and core concepts.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              <span>Review Cards</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>

          <Link
            href="/study-plan"
            className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-sm hover:border-teal-500/50 transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Calendar className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Study Schedule</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Structured 5-day milestone preparation tailored to your exam.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-teal-600 dark:text-teal-400">
              <span>View Schedule</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>
        </div>

        {/* Unfinished Session Resume Banner */}
        {unfinishedSession && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/80 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700 dark:text-amber-400">
                  Unfinished Session Pending
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {unfinishedSession.pdfName} ({unfinishedSession.mode} Mode)
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Subject: {unfinishedSession.detectedSubject || 'Study Material'} • Question{' '}
                  {(unfinishedSession.currentQuestionIndex ?? unfinishedSession.answeredCount ?? 0) + 1} of{' '}
                  {unfinishedSession.questionCount}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleDismissSession(unfinishedSession.id)}
                className="px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-amber-100 dark:hover:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-semibold rounded-lg transition-colors border border-amber-300 dark:border-amber-800"
              >
                Dismiss
              </button>

              <Link
                href={`/session/${unfinishedSession.id}`}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-2 transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Resume Session</span>
              </Link>
            </div>
          </div>
        )}

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Performance Metrics */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 sm:p-5 shadow-xs grid grid-cols-3 divide-x divide-slate-200 dark:divide-slate-800 text-center">
              <div className="px-1 sm:px-2">
                <span className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white block">
                  {analytics?.totalSessions || 0}
                </span>
                <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 block leading-tight">
                  Total Sessions
                </span>
              </div>
              <div className="px-1 sm:px-2">
                <span className="text-xl sm:text-3xl font-extrabold text-brand-600 dark:text-brand-400 block">
                  {analytics?.overallAverageScore || 0}%
                </span>
                <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 block leading-tight">
                  Average Score
                </span>
              </div>
              <div className="px-1 sm:px-2">
                <span className="text-xl sm:text-3xl font-extrabold text-teal-600 dark:text-teal-400 block">
                  {analytics?.totalQuestionsAnswered || 0}
                </span>
                <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 block leading-tight">
                  Questions Practiced
                </span>
              </div>
            </div>

            {/* Uploaded Study Materials (PDFs) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0" />
                    <span>Your Study Materials ({documents.length})</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Choose which PDF to start an AI oral interview on, study flashcards, or generate a summary.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('UPLOAD')}
                  className="px-3.5 py-1.5 bg-brand-50 hover:bg-brand-100 dark:bg-brand-950 dark:hover:bg-brand-900 text-brand-700 dark:text-brand-300 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors border border-brand-200 dark:border-brand-800 shrink-0 self-start sm:self-auto"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Add PDF</span>
                </button>
              </div>

              {documents.length === 0 ? (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500 space-y-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                  <FileText className="w-8 h-8 mx-auto opacity-50" />
                  <p className="text-xs">No PDFs uploaded yet.</p>
                  <button
                    onClick={() => setActiveTab('UPLOAD')}
                    className="text-xs font-semibold text-brand-600 hover:underline"
                  >
                    Upload your first PDF
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:border-brand-500/50 transition-all space-y-3"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300">
                            {doc.detectedSubject || 'Study Material'}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {doc.pageCount} {doc.pageCount === 1 ? 'Page' : 'Pages'}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate" title={doc.filename}>
                          {doc.filename}
                        </h4>
                      </div>

                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-2">
                        <Link
                          href={`/mode-selection?docId=${doc.id}`}
                          className="flex-1 min-w-[120px] py-1.5 px-3 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold text-center flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                        >
                          <Mic className="w-3.5 h-3.5" />
                          <span>Start Interview</span>
                        </Link>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Link
                            href={`/summary?documentId=${doc.id}`}
                            className="py-1.5 px-2.5 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-600 transition-colors"
                            title="View Summary"
                          >
                            Summary
                          </Link>
                          <Link
                            href={`/flashcards?docId=${doc.id}`}
                            className="py-1.5 px-2.5 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-600 transition-colors"
                            title="View Flashcards"
                          >
                            Cards
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Sessions */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mb-4 sm:mb-6">
                <div>
                  <h3 className="text-base sm:text-lg font-bold">Recent Sessions</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Reopen previous learning & assessment sessions</p>
                </div>
                <Link
                  href="/history"
                  className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 shrink-0 self-start sm:self-auto"
                >
                  View All History <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {sessions.length === 0 ? (
                <div className="text-center py-10 text-slate-400 dark:text-slate-500 space-y-3">
                  <FileText className="w-10 h-10 mx-auto opacity-60" />
                  <p className="text-sm">No recent study sessions found.</p>
                  <button
                    onClick={() => setActiveTab('UPLOAD')}
                    className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold shadow-sm hover:bg-brand-700"
                  >
                    Upload a PDF to Start
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.slice(0, 5).map((s) => (
                    <div
                      key={s.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-200/60 dark:border-slate-800"
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-xs shrink-0">
                          {s.mode.slice(0, 1)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">{s.pdfName}</h4>
                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            <span className="font-semibold uppercase text-[10px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700">
                              {s.mode}
                            </span>
                            <span className="truncate">Subject: {s.detectedSubject || 'Study Material'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-4 shrink-0">
                        <div className="text-right">
                          <span className="text-sm font-extrabold text-brand-600 dark:text-brand-400">{s.score}%</span>
                          <span className="block text-[10px] text-slate-400 uppercase font-semibold">{s.status}</span>
                        </div>

                        <Link
                          href={s.status === 'COMPLETED' ? `/report/${s.id}` : `/session/${s.id}`}
                          className="p-2.5 rounded-xl bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-brand-600 border border-slate-200 dark:border-slate-600 transition-colors"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Mastery Analysis */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  Topic Mastery Analysis
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Cross-session concept evaluation
                </p>
              </div>

              {!hasAnyTopics ? (
                <div className="text-center py-6 text-slate-400 dark:text-slate-500 space-y-1 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No Assessment Data Yet</p>
                  <p className="text-[11px] text-slate-400">
                    Complete an interview session to automatically analyze your strong and weak topics.
                  </p>
                </div>
              ) : (
                <>
                  {analytics?.strongTopics && analytics.strongTopics.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> Strong Topics
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {analytics.strongTopics.map((t: any) => (
                          <TopicBadge key={t.name} topic={t.name} classification="STRONG" score={t.score} />
                        ))}
                      </div>
                    </div>
                  )}

                  {analytics?.averageTopics && analytics.averageTopics.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4" /> Average Topics
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {analytics.averageTopics.map((t: any) => (
                          <TopicBadge key={t.name} topic={t.name} classification="AVERAGE" score={t.score} />
                        ))}
                      </div>
                    </div>
                  )}

                  {analytics?.weakTopics && analytics.weakTopics.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4" /> Weak Topics (Needs Work)
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {analytics.weakTopics.map((t: any) => (
                          <div key={t.name} className="flex items-center gap-1">
                            <TopicBadge topic={t.name} classification="WEAK" score={t.score} />
                            <Link
                              href={`/weak-coach?topic=${encodeURIComponent(t.name)}`}
                              className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-600 text-white hover:bg-rose-700"
                            >
                              Practice
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {analytics?.topicProgressList && analytics.topicProgressList.length > 0 && (
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                  <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                    Topic Score Trajectory:
                  </span>
                  {analytics.topicProgressList.slice(0, 3).map((tp: any) => (
                    <div key={tp.topicName} className="text-xs bg-slate-50 dark:bg-slate-800 p-3 rounded-xl space-y-1">
                      <div className="flex justify-between font-bold">
                        <span>{tp.topicName}</span>
                        <span className="text-brand-600 dark:text-brand-400">{tp.latestScore}%</span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        History: {tp.scoreHistory.join('% → ')}% ({tp.attemptsCount} attempts)
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
