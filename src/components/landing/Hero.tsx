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
  const [selectedTopic, setSelectedTopic] = useState<'DBMS' | 'OS' | 'NETWORKS'>('DBMS');
  const [simulatedLang, setSimulatedLang] = useState<'EN' | 'HI' | 'HG'>('EN');
  const [simulatedClueActive, setSimulatedClueActive] = useState(false);
  const [simulatedFeedback, setSimulatedFeedback] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [testedAnswer, setTestedAnswer] = useState<'GOOD' | 'WEAK' | null>(null);

  const topicData = {
    DBMS: {
      name: 'DBMS',
      title: 'Database Systems (2PL)',
      EN: {
        question:
          'Explain how the Two-Phase Locking (2PL) protocol ensures conflict serializability, and describe the condition that triggers a cascading abort.',
        clue: 'Clue: Growing phase locks, shrinking phase releases.',
        citation: 'Silberschatz Database Concepts, 7th Edition, Page 684',
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
      answers: {
        good: {
          text: 'In growing phase locks are acquired; in shrinking phase they are released. Cascading abort occurs when uncommitted dirty writes are read by other transactions that abort.',
          score: 95,
          feedback: 'Grounded citation match. Correctly identified growing/shrinking phase and dirty read vulnerability.',
        },
        weak: {
          text: 'It locks all database rows at startup so that nobody else can access the tables until finished.',
          score: 42,
          feedback: 'Misunderstanding. Conflates conservative 2PL with table-level locking. Recommending 5-word clue.',
        },
      },
    },
    OS: {
      name: 'OS',
      title: 'Operating Systems (Deadlocks)',
      EN: {
        question:
          'State the four Coffman conditions necessary for deadlock, and explain how circular wait can be prevented using total resource ordering.',
        clue: 'Clue: Mutual exclusion, hold & wait, no preemption, circular wait.',
        citation: 'Operating System Concepts (Silberschatz & Galvin), Chapter 8, Page 321',
        snippet:
          'Deadlock occurs if Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait hold simultaneously. Linear ordering guarantees absence of cycles.',
      },
      HI: {
        question:
          'डेडलॉक के लिए आवश्यक चारों कॉफमैन स्थितियों का उल्लेख करें, और बताएं कि टोटल रिसोर्स ऑर्डरिंग से सर्कुलर वेट को कैसे रोका जा सकता है।',
        clue: 'संकेत: म्यूचुअल एक्सक्लूज़न, होल्ड एंड वेट, नो प्रीमेप्शन, सर्कुलर वेट।',
        citation: 'ऑपरेटिंग सिस्टम कॉन्सेप्ट्स, अध्याय 8, पृष्ठ 321',
        snippet:
          'यदि चारों स्थितियां एक साथ पूरी हों तो डेडलॉक उत्पन्न होता है। लीनियर ऑर्डरिंग चक्रीय प्रतीक्षा को समाप्त करती है।',
      },
      HG: {
        question:
          'Deadlock ke char Coffman conditions kya hain? Aur total resource ordering circular wait ko kaise prevent karti hai?',
        clue: 'Clue: Mutual exclusion, hold & wait, no preemption, circular wait.',
        citation: 'OS Lecture Slides, Unit 3, Page 321',
        snippet:
          'Deadlock tab hota hai jab charo conditions simultaneously hold karein. Resource ordering se circular wait eliminate ho jata hai.',
      },
      answers: {
        good: {
          text: 'Mutual exclusion, hold and wait, no preemption, and circular wait. Imposing a global linear order F(R) ensures processes request resources in strictly increasing order.',
          score: 98,
          feedback: 'Flawless recall. Correctly formulated the mathematical linear resource hierarchy F(Ri) < F(Rj).',
        },
        weak: {
          text: 'Deadlock happens when processes wait for RAM and CPU at the exact same moment.',
          score: 38,
          feedback: 'Incomplete. Missed 3 of the 4 Coffman conditions. Suggested topic revision in Study Schedule.',
        },
      },
    },
    NETWORKS: {
      name: 'NETWORKS',
      title: 'Computer Networks (TCP)',
      EN: {
        question:
          'Describe the SYN, SYN-ACK, and ACK packet exchange in the TCP 3-way handshake, and explain why two packets are insufficient.',
        clue: 'Clue: SYN initiates, SYN-ACK syncs & acks, ACK confirms.',
        citation: 'Computer Networking: A Top-Down Approach (Kurose & Ross), Section 3.5, Page 238',
        snippet:
          'The 3-way handshake prevents duplicate historic connection requests from causing half-open connections and synchronizes sequence numbers bidirectionally.',
      },
      HI: {
        question:
          'TCP 3-वे हैंडशेक में SYN, SYN-ACK और ACK पैकेट एक्सचेंज का वर्णन करें, और स्पष्ट करें कि दो पैकेट क्यों अपर्याप्त हैं।',
        clue: 'संकेत: SYN शुरू करता है, SYN-ACK पुष्टि और सिंक करता है, ACK अंतिम पुष्टि है।',
        citation: 'कंप्यूटर नेटवर्किंग, अध्याय 3, पृष्ठ 238',
        snippet:
          '3-वे हैंडशेक पुराने डुप्लिकेट कनेक्शन अनुरोधों को रोकता है और दोनों दिशाओं में सीक्वेंस नंबर सिंक्रनाइज़ करता है।',
      },
      HG: {
        question:
          'TCP 3-way handshake mein SYN, SYN-ACK aur ACK packet flow describe kijiye. Two packets kafi kyu nahi hote?',
        clue: 'Clue: SYN initiate karta hai, SYN-ACK reply deta hai, ACK confirm karta hai.',
        citation: 'Computer Networks Study Notes, Module 4, Page 238',
        snippet:
          '3-way handshake duplicate requests ko rokta hai aur dono sides ka ISN sequence synchronize karta hai.',
      },
      answers: {
        good: {
          text: 'Client sends SYN with its ISN. Server responds with SYN-ACK with its own ISN and ACK. Client replies with ACK. Three packets are required to establish bidirectional reliability against stale delayed packets.',
          score: 96,
          feedback: 'Accurate and comprehensive. Correctly justified bidirectional ISN negotiation and stale-packet rejection.',
        },
        weak: {
          text: 'Client says hello with SYN and server replies OK with ACK so they can start sending data.',
          score: 45,
          feedback: 'Lacks technical depth. Omitted sequence number synchronization and half-open failure modes.',
        },
      },
    },
  };

  const activeTopicObj = topicData[selectedTopic];
  const currentSample = activeTopicObj[simulatedLang];

  const handleSpeak = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    window.speechSynthesis.cancel();
    const clean = text.replace(/[*_#`]/g, '');
    const utter = new SpeechSynthesisUtterance(clean);
    utter.rate = 1.0;
    utter.onstart = () => setIsPlayingAudio(true);
    utter.onend = () => setIsPlayingAudio(false);
    utter.onerror = () => setIsPlayingAudio(false);
    window.speechSynthesis.speak(utter);
  };

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
                Document-Grounded AI Study Platform
              </span>
            </AnimatedSection>

            {/* Giant Serif Headline */}
            <AnimatedSection delay={200}>
              <h1 className="text-[clamp(2.2rem,5.5vw,4.8rem)] font-display leading-[0.98] tracking-tight text-foreground text-balance">
                Turn Your Syllabus into Spoken Oral Exams, Flashcards &amp; Study Guides
              </h1>
            </AnimatedSection>

            <AnimatedSection delay={300}>
              <p className="text-base sm:text-lg lg:text-xl text-muted-foreground leading-relaxed font-sans font-light max-w-xl">
                Upload textbook chapters, lecture notes, or syllabus PDFs. Sahayak AI conducts adaptive spoken technical interviews, creates active recall flashcards, and synthesizes 12-section study summaries — 100% grounded in your document.
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
                href="/dashboard"
                className="inline-flex items-center justify-center border border-foreground/20 text-foreground font-mono text-xs uppercase tracking-widest rounded-full h-14 px-8 transition-all hover:bg-foreground/5 active:scale-[0.98]"
              >
                Explore Studio Dashboard
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
                  <strong className="block text-foreground font-mono font-semibold text-xs">AI Voice Viva</strong>
                  <span className="text-muted-foreground font-light">Real-time oral exams with 5-word hints</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Volume2 className="w-4 h-4 text-foreground shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-foreground font-mono font-semibold text-xs">Complete Study Suite</strong>
                  <span className="text-muted-foreground font-light">Flashcards, 12-part guides &amp; schedules</span>
                </div>
              </div>
            </AnimatedSection>
          </div>

          {/* Right Column: Live Interactive Oral Exam Simulator */}
          <div className="lg:col-span-6 w-full min-w-0">
            <AnimatedSection delay={300} className="bg-background rounded-2xl border border-foreground/15 p-4 sm:p-6 shadow-sm space-y-4">
              {/* Simulator Header & Topic Tabs */}
              <div className="space-y-3 pb-3 border-b border-foreground/10">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span className="text-[11px] sm:text-xs font-mono font-semibold tracking-wider text-foreground uppercase">
                      LIVE EXAMINER SIMULATOR
                    </span>
                  </div>

                  {/* Language Selector */}
                  <div className="flex items-center gap-1 bg-muted/50 p-0.5 sm:p-1 rounded-lg border border-foreground/10 text-[10px] sm:text-[11px] font-mono">
                    {(['EN', 'HI', 'HG'] as const).map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => {
                          setSimulatedLang(lang);
                          setSimulatedFeedback(null);
                          setSimulatedClueActive(false);
                          setTestedAnswer(null);
                        }}
                        className={`px-1.5 sm:px-2 py-0.5 rounded transition-colors ${
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

                {/* Course Switcher Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono scrollbar-none">
                  {(['DBMS', 'OS', 'NETWORKS'] as const).map((topicKey) => (
                    <button
                      key={topicKey}
                      type="button"
                      onClick={() => {
                        setSelectedTopic(topicKey);
                        setSimulatedFeedback(null);
                        setSimulatedClueActive(false);
                        setTestedAnswer(null);
                        if (isPlayingAudio && typeof window !== 'undefined' && 'speechSynthesis' in window) {
                          window.speechSynthesis.cancel();
                          setIsPlayingAudio(false);
                        }
                      }}
                      className={`px-2 sm:px-2.5 py-1 rounded-lg border transition-all text-[10px] sm:text-[11px] font-semibold whitespace-nowrap ${
                        selectedTopic === topicKey
                          ? 'bg-foreground text-background border-foreground shadow-xs'
                          : 'bg-muted/30 border-foreground/10 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {topicData[topicKey].title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Spoken Question Audio Meter Card */}
              <div className="bg-muted/30 rounded-xl p-3.5 sm:p-4 border border-foreground/10 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-muted-foreground">
                  <span className="flex items-center gap-1.5 text-foreground font-medium text-[11px] sm:text-xs">
                    <Volume2 className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 shrink-0" />
                    Examiner Spoken Question
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSpeak(currentSample.question)}
                    className="px-2 sm:px-2.5 py-1 rounded-md bg-foreground text-background hover:bg-foreground/90 font-mono text-[10px] sm:text-[11px] font-semibold flex items-center gap-1.5 transition-colors shadow-2xs shrink-0"
                  >
                    <Volume2 className={`w-3 h-3 ${isPlayingAudio ? 'animate-pulse text-emerald-400' : ''}`} />
                    <span>{isPlayingAudio ? 'Stop Audio' : 'Listen with Voice'}</span>
                  </button>
                </div>

                {/* Animated Voice Soundwave Bars */}
                <div className="flex items-end justify-center gap-1.5 h-8 sm:h-9 py-1 px-4 bg-background rounded-lg border border-foreground/10">
                  <div className={`w-1.5 h-3 bg-foreground/60 rounded-full ${isPlayingAudio ? 'animate-bounce' : 'opacity-40'}`} style={{ animationDelay: '0ms' }} />
                  <div className={`w-1.5 h-6 bg-foreground/80 rounded-full ${isPlayingAudio ? 'animate-bounce' : 'opacity-40'}`} style={{ animationDelay: '150ms' }} />
                  <div className={`w-1.5 h-8 bg-foreground rounded-full ${isPlayingAudio ? 'animate-bounce' : 'opacity-60'}`} style={{ animationDelay: '300ms' }} />
                  <div className={`w-1.5 h-4 bg-foreground/70 rounded-full ${isPlayingAudio ? 'animate-bounce' : 'opacity-40'}`} style={{ animationDelay: '450ms' }} />
                  <div className={`w-1.5 h-7 bg-foreground rounded-full ${isPlayingAudio ? 'animate-bounce' : 'opacity-70'}`} style={{ animationDelay: '200ms' }} />
                  <div className={`w-1.5 h-8 bg-foreground/90 rounded-full ${isPlayingAudio ? 'animate-bounce' : 'opacity-50'}`} style={{ animationDelay: '350ms' }} />
                  <div className={`w-1.5 h-5 bg-foreground/70 rounded-full ${isPlayingAudio ? 'animate-bounce' : 'opacity-40'}`} style={{ animationDelay: '500ms' }} />
                  <div className={`w-1.5 h-7 bg-foreground/80 rounded-full ${isPlayingAudio ? 'animate-bounce' : 'opacity-60'}`} style={{ animationDelay: '100ms' }} />
                  <div className={`w-1.5 h-3 bg-foreground/50 rounded-full ${isPlayingAudio ? 'animate-bounce' : 'opacity-30'}`} style={{ animationDelay: '400ms' }} />
                </div>

                <p className="text-xs sm:text-sm text-foreground font-sans leading-relaxed pt-1">
                  &ldquo;{currentSample.question}&rdquo;
                </p>
              </div>

              {/* 5-Word Clue Banner */}
              {simulatedClueActive && (
                <div className="p-3 rounded-xl border border-brand-300 dark:border-brand-800 bg-brand-50/60 dark:bg-brand-950/40 text-foreground text-xs font-mono flex items-start sm:items-center justify-between gap-2 animate-in fade-in">
                  <div className="flex items-start sm:items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-brand-600 shrink-0 mt-0.5 sm:mt-0" />
                    <span className="text-[11px] sm:text-xs">{currentSample.clue}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSimulatedClueActive(false)}
                    className="text-[10px] underline font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300 shrink-0"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Student Voice Interruption Controls */}
              <div className="space-y-2">
                <span className="block text-[10px] sm:text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
                  Live Voice Interruption Commands
                </span>
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setSimulatedClueActive(true);
                      setSimulatedFeedback('Voice Interruption: Examiner delivered 5-word clue.');
                    }}
                    className="p-1.5 sm:p-2 rounded-lg border border-foreground/15 bg-background hover:bg-muted text-[10px] sm:text-[11px] font-mono text-foreground transition-colors"
                  >
                    5-Word Clue
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSimulatedFeedback('Voice Interruption: Examiner replaying question at 0.9x speed.');
                      handleSpeak(currentSample.question);
                    }}
                    className="p-1.5 sm:p-2 rounded-lg border border-foreground/15 bg-background hover:bg-muted text-[10px] sm:text-[11px] font-mono text-foreground transition-colors"
                  >
                    Repeat Question
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSimulatedFeedback('Voice Interruption: Examiner simplified terminology context.');
                    }}
                    className="p-1.5 sm:p-2 rounded-lg border border-foreground/15 bg-background hover:bg-muted text-[10px] sm:text-[11px] font-mono text-foreground transition-colors"
                  >
                    Simplify Prompt
                  </button>
                </div>

                {simulatedFeedback && (
                  <p className="text-[10px] sm:text-[11px] font-mono text-foreground/80 pt-0.5">
                    &gt; {simulatedFeedback}
                  </p>
                )}
              </div>

              {/* Interactive Verbal Answer Scoring Test */}
              <div className="space-y-2 pt-1">
                <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] sm:text-[11px] font-mono text-muted-foreground">
                  <span className="uppercase tracking-wider">Test Grounded Answer Scoring</span>
                  <span>Click an answer below:</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTestedAnswer('GOOD')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      testedAnswer === 'GOOD'
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40'
                        : 'border-foreground/10 bg-background hover:bg-muted/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-foreground">Grounded Answer</span>
                      <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">95%+</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-tight">
                      {activeTopicObj.answers.good.text}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTestedAnswer('WEAK')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      testedAnswer === 'WEAK'
                        ? 'border-rose-400 bg-rose-50/50 dark:bg-rose-950/40'
                        : 'border-foreground/10 bg-background hover:bg-muted/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-foreground">Vague Answer</span>
                      <span className="text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400">40%</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-tight">
                      {activeTopicObj.answers.weak.text}
                    </p>
                  </button>
                </div>
              </div>

                {testedAnswer && (
                  <div className={`p-3 rounded-xl border text-xs font-mono space-y-1 animate-in fade-in ${
                    testedAnswer === 'GOOD'
                      ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/30'
                      : 'border-rose-300 dark:border-rose-800 bg-rose-50/40 dark:bg-rose-950/30'
                  }`}>
                    <div className="flex items-center justify-between font-bold">
                      <span className={testedAnswer === 'GOOD' ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}>
                        Evaluator Score: {testedAnswer === 'GOOD' ? activeTopicObj.answers.good.score : activeTopicObj.answers.weak.score}%
                      </span>
                      <span className="text-[10px] uppercase tracking-wider">
                        {testedAnswer === 'GOOD' ? 'HIGH DEPTH • PASSED' : 'DEFICIENT • HINT TRIGGER'}
                      </span>
                    </div>
                    <p className="text-[11px] font-sans text-foreground leading-relaxed">
                      {testedAnswer === 'GOOD' ? activeTopicObj.answers.good.feedback : activeTopicObj.answers.weak.feedback}
                    </p>
                  </div>
                )}

              {/* Document Grounding Citation Pill */}
              <div className="p-3 rounded-xl border border-foreground/10 bg-muted/20 text-[11px] font-mono text-muted-foreground space-y-1">
                <div className="flex items-center justify-between text-foreground font-semibold">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                    Grounded Source Excerpt
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 border border-foreground/20 rounded">
                    PAGE CITATION
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
