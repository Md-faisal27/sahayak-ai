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
              <Upload className="w-4 h-4" />
              <span>{activeTab === 'UPLOAD' ? 'View Dashboard' : 'Upload New PDF'}</span>
            </button>
          </div>
        </div>

        {/* Integrated Study Tools Hub (Replaces 3-in-a-row gradient boxes) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Priority Remediation Card */}
          <div className="md:col-span-6 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  Targeted Remediation
                </span>
                {weakTopic && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                    Needs Attention
                  </span>
                )}
              </div>
              <h3 className="font-bold text-base mt-2 text-slate-900 dark:text-white">Weak Topic Coach</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                {weakTopic
                  ? `Focus on reinforced retrieval drills for "${weakTopic}" based on previous assessment mistakes.`
                  : 'Complete sessions to automatically identify and drill weak conceptual areas.'}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              {weakTopic ? (
                <Link
                  href={`/weak-coach?topic=${encodeURIComponent(weakTopic)}`}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <span>Practice Weak Area</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <span className="text-xs text-slate-400 italic">No weak topics identified yet</span>
              )}
            </div>
          </div>

          {/* Flashcards Module */}
          <div className="md:col-span-3 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-700 dark:text-brand-400">
                Active Recall
              </span>
              <h3 className="font-bold text-base mt-2 text-slate-900 dark:text-white">Flashcards</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                Review definitions, formulas, and key concepts extracted from your uploaded documents.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <Link
                href="/flashcards"
                className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
              >
                <span>Review Cards</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* 5-Day Study Plan Module */}
          <div className="md:col-span-3 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                Syllabus Timeline
              </span>
              <h3 className="font-bold text-base mt-2 text-slate-900 dark:text-white">Study Schedule</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                Structured 5-day preparation milestones adapted to your specific exam syllabus.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <Link
                href="/study-plan"
                className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
              >
                <span>View Schedule</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
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

        {/* Upload Section Modal/Tab */}
        {activeTab === 'UPLOAD' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm space-y-6">
            <div className="text-center max-w-md mx-auto space-y-1">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Start a New Learning Session</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Upload your chapter PDF, exam guide, or course syllabus.
              </p>
            </div>
            <PdfUploader onSuccess={handlePdfUploadSuccess} />
          </div>
        )}

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Integrated Performance Metric Strip (Unified 4-column analytical bar) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 text-center gap-y-4 sm:gap-y-0">
              <div className="px-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white block">
                  {analytics?.totalSessions || 0}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 block">
                  Total Sessions
                </span>
              </div>
              <div className="px-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-brand-700 dark:text-brand-400 block">
                  {analytics?.overallAverageScore || 0}%
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 block">
                  Average Score
                </span>
              </div>
              <div className="px-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-teal-700 dark:text-teal-400 block">
                  {analytics?.totalQuestionsAnswered || 0}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 block">
                  Questions Practiced
                </span>
              </div>
              <div className="px-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 block">
                  100%
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 block">
                  Grounded Precision
                </span>
              </div>
            </div>

            {/* Uploaded Study Materials (PDFs) */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                    Your Study Materials ({documents.length})
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Choose which PDF to start an AI oral interview on, study flashcards, or generate a summary.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('UPLOAD')}
                  className="px-3.5 py-1.5 bg-brand-50 hover:bg-brand-100 dark:bg-brand-950 dark:hover:bg-brand-900 text-brand-700 dark:text-brand-300 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors border border-brand-200 dark:border-brand-800"
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
                        {doc.topics && doc.topics.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {doc.topics.slice(0, 3).map((t: string, idx: number) => (
                              <span
                                key={idx}
                                className="text-[10px] px-2 py-0.5 rounded bg-white dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 truncate max-w-[140px]"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
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
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold">Recent Sessions</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Reopen previous learning & assessment sessions</p>
                </div>
                <Link
                  href="/history"
                  className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
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
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  Topic Mastery Analysis
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Cross-session concept evaluation
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Strong Topics
                </span>
                <div className="flex flex-wrap gap-2">
                  {analytics?.strongTopics && analytics.strongTopics.length > 0 ? (
                    analytics.strongTopics.map((t: any) => (
                      <TopicBadge key={t.name} topic={t.name} classification="STRONG" score={t.score} />
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">No strong topics recorded yet</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4" /> Average Topics
                </span>
                <div className="flex flex-wrap gap-2">
                  {analytics?.averageTopics && analytics.averageTopics.length > 0 ? (
                    analytics.averageTopics.map((t: any) => (
                      <TopicBadge key={t.name} topic={t.name} classification="AVERAGE" score={t.score} />
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic font-normal">None recorded</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" /> Weak Topics (Needs Work)
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {analytics?.weakTopics && analytics.weakTopics.length > 0 ? (
                    analytics.weakTopics.map((t: any) => (
                      <div key={t.name} className="flex items-center gap-1">
                        <TopicBadge topic={t.name} classification="WEAK" score={t.score} />
                        <Link
                          href={`/weak-coach?topic=${encodeURIComponent(t.name)}`}
                          className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-600 text-white hover:bg-rose-700"
                        >
                          Practice
                        </Link>
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic font-normal">None recorded</span>
                  )}
                </div>
              </div>

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
