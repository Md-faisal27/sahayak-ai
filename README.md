# Sahayak AI
Demo link - (https://sahayak-ai-zenvibecoders.vercel.app/)
Github Repo- (https://github.com/Md-faisal27/sahayak-ai.git)

> **Syllabus-Grounded Assessment Intelligence**  
> A document-grounded spoken viva and oral-exam preparation platform that turns syllabus PDFs into interactive, adaptive, citation-backed learning experiences.

## 🚀 Overview

**Sahayak AI** is an AI-powered learning and assessment platform designed for students preparing for technical viva voce, oral examinations, and syllabus-based assessments.

Instead of acting like a general-purpose chatbot with an unrestricted knowledge base, Sahayak AI works from the learner's **uploaded study material/PDF**. The document is parsed, divided into meaningful chunks, analyzed for topics, and used as the grounding source for questions, evaluation, summaries, flashcards, weak-topic coaching, and study planning.

The platform combines:

- 📄 **PDF-grounded learning**
- 🎙️ **Spoken AI viva / technical interview**
- 🧠 **Adaptive answer evaluation**
- 🔎 **Retrieval-Augmented Generation (RAG)**
- 🗣️ **English, Hindi & technical Hinglish support**
- 💡 **Live interruption and hint controls**
- 📚 **AI-generated summaries and flashcards**
- 📊 **Topic progress and performance tracking**
- 🎯 **Weak-topic coaching**
- 📅 **Personalized study plans**
- 📑 **Downloadable reports and learning material**

---

## 🎯 Problem Statement

Traditional exam preparation tools have several limitations:

- Generic AI chatbots may answer from knowledge outside the student's prescribed syllabus.
- Students often practice only through passive text-based interaction.
- Existing study tools rarely simulate the pressure and flow of a real viva.
- Students may not know which topics are weak after completing a study session.
- Revision material is often scattered across PDFs, notes, flashcards, and separate planning tools.
- Technical students need terminology and explanations to remain faithful to their actual course material.

### Our Solution

Sahayak AI creates a **document-grounded AI examiner and study assistant** that:

1. Accepts the student's syllabus, textbook chapter, lecture notes, or study PDF.
2. Extracts and structures the document into usable knowledge chunks.
3. Retrieves relevant source content for each AI interaction.
4. Generates questions anchored to the uploaded material.
5. Conducts a spoken, one-question-at-a-time viva experience.
6. Evaluates the student's response against the grounded context.
7. Identifies weak topics and recommends targeted practice.
8. Generates revision resources and a structured study plan.

---

## ✨ Key Features

### 1. 📄 PDF Upload & Document Grounding

Students can upload a PDF containing:

- Syllabus
- Textbook chapters
- Lecture notes
- Course material
- Technical study material

The application extracts the document text and stores structured chunks and topic information for downstream AI processing.

The current upload flow validates PDF input and enforces a **30 MB maximum upload size**.

---

### 2. 🎙️ AI Technical Interview / Spoken Viva

Sahayak AI acts as a proactive examiner rather than a passive chatbot.

The interview experience includes:

- One grounded question at a time
- Easy / Medium / Hard difficulty
- Multiple question types
- Topic-aware questioning
- Adaptive follow-up behavior
- Spoken AI responses
- Student voice interaction
- Question replay
- Hints and interruptions
- Duplicate-question prevention

Supported question types include:

- MCQ
- Short Answer
- Long Answer
- Conceptual
- Application
- Scenario

---

### 3. 🗣️ Multilingual Voice Learning

The platform supports:

- **English**
- **Hindi**
- **Technical Hinglish**

The voice layer uses **Rime AI Text-to-Speech**, allowing generated examiner responses to be played as natural spoken audio.

Students can interact with the examiner through voice while retaining a text-based experience when voice services are unavailable.

---

### 4. 💡 Live Interruption & Hint System

During a viva, students can interrupt the examiner to request assistance.

Available interaction concepts include:

- **5-word clue**
- **Repeat audio**
- **Simplify**
- Hint
- Detailed hint
- Example
- Skip

This is designed to make the experience closer to a real guided oral-learning session instead of a conventional chatbot conversation.

---

### 5. 🔎 RAG-Based Grounding

Sahayak AI uses a retrieval-based grounding pipeline.

```text
Uploaded PDF
     ↓
PDF Text Extraction
     ↓
Document Chunking
     ↓
Topic Extraction / Cleaning
     ↓
Relevant Chunk Retrieval
     ↓
Grounded AI Prompt
     ↓
Question / Summary / Evaluation
```

The RAG layer retrieves relevant document chunks before generating learning content.

The project also contains topic cleaning and normalization logic to reduce document noise such as:

- Page metadata
- Institution information
- Contents/index text
- Course-code artifacts
- Formatting noise

---

### 6. 🛡️ Grounded Answer Evaluation

Student responses are evaluated against the generated question and its source context.

The evaluator produces:

- Score
- Classification
- Feedback
- Adaptive follow-up information

The primary classifications are:

```text
STRONG
AVERAGE
WEAK
```

This allows the system to move beyond simply saying whether an answer is right or wrong.

---

### 7. 🚫 Duplicate Question Prevention

The project includes question similarity and duplicate-checking logic to reduce repetitive questions during practice.

The AI generation pipeline combines:

- Similarity checking
- Existing-question awareness
- Topic targeting
- Difficulty control
- Question-type selection

This helps keep each viva session varied.

---

### 8. 📚 AI Summary Generator

Students can generate a comprehensive summary from their uploaded PDF.

The summary experience is designed to produce structured revision material including:

- Concepts
- Definitions
- Important points
- Comparisons
- Mathematical/formula-oriented information where available
- Exam-focused takeaways

The summary remains grounded in the uploaded document rather than functioning as unrestricted web-based content generation.

---

### 9. 🧠 AI Flashcards

Sahayak AI can generate topic-based flashcards from the uploaded material.

Each flashcard contains:

```text
Topic
   ↓
Front → Question / Concept
Back  → Explanation / Definition
```

Students can use the generated cards for quick revision and mark concepts as known.

---

### 10. 🎯 Weak Topic Coach

The platform tracks topic performance and can target weak areas directly.

The coaching flow generates questions at multiple difficulty levels:

```text
Easy
  ↓
Medium
  ↓
Hard
```

This creates a focused practice path for topics where the learner needs improvement.

---

### 11. 📊 Topic Progress & Performance Tracking

The database maintains topic-level learning information such as:

- Score history
- Attempt count
- Latest score
- Classification
- Mistake history

This allows the application to build a learner performance profile instead of treating every session independently.

---

### 12. 📅 Personalized Study Plan

Sahayak AI can generate a structured study plan based on the uploaded document and learning needs.

The study plan contains daily tasks and priorities and can be used to organize revision over multiple days.

---

### 13. 📑 Reports & Export

The project includes PDF generation/export capabilities for learning and assessment material.

Students can access generated assessment/report content and downloadable question/learning resources.

---

## 🧩 Assessment Modes

Sahayak AI supports multiple learning/assessment workflows:

| Mode | Purpose |
|---|---|
| **EXAM** | Structured syllabus-based assessment |
| **INTERVIEW** | Spoken technical viva / AI interview |
| **SUMMARIZE** | Generate grounded study summary |
| **WEAK_COACH** | Target and improve weak topics |

---

## 🏗️ System Architecture

```text
                    ┌─────────────────────┐
                    │      Student        │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Next.js Frontend  │
                    │ React + TypeScript  │
                    │ Tailwind CSS        │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │    API Layer        │
                    │   Next.js Routes     │
                    └──────────┬──────────┘
                               │
             ┌─────────────────┼──────────────────┐
             │                 │                  │
             ▼                 ▼                  ▼
      ┌─────────────┐  ┌──────────────┐  ┌──────────────┐
      │ PDF Parser  │  │ RAG / Topics  │  │ AI Services  │
      └──────┬──────┘  └──────┬───────┘  └──────┬───────┘
             │                 │                  │
             └─────────────────┼──────────────────┘
                               ▼
                    ┌─────────────────────┐
                    │ PostgreSQL / Prisma │
                    │       Database      │
                    └──────────┬──────────┘
                               │
             ┌─────────────────┼──────────────────┐
             │                 │                  │
             ▼                 ▼                  ▼
       Supabase Storage   Rime AI TTS       LLM Providers
                                             Gemini / OpenAI
```

---

## 🔄 Core AI Learning Pipeline

```text
1. Student uploads PDF
              ↓
2. PDF text is extracted
              ↓
3. Text is cleaned and chunked
              ↓
4. Topics are identified and normalized
              ↓
5. Relevant chunks are retrieved for a task
              ↓
6. AI generates grounded content
              ↓
7. Student answers / interacts
              ↓
8. Answer is evaluated against source context
              ↓
9. Score + feedback are stored
              ↓
10. Topic performance is updated
              ↓
11. Weak topics are identified
              ↓
12. Flashcards / Summary / Study Plan / Coaching
```

---

## 🛠️ Technology Stack

### Frontend

- **Next.js 14.2.7**
- **React 18**
- **TypeScript**
- **Tailwind CSS**
- **Lucide React**

### Backend

- **Next.js Route Handlers**
- **Prisma ORM**
- **PostgreSQL**
- **Supabase**
- **JWT-based authentication**

### AI / Intelligent Processing

- **Gemini**
- **OpenAI (optional provider)**
- **RAG retrieval**
- **Semantic similarity / duplicate detection**
- **AI answer evaluation**
- **Topic extraction**
- **Adaptive question generation**

### Voice

- **Rime AI**
- Text-to-Speech
- Spoken examiner responses
- Voice interaction workflow

### Document Processing

- **pdf-parse**
- PDF text extraction
- Chunking
- Topic analysis
- Grounded context retrieval

### Storage

- **Supabase Storage**
- Uploaded PDF document storage

### Export

- **jsPDF**
- PDF report / learning-resource generation

---

## 📁 Project Structure

```text
sahayak-ai/
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── public/
│   ├── logo.png
│   └── logo-icon.png
│
├── scripts/
│   ├── preflight.js
│   ├── apply-rls.js
│   ├── generate_sample_pdf.js
│   └── test-voice-evidence.js
│
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── ai/
│   │   │   ├── analytics/
│   │   │   ├── auth/
│   │   │   ├── export/
│   │   │   ├── flashcards/
│   │   │   ├── pdf/
│   │   │   ├── sessions/
│   │   │   ├── study-plan/
│   │   │   ├── summary/
│   │   │   ├── tts/
│   │   │   └── weak-coach/
│   │   │
│   │   ├── dashboard/
│   │   ├── flashcards/
│   │   ├── history/
│   │   ├── login/
│   │   ├── mode-selection/
│   │   ├── signup/
│   │   ├── study-plan/
│   │   ├── summary/
│   │   ├── upload/
│   │   ├── weak-coach/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── components/
│   │   ├── landing/
│   │   ├── AiConfigModal.tsx
│   │   ├── ConversationTranscript.tsx
│   │   ├── InterruptionPanel.tsx
│   │   ├── Navbar.tsx
│   │   ├── PdfUploader.tsx
│   │   ├── TopicBadge.tsx
│   │   └── VoiceVisualizer.tsx
│   │
│   └── lib/
│       ├── ai.ts
│       ├── answer-evaluator.ts
│       ├── auth.ts
│       ├── db.ts
│       ├── deduplication-service.ts
│       ├── duplicate-checker.ts
│       ├── interview-manager.ts
│       ├── language.ts
│       ├── pdf-analyzer.ts
│       ├── pdf-generator.ts
│       ├── pdf-parser.ts
│       ├── question-generator.ts
│       ├── rag.ts
│       ├── rime-tts.ts
│       ├── state-machine.ts
│       ├── storage.ts
│       ├── summary-generator.ts
│       └── topic-extractor.ts
│
├── supabase/
│   └── rls.sql
│
├── .env.example
├── package.json
├── package-lock.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.mjs
```

---

## 🗄️ Database Design

The Prisma schema contains the core learning and assessment entities:

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

### Important entities

| Model | Purpose |
|---|---|
| `User` | User account and ownership |
| `PdfDocument` | Uploaded PDF and extracted content |
| `Session` | Assessment/interview session |
| `Question` | Generated grounded questions |
| `Answer` | Student responses and evaluation |
| `ConversationMessage` | AI/student conversation history |
| `TopicProgress` | Topic-level performance |
| `Flashcard` | Generated revision cards |
| `MistakeRecord` | Weak concepts and repeated mistakes |
| `StudyPlan` | Personalized study schedule |

---

## 🔐 Authentication & Data Protection

The application includes authentication endpoints for:

- Signup
- Login
- Logout
- Current-user lookup
- Authentication configuration

The project also contains Supabase Row Level Security configuration and user-scoped database queries so that uploaded documents and learning data are associated with the authenticated user.

### Environment Variables

Create a `.env` file from `.env.example`.

Required configuration includes:

```env
DATABASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=
JWT_SECRET=
RIME_API_KEY=
RIME_MODEL=
RIME_SPEAKER=
GEMINI_API_KEY=
OPENAI_API_KEY=
```

> **Never commit real API keys, database passwords, JWT secrets, or service-role keys to GitHub.**

---

## 💻 Local Development

### Prerequisites

Make sure you have:

- Node.js
- npm
- PostgreSQL/Supabase
- Required AI API credentials
- Rime API credentials

### Installation

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd sahayak-ai
npm install
```

### Prisma

Generate Prisma Client:

```bash
npx prisma generate
```

Push the schema to the configured database:

```bash
npm run db:push
```

Or deploy existing migrations:

```bash
npm run db:migrate
```

### Run Development Server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Next.js development server |
| `npm run build` | Build the production application |
| `npm start` | Start production server |
| `npm run lint` | Run linting |
| `npm run preflight` | Run project preflight checks |
| `npm run test:voice` | Test voice/evidence functionality |
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:push` | Push Prisma schema to database |
| `npm run db:migrate` | Deploy Prisma migrations |
| `npm run db:studio` | Open Prisma Studio |
| `npm run supabase:rls` | Apply Supabase RLS configuration |

---

## 🌐 Deployment

The application is deployed using **Vercel**.

### Production Application

**Sahayak AI — Live Demo**

https://sahayak-ai-zenvibecoders.vercel.app/

---

## 🏆 Why Sahayak AI Is Different

| Capability | Generic AI Chatbot | Sahayak AI |
|---|---|---|
| Knowledge source | Broad/unrestricted | Uploaded syllabus/document |
| Viva simulation | Usually passive | Proactive AI examiner |
| Spoken interaction | Limited | Voice-first viva workflow |
| Interruption | Limited | Live hint/interruption controls |
| Technical grounding | Not guaranteed | Document-grounded retrieval |
| Question adaptation | Generic | Topic + difficulty aware |
| Duplicate prevention | Not guaranteed | Similarity-based checking |
| Weak-topic coaching | Usually absent | Dedicated coaching mode |
| Revision resources | General | PDF-grounded summary + flashcards |
| Study planning | Limited | Personalized study plan |
| Performance tracking | Basic/absent | Topic progress + mistakes |

---

## 🔮 Future Scope

Sahayak AI can be extended with:

- Real-time speech-to-text improvements
- More advanced pronunciation analysis
- Personalized difficulty modeling
- Teacher/instructor dashboards
- Course-wise analytics
- LMS integration
- More regional languages
- Offline/low-bandwidth study mode
- Advanced semantic citation verification
- Team/classroom viva competitions
- Institution-level assessment management
- More detailed learning analytics

---

## 🎥 Hackathon Demo Flow

For a quick demonstration:

```text
1. Create / Sign in
        ↓
2. Upload a syllabus or textbook PDF
        ↓
3. Select assessment mode
        ↓
4. Start AI Technical Interview
        ↓
5. Listen to the AI examiner
        ↓
6. Answer verbally
        ↓
7. Interrupt for a hint if needed
        ↓
8. Receive grounded evaluation
        ↓
9. Review weak topics
        ↓
10. Generate flashcards / summary
        ↓
11. Generate personalized study plan
        ↓
12. Review performance and reports
```

---

## 👥 Project Vision

**Sahayak AI** aims to make technical exam preparation more interactive, measurable, and syllabus-focused.

The core idea is simple:

> **Don't just study the syllabus. Practice defending it.**

By combining document grounding, conversational AI, voice interaction, adaptive assessment, and personalized revision, Sahayak AI transforms static study material into an interactive AI-powered oral examination environment.

---

## 📌 Project Status

**Status:** Hackathon-ready deployed prototype

**Platform:** Web application

**Deployment:** Vercel

**Live Demo:**  
https://sahayak-ai-zenvibecoders.vercel.app/

---

## 🔗 Live Demo

### [🚀 Try Sahayak AI](https://sahayak-ai-zenvibecoders.vercel.app/)