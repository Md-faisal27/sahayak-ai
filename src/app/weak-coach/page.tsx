'use client';

import React, { useEffect, useState, Suspense } from 'react';
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
  Send,
  Loader2,
  ArrowLeft,
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!topic) {
      router.push('/dashboard');
      return;
    }
    initializeWeakCoachSession(topic);
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
      setMessages([
        {
          speaker: 'AI',
          textContent: `Welcome to targeted Weak Topic Coaching for "${targetTopic}". Step 1: Warm-up question: ${firstQ?.questionText}`,
        },
      ]);
    } catch (e: any) {
      alert(e.message || 'Error starting weak coach session');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleInterruption = async (intent: InterruptionIntent) => {
    const currentQ = session?.questions[currentQuestionIndex];
    if (!currentQ) return;

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
      }
    } catch (e) {}
  };

  const handleSubmitAnswer = async () => {
    if (!studentInput.trim() || !session) return;
    setVoiceState('EVALUATING');

    const answerText = studentInput.trim();
    setStudentInput('');
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

      setMessages((prev) => [
        ...prev,
        { speaker: 'AI', textContent: data.aiMessageText, intent: data.isCompleted ? 'COMPLETED' : 'NEXT_QUESTION' },
      ]);

      if (data.isCompleted) {
        setVoiceState('COMPLETED');
      } else {
        setCurrentQuestionIndex(data.nextQuestionIndex);
        setVoiceState('LISTENING');
      }
    } catch (e: any) {
      alert(e.message || 'Evaluation failed');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center space-y-3 flex-col min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
        <span className="text-sm font-semibold text-slate-500">Preparing Targeted Weak Topic Coach...</span>
      </div>
    );
  }

  const currentQ = session?.questions[currentQuestionIndex];
  const isCompleted = voiceState === 'COMPLETED';

  return (
    <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-brand-700 dark:hover:text-brand-300 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
          Targeted Remediation: {topic}
        </span>
      </div>

      {/* Visualizer */}
      <VoiceVisualizer state={voiceState} currentSpeakerText={currentQ?.questionText} />

      {!isCompleted && currentQ && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-2">
          <span className="text-xs font-bold uppercase text-rose-600 dark:text-rose-400 block">
            Coaching Step {currentQuestionIndex + 1} of 3 ({currentQ.difficulty} Level)
          </span>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">{currentQ.questionText}</h2>
        </div>
      )}

      {!isCompleted && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <textarea
            rows={3}
            value={studentInput}
            onChange={(e) => setStudentInput(e.target.value)}
            placeholder="Type your explanation or response to master this weak topic..."
            className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white"
          />
          <div className="flex justify-end">
            <button
              type="button"
              disabled={!studentInput.trim()}
              onClick={handleSubmitAnswer}
              className="px-6 py-2.5 bg-brand-700 hover:bg-brand-800 dark:bg-brand-600 dark:hover:bg-brand-500 text-white font-semibold rounded-xl text-xs shadow-xs flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <span>Submit Answer</span> <Send className="w-3.5 h-3.5" />
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
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-foreground/15 selection:text-foreground">
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
