'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, AlertCircle, CheckCircle2, RefreshCw, X, Loader2, Sparkles } from 'lucide-react';

interface PdfUploaderProps {
  onSuccess: (document: { id: string; filename: string; pageCount: number; topics: string[] }) => void;
}

export function PdfUploader({ onSuccess }: PdfUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [status, setStatus] = useState<'IDLE' | 'UPLOADING' | 'PARSING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (selectedFile: File): boolean => {
    setErrorMessage(null);
    if (!selectedFile.name.toLowerCase().endsWith('.pdf') && selectedFile.type !== 'application/pdf') {
      setErrorMessage('Please upload a valid PDF document (.pdf format only).');
      return false;
    }
    if (selectedFile.size > 25 * 1024 * 1024) {
      setErrorMessage('File size exceeds the maximum limit of 25MB.');
      return false;
    }
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (validateFile(selected)) {
        setFile(selected);
        uploadAndProcess(selected);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      if (validateFile(selected)) {
        setFile(selected);
        uploadAndProcess(selected);
      }
    }
  };

  const uploadAndProcess = async (selectedFile: File) => {
    setStatus('UPLOADING');
    setProgress(30);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      setTimeout(() => {
        setStatus('PARSING');
        setProgress(70);
      }, 600);

      const res = await fetch('/api/pdf/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to process PDF.');
      }

      setProgress(100);
      setStatus('SUCCESS');
      onSuccess(data.document);
    } catch (err: any) {
      setStatus('ERROR');
      setErrorMessage(err.message || 'Error processing document. Please try again.');
    }
  };

  const resetUpload = () => {
    setFile(null);
    setStatus('IDLE');
    setErrorMessage(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => status === 'IDLE' && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-10 text-center transition-all cursor-pointer ${
          dragActive
            ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30 scale-[1.01]'
            : status === 'ERROR'
            ? 'border-red-300 dark:border-red-800 bg-red-50/30 dark:bg-red-950/20'
            : status === 'SUCCESS'
            ? 'border-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20'
            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/60 hover:border-brand-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          className="hidden"
        />

        {status === 'IDLE' && (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-100 dark:bg-brand-900/50 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto shadow-sm">
              <UploadCloud className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Upload your Study PDF
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Drag and drop your document here, or <span className="text-brand-600 dark:text-brand-400 font-semibold underline">browse file</span>
              </p>
            </div>
            <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
              <FileText className="w-3.5 h-3.5" /> PDF files up to 25MB supported
            </div>
          </div>
        )}

        {(status === 'UPLOADING' || status === 'PARSING') && (
          <div className="space-y-4 py-4">
            <div className="w-14 h-14 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 flex items-center justify-center mx-auto">
              <Loader2 className="w-7 h-7 animate-spin text-brand-700 dark:text-brand-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center justify-center gap-2">
                {status === 'UPLOADING' ? 'Uploading PDF Document...' : 'Parsing and Chunking Study Material...'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Extracting concepts, key topics, and preparing grounded voice evaluation models
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-md mx-auto bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-brand-700 dark:bg-brand-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {status === 'SUCCESS' && file && (
          <div className="space-y-3 py-2">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              PDF Processed Successfully!
            </h3>
            <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-4 py-2 rounded-xl text-emerald-800 dark:text-emerald-200 text-sm font-medium">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>{file.name}</span>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  resetUpload();
                }}
                className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold flex items-center gap-1 underline"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Replace File
              </button>
            </div>
          </div>
        )}

        {status === 'ERROR' && (
          <div className="space-y-3 py-2">
            <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-red-700 dark:text-red-400">
              Document Extraction Failed
            </h3>
            <p className="text-sm text-red-600 dark:text-red-300 max-w-md mx-auto">
              {errorMessage || 'Something went wrong while processing your PDF. Please try again.'}
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                resetUpload();
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-xl font-semibold text-xs hover:bg-red-700 transition-colors inline-flex items-center gap-1.5 shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry Upload
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
