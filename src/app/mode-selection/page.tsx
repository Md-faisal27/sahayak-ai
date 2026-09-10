'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { FileText, Mic, Award, CheckCircle2, Sparkles, Loader2, Sliders, Volume2, BookOpen, Layers, ChevronDown } from 'lucide-react';

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

  return (
    <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 min-w-0">
      {/* Document Overview & Switcher */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full min-w-0">
        <div className="flex items-center gap-3 sm:gap-4 w-full min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-900 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-brand-700 dark:text-brand-400" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-100 dark:bg-brand-950 text-brand-800 dark:text-brand-300 shrink-0">
                {document?.detectedSubject || 'Study Material'}
              </span>
              <span className="text-xs text-slate-400 font-mono">• {document?.pageCount || 1} Pages</span>
            </div>
            <h1 className="text-base sm:text-xl font-extrabold text-slate-900 dark:text-white mt-1 break-words">
              {document?.filename}
            </h1>
          </div>
        </div>

        {documents.length > 1 && (
          <div className="relative w-full sm:w-auto min-w-0 sm:min-w-[260px] md:min-w-[300px]">
            <select
              id="pdf-material-selector"
              value={selectedDocId || ''}
              onChange={(e) => handleSelectDoc(e.target.value)}
              className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 rounded-xl pl-3 pr-9 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all cursor-pointer truncate shadow-xs"
            >
              {documents.map((d) => (
                <option key={d.id} value={d.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 py-1">
                  {d.filename} {d.detectedSubject ? `(${d.detectedSubject})` : ''}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              <ChevronDown className="w-4 h-4 shrink-0" />
            </div>
          </div>
        )}
      </div>

      {/* Mode Selector Options */}
      <div className="space-y-4 w-full min-w-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Select Assessment Mode
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Choose how you wish to practice with this document.
          </p>
        </div>

        <div className="space-y-3 w-full min-w-0">
          {/* Mode 1: INTERVIEW */}
          <div
            onClick={() => setSelectedMode('INTERVIEW')}
            className={`rounded-2xl p-4 sm:p-5 border-2 transition-colors cursor-pointer w-full min-w-0 ${
              selectedMode === 'INTERVIEW'
                ? 'border-brand-600 bg-white dark:bg-slate-900 shadow-sm'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`w-3 h-3 rounded-full shrink-0 ${
                  selectedMode === 'INTERVIEW'
                    ? 'bg-brand-600 ring-4 ring-brand-100 dark:ring-brand-950'
                    : 'border-2 border-slate-300 dark:border-slate-600'
                }`}
              />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                AI Voice Interview
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 ml-6 leading-relaxed">
              Interactive spoken examination with adaptive questions and verbal coaching feedback.
            </p>
          </div>

          {/* Mode 2: FLASHCARDS */}
          <div
            onClick={() => setSelectedMode('FLASHCARDS')}
            className={`rounded-2xl p-4 sm:p-5 border-2 transition-colors cursor-pointer w-full min-w-0 ${
              selectedMode === 'FLASHCARDS'
                ? 'border-brand-600 bg-white dark:bg-slate-900 shadow-sm'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`w-3 h-3 rounded-full shrink-0 ${
                  selectedMode === 'FLASHCARDS'
                    ? 'bg-brand-600 ring-4 ring-brand-100 dark:ring-brand-950'
                    : 'border-2 border-slate-300 dark:border-slate-600'
                }`}
              />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Flashcards</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 ml-6 leading-relaxed">
              Active recall question cards with flip answers and mastery tracking.
            </p>
          </div>

          {/* Mode 3: SUMMARIZE */}
          <div
            onClick={() => setSelectedMode('SUMMARIZE')}
            className={`rounded-2xl p-4 sm:p-5 border-2 transition-colors cursor-pointer w-full min-w-0 ${
              selectedMode === 'SUMMARIZE'
                ? 'border-brand-600 bg-white dark:bg-slate-900 shadow-sm'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`w-3 h-3 rounded-full shrink-0 ${
                  selectedMode === 'SUMMARIZE'
                    ? 'bg-brand-600 ring-4 ring-brand-100 dark:ring-brand-950'
                    : 'border-2 border-slate-300 dark:border-slate-600'
                }`}
              />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Document Summary</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 ml-6 leading-relaxed">
              Comprehensive breakdown of core concepts, key formulas, tables, and exam takeaways.
            </p>
          </div>
        </div>
      </div>

      {/* Configuration Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-brand-700 dark:text-brand-400" />
          {selectedMode === 'SUMMARIZE'
            ? 'Summary Settings'
            : selectedMode === 'FLASHCARDS'
            ? 'Flashcard Settings'
            : 'Interview Settings'}
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
                Difficulty Level
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
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Generates active recall flashcards based on key concepts extracted from your document.
          </p>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Synthesizes a structured conceptual summary ready for quick revision or PDF download.
          </p>
        )}

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={handleStartSession}
            disabled={loading}
            className="w-full sm:w-auto px-7 py-2.5 bg-brand-700 hover:bg-brand-800 dark:bg-brand-600 dark:hover:bg-brand-500 text-white font-semibold rounded-xl shadow-sm flex items-center justify-center gap-2 text-xs transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />{' '}
                {selectedMode === 'SUMMARIZE'
                  ? 'Generating Summary...'
                  : selectedMode === 'FLASHCARDS'
                  ? 'Preparing Flashcards...'
                  : 'Starting Interview...'}
              </>
            ) : selectedMode === 'FLASHCARDS' ? (
              <span>Open Flashcards</span>
            ) : selectedMode === 'SUMMARIZE' ? (
              <span>Generate Summary</span>
            ) : (
              <span>Start Interview</span>
            )}
          </button>
        </div>
      </div>
    </main>
  );
}

export default function ModeSelectionPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-foreground/15 selection:text-foreground w-full max-w-full overflow-x-hidden">
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
