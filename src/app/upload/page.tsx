'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { PdfUploader } from '@/components/PdfUploader';
import { UploadCloud, FileText, ArrowRight, Sparkles } from 'lucide-react';

export default function UploadPage() {
  const router = useRouter();

  const handleUploadSuccess = (doc: { id: string; filename: string; topics: string[] }) => {
    router.push(`/mode-selection?docId=${doc.id}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-foreground/15 selection:text-foreground">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-lg bg-brand-700 dark:bg-brand-600 text-white flex items-center justify-center mx-auto shadow-xs mb-3">
            <UploadCloud className="w-5 h-5" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Upload Study Material</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Upload any textbook chapter, notes, or syllabus PDF to generate grounded exams and oral viva defense sessions.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
          <PdfUploader onSuccess={handleUploadSuccess} />
        </div>
      </main>
    </div>
  );
}
