'use client';

import React from 'react';
import { AnimatedSection } from './AnimatedSection';

export function ComparisonTable() {
  const rows = [
    {
      capability: 'Knowledge Boundary',
      generic: 'Unbounded web data (causes out-of-syllabus answers)',
      sahayak: '100% bounded to uploaded syllabus chunks and page numbers',
    },
    {
      capability: 'Examination Interaction',
      generic: 'Passive text chat; user leads the conversation',
      sahayak: 'Proactive examiner role with technical viva probing',
    },
    {
      capability: 'Voice & Interruption Handling',
      generic: 'Unidirectional audio; cannot request hints mid-sentence',
      sahayak: 'Sub-second interruption for 5-word clues and speed adjustments',
    },
    {
      capability: 'Active Recall & Flashcards',
      generic: 'Plain text dumps without spaced repetition or mastery tracking',
      sahayak: 'Interactive flip flashcards with topic classification & PDF export',
    },
    {
      capability: 'Multi-Lingual Support',
      generic: 'Literal translation often garbling engineering concepts',
      sahayak: 'Native English, Hindi, and technical Hinglish pronunciation',
    },
    {
      capability: 'Revision Planning',
      generic: 'No scheduled tracking across exam preparation days',
      sahayak: 'Automated 5-Day Study Plan with weak topic coaching',
    },
  ];

  return (
    <section id="comparison" className="py-24 lg:py-40 border-t border-foreground/10 bg-muted/20">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Eyebrow & Headline */}
        <AnimatedSection className="max-w-3xl mb-16 lg:mb-24">
          <span className="inline-flex items-center gap-3 text-xs font-mono tracking-widest uppercase text-muted-foreground mb-4">
            <span className="w-8 h-px bg-foreground/30" />
            Evaluation Differences
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-7xl font-display tracking-tight text-foreground leading-[1.05] text-balance">
            How Sahayak AI Differs from Generic AI Chatbots
          </h2>
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground font-light leading-relaxed">
            Oral examinations require strict syllabus boundaries, spoken interruptions, and citation accountability that passive conversational interfaces cannot provide.
          </p>
        </AnimatedSection>

        {/* High-Contrast Hairline Comparison Table */}
        <AnimatedSection delay={150} className="border border-foreground/10 bg-background rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse font-sans">
              <thead>
                <tr className="border-b border-foreground/10 bg-muted/40 font-mono text-[11px] text-muted-foreground uppercase tracking-wider">
                  <th className="p-5 font-semibold">Capability</th>
                  <th className="p-5 font-semibold">Generic Chatbot</th>
                  <th className="p-5 font-semibold text-foreground">Sahayak AI Studio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-foreground/10">
                {rows.map((row) => (
                  <tr key={row.capability} className="hover:bg-muted/20 transition-colors">
                    <td className="p-5 font-mono text-xs font-semibold text-foreground">
                      {row.capability}
                    </td>
                    <td className="p-5 text-muted-foreground font-light leading-relaxed">
                      {row.generic}
                    </td>
                    <td className="p-5 font-medium text-foreground leading-relaxed">
                      {row.sahayak}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
