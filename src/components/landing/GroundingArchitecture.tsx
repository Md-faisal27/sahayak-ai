'use client';

import React from 'react';
import { FileText, ShieldCheck } from 'lucide-react';
import { AnimatedSection } from './AnimatedSection';

export function GroundingArchitecture() {
  return (
    <section id="architecture" className="py-24 lg:py-40 border-t border-foreground/10">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Eyebrow & Headline */}
        <AnimatedSection className="max-w-3xl mb-16 lg:mb-24">
          <span className="inline-flex items-center gap-3 text-xs font-mono tracking-widest uppercase text-muted-foreground mb-4">
            <span className="w-8 h-px bg-foreground/30" />
            Grounding Engine
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-7xl font-display tracking-tight text-foreground leading-[1.05] text-balance">
            Zero Hallucination Architecture
          </h2>
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground font-light leading-relaxed">
            Standard conversational models frequently introduce facts that do not exist in your prescribed syllabus. Sahayak AI parses your uploaded PDF into indexed text chunks, computes embedding boundaries, and rejects claims unsupported by the source text.
          </p>
        </AnimatedSection>

        {/* Dual-Pane Inspection Workbench */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-px bg-foreground/10 border border-foreground/10">
          {/* Left Pane: Authentic Document Chunk */}
          <AnimatedSection delay={100} className="lg:col-span-6 bg-background p-8 lg:p-10 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-foreground/10 font-mono text-xs text-muted-foreground">
                <span className="flex items-center gap-2 text-foreground font-semibold">
                  <FileText className="w-3.5 h-3.5" />
                  SOURCE_CHUNK: PAGE_482.TXT
                </span>
                <span>CHUNK ID: #0482-B</span>
              </div>

              <div className="p-4 rounded border border-foreground/10 bg-muted/20 font-mono text-xs leading-relaxed space-y-3">
                <p className="text-muted-foreground">
                  [15.1.2 Two-Phase Locking Protocol]
                </p>
                <p className="text-foreground p-3 rounded border border-foreground/15 bg-background">
                  &ldquo;A transaction that adheres to the two-phase locking protocol can release locks, but cannot acquire any new locks after releasing its first lock. This divides execution into a growing phase and a shrinking phase.&rdquo;
                </p>
                <p className="text-muted-foreground font-sans text-xs">
                  Strict two-phase locking requires that in addition to all locks being two-phase, all exclusive-mode locks taken by a transaction must be held until that transaction commits.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-foreground/10 text-xs font-mono text-muted-foreground flex items-center justify-between">
              <span>Cosine Similarity: 0.942</span>
              <span className="text-foreground font-semibold">VERIFIED IN BOUNDARY</span>
            </div>
          </AnimatedSection>

          {/* Right Pane: Sahayak Grounded Oral Evaluation */}
          <AnimatedSection delay={200} className="lg:col-span-6 bg-background p-8 lg:p-10 flex flex-col justify-between space-y-6">
            <div className="space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between pb-4 border-b border-foreground/10 text-muted-foreground">
                <span className="text-foreground font-semibold">
                  GROUNDING_EVALUATOR // VERIFIED
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 border border-foreground/20 rounded">
                  STATUS: PASSED
                </span>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded border border-foreground/10 bg-muted/20 space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">
                    Generated Spoken Question
                  </span>
                  <p className="text-foreground font-sans text-xs sm:text-sm">
                    &ldquo;What distinguishes strict two-phase locking from standard two-phase locking regarding lock release timing?&rdquo;
                  </p>
                </div>

                <div className="p-3.5 rounded border border-foreground/10 bg-muted/20 space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">
                    Candidate Spoken Transcript
                  </span>
                  <p className="text-foreground font-sans text-xs sm:text-sm">
                    &ldquo;In strict 2PL, exclusive locks cannot be released during the shrinking phase; they must be held until the transaction explicitly commits.&rdquo;
                  </p>
                </div>

                <div className="p-3.5 rounded border border-foreground/20 bg-background space-y-1">
                  <div className="flex justify-between items-center text-foreground font-bold">
                    <span>Evaluation: ACCURATE (96%)</span>
                    <span className="text-[10px] tracking-wider uppercase">GROUNDED FACT</span>
                  </div>
                  <p className="text-muted-foreground font-sans text-xs leading-relaxed">
                    Response matches exact commit-hold condition articulated in Section 15.1.2. Zero hallucinated rules detected.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-foreground/10 text-xs font-mono text-muted-foreground flex items-center justify-between">
              <span>Hallucination Filter: Active</span>
              <span className="text-foreground font-semibold">Tolerance: 0.00</span>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}
