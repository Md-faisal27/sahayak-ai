'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Download, ChevronRight, Check, Volume2, Mic, Sparkles } from 'lucide-react';
import { AnimatedSection } from './AnimatedSection';

export function AssessmentModes() {
  const [activeModeTab, setActiveModeTab] = useState<'INTERVIEW' | 'SUMMARIZE'>('INTERVIEW');

  return (
    <section id="modes" className="py-24 lg:py-40 border-t border-foreground/10 bg-muted/20">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Eyebrow & Headline */}
        <AnimatedSection className="max-w-3xl mb-16 lg:mb-24">
          <span className="inline-flex items-center gap-3 text-xs font-mono tracking-widest uppercase text-muted-foreground mb-4">
            <span className="w-8 h-px bg-foreground/30" />
            Modes of Assessment
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-7xl font-display tracking-tight text-foreground leading-[1.05] text-balance">
            Grounded Assessment Modes
          </h2>
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground font-light leading-relaxed">
            Configure your evaluation to match your syllabus. All questions, scoring rubrics, and feedback are strictly anchored to your uploaded document chunks.
          </p>
        </AnimatedSection>

        {/* Asymmetric Master-Detail Workbench */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-px bg-foreground/10 border border-foreground/10">
          {/* Left Selector Rail */}
          <div className="lg:col-span-5 bg-background p-6 sm:p-8 space-y-4">
            <button
              type="button"
              onClick={() => setActiveModeTab('INTERVIEW')}
              className={`w-full text-left p-6 rounded border transition-all ${
                activeModeTab === 'INTERVIEW'
                  ? 'border-foreground bg-muted/40 shadow-xs'
                  : 'border-foreground/10 bg-background hover:bg-muted/20'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-display text-2xl text-foreground tracking-tight">
                  AI Technical Interview
                </span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 border border-foreground/20 rounded flex items-center gap-1">
                  <Volume2 className="w-3 h-3 text-emerald-600" /> Rime AI Voice
                </span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-light">
                Spoken conversational technical viva asking 1 grounded question at a time. Evaluates semantic depth, dynamically adapts difficulty, and prevents duplicates.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setActiveModeTab('SUMMARIZE')}
              className={`w-full text-left p-6 rounded border transition-all ${
                activeModeTab === 'SUMMARIZE'
                  ? 'border-foreground bg-muted/40 shadow-xs'
                  : 'border-foreground/10 bg-background hover:bg-muted/20'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-display text-2xl text-foreground tracking-tight">
                  Summary of Uploaded PDF
                </span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 border border-foreground/20 rounded">
                  12-Part Guide
                </span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-light">
                Generates a comprehensive 12-section conceptual breakdown, key mathematical formulas, comparative tables, definitions, and exam takeaways extracted directly from your PDF.
              </p>
            </button>
          </div>

          {/* Right Detail Stage */}
          <div className="lg:col-span-7 bg-background p-8 lg:p-10 flex flex-col justify-between space-y-8">
            {activeModeTab === 'INTERVIEW' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-foreground/10 text-xs font-mono text-muted-foreground">
                  <span>FORMAT: ADAPTIVE 1-ON-1 VOICE VIVA</span>
                  <span className="text-foreground font-semibold flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-emerald-600" /> RIME AI NATURAL TTS
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded border border-foreground/10 bg-muted/30 space-y-2">
                    <div className="flex items-center justify-between text-muted-foreground font-mono text-[11px]">
                      <span>QUESTION 01 • MEDIUM DEPTH</span>
                      <span>PAGE 42 REFERENCE</span>
                    </div>
                    <p className="text-sm font-sans font-medium text-foreground leading-relaxed">
                      &ldquo;Explain how the Two-Phase Locking protocol guarantees conflict serializability, and under what condition a cascading abort is triggered?&rdquo;
                    </p>
                    <div className="pt-2 flex items-center gap-2 text-xs font-mono text-muted-foreground">
                      <Volume2 className="w-3.5 h-3.5 text-foreground shrink-0" />
                      <span>Audio playback active • Zero duplicate questions guaranteed</span>
                    </div>
                  </div>

                  <div className="p-4 rounded border border-foreground/10 bg-muted/30 space-y-2">
                    <div className="flex items-center justify-between text-muted-foreground font-mono text-[11px]">
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold uppercase">Evaluator Feedback (Score: 9.5 / 10)</span>
                      <span>GROUND TRUTH MATCH</span>
                    </div>
                    <p className="text-xs sm:text-sm font-sans text-muted-foreground leading-relaxed">
                      Strong answer. Correctly noted the growing phase prevents lock acquisition after release. Recommending next question at Hard difficulty depth.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeModeTab === 'SUMMARIZE' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-foreground/10 text-xs font-mono text-muted-foreground">
                  <span>FORMAT: SYSTEMATIC DOCUMENT BREAKDOWN</span>
                  <span className="text-foreground font-semibold">100% GROUNDED EXTRACT</span>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded border border-foreground/10 bg-muted/30 space-y-2">
                    <div className="flex items-center justify-between text-muted-foreground font-mono text-[11px]">
                      <span className="uppercase font-bold text-foreground">01. Core Concepts &amp; Definitions</span>
                      <span>PAGE 12 REFERENCE</span>
                    </div>
                    <p className="text-xs sm:text-sm font-sans text-muted-foreground leading-relaxed">
                      Comprehensive explanation of primary definitions, architectural models, and procedural flows synthesized directly from source chunks without hallucination.
                    </p>
                  </div>

                  <div className="p-4 rounded border border-foreground/10 bg-muted/30 space-y-2">
                    <div className="flex items-center justify-between text-muted-foreground font-mono text-[11px]">
                      <span className="uppercase font-bold text-foreground">02. Formulas &amp; Theoretical Derivations</span>
                      <span>PAGE 34 REFERENCE</span>
                    </div>
                    <div className="font-mono text-xs text-foreground bg-background/50 p-2.5 rounded border border-foreground/5 space-y-1">
                      <div>1. Relational Algebra: &pi;_{`{name, roll}`} (&sigma;_{`{dept='CS'}`}(Students))</div>
                      <div>2. Shannon Entropy: H(X) = -&sum; P(x_i) log2 P(x_i)</div>
                    </div>
                  </div>

                  <div className="p-4 rounded border border-foreground/10 bg-muted/30 space-y-2">
                    <div className="flex items-center justify-between text-muted-foreground font-mono text-[11px]">
                      <span className="uppercase font-bold text-foreground">03. Key Takeaways &amp; Exam Checklist</span>
                      <span>HIGH-FREQUENCY TOPICS</span>
                    </div>
                    <p className="text-xs sm:text-sm font-sans text-muted-foreground leading-relaxed">
                      Targeted synthesis of exam-critical points, edge cases, and high-yield topics ready for quick revision before exams.
                    </p>
                  </div>

                  <div className="pt-2 text-xs font-mono text-muted-foreground flex items-center gap-2">
                    <Download className="w-3.5 h-3.5 text-foreground shrink-0" />
                    <span>Instant generation with formatted study view and exportable PDF study notes</span>
                  </div>
                </div>
              </div>
            )}

            {/* Launch Mode Action */}
            <div className="pt-6 border-t border-foreground/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <span className="text-xs font-mono text-muted-foreground">
                Ready to practice with your syllabus PDF?
              </span>
              <Link
                href="/signup"
                className="group inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-foreground hover:opacity-70 transition-opacity"
              >
                <span>Launch Mode in Studio</span>
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
