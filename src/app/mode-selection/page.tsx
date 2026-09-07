'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { FileText, Mic, Award, CheckCircle2, Sparkles, Loader2, Sliders, Volume2, BookOpen, Layers } from 'lucide-react';

function ModeSelectionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const docId = searchParams.get('docId');

  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(docId);
  const [document, setDocument] = useState<any>(null);
  const [selectedMode, setSelectedMode] = useState<'INTERVIEW' | 'FLASHCARDS' | 'SUMMARIZE'>('INTERVIEW');
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [loading, setLoading] = useState(false);
  const [fetchingDoc, setFetchingDoc] = useState(true);

  const loadDocDetails = async (id: string) => {
    try {
      const res = await fetch(`/api/pdf/${id}`);
      if (res.ok) {
        const data = await res.json();
        setDocument(data.document);
      }
    } catch (err) {
      console.error('Error fetching document details:', err);
    }
  };

  useEffect(() => {
    fetch('/api/pdf')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const docs = data?.documents || [];
        setDocuments(docs);

        if (docs.length > 0) {
          const targetId = docId && docs.some((d: any) => d.id === docId) ? docId : docs[0].id;
          setSelectedDocId(targetId);
          loadDocDetails(targetId);
        }
      })
      .catch((e) => console.error(e))
      .finally(() => setFetchingDoc(false));
  }, [docId]);

  const handleSelectDoc = (id: string) => {
    setSelectedDocId(id);
    loadDocDetails(id);
    router.replace(`/mode-selection?docId=${id}`);
  };

  const handleStartSession = async () => {
    if (!selectedDocId) return;

    if (selectedMode === 'FLASHCARDS') {
      router.push(`/flashcards?docId=${selectedDocId}`);
      return;
    }

    if (selectedMode === 'SUMMARIZE') {
      router.push(`/summary?documentId=${selectedDocId}`);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: selectedDocId,
          mode: selectedMode,
          questionCount,
          difficulty,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initialize session');

      router.push(`/session/${data.session.id}`);
    } catch (err: any) {
      alert(err.message || 'Error creating session');
      setLoading(false);
    }
  };

  if (fetchingDoc) {
    return (
      <div className="flex-1 flex items-center justify-center space-y-3 flex-col">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
        <span className="text-sm font-semibold text-slate-500">Loading study materials...</span>
      </div>
    );
  }

  if (documents.length === 0 && !document) {
    return (
      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
          <FileText className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">No Study Materials Found</h2>
        <p className="text-xs text-slate-500">Please upload a syllabus or lecture notes PDF first to begin.</p>
        <button
          onClick={() => router.push('/upload')}
          className="px-5 py-2.5 bg-brand-600 text-white font-semibold text-xs rounded-xl shadow-sm"
        >
          Upload PDF Now
        </button>
      </main>
    );
  }

  const topics: string[] = document?.extractedTopics ? (typeof document.extractedTopics === 'string' ? JSON.parse(document.extractedTopics) : document.extractedTopics) : (document?.topics || []);

  return (
    <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Multi-Document Switcher Pills */}
      {documents.length > 1 && (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <Layers className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Choose PDF Material ({documents.length} available):
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {documents.map((d) => {
              const active = selectedDocId === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => handleSelectDoc(d.id)}
                  type="button"
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                    active
                      ? 'bg-brand-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[170px]">{d.filename}</span>
                  {active && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Document Overview Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-900 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6 text-brand-700 dark:text-brand-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-100 dark:bg-brand-950 text-brand-800 dark:text-brand-300">
                {document?.detectedSubject || 'Study Material'}
              </span>
              <span className="text-xs text-slate-400 font-mono">• {document?.pageCount || 1} Pages</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              {document?.filename}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 max-w-md">
          {topics.slice(0, 4).map((t, idx) => (
            <span
              key={idx}
              className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              {t}
            </span>
          ))}
          {topics.length > 4 && (
            <span className="text-[11px] text-slate-400 font-mono self-center">
              +{topics.length - 4} more
            </span>
          )}
        </div>
      </div>

      {/* Mode Selector Options */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Select Assessment Modality
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Choose how you wish to be tested on the extracted document concepts.
          </p>
        </div>

        <div className="space-y-3">
          {/* Mode 1: INTERVIEW */}
          <div
            onClick={() => setSelectedMode('INTERVIEW')}
            className={`rounded-2xl p-5 border-2 transition-colors cursor-pointer ${
              selectedMode === 'INTERVIEW'
                ? 'border-brand-600 bg-white dark:bg-slate-900 shadow-sm'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span
                  className={`w-3 h-3 rounded-full ${
                    selectedMode === 'INTERVIEW'
                      ? 'bg-brand-600 ring-4 ring-brand-100 dark:ring-brand-950'
                      : 'border-2 border-slate-300 dark:border-slate-600'
                  }`}
                />
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    AI Technical Interview (Adaptive Agent)
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 flex items-center gap-1">
                    Adaptive Examination
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-900 self-start sm:self-auto">
                1 Question at a Time • Report After Exam
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2.5 ml-6 leading-relaxed">
              Targeted technical interview asking one grounded core question at a time. Adapts difficulty dynamically and provides a comprehensive evaluation report upon completion.
            </p>
          </div>

          {/* Mode 2: FLASHCARDS */}
          <div
            onClick={() => setSelectedMode('FLASHCARDS')}
            className={`rounded-2xl p-5 border-2 transition-colors cursor-pointer ${
              selectedMode === 'FLASHCARDS'
                ? 'border-brand-600 bg-white dark:bg-slate-900 shadow-sm'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span
                  className={`w-3 h-3 rounded-full ${
                    selectedMode === 'FLASHCARDS'
                      ? 'bg-brand-600 ring-4 ring-brand-100 dark:ring-brand-950'
                      : 'border-2 border-slate-300 dark:border-slate-600'
                  }`}
                />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Active Recall Flashcards</h3>
              </div>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 self-start sm:self-auto">
                Interactive Drill
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2.5 ml-6 leading-relaxed">
              High-yield question cards testing the core topics of the PDF with flip answers, mastery tracking, and printable study sheets.
            </p>
          </div>

          {/* Mode 3: SUMMARIZE */}
          <div
            onClick={() => setSelectedMode('SUMMARIZE')}
            className={`rounded-2xl p-5 border-2 transition-colors cursor-pointer ${
              selectedMode === 'SUMMARIZE'
                ? 'border-brand-600 bg-white dark:bg-slate-900 shadow-sm'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span
                  className={`w-3 h-3 rounded-full ${
                    selectedMode === 'SUMMARIZE'
                      ? 'bg-brand-600 ring-4 ring-brand-100 dark:ring-brand-950'
                      : 'border-2 border-slate-300 dark:border-slate-600'
                  }`}
                />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Summary of Uploaded PDF</h3>
              </div>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 self-start sm:self-auto">
                12-Part Master Study Guide
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2.5 ml-6 leading-relaxed">
              Generates a comprehensive 12-section conceptual breakdown, key mathematical formulas, comparative tables, definitions, and exam takeaways extracted directly from your PDF with multi-page PDF download.
            </p>
          </div>
        </div>
      </div>

      {/* Configuration Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-brand-700 dark:text-brand-400" />
          {selectedMode === 'SUMMARIZE'
            ? 'Summary Output Specification'
            : selectedMode === 'FLASHCARDS'
            ? 'Flashcard Study Specification'
            : 'AI Interview Calibration'}
        </h3>

        {selectedMode === 'INTERVIEW' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                Number of Questions
              </label>
              <div className="flex items-center gap-2">
                {[3, 5, 8, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setQuestionCount(num)}
                    className={`flex-1 py-2 rounded-lg border text-xs font-semibold transition-colors ${
                      questionCount === num
                        ? 'bg-brand-700 text-white border-brand-700 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {num} Qs
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                Starting Difficulty Level
              </label>
              <div className="flex items-center gap-2">
                {(['Easy', 'Medium', 'Hard'] as const).map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setDifficulty(diff)}
                    className={`flex-1 py-2 rounded-lg border text-xs font-semibold transition-colors ${
                      difficulty === diff
                        ? 'bg-brand-700 text-white border-brand-700 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : selectedMode === 'FLASHCARDS' ? (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
            <p className="font-semibold text-slate-900 dark:text-white">Active Recall Flashcards on Core Topics</p>
            <p className="leading-relaxed">
              Generates high-yield question cards testing the core topics of the PDF with flip answers, mastery tracking, and printable study sheets.
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
            <p className="font-semibold text-slate-900 dark:text-white">12-Part Master Study Guide Extraction</p>
            <p className="leading-relaxed">
              Synthesizes core definitions, theoretical foundations, formulas, comparison tables, and exam takeaways across all extracted document pages into an exportable study summary.
            </p>
          </div>
        )}

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={handleStartSession}
            disabled={loading}
            className="w-full sm:w-auto px-7 py-3 bg-brand-700 hover:bg-brand-800 dark:bg-brand-600 dark:hover:bg-brand-500 text-white font-semibold rounded-xl shadow-sm flex items-center justify-center gap-2 text-sm transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />{' '}
                {selectedMode === 'SUMMARIZE'
                  ? 'Generating 12-Part PDF Summary...'
                  : selectedMode === 'FLASHCARDS'
                  ? 'Preparing Core Topic Flashcards...'
                  : 'Initializing AI Interviewer & Voice...'}
              </>
            ) : selectedMode === 'FLASHCARDS' ? (
              <span>Study Core Topic Flashcards</span>
            ) : selectedMode === 'SUMMARIZE' ? (
              <span>Generate PDF Summary</span>
            ) : (
              <span>Start AI Technical Interview</span>
            )}
          </button>
        </div>
      </div>
    </main>
  );
}

export default function ModeSelectionPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-foreground/15 selection:text-foreground">
      <Navbar />
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          </div>
        }
      >
        <ModeSelectionContent />
      </Suspense>
    </div>
  );
}
