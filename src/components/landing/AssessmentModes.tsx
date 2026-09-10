'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Download,
  ChevronRight,
  Check,
  Volume2,
  Mic,
  Layers,
  FileText,
  Calendar,
  RotateCw,
  CheckCircle2,
} from 'lucide-react';
import { AnimatedSection } from './AnimatedSection';

export function AssessmentModes() {
  const [activeModeTab, setActiveModeTab] = useState<'INTERVIEW' | 'FLASHCARDS' | 'SUMMARIZE' | 'SCHEDULE'>('INTERVIEW');
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [flashcardFlipped, setFlashcardFlipped] = useState(false);
  const [masteryCount, setMasteryCount] = useState(18);
  const [activeScheduleDay, setActiveScheduleDay] = useState<'D1' | 'D2' | 'D3' | 'D4' | 'D5'>('D1');
  const [activeSummarySection, setActiveSummarySection] = useState<'CONCEPTS' | 'FORMULAS' | 'TABLES'>('CONCEPTS');
  const [interviewPlaying, setInterviewPlaying] = useState(false);

  const sampleFlashcards = [
    {
      topic: 'Concurrency Control',
      question: 'How does Strict Two-Phase Locking (Strict 2PL) eliminate cascading rollbacks in transaction schedules?',
      answer: 'Strict 2PL requires all exclusive (X) locks to be held until transaction commit/abort, ensuring uncommitted dirty writes are never read by other transactions.',
    },
    {
      topic: 'Computer Architecture',
      question: "State Amdahl's Law formula and its core insight for multi-core scalability.",
      answer: "Speedup = 1 / ((1 - P) + (P / N)). As N approaches infinity, maximum speedup is strictly bounded by the serial fraction (1 - P).",
    },
    {
      topic: 'Computer Networks',
      question: 'Differentiate Flow Control from Congestion Control in TCP.',
      answer: 'Flow Control protects the receiver buffer via rwnd in the TCP header; Congestion Control protects network transit pipes via cwnd.',
    },
  ];

  const scheduleDays = {
    D1: {
      title: 'Foundations & Core Definitions',
      priority: 'High Priority',
      badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
      duration: '45 mins',
      tasks: [
        'Review chapter 1-2 core terms and glossary definitions',
        'Practice 15 active recall flashcards on fundamental terminology',
        'Verify concept boundaries against syllabus page chunks',
      ],
    },
    D2: {
      title: 'Mechanisms, Protocols & Math',
      priority: 'Medium Priority',
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
      duration: '60 mins',
      tasks: [
        'Derive mathematical equations, state transitions, and formulas',
        'Trace algorithm step-by-step with sample inputs',
        'Generate 12-section summary notes for quick reference',
      ],
    },
    D3: {
      title: 'Complex Problem Solving & Edge Cases',
      priority: 'High Priority',
      badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
      duration: '50 mins',
      tasks: [
        'Test corner conditions and failure recovery scenarios',
        'Run 5-question AI voice interview on hard difficulty',
        'Review semantic evaluation feedback on missing citation terms',
      ],
    },
    D4: {
      title: 'Weak Topic Targeted Coaching',
      priority: 'High Priority',
      badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
      duration: '40 mins',
      tasks: [
        'Focus drills exclusively on concepts missed in previous vivas',
        'Re-attempt adaptive questions with 5-word clue assistance',
        'Target mastery on lowest scoring topics from telemetry',
      ],
    },
    D5: {
      title: 'Full Mock Oral Viva & Exam Simulation',
      priority: 'High Priority',
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
      duration: '35 mins',
      tasks: [
        'Simulate 10-question continuous spoken oral examination',
        'Practice live interruptions and rapid explanation clarity',
        'Export final study guide and performance report',
      ],
    },
  };

  const handleInterviewSpeak = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (interviewPlaying) {
      window.speechSynthesis.cancel();
      setInterviewPlaying(false);
      return;
    }

    window.speechSynthesis.cancel();
    const text = 'Explain how the Two-Phase Locking protocol guarantees conflict serializability, and under what condition a cascading abort is triggered?';
    const utter = new SpeechSynthesisUtterance(text);
    utter.onstart = () => setInterviewPlaying(true);
    utter.onend = () => setInterviewPlaying(false);
    utter.onerror = () => setInterviewPlaying(false);
    window.speechSynthesis.speak(utter);
  };

  const currentCard = sampleFlashcards[flashcardIndex];

  const tools = [
    {
      id: 'INTERVIEW',
      title: 'AI Voice Interview',
      badge: 'Live Spoken Viva',
      icon: Mic,
      description: 'Spoken technical viva with adaptive difficulty, live interruption handling, 5-word clues, and zero-hallucination citation grading.',
    },
    {
      id: 'FLASHCARDS',
      title: 'Active Recall Flashcards',
      badge: 'Spaced Recall',
      icon: Layers,
      description: 'Flip-card concept testing generated from your PDF with mastery status tracking and one-click printable study sheet export.',
    },
    {
      id: 'SUMMARIZE',
      title: '12-Part Document Summary',
      badge: 'Curriculum Synthesis',
      icon: FileText,
      description: 'Publication-grade academic study guide extracting core concepts, formulas, comparative tables, and exam checklists.',
    },
    {
      id: 'SCHEDULE',
      title: '5-Day Study Schedule',
      badge: 'Targeted Prep',
      icon: Calendar,
      description: 'Structured 5-day milestone preparation plan with daily prioritized tasks and targeted coaching on weak topics.',
    },
  ] as const;

  return (
    <section id="modes" className="py-20 lg:py-32 border-t border-foreground/10 bg-muted/20">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Eyebrow & Headline */}
        <AnimatedSection className="max-w-3xl mb-12 lg:mb-16">
          <span className="inline-flex items-center gap-3 text-xs font-mono tracking-widest uppercase text-muted-foreground mb-3">
            <span className="w-8 h-px bg-foreground/30" />
            Four Integrated Study Tools
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-6xl font-display tracking-tight text-foreground leading-[1.05] text-balance">
            Everything You Need to Master Your Syllabus
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground font-light leading-relaxed">
            From spoken oral examinations and active recall flashcards to 12-section study guides and personalized milestone schedules — 100% grounded in your uploaded PDF materials.
          </p>
        </AnimatedSection>

        {/* Asymmetric Master-Detail Workbench */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-px bg-foreground/10 border border-foreground/10 rounded-2xl overflow-hidden shadow-sm">
          {/* Left Selector Rail */}
          <div className="lg:col-span-5 bg-background p-4 sm:p-6 space-y-2.5">
            {tools.map((tool) => {
              const Icon = tool.icon;
              const isActive = activeModeTab === tool.id;
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => {
                    setActiveModeTab(tool.id as any);
                    if (tool.id === 'FLASHCARDS') setFlashcardFlipped(false);
                  }}
                  className={`w-full text-left p-3.5 sm:p-4 rounded-xl border transition-all ${
                    isActive
                      ? 'border-foreground bg-muted/40 shadow-xs'
                      : 'border-foreground/10 bg-background hover:bg-muted/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isActive ? 'bg-foreground text-background' : 'bg-muted text-foreground'}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-display text-base sm:text-lg text-foreground tracking-tight">
                        {tool.title}
                      </span>
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 border border-foreground/20 rounded shrink-0">
                      {tool.badge}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed font-light pl-9">
                    {tool.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Right Detail Stage */}
          <div className="lg:col-span-7 bg-background p-5 sm:p-7 lg:p-8 flex flex-col justify-between space-y-6">
            {/* TAB 1: AI TECHNICAL INTERVIEW */}
            {activeModeTab === 'INTERVIEW' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-foreground/10 text-xs font-mono text-muted-foreground">
                  <span>FORMAT: ADAPTIVE 1-ON-1 VOICE VIVA</span>
                  <button
                    type="button"
                    onClick={handleInterviewSpeak}
                    className="text-foreground font-semibold flex items-center gap-1.5 px-2 py-0.5 rounded border border-foreground/20 hover:bg-muted/40 transition-colors"
                  >
                    <Volume2 className={`w-3.5 h-3.5 ${interviewPlaying ? 'text-emerald-500 animate-pulse' : 'text-emerald-600'}`} />
                    <span>{interviewPlaying ? 'Stop Audio' : 'Hear Question'}</span>
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl border border-foreground/10 bg-muted/30 space-y-1.5">
                    <div className="flex items-center justify-between text-muted-foreground font-mono text-[10px]">
                      <span>QUESTION 01 • MEDIUM DEPTH</span>
                      <span>PAGE 42 REFERENCE</span>
                    </div>
                    <p className="text-xs sm:text-sm font-sans font-medium text-foreground leading-relaxed">
                      &ldquo;Explain how the Two-Phase Locking protocol guarantees conflict serializability, and under what condition a cascading abort is triggered?&rdquo;
                    </p>
                    <div className="pt-1 flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
                      <Volume2 className="w-3.5 h-3.5 text-foreground shrink-0" />
                      <span>Zero duplicate questions • Strict citation validation</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-foreground/10 bg-muted/30 space-y-1.5">
                    <div className="flex items-center justify-between text-muted-foreground font-mono text-[10px]">
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold uppercase">Candidate Spoken Response</span>
                      <span>VOICE TRANSCRIPT</span>
                    </div>
                    <p className="text-xs font-sans text-foreground leading-relaxed italic">
                      &ldquo;During the growing phase, locks can be acquired but none released. Cascading abort occurs when uncommitted dirty writes are read by subsequent transactions that also must abort.&rdquo;
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-foreground/10 bg-muted/30 space-y-1.5">
                    <div className="flex items-center justify-between text-muted-foreground font-mono text-[10px]">
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold uppercase">Evaluator Feedback (Score: 9.5 / 10)</span>
                      <span>GROUND TRUTH MATCH</span>
                    </div>
                    <p className="text-xs font-sans text-muted-foreground leading-relaxed">
                      Strong answer. Correctly articulated the strict commit-hold condition that mitigates cascading aborts. Next question elevated to advanced depth.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: ACTIVE RECALL FLASHCARDS */}
            {activeModeTab === 'FLASHCARDS' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-foreground/10 text-xs font-mono text-muted-foreground">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="text-[11px] sm:text-xs">CARD {flashcardIndex + 1} OF {sampleFlashcards.length}</span>
                    <span className="text-foreground font-semibold text-[11px] sm:text-xs truncate max-w-[150px] sm:max-w-none">• {currentCard.topic}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setFlashcardFlipped(false);
                        setFlashcardIndex((prev) => (prev > 0 ? prev - 1 : sampleFlashcards.length - 1));
                      }}
                      className="px-2 sm:px-2.5 py-1 rounded border border-foreground/20 text-[11px] sm:text-xs hover:bg-muted font-mono"
                    >
                      Prev
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFlashcardFlipped(false);
                        setFlashcardIndex((prev) => (prev < sampleFlashcards.length - 1 ? prev + 1 : 0));
                      }}
                      className="px-2 sm:px-2.5 py-1 rounded border border-foreground/20 text-[11px] sm:text-xs hover:bg-muted font-mono"
                    >
                      Next
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Interactive Flip Card Demo */}
                  <div
                    onClick={() => setFlashcardFlipped(!flashcardFlipped)}
                    className="p-5 sm:p-6 rounded-xl border border-foreground/15 bg-muted/30 hover:bg-muted/40 cursor-pointer transition-all space-y-3 text-center min-h-[190px] flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] uppercase">
                        {currentCard.topic}
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[10px] uppercase flex items-center gap-1">
                        <Check className="w-3 h-3" /> Mastered
                      </span>
                    </div>

                    <div className="py-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block mb-1">
                        {flashcardFlipped ? 'Answer (Click to Flip back)' : 'Question (Click to Flip)'}
                      </span>
                      <p className="text-xs sm:text-base font-bold text-foreground leading-relaxed">
                        {flashcardFlipped ? currentCard.answer : currentCard.question}
                      </p>
                    </div>

                    <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground font-mono">
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>Click to flip card</span>
                    </div>
                  </div>

                  {/* Mastery Actions & Counter */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl border border-foreground/10 bg-background text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setMasteryCount((prev) => Math.max(0, prev - 1))}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] hover:bg-rose-50 hover:text-rose-700 transition-colors"
                      >
                        Still Learning
                      </button>
                      <button
                        type="button"
                        onClick={() => setMasteryCount((prev) => Math.min(24, prev + 1))}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-semibold hover:bg-emerald-700 transition-colors"
                      >
                        Know This
                      </button>
                    </div>

                    <div className="text-muted-foreground font-semibold">
                      Mastery: {masteryCount} / 24 Cards ({Math.round((masteryCount / 24) * 100)}%)
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: 12-PART DOCUMENT SUMMARY */}
            {activeModeTab === 'SUMMARIZE' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-foreground/10 text-xs font-mono text-muted-foreground">
                  <span className="text-[11px] sm:text-xs">FORMAT: 12-SECTION CURRICULUM SYNTHESIS</span>
                  <div className="flex items-center gap-1">
                    {(['CONCEPTS', 'FORMULAS', 'TABLES'] as const).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveSummarySection(tab)}
                        className={`px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-mono transition-colors ${
                          activeSummarySection === tab
                            ? 'bg-foreground text-background font-semibold'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {tab === 'CONCEPTS' ? 'Concepts' : tab === 'FORMULAS' ? 'Formulas' : 'Tables'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2.5">
                  {activeSummarySection === 'CONCEPTS' && (
                    <div className="p-3.5 rounded-xl border border-foreground/10 bg-muted/30 space-y-1.5 animate-in fade-in">
                      <div className="flex items-center justify-between text-muted-foreground font-mono text-[10px]">
                        <span className="uppercase font-bold text-foreground">01. Core Definitions &amp; Rules</span>
                        <span>SECTION 1.2 • PAGE 14</span>
                      </div>
                      <p className="text-xs font-sans text-muted-foreground leading-relaxed">
                        Strict 2PL prevents cascading aborts by holding all exclusive locks until commit. Growing phase strictly expands locks; shrinking phase progressively releases them without re-acquiring.
                      </p>
                    </div>
                  )}

                  {activeSummarySection === 'FORMULAS' && (
                    <div className="p-3.5 rounded-xl border border-foreground/10 bg-muted/30 space-y-1.5 animate-in fade-in">
                      <div className="flex items-center justify-between text-muted-foreground font-mono text-[10px]">
                        <span className="uppercase font-bold text-foreground">02. Mathematical Derivations</span>
                        <span>FORMULA SHEET</span>
                      </div>
                      <div className="font-mono text-xs text-foreground bg-background/50 p-2.5 rounded border border-foreground/5 space-y-1">
                        <div>1. Amdahl&apos;s Law: S = 1 / ((1 - P) + (P / N))</div>
                        <div>2. Little&apos;s Law: L = &lambda; &times; W</div>
                        <div>3. Serializability Graph: Directed G=(V,E) where cycles indicate deadlock</div>
                      </div>
                    </div>
                  )}

                  {activeSummarySection === 'TABLES' && (
                    <div className="p-3.5 rounded-xl border border-foreground/10 bg-muted/30 space-y-1.5 animate-in fade-in">
                      <div className="flex items-center justify-between text-muted-foreground font-mono text-[10px]">
                        <span className="uppercase font-bold text-foreground">03. Protocol Comparison Matrix</span>
                        <span>COMPARATIVE STUDY</span>
                      </div>
                      <div className="font-mono text-[11px] space-y-1 text-foreground overflow-x-auto pb-1">
                        <div className="grid grid-cols-3 gap-2 border-b border-foreground/10 pb-1 font-bold min-w-[280px]">
                          <span>Protocol</span>
                          <span>Cascading Abort</span>
                          <span>Deadlock Possible</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-muted-foreground min-w-[280px]">
                          <span>Basic 2PL</span>
                          <span>Possible</span>
                          <span>Yes</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-muted-foreground min-w-[280px]">
                          <span>Strict 2PL</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Prevented</span>
                          <span>Yes</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-1 text-xs font-mono text-muted-foreground flex flex-wrap items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-[11px] sm:text-xs">
                      <Download className="w-3.5 h-3.5 text-foreground shrink-0" />
                      One-click master study guide PDF
                    </span>
                    <span className="text-foreground font-semibold text-[11px] sm:text-xs">12 OF 12 SECTIONS COMPILED</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: 5-DAY STUDY SCHEDULE */}
            {activeModeTab === 'SCHEDULE' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-foreground/10 text-xs font-mono text-muted-foreground">
                  <span className="text-[11px] sm:text-xs">FORMAT: ADAPTIVE 5-DAY SCHEDULE</span>
                  {/* Day Selector Pills */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                    {(['D1', 'D2', 'D3', 'D4', 'D5'] as const).map((dayKey) => (
                      <button
                        key={dayKey}
                        type="button"
                        onClick={() => setActiveScheduleDay(dayKey)}
                        className={`px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-mono transition-colors ${
                          activeScheduleDay === dayKey
                            ? 'bg-foreground text-background font-semibold'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {dayKey}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active Day Detail Card */}
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl border border-foreground/10 bg-muted/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                          {activeScheduleDay}
                        </span>
                        <h4 className="text-xs font-bold text-foreground">
                          {scheduleDays[activeScheduleDay].title}
                        </h4>
                      </div>
                      <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded shrink-0 ${scheduleDays[activeScheduleDay].badgeColor}`}>
                        {scheduleDays[activeScheduleDay].priority}
                      </span>
                    </div>

                    <ul className="space-y-1.5 text-xs text-muted-foreground font-sans pl-2">
                      {scheduleDays[activeScheduleDay].tasks.map((task, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                          <span>{task}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="pt-2 border-t border-foreground/10 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                      <span>Estimated Duration: {scheduleDays[activeScheduleDay].duration}</span>
                      <span className="text-foreground font-semibold">Auto-Synced with Weak Coach</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Launch Mode Action */}
            <div className="pt-4 border-t border-foreground/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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

