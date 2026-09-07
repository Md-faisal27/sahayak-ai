-- ==============================================================================
-- DataForge RLS (Row Level Security) Policies
-- ==============================================================================
-- Apply this SQL in the Supabase SQL Editor (https://app.supabase.com/project/*/sql)
-- or by running: supabase db execute --file supabase/rls.sql
-- ==============================================================================

-- Enable Row Level Security on all app tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE mistake_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_plans ENABLE ROW LEVEL SECURITY;

-- ---- users ----
CREATE POLICY "Users can read their own record"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own record"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- ---- pdf_documents ----
CREATE POLICY "Users manage their own PDF documents"
  ON pdf_documents FOR ALL
  USING (auth.uid() = userId)
  WITH CHECK (auth.uid() = userId);

-- ---- sessions ----
CREATE POLICY "Users manage their own sessions"
  ON sessions FOR ALL
  USING (auth.uid() = userId)
  WITH CHECK (auth.uid() = userId);

-- ---- questions ----
CREATE POLICY "Users manage questions in their own sessions"
  ON questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = questions.sessionId
        AND sessions.userId = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = questions.sessionId
        AND sessions.userId = auth.uid()
    )
  );

-- ---- answers ----
CREATE POLICY "Users manage answers in their own sessions"
  ON answers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = answers.sessionId
        AND sessions.userId = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = answers.sessionId
        AND sessions.userId = auth.uid()
    )
  );

-- ---- conversation_messages ----
CREATE POLICY "Users manage messages in their own sessions"
  ON conversation_messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = conversation_messages.sessionId
        AND sessions.userId = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = conversation_messages.sessionId
        AND sessions.userId = auth.uid()
    )
  );

-- ---- topic_progress ----
CREATE POLICY "Users manage their own topic progress"
  ON topic_progress FOR ALL
  USING (auth.uid() = userId)
  WITH CHECK (auth.uid() = userId);

-- ---- flashcards ----
CREATE POLICY "Users manage their own flashcards"
  ON flashcards FOR ALL
  USING (auth.uid() = userId)
  WITH CHECK (auth.uid() = userId);

-- ---- mistake_records ----
CREATE POLICY "Users manage their own mistake records"
  ON mistake_records FOR ALL
  USING (auth.uid() = userId)
  WITH CHECK (auth.uid() = userId);

-- ---- study_plans ----
CREATE POLICY "Users manage their own study plans"
  ON study_plans FOR ALL
  USING (auth.uid() = userId)
  WITH CHECK (auth.uid() = userId);

-- ---- Supabase Storage: PDF bucket ----
-- Restrict the pdf-documents bucket to per-user paths.
CREATE POLICY "Users manage their own PDF files"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'pdf-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'pdf-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );