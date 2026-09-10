'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import {
  Check,
  X,
  RotateCw,
  BookOpen,
  Loader2,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Download,
  RefreshCw,
  FileText,
} from 'lucide-react';
import Link from 'next/link';
import jsPDF from 'jspdf';

function FlashcardsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const docIdParam = searchParams.get('docId') || searchParams.get('documentId');

  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(docIdParam || null);
  const [currentDoc, setCurrentDoc] = useState<any>(null);
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    loadFlashcards(selectedDocId || undefined);
  }, [selectedDocId]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.code === 'ArrowRight') {
        if (currentIndex < flashcards.length - 1) {
          setIsFlipped(false);
          setCurrentIndex((prev) => prev + 1);
        }
      } else if (e.code === 'ArrowLeft') {
        if (currentIndex > 0) {
          setIsFlipped(false);
          setCurrentIndex((prev) => prev - 1);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, flashcards.length]);

  const loadFlashcards = async (docId?: string, forceRegenerate: boolean = false) => {
    if (forceRegenerate) setRegenerating(true);
    else setLoading(true);

    try {
      const url = docId
        ? `/api/flashcards?documentId=${docId}${forceRegenerate ? '&regenerate=true' : ''}`
        : `/api/flashcards${forceRegenerate ? '?regenerate=true' : ''}`;
      const res = await fetch(url);
      const data = await res.json();

      if (res.ok) {
        setFlashcards(data.flashcards || []);
        setCurrentDoc(data.document || null);
        if (data.documents && data.documents.length > 0) {
          setDocuments(data.documents);
          if (!selectedDocId && data.document?.id) {
            setSelectedDocId(data.document.id);
          }
        }
        setCurrentIndex(0);
        setIsFlipped(false);
      }
    } catch (e) {
      console.error('Failed to load flashcards:', e);
    } finally {
      setLoading(false);
      setRegenerating(false);
    }
  };

  const handleToggleKnown = async (known: boolean) => {
    const card = flashcards[currentIndex];
    if (!card) return;

    setFlashcards((prev) =>
      prev.map((c, i) => (i === currentIndex ? { ...c, known } : c))
    );

    await fetch('/api/flashcards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flashcardId: card.id, known }),
    });

    if (currentIndex < flashcards.length - 1) {
      setIsFlipped(false);
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const downloadStudySheet = () => {
    if (!flashcards.length) return;
    const doc = new jsPDF();
    const title = currentDoc?.filename || 'Flashcard Study Sheet';

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(30, 27, 75);
    doc.text('SAHAYAK AI • CORE TOPIC FLASHCARDS', 14, 20);

    doc.setFontSize(12);
    doc.setTextColor(79, 70, 229);
    doc.text(`Material: ${title}`, 14, 28);

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated on ${new Date().toLocaleDateString()} • Total Cards: ${flashcards.length}`, 14, 34);

    doc.setDrawColor(226, 232, 240);
    doc.line(14, 38, 196, 38);

    let y = 46;
    flashcards.forEach((card, idx) => {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      const qLines = doc.splitTextToSize(`Card ${idx + 1} [${card.topic}]: ${card.front}`, 175);
      doc.text(qLines, 14, y);
      y += qLines.length * 5 + 2;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      const aLines = doc.splitTextToSize(`Answer: ${card.back}`, 170);
      doc.text(aLines, 18, y);
      y += aLines.length * 5 + 6;
    });

    doc.save(`Flashcards_${title.replace(/\.pdf$/i, '')}.pdf`);
  };

  const currentCard = flashcards[currentIndex];
  const knownCount = flashcards.filter((f) => f.known).length;
  const progressPercent = flashcards.length > 0 ? Math.round((knownCount / flashcards.length) * 100) : 0;

  return (
    <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 min-w-0">
      {/* Streamlined Header Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800 w-full">
        {/* Back Link & Document Selector */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/dashboard"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          {documents.length > 1 ? (
            <div className="relative min-w-0">
              <select
                value={selectedDocId || ''}
                onChange={(e) => {
                  setSelectedDocId(e.target.value);
                  router.push(`/flashcards?docId=${e.target.value}`);
                }}
                className="appearance-none bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 rounded-xl pl-3 pr-8 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer max-w-[200px] sm:max-w-[280px] truncate transition-colors"
              >
                {documents.map((d) => (
                  <option key={d.id} value={d.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                    {d.filename}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          ) : (
            <h1 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[240px] sm:max-w-[320px]">
              {currentDoc?.filename || 'Flashcards'}
            </h1>
          )}
        </div>

        {/* Actions & Card Count */}
        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
          {flashcards.length > 0 && (
            <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400">
              {currentIndex + 1} / {flashcards.length}
            </span>
          )}

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => loadFlashcards(selectedDocId || undefined, true)}
              disabled={regenerating || loading}
              className="px-2.5 py-1.5 text-xs font-medium border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1.5 transition-colors disabled:opacity-50"
              title="Regenerate flashcards"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{regenerating ? 'Generating...' : 'Regenerate'}</span>
            </button>

            {flashcards.length > 0 && (
              <button
                onClick={downloadStudySheet}
                className="px-2.5 py-1.5 text-xs font-medium border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1.5 transition-colors"
                title="Export as PDF"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export PDF</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {flashcards.length > 0 && !loading && (
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-600 transition-all duration-300 ease-out"
            style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
          />
        </div>
      )}

      {/* Main Flashcard Stage */}
      {loading ? (
        <div className="py-24 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" />
          <p className="text-xs font-medium text-slate-500">
            {regenerating ? 'Generating flashcards with AI...' : 'Loading flashcards...'}
          </p>
        </div>
      ) : flashcards.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 sm:p-12 text-center text-slate-400 space-y-4">
          <BookOpen className="w-12 h-12 mx-auto opacity-40 text-slate-400" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No Flashcards Available</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Upload a PDF document from your dashboard to automatically create revision flashcards.
          </p>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold shadow-xs hover:bg-brand-700 transition-colors"
          >
            Upload PDF Now
          </Link>
        </div>
      ) : (
        <div className="space-y-5 w-full min-w-0">
          {/* Flashcard Box */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="w-full min-h-[300px] sm:min-h-[360px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-sm hover:shadow-md cursor-pointer flex flex-col justify-between hover:border-brand-400 dark:hover:border-brand-500 transition-all text-center select-none"
          >
            {/* Card Header: Topic & Mastered Badge */}
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] truncate max-w-[200px]">
                {currentCard?.topic}
              </span>

              {currentCard?.known && (
                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Mastered
                </span>
              )}
            </div>

            {/* Card Body: Question or Answer */}
            <div className="py-8 my-auto">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-3">
                {isFlipped ? 'Answer' : 'Question'}
              </span>
              <p className="text-lg sm:text-2xl font-bold leading-relaxed text-slate-900 dark:text-white max-w-2xl mx-auto break-words">
                {isFlipped ? currentCard?.back : currentCard?.front}
              </p>
            </div>

            {/* Card Footer: Flip Hint */}
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
              <RotateCw className="w-3.5 h-3.5" />
              <span>Click or Space to flip</span>
            </div>
          </div>

          {/* Controls: Prev, Mastery grading, Next */}
          <div className="flex items-center justify-between gap-2 sm:gap-4 pt-1">
            <button
              type="button"
              onClick={() => {
                if (currentIndex > 0) {
                  setIsFlipped(false);
                  setCurrentIndex((p) => p - 1);
                }
              }}
              disabled={currentIndex === 0}
              className="px-3 sm:px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Prev</span>
            </button>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => handleToggleKnown(false)}
                className="px-3.5 sm:px-5 py-2.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 dark:bg-slate-800 dark:hover:bg-rose-950/50 dark:hover:text-rose-300 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-900 transition-all flex items-center gap-1.5"
              >
                <X className="w-4 h-4 text-rose-500" />
                <span>Still Learning</span>
              </button>

              <button
                type="button"
                onClick={() => handleToggleKnown(true)}
                className={`px-3.5 sm:px-5 py-2.5 font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 ${
                  currentCard?.known
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-600 hover:text-white'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>{currentCard?.known ? 'Mastered' : 'Know This'}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                if (currentIndex < flashcards.length - 1) {
                  setIsFlipped(false);
                  setCurrentIndex((p) => p + 1);
                }
              }}
              disabled={currentIndex === flashcards.length - 1}
              className="px-3 sm:px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

export default function FlashcardsPage() {
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
        <FlashcardsContent />
      </Suspense>
    </div>
  );
}
