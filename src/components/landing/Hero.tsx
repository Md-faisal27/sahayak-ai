'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ShieldCheck,
  Mic,
  Volume2,
  HelpCircle,
  FileText,
} from 'lucide-react';
import { AnimatedSection } from './AnimatedSection';

export function Hero() {
  const [simulatedLang, setSimulatedLang] = useState<'EN' | 'HI' | 'HG'>('EN');
  const [simulatedClueActive, setSimulatedClueActive] = useState(false);
  const [simulatedFeedback, setSimulatedFeedback] = useState<string | null>(null);

  const samplePrompts = {
    EN: {
      question:
        'Explain how the Two-Phase Locking (2PL) protocol ensures conflict serializability, and describe the condition that triggers a cascading abort.',
      clue: 'Clue: Growing phase locks, shrinking phase releases.',
      citation: 'Silberschatz Database Concepts, 7th Edition, Section 15.1, Page 684',
      snippet:
        'A transaction cannot request any lock once it has released any lock. Strict 2PL requires exclusive locks to be held until transaction commit.',
    },
    HI: {
      question:
        'स्पष्ट कीजिए कि टू-फेज लॉकिंग (2PL) प्रोटोकॉल किस प्रकार कॉन्फ्लिक्ट सीरियलाइजेबिलिटी सुनिश्चित करता है, और कैस्केडिंग एबॉर्ट की स्थिति बताएं।',
      clue: 'संकेत: ग्रोइंग फेज़ में लॉक पाना, श्रिंकिंग फेज़ में छोड़ना।',
      citation: 'सिलबरशैट्ज़ डेटाबेस कॉन्सेप्ट्स, अध्याय 15, पृष्ठ 684',
      snippet:
        'एक बार लॉक रिलीज़ करने के बाद ट्रांजैक्शन कोई नया लॉक नहीं ले सकता। स्ट्रिक्ट 2PL में एक्सक्लूसिव लॉक कमिट तक रहता है।',
    },
    HG: {
      question:
        'Explain kijiye ki Two-Phase Locking (2PL) conflict serializability kaise ensure karta hai, aur cascading abort kab trigger hota hai?',
      clue: 'Clue: Growing phase mein locks lena, shrinking mein release karna.',
      citation: 'Database Concepts Notes, Unit 4, Page 684',
      snippet:
        'Ek baar unlock start hone par naya lock request nahi ho sakta. Strict 2PL mein commit hone tak exclusive lock maintain rehta hai.',
    },
  };

  const currentSample = samplePrompts[simulatedLang];

  return (
    <section className="relative pt-28 sm:pt-36 lg:pt-40 pb-20 overflow-hidden border-b border-foreground/10">
      {/* Faint 8x12 grid of hairlines behind hero */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30 select-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, oklch(var(--foreground) / 0.08) 1px, transparent 1px),
            linear-gradient(to bottom, oklch(var(--foreground) / 0.08) 1px, transparent 1px)
          `,
          backgroundSize: 'calc(100% / 12) calc(100% / 8)',
        }}
      />

      {/* Large low-opacity wireframe sphere */}
      <div className="absolute right-[-12%] top-[5%] w-[500px] h-[500px] lg:w-[700px] lg:h-[700px] pointer-events-none opacity-[0.06] select-none">
        <svg viewBox="0 0 400 400" className="w-full h-full text-foreground" fill="none">
          <circle cx="200" cy="200" r="180" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
          <ellipse cx="200" cy="200" rx="180" ry="60" stroke="currentColor" strokeWidth="1" />
          <ellipse cx="200" cy="200" rx="180" ry="120" stroke="currentColor" strokeWidth="1" />
          <ellipse cx="200" cy="200" rx="60" ry="180" stroke="currentColor" strokeWidth="1" />
          <ellipse cx="200" cy="200" rx="120" ry="180" stroke="currentColor" strokeWidth="1" />
        </svg>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-12 items-center">
          {/* Left Column: Authentic Content & Editorial Presentation */}
          <div className="lg:col-span-6 space-y-6 text-left">
            {/* Eyebrow pattern */}
            <AnimatedSection delay={100}>
              <span className="inline-flex items-center gap-3 text-xs font-mono tracking-widest uppercase text-muted-foreground">
                <span className="w-8 h-px bg-foreground/30" />
                Syllabus-Grounded Assessment Intelligence
              </span>
            </AnimatedSection>

            {/* Giant Serif Headline */}
            <AnimatedSection delay={200}>
              <h1 className="text-[clamp(2.5rem,6.2vw,5.5rem)] font-display leading-[0.96] tracking-tight text-foreground text-balance">
                Document-Grounded Spoken Viva Voce and Oral Exam Prep
              </h1>
            </AnimatedSection>

            <AnimatedSection delay={300}>
              <p className="text-base sm:text-lg lg:text-xl text-muted-foreground leading-relaxed font-sans font-light max-w-xl">
                Upload textbook chapters, lecture notes, or syllabus PDFs. Sahayak AI conducts interactive verbal examinations, accepts natural spoken interruptions, and grades your responses strictly against source document citations.
              </p>
            </AnimatedSection>

            {/* Primary & Secondary Buttons */}
            <AnimatedSection delay={400} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <Link
                href="/signup"
                className="group inline-flex items-center justify-center gap-3 bg-foreground text-background font-mono text-xs uppercase tracking-widest rounded-full h-14 px-8 transition-all hover:bg-foreground/90 active:scale-[0.98] shadow-sm"
              >
                <span>Upload Syllabus &amp; Start Viva</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1.5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center border border-foreground/20 text-foreground font-mono text-xs uppercase tracking-widest rounded-full h-14 px-8 transition-all hover:bg-foreground/5 active:scale-[0.98]"
              >
                Sign In to Studio
              </Link>
            </AnimatedSection>

            {/* Key Grounding Anchors */}
            <AnimatedSection delay={500} className="pt-8 border-t border-foreground/10 grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-foreground shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-foreground font-mono font-semibold text-xs">Zero Hallucination</strong>
                  <span className="text-muted-foreground font-light">Restricted strictly to uploaded page chunks</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Mic className="w-4 h-4 text-foreground shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-foreground font-mono font-semibold text-xs">Live Interruption</strong>
                  <span className="text-muted-foreground font-light">Interrupt anytime to ask for 5-word clues</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Volume2 className="w-4 h-4 text-foreground shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-foreground font-mono font-semibold text-xs">3 Spoken Languages</strong>
                  <span className="text-muted-foreground font-light">English, Hindi, and technical Hinglish</span>
                </div>
              </div>
            </AnimatedSection>
          </div>

          {/* Right Column: Live Interactive Oral Exam Simulator */}
          <div className="lg:col-span-6">
            <AnimatedSection delay={300} className="bg-background rounded-lg border border-foreground/15 p-6 sm:p-7 shadow-sm space-y-5">
              {/* Console Header */}
              <div className="flex items-center justify-between pb-4 border-b border-foreground/10">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-foreground animate-pulse" />
                  <span className="text-xs font-mono font-semibold tracking-wider text-foreground uppercase">
                    EXAMINER ACTIVE // VIVA SESSION
                  </span>
                </div>

                {/* Language Switcher */}
                <div className="flex items-center gap-1 bg-muted/40 p-1 rounded border border-foreground/10 text-[11px] font-mono">
                  {(['EN', 'HI', 'HG'] as const).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => {
                        setSimulatedLang(lang);
                        setSimulatedFeedback(null);
                        setSimulatedClueActive(false);
                      }}
                      className={`px-2 py-0.5 rounded transition-colors ${
                        simulatedLang === lang
                          ? 'bg-foreground text-background font-semibold'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Spoken Audio Meter */}
              <div className="bg-muted/30 rounded p-4 border border-foreground/10 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                  <span className="flex items-center gap-2 text-foreground font-medium">
                    <Volume2 className="w-3.5 h-3.5" />
                    Examiner Spoken Audio Stream
                  </span>
                  <span className="font-semibold text-foreground">RATE: 1.0X</span>
                </div>

                {/* Geometric Audio Bars */}
                <div className="flex items-end justify-center gap-1.5 h-12 py-1 px-4 bg-background rounded border border-foreground/10">
                  <div className="w-1.5 h-4 bg-foreground/60 rounded-full animate-pulse" />
                  <div className="w-1.5 h-7 bg-foreground/80 rounded-full animate-pulse" />
                  <div className="w-1.5 h-10 bg-foreground rounded-full animate-pulse" />
                  <div className="w-1.5 h-5 bg-foreground/70 rounded-full animate-pulse" />
                  <div className="w-1.5 h-9 bg-foreground rounded-full animate-pulse" />
                  <div className="w-1.5 h-11 bg-foreground/90 rounded-full animate-pulse" />
                  <div className="w-1.5 h-6 bg-foreground/70 rounded-full animate-pulse" />
                  <div className="w-1.5 h-8 bg-foreground/80 rounded-full animate-pulse" />
                  <div className="w-1.5 h-4 bg-foreground/50 rounded-full animate-pulse" />
                  <div className="w-1.5 h-10 bg-foreground rounded-full animate-pulse" />
                  <div className="w-1.5 h-7 bg-foreground/70 rounded-full animate-pulse" />
                  <div className="w-1.5 h-3 bg-foreground/40 rounded-full animate-pulse" />
                </div>

                <p className="text-xs sm:text-sm text-foreground font-sans leading-relaxed pt-1">
                  &ldquo;{currentSample.question}&rdquo;
                </p>
              </div>

              {/* 5-Word Clue Banner */}
              {simulatedClueActive && (
                <div className="p-3 rounded border border-foreground/20 bg-muted/60 text-foreground text-xs font-mono flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 shrink-0" />
                    <span>{currentSample.clue}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSimulatedClueActive(false)}
                    className="text-[10px] underline font-bold uppercase tracking-wider"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Interruption Action Console */}
              <div className="space-y-2">
                <span className="block text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
                  Student Voice Interruption Controls
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSimulatedClueActive(true);
                      setSimulatedFeedback('Examiner provided a 5-word prompt clue.');
                    }}
                    className="p-2.5 rounded border border-foreground/15 bg-background hover:bg-muted text-xs font-mono text-foreground text-center transition-colors"
                  >
                    5-Word Clue
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSimulatedFeedback('Examiner repeated the question at 0.9x speed.');
                    }}
                    className="p-2.5 rounded border border-foreground/15 bg-background hover:bg-muted text-xs font-mono text-foreground text-center transition-colors"
                  >
                    Repeat Audio
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSimulatedFeedback('Examiner simplified the terminology.');
                    }}
                    className="p-2.5 rounded border border-foreground/15 bg-background hover:bg-muted text-xs font-mono text-foreground text-center transition-colors"
                  >
                    Simplify
                  </button>
                </div>

                {simulatedFeedback && (
                  <p className="text-[11px] font-mono text-foreground/80 pt-1">
                    &gt; {simulatedFeedback}
                  </p>
                )}
              </div>

              {/* Document Grounding Citation Pill */}
              <div className="p-3 rounded border border-foreground/10 bg-muted/20 text-[11px] font-mono text-muted-foreground space-y-1">
                <div className="flex items-center justify-between text-foreground font-semibold">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    Grounded Source Excerpt
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 border border-foreground/20 rounded">
                    EXACT MATCH
                  </span>
                </div>
                <p className="text-foreground italic font-sans text-xs">
                  &ldquo;{currentSample.snippet}&rdquo;
                </p>
                <span className="block text-[10px] text-muted-foreground pt-0.5">
                  Citation: {currentSample.citation}
                </span>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </div>
    </section>
  );
}
