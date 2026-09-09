'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import {
  Sparkles,
  Check,
  X,
  RotateCw,
  BookOpen,
  Loader2,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
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
    <main className="flex-1 max-w-4xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 min-w-0">
      {/* Top Breadcrumb & Document Selector */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800 w-full min-w-0">
        <Link
          href="/dashboard"
          className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-brand-700 dark:hover:text-brand-300 flex items-center gap-1.5 transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        {documents.length > 1 && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 w-full sm:w-auto min-w-0">
            <span className="text-xs text-slate-500 font-mono shrink-0 whitespace-nowrap">
              Select Document:
            </span>
            <select
              value={selectedDocId || ''}
              onChange={(e) => {
                setSelectedDocId(e.target.value);
                router.push(`/flashcards?docId=${e.target.value}`);
              }}
              className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 dark:text-slate-200 focus:outline-hidden w-full sm:w-auto max-w-full truncate"
            >
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.filename} ({d.detectedSubject})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full min-w-0">
        <div className="space-y-1 w-full min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-900 shrink-0">
              Active Recall Engine
            </span>
            {currentDoc?.detectedSubject && (
              <span className="text-xs text-slate-500 font-medium truncate">
                • {currentDoc.detectedSubject}
              </span>
            )}
          </div>
          <h1 className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white break-words">
            {currentDoc?.filename || 'Document Flashcards'}
          </h1>
          {currentDoc?.topics && currentDoc.topics.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {currentDoc.topics.slice(0, 5).map((topic: string) => (
                <span
                  key={topic}
                  className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 break-all"
                >
                  #{topic}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:items-end gap-2 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-brand-700 dark:text-brand-300">
            <span>Mastery: {knownCount} / {flashcards.length} Known</span>
            <span className="text-slate-400">({progressPercent}%)</span>
          </div>
          <div className="w-full sm:w-36 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1 w-full sm:w-auto">
            <button
              onClick={() => loadFlashcards(selectedDocId || undefined, true)}
              disabled={regenerating || loading}
              className="flex-1 sm:flex-initial px-2.5 py-1.5 sm:py-1 text-[11px] font-mono border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              title="Regenerate questions using LLM"
            >
              <RefreshCw className={`w-3 h-3 ${regenerating ? 'animate-spin' : ''}`} />
              <span>Regenerate with AI</span>
            </button>

            {flashcards.length > 0 && (
              <button
                onClick={downloadStudySheet}
                className="flex-1 sm:flex-initial px-2.5 py-1.5 sm:py-1 text-[11px] font-mono border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 transition-colors"
                title="Download study sheet PDF"
              >
                <Download className="w-3 h-3" />
                <span>Export PDF</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Flashcard Stage */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-700 dark:text-brand-400 mx-auto" />
          <span className="text-xs font-semibold text-slate-500">
            {regenerating ? 'Regenerating Core Topic Flashcards with LLM...' : 'Extracting Core Topic Flashcards...'}
          </span>
        </div>
      ) : flashcards.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 sm:p-12 text-center text-slate-400 space-y-4">
          <BookOpen className="w-12 h-12 mx-auto opacity-50" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">No Flashcards Generated Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Upload a syllabus PDF from your dashboard to create active-recall revision flashcards.
          </p>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-xs hover:bg-brand-800"
          >
            Upload PDF Now
          </Link>
        </div>
      ) : (
        <div className="space-y-6 w-full min-w-0">
          {/* Flashcard Box */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="w-full min-h-[260px] sm:min-h-[340px] rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 p-4 sm:p-8 shadow-sm cursor-pointer flex flex-col justify-between hover:border-brand-500 transition-all text-center relative overflow-hidden select-none min-w-0"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-500">
              <span>Card {currentIndex + 1} of {flashcards.length}</span>
              <span className="font-bold text-brand-700 dark:text-brand-400 uppercase tracking-wider truncate max-w-[150px] sm:max-w-none">
                {currentCard?.topic}
              </span>
              <span className="text-slate-400 flex items-center gap-1">
                <RotateCw className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Click or Space to </span>Flip
              </span>
            </div>

            <div className="py-6 sm:py-10 my-auto">
              <span className="text-[11px] font-mono uppercase font-bold text-slate-400 tracking-wider block mb-3">
                {isFlipped ? 'Grounded Answer & Definition' : 'Core Topic Question / Prompt'}
              </span>
              <p className="text-base sm:text-xl lg:text-2xl font-extrabold leading-relaxed text-slate-900 dark:text-white max-w-2xl mx-auto break-words">
                {isFlipped ? currentCard?.back : currentCard?.front}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400 pt-4 border-t border-slate-100 dark:border-slate-800/80">
              <span className="hidden sm:inline">Tip: Use Left/Right arrows to flip between cards</span>
              <span className="sm:hidden">Tap card to flip answer</span>
              {currentCard?.known ? (
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  ✓ Marked as Known
                </span>
              ) : (
                <span className="text-slate-400">Needs practice</span>
              )}
            </div>

            {currentCard?.known && (
              <div className="absolute top-3 right-3 sm:top-4 sm:right-4 text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-2 sm:px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                ✓ Mastered
              </div>
            )}
          </div>

          {/* Stepper Navigation & Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 w-full min-w-0">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  if (currentIndex > 0) {
                    setIsFlipped(false);
                    setCurrentIndex((p) => p - 1);
                  }
                }}
                disabled={currentIndex === 0}
                className="flex-1 sm:flex-initial px-3 sm:px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              <button
                type="button"
                onClick={() => {
                  if (currentIndex < flashcards.length - 1) {
                    setIsFlipped(false);
                    setCurrentIndex((p) => p + 1);
                  }
                }}
                disabled={currentIndex === flashcards.length - 1}
                className="flex-1 sm:flex-initial px-3 sm:px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => handleToggleKnown(false)}
                className="flex-1 sm:flex-initial px-3 sm:px-5 py-2.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold text-xs rounded-xl border border-rose-200 dark:border-rose-900 transition-all flex items-center justify-center gap-1.5 sm:gap-2"
              >
                <X className="w-4 h-4 shrink-0" /> <span>Needs Practice</span>
              </button>

              <button
                type="button"
                onClick={() => handleToggleKnown(true)}
                className="flex-1 sm:flex-initial px-3 sm:px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 sm:gap-2"
              >
                <Check className="w-4 h-4 shrink-0" /> <span>I Know This</span>
              </button>
            </div>
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
