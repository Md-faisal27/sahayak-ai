'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { VoiceVisualizer } from '@/components/VoiceVisualizer';
import { InterruptionPanel } from '@/components/InterruptionPanel';
import { ConversationTranscript, Message } from '@/components/ConversationTranscript';
import { VoiceState, InterruptionIntent } from '@/lib/state-machine';
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
  Play,
  Pause,
  RotateCcw,
} from 'lucide-react';
import Link from 'next/link';

function WeakCoachContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const topic = searchParams.get('topic');

  const [session, setSession] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [voiceState, setVoiceState] = useState<VoiceState>('IDLE');
  const [messages, setMessages] = useState<Message[]>([]);
  const [studentInput, setStudentInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

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
        if (speechTokenRef.current !== currentToken) return;

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
            // Hands-Free Audio Loop: Auto-open microphone for student speech
            if (continuousVoiceLoopRef.current && recognitionRef.current) {
              try {
                setStudentInput('');
                recognitionRef.current.start();
                setIsListening(true);
              } catch (err) {}
            }
          }
        };

        await audio.play();
      } else {
        if (speechTokenRef.current === currentToken) {
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
    if (!topic) {
      router.push('/dashboard');
      return;
    }
    initializeWeakCoachSession(topic);

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
          studentInputRef.current.trim().length > 8 &&
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
  }, [topic, router]);

  const initializeWeakCoachSession = async (targetTopic: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/weak-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicName: targetTopic }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start coaching');

      setSession(data.session);
      setCurrentQuestionIndex(0);

      const firstQ = data.session.questions[0];
      const welcomeText = `Welcome to targeted Audio Coaching on ${targetTopic}. Let's master this step-by-step. Step 1: ${firstQ?.questionText}`;

      setMessages([
        {
          speaker: 'AI',
          textContent: welcomeText,
        },
      ]);

      if (!hasSpokenWelcomeRef.current) {
        hasSpokenWelcomeRef.current = true;
        speakAiResponse(welcomeText);
      }
    } catch (e: any) {
      alert(e.message || 'Error starting weak coach session');
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
    if (q?.questionText) {
      speakAiResponse(`Coaching Step ${currentQuestionIndex + 1}: ${q.questionText}`);
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

  const handleInterruption = async (intent: InterruptionIntent) => {
    const currentQ = session?.questions[currentQuestionIndex];
    if (!currentQ) return;

    stopCurrentSpeech();
    cancelAutoSubmit();
    setVoiceState('INTERRUPTED');

    try {
      const res = await fetch(`/api/sessions/${session.id}/interact`, {
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
    } catch (e) {}
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
      const res = await fetch(`/api/sessions/${session.id}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQ.id,
          studentResponse: answerText,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const spokenFeedback = data.aiMessageText || (data.isCompleted ? 'Coaching complete! You have mastered this concept.' : 'Answer recorded.');

      setMessages((prev) => [
        ...prev,
        { speaker: 'AI', textContent: spokenFeedback, intent: data.isCompleted ? 'COMPLETED' : 'NEXT_QUESTION' },
      ]);

      speakAiResponse(spokenFeedback);

      if (data.isCompleted) {
        setVoiceState('COMPLETED');
      } else {
        setCurrentQuestionIndex(data.nextQuestionIndex);
      }
    } catch (e: any) {
      alert(e.message || 'Evaluation failed');
      setVoiceState('IDLE');
    } finally {
      setSubmittingAnswer(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center space-y-3 flex-col min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
        <span className="text-sm font-semibold text-slate-500">Preparing Targeted Audio Coach...</span>
      </div>
    );
  }

  const currentQ = session?.questions[currentQuestionIndex];
  const isCompleted = voiceState === 'COMPLETED' || session?.status === 'COMPLETED';

  return (
    <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href="/dashboard"
          className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-brand-700 dark:hover:text-brand-300 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <span className="text-xs font-bold text-rose-600 dark:text-rose-400 break-words">
          Targeted Spoken Remediation: {topic}
        </span>
      </div>

      {/* Rime Speech Telemetry & Audio Observability Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs w-full min-w-0">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="flex items-center gap-1.5 font-mono font-bold px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            Rime AI Coach: {voiceTelemetry.model}:{voiceTelemetry.speaker}
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
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setContinuousVoiceLoop(!continuousVoiceLoop)}
            title="Toggle Continuous Coaching Voice Loop"
            className={`px-3 py-1.5 rounded-lg font-mono text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
              continuousVoiceLoop
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${continuousVoiceLoop ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            <span>Voice Loop: {continuousVoiceLoop ? 'Auto-Listen' : 'Manual'}</span>
          </button>

          <button
            type="button"
            onClick={togglePlayPauseAudio}
            title={isPlayingAudio ? 'Pause Coach Voice' : 'Play Coach Voice'}
            className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1 transition-colors text-xs"
          >
            {isPlayingAudio ? (
              <>
                <Pause className="w-3.5 h-3.5" /> <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" /> <span>Play</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={replayCurrentAudio}
            title="Replay Coach Question Aloud"
            className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1 transition-colors text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" /> <span>Replay</span>
          </button>

          <button
            type="button"
            onClick={toggleMute}
            title={isAudioMuted ? 'Unmute' : 'Mute'}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-center"
          >
            {isAudioMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Visualizer */}
      <VoiceVisualizer
        state={voiceState}
        currentSpeakerText={isPlayingAudio ? lastSpokenTextRef.current : currentQ?.questionText}
      />

      {!isCompleted && currentQ && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-2">
          <span className="text-xs font-bold uppercase text-rose-600 dark:text-rose-400 block">
            Audio Coaching Step {currentQuestionIndex + 1} of 3 ({currentQ.difficulty} Level)
          </span>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white leading-relaxed">
            {currentQ.questionText}
          </h2>
        </div>
      )}

      {/* Student Spoken Response Box */}
      {!isCompleted && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Student Response (Spoken Voice or Typed)
              </label>
              {isListening && (
                <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  Coach is Listening...
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={toggleListening}
              className={`px-4 py-2 sm:px-3.5 sm:py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                isListening
                  ? 'bg-rose-600 text-white shadow-xs animate-pulse'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-3.5 h-3.5" /> <span>Listening (Stop Mic)</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5" /> <span>Start Mic</span>
                </>
              )}
            </button>
          </div>

          {autoSubmitCountdown !== null && (
            <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-ping shrink-0" />
                <span className="font-bold">
                  Spoken explanation captured. Hands-free submitting to coach in {autoSubmitCountdown}s...
                </span>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={cancelAutoSubmit}
                  className="px-3 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Keep Speaking
                </button>
                <button
                  type="button"
                  onClick={handleSubmitAnswer}
                  className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors shadow-xs"
                >
                  Submit to Coach
                </button>
              </div>
            </div>
          )}



          <textarea
            rows={3}
            value={studentInput}
            onChange={(e) => {
              cancelAutoSubmit();
              setStudentInput(e.target.value);
            }}
            placeholder="Speak your explanation through your mic or type here to master this concept..."
            className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white"
          />
          <div className="flex justify-end">
            <button
              type="button"
              disabled={!studentInput.trim() || submittingAnswer}
              onClick={handleSubmitAnswer}
              className="px-6 py-2.5 bg-brand-700 hover:bg-brand-800 dark:bg-brand-600 dark:hover:bg-brand-500 text-white font-semibold rounded-xl text-xs shadow-xs flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {submittingAnswer ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> <span>Coach is Evaluating...</span>
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

      {!isCompleted && <InterruptionPanel onTrigger={handleInterruption} />}

      <ConversationTranscript messages={messages} />
    </main>
  );
}

export default function WeakCoachPage() {
  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-background text-foreground flex flex-col font-sans selection:bg-foreground/15 selection:text-foreground">
      <Navbar />
      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
        </div>
      }>
        <WeakCoachContent />
      </Suspense>
    </div>
  );
}
