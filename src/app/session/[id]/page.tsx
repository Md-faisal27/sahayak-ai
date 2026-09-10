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
  Sparkles,
  AlertCircle,
  Mic,
  MicOff,
  Send,
  Loader2,
  ArrowLeft,
  Volume2,
  VolumeX,
  RotateCcw,
  BookOpen,
  Award,
  Layers,
} from 'lucide-react';
import Link from 'next/link';

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [session, setSession] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [voiceState, setVoiceState] = useState<VoiceState>('IDLE');
  const [messages, setMessages] = useState<Message[]>([]);
  const [studentInput, setStudentInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<AppLanguage>('ENGLISH');

  // Audio / Telemetry State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [continuousVoiceLoop, setContinuousVoiceLoop] = useState(true);
  const [autoSubmitCountdown, setAutoSubmitCountdown] = useState<number | null>(null);
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
  const continuousVoiceLoopRef = useRef(true);
  const autoSubmitTimerRef = useRef<NodeJS.Timeout | null>(null);
  const studentInputRef = useRef('');
  const hasSpokenWelcomeRef = useRef(false);

  useEffect(() => {
    continuousVoiceLoopRef.current = continuousVoiceLoop;
  }, [continuousVoiceLoop]);

  useEffect(() => {
    studentInputRef.current = studentInput;
  }, [studentInput]);

  const cancelAutoSubmit = () => {
    if (autoSubmitTimerRef.current) {
      clearInterval(autoSubmitTimerRef.current);
      autoSubmitTimerRef.current = null;
    }
    setAutoSubmitCountdown(null);
  };

  const parseVoiceCommand = (transcript: string): InterruptionIntent | null => {
    const lower = transcript.toLowerCase().trim();
    if (/\b(5[- ]?word hint|five word hint|clue|give clue|hint)\b/.test(lower)) return 'HINT_5_WORD';
    if (/\b(repeat question|repeat|say again|pardon)\b/.test(lower)) return 'REPEAT';
    if (/\b(explain simply|simplify|simpler)\b/.test(lower)) return 'SIMPLIFY';
    if (/\b(give example|practical example|example)\b/.test(lower)) return 'EXAMPLE';
    if (/\b(detailed hint|full hint)\b/.test(lower)) return 'HINT_FULL';
    if (/\b(skip question|skip|next question)\b/.test(lower)) return 'SKIP';
    return null;
  };

  const stopCurrentSpeech = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    speechTokenRef.current += 1;
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
    stopCurrentSpeech();
    cancelAutoSubmit();

    speechTokenRef.current += 1;
    const currentToken = speechTokenRef.current;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    lastSpokenTextRef.current = text;
    setVoiceState('ASKING');

    try {
      const res = await fetch('/api/tts/rime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
        signal: controller.signal,
      });

      if (speechTokenRef.current !== currentToken) return;

      const contentType = res.headers.get('Content-Type') || '';
      const latencyHdr = res.headers.get('X-Rime-Latency-Ms');
      const cachedHdr = res.headers.get('X-Rime-Cached');
      const modelHdr = res.headers.get('X-Rime-Model');
      const speakerHdr = res.headers.get('X-Rime-Speaker');

      setVoiceTelemetry({
        latency: latencyHdr ? parseInt(latencyHdr, 10) : null,
        cached: cachedHdr === 'true',
        model: modelHdr || 'arcana',
        speaker: speakerHdr || 'astra',
      });

      if (res.ok && contentType.includes('audio')) {
        const audioBlob = await res.blob();
        if (speechTokenRef.current !== currentToken) return;

        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.muted = isAudioMuted;
        audioRef.current = audio;

        audio.onplay = () => {
          setIsPlayingAudio(true);
          setVoiceState('ASKING');
        };

        audio.onended = () => {
          setIsPlayingAudio(false);
          setVoiceState('LISTENING');
          URL.revokeObjectURL(audioUrl);
          audioRef.current = null;

          if (continuousVoiceLoopRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.start();
              setIsListening(true);
            } catch (e) {
              // Already running
            }
          }
        };

        audio.onerror = () => {
          setIsPlayingAudio(false);
          setVoiceState('LISTENING');
          URL.revokeObjectURL(audioUrl);
          audioRef.current = null;
        };

        await audio.play().catch(() => {
          setIsPlayingAudio(false);
          setVoiceState('LISTENING');
        });
      } else {
        // Fallback to speech synthesis if Rime API is unreachable or text-only fallback
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          const cleanText = text.replace(/[*_#`]/g, '');
          const utterance = new SpeechSynthesisUtterance(cleanText);
          utterance.rate = 1.0;
          utterance.onstart = () => {
            setIsPlayingAudio(true);
            setVoiceState('ASKING');
          };
          utterance.onend = () => {
            setIsPlayingAudio(false);
            setVoiceState('LISTENING');
            if (continuousVoiceLoopRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.start();
                setIsListening(true);
              } catch (e) {}
            }
          };
          window.speechSynthesis.speak(utterance);
        } else {
          setVoiceState('LISTENING');
        }
      }
    } catch (e: any) {
      if (e?.name === 'AbortError') return;
      if (speechTokenRef.current === currentToken) {
        setVoiceState('LISTENING');
      }
    }
  };

  useEffect(() => {
    fetchSession();

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

        const command = parseVoiceCommand(transcript);
        if (command) {
          cancelAutoSubmit();
          setStudentInput('');
          try {
            recognition.stop();
          } catch (e) {}
          handleInterruption(command);
          return;
        }

        cancelAutoSubmit();
        setStudentInput(transcript);
      };

      recognition.onend = () => {
        setIsListening(false);
        if (
          continuousVoiceLoopRef.current &&
          studentInputRef.current.trim().length > 5 &&
          voiceState !== 'EVALUATING' &&
          voiceState !== 'COMPLETED'
        ) {
          cancelAutoSubmit();
          let count = 3;
          setAutoSubmitCountdown(count);
          autoSubmitTimerRef.current = setInterval(() => {
            count -= 1;
            if (count <= 0) {
              cancelAutoSubmit();
              if (studentInputRef.current.trim()) {
                handleSubmitAnswer();
              }
            } else {
              setAutoSubmitCountdown(count);
            }
          }, 1000);
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      stopCurrentSpeech();
      cancelAutoSubmit();
    };
  }, [sessionId]);

  const fetchSession = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load session');

      setSession(data.session);
      setCurrentQuestionIndex(data.session.currentQuestionIndex || 0);
      setCurrentLanguage(data.session.language || 'ENGLISH');

      if (data.session.messages && data.session.messages.length > 0) {
        setMessages(data.session.messages);
      } else {
        const firstQ = data.session.questions[0];
        const initialText = `Welcome to your AI Technical Interview. Let's start with Question 1: ${firstQ?.questionText}`;
        setMessages([{ speaker: 'AI', textContent: initialText }]);
      }

      if (data.session.status === 'COMPLETED') {
        setVoiceState('COMPLETED');
      } else if (!hasSpokenWelcomeRef.current) {
        hasSpokenWelcomeRef.current = true;
        const currentQ = data.session.questions[data.session.currentQuestionIndex || 0];
        const speechText = data.session.messages?.[0]?.textContent || `Question: ${currentQ?.questionText}`;
        speakAiResponse(speechText);
      }
    } catch (err: any) {
      alert(err.message || 'Error fetching interview session');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const toggleListening = () => {
    cancelAutoSubmit();
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

  const toggleMute = () => {
    const nextMuted = !isAudioMuted;
    setIsAudioMuted(nextMuted);
    if (audioRef.current) {
      audioRef.current.muted = nextMuted;
    }
  };

  const handleLanguageChange = async (newLang: AppLanguage) => {
    setCurrentLanguage(newLang);
    try {
      await fetch(`/api/sessions/${sessionId}/language`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: newLang }),
      });
    } catch (e) {
      console.error('Failed to change language:', e);
    }
  };

  const handleSkipQuestion = async () => {
    if (!session || submittingAnswer) return;
    const currentQ = session.questions[currentQuestionIndex];
    if (!currentQ) return;

    stopCurrentSpeech();
    cancelAutoSubmit();
    setSubmittingAnswer(true);
    setVoiceState('EVALUATING');
    setIsListening(false);
    setStudentInput('');

    setMessages((prev) => [...prev, { speaker: 'STUDENT', textContent: '[Question Skipped]' }]);

    try {
      const res = await fetch(`/api/sessions/${sessionId}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQ?.id,
          studentResponse: '[Question Skipped]',
          isSkipped: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to skip question');

      const spokenFeedback = data.aiMessageText || (data.isCompleted ? 'Technical interview completed!' : 'Question skipped.');

      setMessages((prev) => [
        ...prev,
        { speaker: 'AI', textContent: spokenFeedback, intent: data.isCompleted ? 'COMPLETED' : 'NEXT_QUESTION' },
      ]);

      speakAiResponse(spokenFeedback);

      if (data.isCompleted) {
        setVoiceState('COMPLETED');
        setSession((prev: any) => ({ ...prev, status: 'COMPLETED' }));
      } else {
        if (data.questions) {
          setSession((prev: any) => ({ ...prev, questions: data.questions }));
        }
        setCurrentQuestionIndex(data.nextQuestionIndex);
      }
    } catch (e: any) {
      alert(e.message || 'Failed to skip question');
      setVoiceState('IDLE');
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const handleInterruption = async (intent: InterruptionIntent) => {
    const currentQ = session?.questions[currentQuestionIndex];
    if (!currentQ) return;

    stopCurrentSpeech();
    cancelAutoSubmit();

    if (intent === 'SKIP') {
      await handleSkipQuestion();
      return;
    }

    setVoiceState('INTERRUPTED');

    try {
      const res = await fetch(`/api/sessions/${sessionId}/interact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ directIntent: intent, questionIndex: currentQuestionIndex }),
      });
      const data = await res.json();
      if (data.isInterruption) {
        setMessages((prev) => [
          ...prev,
          { speaker: 'STUDENT', textContent: `[Triggered: ${intent}]` },
          { speaker: 'AI', textContent: data.aiResponseText, intent },
        ]);
        speakAiResponse(data.aiResponseText);
      }
    } catch (e) {
      console.error('Interruption failed:', e);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!studentInput.trim() || !session) return;
    stopCurrentSpeech();
    cancelAutoSubmit();
    setSubmittingAnswer(true);
    setVoiceState('EVALUATING');

    const answerText = studentInput.trim();
    setStudentInput('');
    setIsListening(false);
    setMessages((prev) => [...prev, { speaker: 'STUDENT', textContent: answerText }]);

    const currentQ = session.questions[currentQuestionIndex];

    try {
      const res = await fetch(`/api/sessions/${sessionId}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQ?.id,
          studentResponse: answerText,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Evaluation failed');

      const spokenFeedback = data.aiMessageText || (data.isCompleted ? 'Interview completed! Generating evaluation report.' : 'Answer recorded.');

      setMessages((prev) => [
        ...prev,
        { speaker: 'AI', textContent: spokenFeedback, intent: data.isCompleted ? 'COMPLETED' : 'NEXT_QUESTION' },
      ]);

      speakAiResponse(spokenFeedback);

      if (data.isCompleted) {
        setVoiceState('COMPLETED');
        setSession((prev: any) => ({ ...prev, status: 'COMPLETED' }));
      } else {
        if (data.questions) {
          setSession((prev: any) => ({ ...prev, questions: data.questions }));
        }
        setCurrentQuestionIndex(data.nextQuestionIndex);
      }
    } catch (e: any) {
      alert(e.message || 'Failed to submit response');
      setVoiceState('IDLE');
    } finally {
      setSubmittingAnswer(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center space-y-3 flex-col min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          <span className="text-sm font-semibold text-slate-500">Initializing AI Technical Interview & Voice Stream...</span>
        </div>
      </div>
    );
  }

  const currentQ = session?.questions[currentQuestionIndex];
  const isCompleted = voiceState === 'COMPLETED' || session?.status === 'COMPLETED';

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-background text-foreground flex flex-col font-sans selection:bg-foreground/15 selection:text-foreground">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 min-w-0">
        {/* Top Breadcrumb & Status */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-brand-700 dark:hover:text-brand-300 flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
              {session?.mode || 'INTERVIEW'} MODE
            </span>
            <span className="text-xs font-mono text-slate-400">
              Q{currentQuestionIndex + 1} of {session?.questionCount || 5}
            </span>
          </div>
        </div>

        {/* Voice Session Control Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs w-full min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Voice Active
            </span>
            <span className="font-mono text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
              <span className="text-slate-400">Voice Model:</span>
              <strong className="text-brand-600 dark:text-brand-400 font-semibold">Rime AI ({voiceTelemetry.model} : {voiceTelemetry.speaker})</strong>
            </span>
            {voiceTelemetry.latency !== null && (
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 hidden sm:inline-block">
                {voiceTelemetry.latency}ms {voiceTelemetry.cached ? '(cached)' : ''}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              title={isAudioMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isAudioMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => lastSpokenTextRef.current && speakAiResponse(lastSpokenTextRef.current)}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Replay Question
            </button>
          </div>
        </div>

        {/* Visualizer & Voice State Engine */}
        <VoiceVisualizer
          state={voiceState}
          currentSpeakerText={lastSpokenTextRef.current}
          hideSpokenText={true}
        />

        {/* Question Display Card */}
        {currentQ && !isCompleted && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-brand-100 dark:bg-brand-950 text-brand-800 dark:text-brand-300">
                  Topic: {currentQ.topic}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Difficulty: {currentQ.difficulty}
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Type: {currentQ.questionType || 'Conceptual'}
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-relaxed">
              {currentQ.questionText}
            </h2>
          </div>
        )}

        {/* Completion Card */}
        {isCompleted && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-4 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto">
              <Award className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              Technical Interview Concluded!
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              You have completed all questions in this session. Your verbal responses have been scored against the syllabus source context.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href={`/report/${sessionId}`}
                className="px-6 py-3 bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2"
              >
                <span>View Full Performance Report</span>
              </Link>
              <Link
                href="/dashboard"
                className="px-5 py-3 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300"
              >
                Return to Dashboard
              </Link>
            </div>
          </div>
        )}

        {/* Student Voice Input Bar */}
        {!isCompleted && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Mic className="w-4 h-4 text-brand-600" /> Your Spoken Answer
              </span>
              {autoSubmitCountdown !== null && (
                <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 animate-pulse">
                  Auto-submitting in {autoSubmitCountdown}s...
                </span>
              )}
            </div>

            <textarea
              value={studentInput}
              onChange={(e) => {
                cancelAutoSubmit();
                setStudentInput(e.target.value);
              }}
              placeholder="Speak aloud or type your answer here..."
              rows={3}
              className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-sm focus:outline-hidden focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white resize-none"
            />

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={toggleListening}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-xs ${
                  isListening
                    ? 'bg-rose-600 text-white hover:bg-rose-700 animate-pulse'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-4 h-4" /> <span>Stop Listening</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" /> <span>Speak Answer (Mic)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleSubmitAnswer}
                disabled={submittingAnswer || !studentInput.trim()}
                className="px-6 py-2.5 bg-brand-700 hover:bg-brand-800 dark:bg-brand-600 dark:hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all"
              >
                {submittingAnswer ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> <span>Evaluating...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Answer</span> <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Live Interruption Triggers */}
        {!isCompleted && (
          <InterruptionPanel
            onTrigger={handleInterruption}
            onLanguageSwitch={handleLanguageChange}
            currentLanguage={currentLanguage}
          />
        )}

        {/* Full Transcript of the Viva */}
        <ConversationTranscript messages={messages} onReplayAudio={speakAiResponse} />
      </main>
    </div>
  );
}
