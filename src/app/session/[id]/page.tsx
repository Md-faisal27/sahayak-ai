'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { VoiceVisualizer } from '@/components/VoiceVisualizer';
import { InterruptionPanel } from '@/components/InterruptionPanel';
import { ConversationTranscript, Message } from '@/components/ConversationTranscript';
import { VoiceState, InterruptionIntent } from '@/lib/state-machine';
import { AppLanguage } from '@/lib/language';
import {
  Mic,
  MicOff,
  Send,
  Sparkles,
  Download,
  Lightbulb,
  Loader2,
  ChevronRight,
  BookOpen,
  Languages,
  Layers,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Compass,
  X,
} from 'lucide-react';

export default function SessionStudioPage() {
  const { id: sessionId } = useParams() as { id: string };
  const router = useRouter();

  const [session, setSession] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [voiceState, setVoiceState] = useState<VoiceState>('IDLE');
  const [messages, setMessages] = useState<Message[]>([]);
  const [studentInput, setStudentInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

  // Tracking state & Assistance Banners
  const [hintsUsed, setHintsUsed] = useState(0);
  const [interruptionsCount, setInterruptionsCount] = useState(0);
  const [hint5WordsActive, setHint5WordsActive] = useState<string | null>(null);
  const [hintFullActive, setHintFullActive] = useState<string | null>(null);
  const [assistBanner, setAssistBanner] = useState<{ type: string; title: string; text: string } | null>(null);
  const [translatedQuestions, setTranslatedQuestions] = useState<Record<string, string>>({});
  const [isTranslatingLanguage, setIsTranslatingLanguage] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<AppLanguage>('ENGLISH');

  // Audio / Voice Controls State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [voiceTelemetry, setVoiceTelemetry] = useState<{
    latency: number | null;
    cached: boolean;
    model: string;
    speaker: string;
  }>({
    latency: null,
    cached: false,
    model: 'arcana',
    speaker: 'astra',
  });

  // Audio refs & Speech Recognition
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const lastSpokenTextRef = useRef<string>('');
  const speechTokenRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasSpokenQuestion1Ref = useRef<boolean>(false);

  useEffect(() => {
    fetchSessionDetails();

    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        stopCurrentSpeech();
        const transcript = Array.from(event.results)
          .map((res: any) => res[0].transcript)
          .join('');
        setStudentInput(transcript);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      stopCurrentSpeech();
    };
  }, [sessionId]);

  const fetchSessionDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load session');

      setSession(data.session);
      setCurrentQuestionIndex(data.session.currentQuestionIndex || 0);
      setCurrentLanguage((data.session.language as AppLanguage) || 'ENGLISH');

      if (data.session.messages) {
        setMessages(
          data.session.messages.map((m: any) => ({
            id: m.id,
            speaker: m.speaker,
            textContent: m.textContent,
            intent: m.intent,
            createdAt: m.createdAt,
          }))
        );
      }

      if (data.session.mode === 'SUMMARIZE') {
        stopCurrentSpeech();
        setVoiceState('IDLE');
      } else {
        // Voice-Native Oral Examination: Rime AI speaks active question aloud
        const qIndex = data.session.currentQuestionIndex || 0;
        const currentQ = data.session.questions?.[qIndex];
        if (currentQ && data.session.status !== 'COMPLETED' && !hasSpokenQuestion1Ref.current) {
          hasSpokenQuestion1Ref.current = true;
          const qNum = qIndex + 1;
          const spokenPrompt = qNum === 1
            ? `Welcome to your technical oral examination. Question 1: ${currentQ.questionText}`
            : `Question ${qNum}: ${currentQ.questionText}`;
          speakAiResponse(spokenPrompt);
        } else if (data.session.status === 'COMPLETED') {
          setVoiceState('COMPLETED');
        }
      }
    } catch (err: any) {
      alert(err.message || 'Error loading session');
    } finally {
      setLoading(false);
    }
  };

  const stopCurrentSpeech = () => {
    // 1. Abort in-flight network request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    // 2. Invalidate speech token to discard pending callbacks
    speechTokenRef.current += 1;

    // 3. Immediately pause, wipe src, and destroy audio element
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.onplay = null;
      audioRef.current.onpause = null;
      audioRef.current.onended = null;
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
      audioRef.current = null;
    }
    setIsPlayingAudio(false);
  };

  const speakAiResponse = async (text: string) => {
    if (session?.mode === 'SUMMARIZE' || !voiceEnabled) {
      setVoiceState('LISTENING');
      return;
    }

    // Always halt and destroy any active speech and cancel in-flight requests
    stopCurrentSpeech();

    // Increment and capture unique speech token for this invocation
    speechTokenRef.current += 1;
    const currentToken = speechTokenRef.current;

    // Create fresh AbortController for this fetch
    const controller = new AbortController();
    abortControllerRef.current = controller;

    lastSpokenTextRef.current = text;
    setVoiceState('ASKING');
    setVoiceError(null);

    try {
      const res = await fetch('/api/tts/rime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
        signal: controller.signal,
      });

      // Discard if token was invalidated while waiting
      if (speechTokenRef.current !== currentToken) {
        return;
      }

      const contentType = res.headers.get('Content-Type') || '';
      const latencyHdr = res.headers.get('X-Rime-Latency-Ms');
      const cachedHdr = res.headers.get('X-Rime-Cached');
      const modelHdr = res.headers.get('X-Rime-Model');
      const speakerHdr = res.headers.get('X-Rime-Speaker');

      if (latencyHdr) {
        setVoiceTelemetry({
          latency: parseInt(latencyHdr, 10),
          cached: cachedHdr === 'true',
          model: modelHdr || 'arcana',
          speaker: speakerHdr || 'astra',
        });
      }

      if (res.ok && contentType.includes('audio')) {
        const blob = await res.blob();

        // Discard if token was invalidated while reading blob
        if (speechTokenRef.current !== currentToken) {
          return;
        }

        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        audio.muted = isAudioMuted;
        audioRef.current = audio;

        audio.onplay = () => {
          if (speechTokenRef.current === currentToken) {
            setIsPlayingAudio(true);
          } else {
            audio.pause();
            audio.removeAttribute('src');
          }
        };
        audio.onpause = () => setIsPlayingAudio(false);
        audio.onended = () => {
          if (speechTokenRef.current === currentToken) {
            setIsPlayingAudio(false);
            setVoiceState('LISTENING');
          }
        };

        await audio.play();
        return;
      } else {
        const data = await res.json().catch(() => ({}));
        if (speechTokenRef.current === currentToken) {
          setVoiceError(data.message || 'Voice temporarily unavailable. You can continue using text mode.');
          setVoiceState('LISTENING');
        }
      }
    } catch (e: any) {
      if (e?.name === 'AbortError') return;
      if (speechTokenRef.current === currentToken) {
        setVoiceError('Voice temporarily unavailable. You can continue using text mode.');
        setVoiceState('LISTENING');
      }
    }
  };

  const togglePlayPauseAudio = () => {
    if (!audioRef.current) {
      if (lastSpokenTextRef.current) {
        speakAiResponse(lastSpokenTextRef.current);
      }
      return;
    }

    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  const replayCurrentAudio = () => {
    const q = session?.questions?.[currentQuestionIndex];
    const translated =
      currentLanguage !== 'ENGLISH' ? translatedQuestions[`${currentQuestionIndex}_${currentLanguage}`] : null;
    if (translated) {
      speakAiResponse(`Question ${currentQuestionIndex + 1}: ${translated}`);
    } else if (q?.questionText) {
      speakAiResponse(`Question ${currentQuestionIndex + 1}: ${q.questionText}`);
    } else if (lastSpokenTextRef.current) {
      speakAiResponse(lastSpokenTextRef.current);
    }
  };

  const toggleMute = () => {
    const nextMuted = !isAudioMuted;
    setIsAudioMuted(nextMuted);
    if (audioRef.current) {
      audioRef.current.muted = nextMuted;
    }
  };

  const toggleVoiceEnabled = () => {
    const next = !voiceEnabled;
    setVoiceEnabled(next);
    if (!next) {
      stopCurrentSpeech();
    } else if (lastSpokenTextRef.current) {
      speakAiResponse(lastSpokenTextRef.current);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      stopCurrentSpeech();
      setStudentInput('');
      recognitionRef.current?.start();
      setIsListening(true);
      setVoiceState('LISTENING');
    }
  };

  const handleLanguageSwitch = async (lang: AppLanguage) => {
    stopCurrentSpeech();
    setCurrentLanguage(lang);
    setIsTranslatingLanguage(true);

    // Update microphone speech recognition language
    if (recognitionRef.current) {
      recognitionRef.current.lang = lang === 'ENGLISH' ? 'en-US' : 'hi-IN';
    }

    try {
      const res = await fetch(`/api/sessions/${sessionId}/language`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: lang, questionIndex: currentQuestionIndex }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.translatedQuestion) {
          const qIdx = typeof data.questionIndex === 'number' ? data.questionIndex : currentQuestionIndex;
          setTranslatedQuestions((prev) => ({
            ...prev,
            [`${qIdx}_${lang}`]: data.translatedQuestion,
          }));
        }
        if (data.confirmMsg) {
          setMessages((prev) => [
            ...prev,
            { speaker: 'AI', textContent: data.confirmMsg, intent: `SWITCH_${lang}` },
          ]);
          speakAiResponse(data.confirmMsg);
        }
      }
    } catch (e) {
    } finally {
      setIsTranslatingLanguage(false);
    }
  };

  const handleInterruption = async (intent: InterruptionIntent) => {
    stopCurrentSpeech();
    setInterruptionsCount((prev) => prev + 1);
    setVoiceState('INTERRUPTED');

    try {
      const res = await fetch(`/api/sessions/${sessionId}/interact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          directIntent: intent,
          questionIndex: currentQuestionIndex,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.isInterruption) {
        if (data.incrementHintCount) setHintsUsed((prev) => prev + 1);

        // 1. Skip Question
        if (data.isSkip) {
          setHint5WordsActive(null);
          setHintFullActive(null);
          setAssistBanner(null);
          setStudentInput('');

          if (data.isCompleted) {
            setVoiceState('COMPLETED');
            setMessages((prev) => [
              ...prev,
              { speaker: 'STUDENT', textContent: '[Triggered: SKIP]' },
              { speaker: 'AI', textContent: data.aiResponseText, intent: 'COMPLETED' },
            ]);
            speakAiResponse(data.aiResponseText);
            setTimeout(() => {
              router.push(`/report/${sessionId}`);
            }, 2200);
            return;
          }

          if (data.nextQuestion && session?.questions) {
            setSession((prev: any) => {
              const exists = prev.questions.some((q: any) => q.orderIndex === data.nextQuestion.orderIndex);
              if (!exists) {
                return { ...prev, questions: [...prev.questions, data.nextQuestion] };
              }
              return prev;
            });
          }

          setCurrentQuestionIndex(data.nextQuestionIndex);
          setMessages((prev) => [
            ...prev,
            { speaker: 'STUDENT', textContent: '[Triggered: SKIP]' },
            { speaker: 'AI', textContent: data.aiResponseText, intent: 'SKIP' },
          ]);
          speakAiResponse(data.aiResponseText);
          return;
        }

        // 2. 5-Word Hint
        if (intent === 'HINT_5_WORD' && data.hint5Words) {
          setHint5WordsActive(data.hint5Words);
          setHintFullActive(null);
          setAssistBanner(null);
        }

        // 3. Detailed Hint
        if (intent === 'HINT_FULL' && data.fullHint) {
          setHintFullActive(data.fullHint);
          setHint5WordsActive(null);
          setAssistBanner(null);
        }

        // 4. Explain Simply
        if (intent === 'SIMPLIFY') {
          setAssistBanner({
            type: 'SIMPLIFY',
            title: 'Simplified Explanation',
            text: data.simplifiedText || data.aiResponseText,
          });
          setHint5WordsActive(null);
          setHintFullActive(null);
        }

        // 5. Give Example
        if (intent === 'EXAMPLE') {
          setAssistBanner({
            type: 'EXAMPLE',
            title: 'Practical Scenario / Example',
            text: data.exampleText || data.aiResponseText,
          });
          setHint5WordsActive(null);
          setHintFullActive(null);
        }

        // 6. Repeat
        if (intent === 'REPEAT') {
          // Replay current speech
        }

        setMessages((prev) => [
          ...prev,
          { speaker: 'STUDENT', textContent: `[Triggered: ${intent}]` },
          { speaker: 'AI', textContent: data.aiResponseText, intent },
        ]);

        speakAiResponse(data.aiResponseText);
      }
    } catch (e: any) {
      alert(e.message || 'Interruption error');
    }
  };

  const handleSubmitAnswer = async () => {
    if (!studentInput.trim()) return;

    stopCurrentSpeech();
    setSubmittingAnswer(true);
    setVoiceState('EVALUATING');

    const answerText = studentInput.trim();
    setStudentInput('');
    setIsListening(false);

    setMessages((prev) => [...prev, { speaker: 'STUDENT', textContent: answerText }]);

    const currentQuestion = session.questions[currentQuestionIndex];

    try {
      const res = await fetch(`/api/sessions/${sessionId}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          studentResponse: answerText,
          hintsUsed,
          interruptionsCount,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setHintsUsed(0);
      setInterruptionsCount(0);
      setHint5WordsActive(null);
      setHintFullActive(null);
      setAssistBanner(null);

      if (data.isCompleted) {
        setVoiceState('COMPLETED');
        const finalMsg = 'All questions have been answered. That concludes your oral technical defense. Compiling your final performance report.';
        speakAiResponse(finalMsg);
        setMessages((prev) => [
          ...prev,
          {
            speaker: 'AI',
            textContent: finalMsg,
            intent: 'COMPLETED',
          },
        ]);
        setTimeout(() => {
          router.push(`/report/${sessionId}`);
        }, 2200);
      } else {
        if (session?.mode === 'INTERVIEW' && data.nextQuestion) {
          setSession((prev: any) => ({
            ...prev,
            questions: [...prev.questions, data.nextQuestion],
          }));
        }
        setCurrentQuestionIndex(data.nextQuestionIndex);

        // Resolve the exact question that will be active on screen
        const targetQ = session?.mode === 'INTERVIEW'
          ? data.nextQuestion
          : session?.questions?.[data.nextQuestionIndex] || data.nextQuestion;

        const questionTextToSpeak = targetQ?.questionText || targetQ?.question || '';
        const nextSpeech = `Answer recorded. Question ${data.nextQuestionIndex + 1}: ${questionTextToSpeak}`;

        speakAiResponse(nextSpeech);
        setMessages((prev) => [
          ...prev,
          {
            speaker: 'AI',
            textContent: nextSpeech,
            intent: 'NEXT_QUESTION',
          },
        ]);
      }
    } catch (err: any) {
      alert(err.message || 'Answer submission failed');
      setVoiceState('IDLE');
    } finally {
      setSubmittingAnswer(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-foreground/15 selection:text-foreground">
        <Navbar />
        <div className="flex-1 flex items-center justify-center space-y-3 flex-col">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          <span className="text-sm font-semibold text-slate-500">Preparing Studio & Audio Engine...</span>
        </div>
      </div>
    );
  }

  const currentQuestion = session?.questions?.[currentQuestionIndex];
  const isCompleted = session?.status === 'COMPLETED' || voiceState === 'COMPLETED';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* If SUMMARIZE MODE: Render Dedicated Full-Width Summary Studio */}
        {session?.mode === 'SUMMARIZE' ? (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
              {/* Summary Toolbar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900">
                      Grounded PDF Summary
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      • {session.detectedSubject || 'Study Material'}
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1.5">
                    {session.pdfName || 'Document Summary'}
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Systematic 12-part conceptual synthesis anchored strictly to uploaded document chunks.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={`/api/export/summary/${sessionId}`}
                    download
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Summary PDF</span>
                  </a>
                </div>
              </div>

              {/* Formatted Content Reader */}
              <div className="space-y-4 font-sans max-w-4xl">
                {(session?.writtenSummary || '').split('\n').map((line: string, idx: number) => {
                  const trimmed = line.trim();
                  if (!trimmed) return <div key={idx} className="h-2" />;
                  if (trimmed.startsWith('# ')) {
                    return (
                      <h2
                        key={idx}
                        className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white pt-3 pb-1 border-b border-slate-200 dark:border-slate-800"
                      >
                        {trimmed.replace(/^#\s+/, '')}
                      </h2>
                    );
                  }
                  if (trimmed.startsWith('## ')) {
                    return (
                      <h3
                        key={idx}
                        className="text-base sm:text-lg font-bold text-indigo-700 dark:text-indigo-400 pt-4 pb-1"
                      >
                        {trimmed.replace(/^##\s+/, '')}
                      </h3>
                    );
                  }
                  if (trimmed.startsWith('### ')) {
                    return (
                      <h4 key={idx} className="text-sm font-bold text-slate-800 dark:text-slate-200 pt-2">
                        {trimmed.replace(/^###\s+/, '')}
                      </h4>
                    );
                  }
                  if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
                    return (
                      <div
                        key={idx}
                        className="font-mono text-xs bg-slate-50 dark:bg-slate-800/70 p-2 rounded border border-slate-200 dark:border-slate-700 overflow-x-auto"
                      >
                        {trimmed}
                      </div>
                    );
                  }
                  if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                    return (
                      <div key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 pl-2">
                        <span className="text-indigo-500 font-bold mt-0.5">•</span>
                        <span>{trimmed.replace(/^[-*]\s+/, '')}</span>
                      </div>
                    );
                  }
                  return (
                    <p key={idx} className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {trimmed}
                    </p>
                  );
                })}
              </div>

              {/* Next Steps Quick Action Cards */}
              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-brand-600" /> Active Recall Flashcards
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Practice questions on the core topics extracted from this PDF with interactive cards.
                    </p>
                  </div>
                  <button
                    onClick={() => router.push(`/flashcards?docId=${session.documentId}`)}
                    className="self-start px-3.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-brand-700 dark:text-brand-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
                  >
                    <span>Launch Flashcards</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-emerald-600" /> Targeted Practice Exam
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Attempt multi-format exam questions calibrated to your syllabus difficulty level.
                    </p>
                  </div>
                  <button
                    onClick={() => router.push(`/mode-selection?docId=${session.documentId}`)}
                    className="self-start px-3.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
                  >
                    <span>Configure Exam</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Header for Interview / Exam Modes */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300">
                    {session?.mode === 'INTERVIEW' ? 'AI Technical Interview' : `${session?.mode} Mode`}
                  </span>
                  <span className="text-xs text-slate-500">• {session?.pdfName}</span>
                  <span className="text-xs font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1">
                    <Languages className="w-3.5 h-3.5" /> {currentLanguage}
                  </span>
                </div>
                <h1 className="text-xl font-extrabold mt-1">
                  {isCompleted
                    ? 'Session Completed'
                    : `Question ${currentQuestionIndex + 1} of ${session?.questionCount || session?.questions?.length}`}
                </h1>
              </div>

              {/* Session Top Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={`/api/export/questions/${sessionId}`}
                  download
                  className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
                >
                  <Download className="w-3.5 h-3.5" /> Question List PDF
                </a>

                {isCompleted && (
                  <button
                    onClick={() => router.push(`/report/${sessionId}`)}
                    className="px-5 py-2.5 bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5"
                  >
                    <span>View Full Report</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* State Indicator Banner for Exam Progress */}
            <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isListening
                      ? 'bg-rose-500 animate-ping'
                      : submittingAnswer
                      ? 'bg-amber-500 animate-spin'
                      : isCompleted
                      ? 'bg-emerald-500'
                      : 'bg-emerald-500'
                  }`}
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {submittingAnswer
                    ? 'Submitting response...'
                    : isListening
                    ? 'Listening to Student Mic...'
                    : isCompleted
                    ? 'Technical Interview Completed'
                    : 'Ready for Response'}
                </span>
              </div>

              {currentQuestion && (
                <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
                  <span>Topic: <strong className="text-slate-900 dark:text-white break-all">{currentQuestion.topic}</strong></span>
                  <span>•</span>
                  <span>Difficulty: <strong className="text-slate-900 dark:text-white">{currentQuestion.difficulty}</strong></span>
                </div>
              )}
            </div>

            {/* Speech Provider Observability & Audio Controls Bar */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="flex items-center gap-1.5 font-mono font-bold px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  Rime AI: {voiceTelemetry.model}:{voiceTelemetry.speaker}
                </span>

                <span className="font-mono text-slate-500 dark:text-slate-400">
                  Format: <strong className="text-slate-700 dark:text-slate-300">audio/mp3</strong>
                </span>

                {voiceTelemetry.latency !== null && (
                  <span className="font-mono text-slate-500 dark:text-slate-400">
                    • Latency:{' '}
                    <strong className="text-emerald-600 dark:text-emerald-400">
                      {voiceTelemetry.latency}ms
                    </strong>
                    {voiceTelemetry.cached && (
                      <span className="ml-1 text-[10px] text-indigo-500 font-bold">(In-Memory Cache)</span>
                    )}
                  </span>
                )}

                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                  Cut-off &lt;1ms
                </span>
              </div>

              {/* Audio Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={togglePlayPauseAudio}
                  title={isPlayingAudio ? 'Pause Voice' : 'Play Voice'}
                  className="px-3 py-2 sm:px-2.5 sm:py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1 transition-colors min-h-[44px] sm:min-h-0"
                >
                  {isPlayingAudio ? (
                    <>
                      <Pause className="w-3.5 h-3.5" /> <span className="sm:hidden">Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" /> <span className="sm:hidden">Play</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={replayCurrentAudio}
                  title="Replay Current Question Aloud"
                  className="px-3 py-2 sm:px-2.5 sm:py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1 transition-colors min-h-[44px] sm:min-h-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> <span className="sm:hidden">Replay</span>
                </button>

                <button
                  type="button"
                  onClick={toggleMute}
                  title={isAudioMuted ? 'Unmute' : 'Mute'}
                  className="p-3 sm:p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors min-h-[44px] sm:min-h-0 min-w-[44px] sm:min-w-0 flex items-center justify-center"
                >
                  {isAudioMuted ? <VolumeX className="w-4 h-4 sm:w-3.5 sm:h-3.5" /> : <Volume2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />}
                </button>
              </div>
            </div>

            {/* Voice Visualizer */}
            <VoiceVisualizer
              state={voiceState}
              currentSpeakerText={isPlayingAudio ? lastSpokenTextRef.current : undefined}
            />

            {/* Active Question Box */}
            {!isCompleted && currentQuestion && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-slate-500 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="flex items-center gap-1.5 font-bold text-brand-700 dark:text-brand-300">
                    Topic: {currentQuestion.topic}
                  </span>
                  <div className="flex items-center gap-3">
                    {currentLanguage !== 'ENGLISH' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-mono text-[11px] font-bold border border-teal-200 dark:border-teal-800 flex items-center gap-1.5">
                        {isTranslatingLanguage ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" /> Translating...
                          </>
                        ) : (
                          <span>{currentLanguage === 'HINDI' ? 'हिंदी (Hindi)' : 'Hinglish'}</span>
                        )}
                      </span>
                    )}
                    <span>
                      Format: <strong>{currentQuestion.questionType || 'Core concept'}</strong> • Difficulty:{' '}
                      <strong>{currentQuestion.difficulty}</strong>
                    </span>
                  </div>
                </div>

                {/* Question Text */}
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white leading-relaxed">
                  {currentLanguage !== 'ENGLISH' && translatedQuestions[`${currentQuestionIndex}_${currentLanguage}`]
                    ? translatedQuestions[`${currentQuestionIndex}_${currentLanguage}`]
                    : currentQuestion.questionText}
                </h2>

                {/* Hint / Assistance Callouts */}
                {hint5WordsActive && (
                  <div className="p-4 rounded-2xl bg-[#243348] text-white flex items-start justify-between gap-3 shadow-sm border border-slate-700">
                    <div className="flex items-start gap-2.5">
                      <Lightbulb className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-amber-300">5-Word Hint</p>
                        <p className="text-base font-extrabold mt-0.5 tracking-wide">"{hint5WordsActive}"</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setHint5WordsActive(null)}
                      className="text-xs text-slate-300 hover:text-white px-3 py-2 rounded bg-slate-800/80 hover:bg-slate-700 transition-colors min-h-[44px] sm:min-h-0 flex items-center"
                    >
                      <X className="w-4 h-4 sm:hidden" /> Dismiss
                    </button>
                  </div>
                )}

                {hintFullActive && (
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100 flex items-start justify-between gap-3 shadow-sm">
                    <div className="flex items-start gap-2.5">
                      <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">Detailed Conceptual Hint</p>
                        <p className="text-xs font-semibold mt-0.5 leading-relaxed">{hintFullActive}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setHintFullActive(null)}
                      className="text-xs text-amber-700 dark:text-amber-300 hover:text-amber-900 px-3 py-2 rounded hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors min-h-[44px] sm:min-h-0 flex items-center"
                    >
                      <X className="w-4 h-4 sm:hidden" /> Dismiss
                    </button>
                  </div>
                )}

                {assistBanner && (
                  <div className={`p-4 rounded-2xl flex items-start justify-between gap-3 shadow-sm ${
                    assistBanner.type === 'SIMPLIFY'
                      ? 'bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-900 dark:text-teal-100'
                      : 'bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-100'
                  }`}>
                    <div className="flex items-start gap-2.5">
                      {assistBanner.type === 'SIMPLIFY' ? (
                        <HelpCircle className="w-5 h-5 text-teal-600 dark:text-teal-400 mt-0.5 shrink-0" />
                      ) : (
                        <Compass className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5 shrink-0" />
                      )}
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider opacity-80">{assistBanner.title}</p>
                        <p className="text-xs font-semibold mt-0.5 leading-relaxed">{assistBanner.text}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAssistBanner(null)}
                      className="text-xs opacity-70 hover:opacity-100 px-3 py-2 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors min-h-[44px] sm:min-h-0 flex items-center"
                    >
                      <X className="w-4 h-4 sm:hidden" /> Dismiss
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Student Input Box */}
            {!isCompleted && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Student Response (Spoken or Typed)
                  </label>

                  <button
                    type="button"
                    onClick={toggleListening}
                    className={`px-4 py-3 sm:px-3.5 sm:py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 min-h-[44px] sm:min-h-0 ${
                      isListening
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {isListening ? (
                      <>
                        <MicOff className="w-3.5 h-3.5" /> <span className="sm:hidden">Stop Mic</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-3.5 h-3.5" /> <span className="sm:hidden">Mic</span>
                      </>
                    )}
                  </button>
                </div>

                <textarea
                  rows={3}
                  value={studentInput}
                  onChange={(e) => setStudentInput(e.target.value)}
                  placeholder="Speak through your mic or type your explanation here..."
                  className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white"
                />

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Evaluated against PDF content using semantic understanding.
                  </span>
                  <button
                    type="button"
                    disabled={submittingAnswer || !studentInput.trim()}
                    onClick={handleSubmitAnswer}
                    className="px-6 py-2.5 bg-brand-700 hover:bg-brand-800 dark:bg-brand-600 dark:hover:bg-brand-500 text-white font-semibold rounded-xl shadow-xs flex items-center gap-2 text-sm transition-colors disabled:opacity-50"
                  >
                    {submittingAnswer ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Evaluating...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" /> Submit Answer
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Interruption & Language Switcher Panel */}
            {!isCompleted && (
              <InterruptionPanel
                onTrigger={handleInterruption}
                onLanguageSwitch={handleLanguageSwitch}
                currentLanguage={currentLanguage}
                disabled={submittingAnswer || isTranslatingLanguage}
              />
            )}

            <ConversationTranscript messages={messages} />
          </>
        )}
      </main>
    </div>
  );
}
