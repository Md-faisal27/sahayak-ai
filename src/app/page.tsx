import React from 'react';
import { Navigation } from '@/components/landing/Navigation';
import { Hero } from '@/components/landing/Hero';
import { AssessmentModes } from '@/components/landing/AssessmentModes';
import { GroundingArchitecture } from '@/components/landing/GroundingArchitecture';
import { ComparisonTable } from '@/components/landing/ComparisonTable';
import { Cta } from '@/components/landing/Cta';
import { Footer } from '@/components/landing/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-foreground/15 selection:text-foreground">
      <Navigation />
      <main className="flex-1 noise-overlay">
        <Hero />
        <AssessmentModes />
        <GroundingArchitecture />
        <ComparisonTable />
        <Cta />
      </main>
      <Footer />
    </div>
  );
}
