'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { AnimatedSection } from './AnimatedSection';

export function Cta() {
  return (
    <section className="py-24 lg:py-40 border-t border-foreground/10 bg-background">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 text-center">
        <AnimatedSection className="max-w-3xl mx-auto space-y-6">
          <span className="inline-flex items-center gap-3 text-xs font-mono tracking-widest uppercase text-muted-foreground">
            <span className="w-8 h-px bg-foreground/30" />
            Begin Assessment
          </span>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-display tracking-tight text-foreground leading-[1.05] text-balance">
            Prepare for Your Next Technical Oral Exam with Confidence
          </h2>

          <p className="text-base sm:text-lg text-muted-foreground font-light leading-relaxed max-w-2xl mx-auto">
            Upload your syllabus or lecture notes PDF to start practicing live spoken vivas, reviewing active recall flashcards, and generating 12-section master study guides today.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="group inline-flex items-center justify-center gap-3 bg-foreground text-background font-mono text-xs uppercase tracking-widest rounded-full h-14 px-8 transition-all hover:bg-foreground/90 active:scale-[0.98] shadow-sm"
            >
              <span>Create Free Account</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1.5" />
            </Link>

            <Link
              href="/login"
              className="inline-flex items-center justify-center border border-foreground/20 text-foreground font-mono text-xs uppercase tracking-widest rounded-full h-14 px-8 transition-all hover:bg-foreground/5 active:scale-[0.98]"
            >
              Sign In to Existing Sessions
            </Link>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
