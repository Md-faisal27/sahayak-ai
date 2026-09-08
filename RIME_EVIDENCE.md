# Sahayak AI — 



> **Your syllabus. Your voice. Your AI examiner.**

**Live Demo:** https://sahayak-ai-zenvibecoders.vercel.app/

---

# 1. Project Overview

**Sahayak AI** is an AI-powered, voice-first technical viva and learning platform that transforms a student's syllabus, textbook, lecture notes, or study PDF into an interactive oral-examination experience.

Instead of simply allowing a student to chat with an AI, Sahayak AI acts as a proactive examiner:

```text
Upload Study Material
        ↓
Understand & Ground on the Document
        ↓
Generate Relevant Question
        ↓
Rime Speaks the Question
        ↓
Student Answers by Voice
        ↓
AI Evaluates the Answer
        ↓
Feedback + Next Question
        ↓
Track Weak Topics
        ↓
Targeted Practice & Revision
```

The core product is designed around the real experience of a technical viva, where students must listen, understand, think, and explain their answers verbally.

---

# 2. The Problem

Students commonly prepare for technical examinations by reading PDFs, notes, and textbooks, but this does not adequately prepare them for an oral viva.

### Common problems

- Static study material is passive.
- Generic AI assistants may provide information outside the student's syllabus.
- Students have limited opportunities to practice speaking answers.
- Students may know a concept but struggle to explain it verbally.
- Students often do not know which topics they are weak in.
- Revision resources are scattered across multiple tools.
- Traditional study tools do not simulate a real examiner interaction.

### The core problem

> **Students study the syllabus, but they do not practice defending their understanding of it.**

---

# 3. Our Solution

## Sahayak AI

Sahayak AI converts study material into a personalized AI viva.

The system:

1. Accepts the student's document.
2. Extracts and cleans its content.
3. Splits content into usable knowledge chunks.
4. Identifies and normalizes topics.
5. Retrieves relevant context for each task.
6. Generates grounded questions.
7. Uses Rime to speak the examiner's question.
8. Captures the student's spoken answer.
9. Evaluates the answer against the relevant context.
10. Tracks topic-level performance.
11. Identifies weak areas.
12. Provides targeted coaching and revision resources.

---

# 4. Why Voice Is Essential

Voice is not an optional feature in Sahayak AI.

The primary use case is an **oral technical examination**.

A text-only chatbot would remove the central experience:

```text
AI Examiner
    ↓
SPEAKS
    ↓
Student
    ↓
LISTENS
    ↓
Student
    ↓
SPEAKS
    ↓
AI
    ↓
EVALUATES
    ↓
AI Examiner
    ↓
SPEAKS AGAIN
```

Rime provides the primary spoken output for this interaction.

Without spoken examiner responses, Sahayak AI would no longer provide the intended voice-first viva experience.

---

# 5. Key Features

## 🎙️ Voice-First AI Viva

- One question at a time
- Spoken examiner interaction
- Student voice responses
- Difficulty-aware questions
- Multiple question types
- Adaptive follow-up
- Question replay

## 📄 PDF-Grounded Learning

- Upload syllabus or study PDF
- Extract document text
- Clean document noise
- Chunk source content
- Retrieve relevant context
- Generate grounded questions and learning material

## 🧠 AI Answer Evaluation

Answers are evaluated against the generated question and relevant source context.

The system provides:

```text
Score
Classification
Feedback
Topic information
```

Classifications include:

```text
STRONG
AVERAGE
WEAK
```

## 💡 Live Interruption & Hints

Students can interrupt the examiner to request help.

Examples:

```text
"Give me a clue."
"Repeat."
"Simplify."
"Explain with an example."
```

## 🎯 Weak Topic Coach

The system identifies weak topics and provides targeted practice.

```text
Weak Topic
    ↓
Easy
    ↓
Medium
    ↓
Hard
```

## 📚 AI Summary

Generates structured revision material from the uploaded document.

## 🧠 AI Flashcards

Creates topic-based flashcards for active revision.

## 📅 Personalized Study Plan

Creates a structured study plan based on the student's learning needs.

## 📊 Performance Tracking

Tracks topic progress, attempts, scores, classifications, and mistakes.

---

# 6. How Rime Is Used

Rime is integrated into the **main viva interaction**, not merely a welcome message or an optional audio button.

### Rime flow

```text
Generated Examiner Question
            ↓
     Text Preprocessing
            ↓
       /api/tts/rime
            ↓
        Rime TTS API
            ↓
        audio/mp3
            ↓
       Browser Playback
            ↓
      Student Hears Question
```

The application uses a server-side Rime API route so that the Rime API key remains protected.

### Rime responsibilities

- Text-to-speech
- Spoken examiner questions
- Spoken hints
- Spoken feedback
- Spoken continuation of the viva

### Sahayak AI responsibilities

- Document grounding
- Question generation
- Speech recognition
- Answer evaluation
- Conversation state
- Interruption handling
- Audio lifecycle
- UI orchestration
- Topic analytics
- Weak-topic coaching

---

# 7. Rime Configuration

The project supports configuration through environment variables:

```env
RIME_API_KEY=
RIME_MODEL=
RIME_SPEAKER=
```

The current project configuration is designed around:

```text
Model: arcana
Speaker: astra
```

A compatible fallback configuration is also supported:

```text
mist : marsh
```

> The exact model, speaker, language, endpoint, and audio format should be revalidated against the current Rime catalog before the final hackathon submission. Final evidence must use the actual shipped configuration.

---

# 8. Rime API Security

The browser does not receive the Rime API secret.

The application uses:

```text
Browser
   ↓
/api/tts/rime
   ↓
Server
   ↓
RIME_API_KEY
   ↓
Rime API
```

The repository must never contain:

- Real Rime API keys
- Database passwords
- JWT secrets
- Supabase service-role keys
- Other private credentials

Only environment-variable placeholders should be committed.

---

# 9. Voice-Specific Engineering Challenge

## The problem: interruption

A naive voice application may behave like this:

```text
AI is speaking
      ↓
Student interrupts
      ↓
New request starts
      ↓
Old audio continues
      ↓
Two responses overlap
```

This creates a poor conversational experience.

### Sahayak AI solution

The application uses:

- `AbortController`
- Speech generation tokens
- Active audio cleanup
- State fencing

### Recovery sequence

```text
AI is speaking
      ↓
Student interrupts
      ↓
Abort current TTS request
      ↓
Invalidate previous speech token
      ↓
Stop active audio
      ↓
Discard stale result
      ↓
Process the new request
      ↓
Generate new response
      ↓
Rime speaks the new response
```

This ensures that an outdated response does not continue speaking after the student changes the interaction.

---

# 10. Technical Writing for the Ear

Technical study material contains symbols, Markdown, formulas, and code-like expressions that should not always be read literally.

Sahayak AI preprocesses generated text before sending it to Rime.

```text
AI Response
    ↓
Remove Markdown
    ↓
Remove Code Formatting
    ↓
Normalize Bullets
    ↓
Normalize Technical Symbols
    ↓
Improve Punctuation
    ↓
Rime TTS
```

Examples:

```text
O(N log N)
        ↓
Big O of N log N

π
        ↓
projection

σ
        ↓
selection

!=
        ↓
is not equal to

<=
        ↓
is less than or equal to

->
        ↓
implies
```

The objective is to make technical information more understandable when heard rather than merely read.

---

# 11. Voice Caching

The application maintains an in-memory cache for generated Rime audio.

The cache key is based on:

```text
Model + Speaker + Cleaned Text
```

For repeated content:

```text
First request
    ↓
Rime API
    ↓
Audio
    ↓
Cache

Same request
    ↓
Cache
    ↓
Audio
```

The application records cache-related telemetry where available.

This reduces unnecessary repeated TTS requests during a session.

---

# 12. Speech Recognition

The viva also includes browser-side speech recognition.

The intended interaction is:

```text
Rime speaks
     ↓
Student listens
     ↓
Student answers
     ↓
Speech Recognition
     ↓
Transcript
     ↓
Answer Evaluation
     ↓
Next Question
```

This completes the voice loop rather than limiting the product to text input with audio playback.

---

# 13. Main Demo Flow

For the hackathon demo:

### Step 1 — Upload

Upload a syllabus or technical study PDF.

### Step 2 — Start Viva

Select the technical interview/viva mode.

### Step 3 — Rime Examiner

Rime speaks a question grounded in the uploaded material.

### Step 4 — Student Answers

The student responds naturally using voice.

### Step 5 — AI Evaluation

Show:

```text
Score
Strong / Average / Weak
Feedback
Topic
```

### Step 6 — Interrupt

While the examiner is speaking:

> **"Wait, give me a hint."**

### Step 7 — Speech Recovery

The current audio stops.

The stale response is invalidated.

### Step 8 — Rime Hint

Rime speaks the requested hint.

### Step 9 — Weak Topic

Show the topic that requires improvement.

### Step 10 — Coaching

Generate targeted practice for that topic.

---

# 14. Strongest Demo Moment

The most important part of the demo should be the interruption flow:

```text
Rime is speaking
       ↓
Student: "Wait, give me a hint."
       ↓
Current speech stops
       ↓
Old response is fenced
       ↓
Hint is generated
       ↓
Rime speaks the hint
       ↓
Viva continues
```

This demonstrates that voice is central to the product and that the project solves a real voice-specific engineering problem.

---

# 15. Evidence & Testing

The project includes:

```text
scripts/test-voice-evidence.js
```

The evidence workflow covers:

### A. Writing for the Ear

Tests technical text preprocessing and conversion into speakable language.

### B. Cold vs Warm Rime Latency

Measures:

```text
Cold request
Warm/cached request
Audio generation
Observed latency
Cache behavior
```

### C. Interruption / State Fencing

Tests:

```text
Speech starts
      ↓
Interruption
      ↓
Audio cleanup
      ↓
Request cancellation
      ↓
State fencing
      ↓
Stale response rejection
```

Run the voice evidence test with:

```bash
npm run test:voice
```

---

# 16. Evidence Integrity

The final submission should use **actual measured results**.

Do not use invented benchmark numbers.

Recommended evidence:

```text
RIME_EVIDENCE.md
        +
Test output
        +
Screenshots
        +
Demo recording
        +
Actual Rime configuration
        +
Measured latency
        +
Interruption result
```

If a result is simulated or controller-level rather than measured end-to-end, it should be labeled clearly as such.

---

# 17. Evidence Artifact Structure

Recommended structure:

```text
docs/
└── rime/
    ├── RIME_EVIDENCE.md
    ├── voice-test-output.txt
    ├── cold-run.mp3
    ├── warm-run.mp3
    ├── normal-flow.mp4
    ├── interruption-flow.mp4
    └── screenshots/
```

Never place API credentials inside this directory.

---

# 18. Technology Stack

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Lucide React

## Backend

- Next.js API Routes
- Prisma ORM
- PostgreSQL
- Supabase
- JWT authentication

## AI

- Gemini
- OpenAI provider support
- Retrieval-Augmented Generation
- Semantic similarity
- Question generation
- Answer evaluation
- Topic extraction

## Voice

- Rime AI Text-to-Speech
- Browser Speech Recognition
- Audio playback and interruption control

## Document Processing

- PDF text extraction
- Chunking
- Topic analysis
- Context retrieval

## Storage & Export

- Supabase Storage
- jsPDF

---

# 19. System Architecture

```text
                    STUDENT
                       │
                       ▼
             ┌───────────────────┐
             │   Next.js / React  │
             │     Frontend       │
             └─────────┬─────────┘
                       │
                       ▼
             ┌───────────────────┐
             │    API Layer      │
             └─────────┬─────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
   PDF Processing     RAG          AI Services
        │              │              │
        └──────────────┼──────────────┘
                       ▼
                PostgreSQL
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
   Session Data   Topic Progress   Study Data
                       │
                       ▼
                 Voice Layer
                ┌─────────────┐
                │ Rime TTS    │
                │ Speech Input│
                │ Interruption│
                └─────────────┘
```

---

# 20. Database / Learning Model

The main learning entities are:

```text
User
 │
 ├── PdfDocument
 │      ├── Session
 │      ├── Flashcard
 │      └── StudyPlan
 │
 ├── Session
 │      ├── Question
 │      │      └── Answer
 │      └── ConversationMessage
 │
 ├── TopicProgress
 │
 ├── Flashcard
 │
 └── MistakeRecord
```

This allows Sahayak AI to maintain learning context rather than treating every question as an isolated interaction.

---

# 21. Why Sahayak AI Is Different

| Generic Study Tool | Sahayak AI |
|---|---|
| Static documents | Interactive document-grounded viva |
| Passive reading | Active speaking |
| Generic AI conversation | AI examiner |
| Text-only interaction | Voice-first interaction |
| No real interruption handling | Interrupt + recover |
| Generic revision | Document-grounded revision |
| Limited weakness tracking | Topic-level performance |
| No targeted coaching | Weak Topic Coach |

### The central idea

> **Don't just study the syllabus. Practice defending it.**

---

# 22. Submission Checklist

Before final submission:

- [ ] Deployed application works.
- [ ] Main viva flow works.
- [ ] Rime is used in the core interaction.
- [ ] Actual Rime model is verified.
- [ ] Actual Rime speaker/voice is verified.
- [ ] Language is recorded.
- [ ] Endpoint and audio format are recorded.
- [ ] Rime API key is server-side only.
- [ ] No secrets are committed.
- [ ] Voice interruption has been tested.
- [ ] Stale speech is prevented.
- [ ] Cold/warm latency is measured.
- [ ] Voice evidence test is executed.
- [ ] Actual test output is saved.
- [ ] Demo recording is captured.
- [ ] Rime evidence is included.
- [ ] Limitations are honestly disclosed.
- [ ] Final evidence matches the shipped deployment.

---

# 23. Final Message

## Sahayak AI

### **Your syllabus.**
### **Your voice.**
### **Your AI examiner.**

> **Don't just read the answer. Learn to explain it.**

---

# 24. Live Project

## 🚀 Sahayak AI

https://sahayak-ai-zenvibecoders.vercel.app/

