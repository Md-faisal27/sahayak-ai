/**
 * Minimal Supabase `Database` type shim.
 *
 * This file is intentionally lightweight. It mirrors the Prisma schema so the
 * Supabase client is typed against the same tables the rest of the app uses.
 * The shape here is intentionally permissive (`any` on JSON/string fields) so
 * that the Prisma client and the Supabase client can coexist without forcing
 * callers to juggle two incompatible type systems.
 */
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          passwordHash: string;
          name: string;
          createdAt: string;
          updatedAt: string;
        };
        Insert: Partial<Database['public']['Tables']['users']['Row']>;
        Update: Partial<Database['public']['Tables']['users']['Row']>;
      };
      pdf_documents: {
        Row: {
          id: string;
          userId: string;
          filename: string;
          fileSize: number;
          pageCount: number;
          detectedSubject: string;
          extractedText: string;
          extractedTopics: string;
          extractedChunks: string;
          createdAt: string;
        };
        Insert: Partial<Database['public']['Tables']['pdf_documents']['Row']>;
        Update: Partial<Database['public']['Tables']['pdf_documents']['Row']>;
      };
      sessions: {
        Row: {
          id: string;
          userId: string;
          documentId: string;
          mode: string;
          status: string;
          language: string;
          currentQuestionIndex: number;
          totalScore: number;
          questionCount: number;
          difficulty: string;
          writtenSummary: string | null;
          topicsCovered: string | null;
          weakTopicTarget: string | null;
          createdAt: string;
          updatedAt: string;
        };
        Insert: Partial<Database['public']['Tables']['sessions']['Row']>;
        Update: Partial<Database['public']['Tables']['sessions']['Row']>;
      };
      questions: {
        Row: {
          id: string;
          sessionId: string;
          orderIndex: number;
          questionText: string;
          topic: string;
          difficulty: string;
          questionType: string;
          mcqOptions: string | null;
          correctAnswer: string | null;
          explanation: string | null;
          hint5Words: string;
          fullHint: string;
          contextReference: string;
        };
        Insert: Partial<Database['public']['Tables']['questions']['Row']>;
        Update: Partial<Database['public']['Tables']['questions']['Row']>;
      };
      answers: {
        Row: {
          id: string;
          sessionId: string;
          questionId: string;
          studentResponse: string;
          evaluationScore: number;
          classification: string;
          feedback: string;
          hintsUsed: number;
          interruptionsCount: number;
          timeTakenSeconds: number;
          createdAt: string;
        };
        Insert: Partial<Database['public']['Tables']['answers']['Row']>;
        Update: Partial<Database['public']['Tables']['answers']['Row']>;
      };
      conversation_messages: {
        Row: {
          id: string;
          sessionId: string;
          speaker: string;
          textContent: string;
          intent: string | null;
          createdAt: string;
        };
        Insert: Partial<Database['public']['Tables']['conversation_messages']['Row']>;
        Update: Partial<Database['public']['Tables']['conversation_messages']['Row']>;
      };
      topic_progress: {
        Row: {
          id: string;
          userId: string;
          topicName: string;
          scoreHistory: string;
          attemptsCount: number;
          latestScore: number;
          classification: string;
          updatedAt: string;
        };
        Insert: Partial<Database['public']['Tables']['topic_progress']['Row']>;
        Update: Partial<Database['public']['Tables']['topic_progress']['Row']>;
      };
      flashcards: {
        Row: {
          id: string;
          userId: string;
          documentId: string;
          topic: string;
          front: string;
          back: string;
          known: boolean;
          createdAt: string;
        };
        Insert: Partial<Database['public']['Tables']['flashcards']['Row']>;
        Update: Partial<Database['public']['Tables']['flashcards']['Row']>;
      };
      mistake_records: {
        Row: {
          id: string;
          userId: string;
          topic: string;
          questionText: string;
          wrongAnswer: string;
          correctConcept: string;
          failCount: number;
          resolved: boolean;
          createdAt: string;
          updatedAt: string;
        };
        Insert: Partial<Database['public']['Tables']['mistake_records']['Row']>;
        Update: Partial<Database['public']['Tables']['mistake_records']['Row']>;
      };
      study_plans: {
        Row: {
          id: string;
          userId: string;
          documentId: string;
          planData: string;
          createdAt: string;
          updatedAt: string;
        };
        Insert: Partial<Database['public']['Tables']['study_plans']['Row']>;
        Update: Partial<Database['public']['Tables']['study_plans']['Row']>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};