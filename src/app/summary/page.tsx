'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import {
  FileText,
  Download,
  Loader2,
  Sparkles,
  BookOpen,
  Layers,
  Calendar,
  ChevronDown,
  Upload,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';

function SummaryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const docIdParam = searchParams.get('docId') || searchParams.get('documentId');

  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(docIdParam || null);
  const [currentDoc, setCurrentDoc] = useState<any>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadSummary(selectedDocId || undefined);
  }, [selectedDocId]);

  const loadSummary = async (targetId?: string) => {
    setLoading(true);
    try {
      const url = targetId ? `/api/summary?documentId=${targetId}&autoGenerate=true` : '/api/summary?autoGenerate=true';
      const res = await fetch(url);
      const data = await res.json();

      if (res.ok) {
        setDocuments(data.documents || []);
        setCurrentDoc(data.document || null);
        setSummary(data.summary || null);
        setSessionId(data.sessionId || null);

        if (!selectedDocId && data.document?.id) {
          setSelectedDocId(data.document.id);
        }
      }
    } catch (e) {
      console.error('Failed to fetch summary:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSummary = async (force: boolean = false) => {
    if (!selectedDocId) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: selectedDocId }),
      });
      const data = await res.json();
      if (res.ok) {
        setSummary(data.summary);
        setSessionId(data.sessionId);
      } else {
        alert(data.error || 'Failed to generate summary');
      }
    } catch (e: any) {
      alert(e.message || 'Error generating summary');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center space-y-3 flex-col py-28">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
        <span className="text-sm font-semibold text-slate-500">Loading master study guide...</span>
      </div>
    );
  }

  if (!documents.length) {
    return (
      <div className="flex-1 max-w-xl mx-auto px-4 py-24 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-900 flex items-center justify-center mx-auto text-brand-600 dark:text-brand-400 shadow-sm">
          <FileText className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">No PDF Documents Yet</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Upload your syllabus or course PDF to automatically synthesize a 12-part comprehensive study guide with formulas, definitions, and comparative tables.
          </p>
        </div>
        <Link
          href="/upload"
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand-700 hover:bg-brand-800 text-white font-semibold rounded-xl text-sm shadow-sm transition-colors"
        >
          <Upload className="w-4 h-4" /> Upload Course PDF
        </Link>
      </div>
    );
  }

  return (
    <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 min-w-0">
      {/* Studio Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-8 shadow-sm space-y-6 w-full min-w-0">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800 w-full min-w-0">
          <div className="w-full md:w-auto min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900 shrink-0">
                12-Part Study Guide
              </span>
              <span className="text-xs text-slate-500 font-mono truncate">
                • {currentDoc?.detectedSubject || 'Curriculum Synthesis'}
              </span>
            </div>
            <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1.5 break-words">
              {currentDoc?.filename || 'Document Summary'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Rigorous, publication-grade academic synthesis anchored strictly to your uploaded PDF chunks.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Document Selector */}
            {documents.length > 1 && (
              <div className="relative w-full sm:w-auto">
                <select
                  value={selectedDocId || ''}
                  onChange={(e) => setSelectedDocId(e.target.value)}
                  className="appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 pr-8 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 w-full sm:w-auto max-w-full truncate"
                >
                  {documents.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.filename}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}

            {/* Regenerate Button */}
            <button
              type="button"
              disabled={generating}
              onClick={() => handleGenerateSummary(true)}
              className="flex-1 sm:flex-initial justify-center px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
              <span>{generating ? 'Synthesizing...' : 'Regenerate'}</span>
            </button>

            {/* Download PDF */}
            {sessionId && (
              <a
                href={`/api/export/summary/${sessionId}`}
                download
                className="flex-1 sm:flex-initial justify-center px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF Guide</span>
              </a>
            )}
          </div>
        </div>

        {/* Content Viewer */}
        {generating ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 text-center px-4">
              Synthesizing 12-section master study guide from document pages...
            </p>
          </div>
        ) : summary ? (
          <div className="space-y-4 font-sans max-w-4xl w-full min-w-0 break-words">
            {summary.split('\n').map((line: string, idx: number) => {
              const trimmed = line.trim();
              if (!trimmed) return <div key={idx} className="h-2" />;
              if (trimmed.startsWith('# ')) {
                return (
                  <h2
                    key={idx}
                    className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white pt-4 pb-2 border-b border-slate-200 dark:border-slate-800 break-words"
                  >
                    {trimmed.replace(/^#\s+/, '')}
                  </h2>
                );
              }
              if (trimmed.startsWith('## ')) {
                return (
                  <h3
                    key={idx}
                    className="text-sm sm:text-lg font-bold text-indigo-700 dark:text-indigo-400 pt-5 pb-1 break-words"
                  >
                    {trimmed.replace(/^##\s+/, '')}
                  </h3>
                );
              }
              if (trimmed.startsWith('### ')) {
                return (
                  <h4 key={idx} className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 pt-2 break-words">
                    {trimmed.replace(/^###\s+/, '')}
                  </h4>
                );
              }
              if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
                return (
                  <div
                    key={idx}
                    className="font-mono text-xs bg-slate-50 dark:bg-slate-800/70 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 overflow-x-auto max-w-full min-w-0 w-full"
                  >
                    {trimmed}
                  </div>
                );
              }
              if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                return (
                  <div key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 pl-1 sm:pl-2 min-w-0">
                    <span className="text-indigo-500 font-bold mt-0.5 shrink-0">•</span>
                    <span className="break-words min-w-0 flex-1">{trimmed.replace(/^[-*]\s+/, '')}</span>
                  </div>
                );
              }
              return (
                <p key={idx} className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed break-words">
                  {trimmed}
                </p>
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center space-y-4">
            <p className="text-sm text-slate-500">No summary has been generated for this document yet.</p>
            <button
              onClick={() => handleGenerateSummary(false)}
              disabled={generating}
              className="px-5 py-2.5 bg-brand-700 hover:bg-brand-800 text-white text-xs font-semibold rounded-xl"
            >
              Generate 12-Part Master Study Guide
            </button>
          </div>
        )}

        {/* Quick-Launch Next Actions */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full min-w-0">
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-3 w-full min-w-0">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-brand-600" /> Active Recall Flashcards
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Reinforce core concepts extracted from this document with interactive flip cards.
              </p>
            </div>
            <button
              onClick={() => router.push(`/flashcards?docId=${selectedDocId}`)}
              className="self-start px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-brand-700 dark:text-brand-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <span>Practice Flashcards</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-3 w-full min-w-0">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-emerald-600" /> AI Technical Interview
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Defend your understanding through voice-driven technical questions with Rime AI.
              </p>
            </div>
            <button
              onClick={() => router.push(`/mode-selection?docId=${selectedDocId}`)}
              className="self-start px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <span>Start AI Interview</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function SummaryPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-foreground/15 selection:text-foreground w-full max-w-full overflow-x-hidden">
      <Navbar />
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          </div>
        }
      >
        <SummaryContent />
      </Suspense>
    </div>
  );
}
