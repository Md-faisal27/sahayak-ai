import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { callLLM } from '@/lib/ai';
import { generateSingleInterviewQuestion } from '@/lib/question-generator';
import { parseInterruptionIntent } from '@/lib/state-machine';
import { parseLanguageAndIntent } from '@/lib/language';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { studentInput, questionIndex = 0, directIntent } = body;

    const session = await db.session.findFirst({
      where: { id: params.id, userId: user.id },
      include: {
        document: true,
        questions: { orderBy: { orderIndex: 'asc' } },
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const currentQuestion = session.questions[questionIndex] || session.questions[0];
    if (!currentQuestion) {
      return NextResponse.json({ error: 'No question available for this index' }, { status: 400 });
    }

    const textInput = (studentInput || '').trim();

    // Check language switch intent from spoken input
    const langIntent = parseLanguageAndIntent(textInput);
    if (langIntent.detectedLanguage) {
      await db.session.update({
        where: { id: session.id },
        data: { language: langIntent.detectedLanguage },
      });

      const langConfirmText =
        langIntent.detectedLanguage === 'HINDI'
          ? 'भाषा हिंदी में बदल दी गई है। प्रश्न पुनः प्रस्तुत है:'
          : langIntent.detectedLanguage === 'HINGLISH'
          ? 'Language Hinglish mein switch ho gayi hai. Next question:'
          : 'Switched language to English. Next question:';

      const fullAiText = `${langConfirmText} ${currentQuestion.questionText}`;

      await db.conversationMessage.create({
        data: {
          sessionId: session.id,
          speaker: 'AI',
          textContent: fullAiText,
          intent: `SWITCH_${langIntent.detectedLanguage}`,
        },
      });

      return NextResponse.json({
        isInterruption: true,
        intent: `SWITCH_${langIntent.detectedLanguage}`,
        aiResponseText: fullAiText,
        nextState: 'ASKING',
        language: langIntent.detectedLanguage,
        currentQuestionIndex: session.currentQuestionIndex,
      });
    }

    // Determine intent from direct payload or text parsing
    const intent = directIntent || parseInterruptionIntent(textInput);

    // Save student message in conversation log
    if (textInput) {
      await db.conversationMessage.create({
        data: {
          sessionId: session.id,
          speaker: 'STUDENT',
          textContent: textInput,
          intent: intent || 'ANSWER',
        },
      });
    }

    if (intent) {
      // 1. SKIP Question
      if (intent === 'SKIP') {
        const nextIndex = (typeof questionIndex === 'number' ? questionIndex : session.currentQuestionIndex) + 1;
        const totalCount = session.questionCount || session.questions.length;
        const isCompleted = nextIndex >= totalCount;

        if (isCompleted) {
          await db.session.update({
            where: { id: session.id },
            data: { status: 'COMPLETED' },
          });

          const completeMsg = 'Skipping question. That concludes all questions for this session. Generating your final report now.';
          await db.conversationMessage.create({
            data: {
              sessionId: session.id,
              speaker: 'AI',
              textContent: completeMsg,
              intent: 'COMPLETED',
            },
          });

          return NextResponse.json({
            isInterruption: true,
            isSkip: true,
            isCompleted: true,
            nextQuestionIndex: nextIndex,
            aiResponseText: completeMsg,
          });
        }

        // Advance to next question
        let nextQuestion = session.questions[nextIndex];

        // In INTERVIEW mode, if next question not yet created, generate it adaptively
        if (!nextQuestion && session.mode === 'INTERVIEW') {
          const chunks = JSON.parse(session.document.extractedChunks || '[]');
          const topics = JSON.parse(session.document.extractedTopics || '[]');
          const allPrevious = session.questions.map((q) => ({
            questionText: q.questionText,
            topic: q.topic,
          }));
          const targetTopic = topics[nextIndex % topics.length] || session.document.detectedSubject;

          const nq = await generateSingleInterviewQuestion(
            chunks,
            session.document.detectedSubject,
            targetTopic,
            (session.difficulty as any) || 'Medium',
            allPrevious,
            (session.language as any) || 'ENGLISH'
          );

          nextQuestion = await db.question.create({
            data: {
              sessionId: session.id,
              orderIndex: nextIndex,
              questionText: nq.question,
              topic: nq.topic,
              difficulty: nq.difficulty,
              questionType: nq.questionType,
              correctAnswer: JSON.stringify(nq.expectedKeyPoints),
              explanation: nq.conceptBeingTested,
              hint5Words: nq.hint5Words,
              fullHint: nq.fullHint,
              contextReference: nq.sourceContext,
            },
          });
        }

        await db.session.update({
          where: { id: session.id },
          data: { currentQuestionIndex: nextIndex },
        });

        const skipMsg = nextQuestion
          ? `Skipping to the next question. Question ${nextIndex + 1}: ${nextQuestion.questionText}`
          : 'Skipping to the next question.';

        await db.conversationMessage.create({
          data: {
            sessionId: session.id,
            speaker: 'AI',
            textContent: skipMsg,
            intent: 'SKIP',
          },
        });

        return NextResponse.json({
          isInterruption: true,
          isSkip: true,
          isCompleted: false,
          nextQuestionIndex: nextIndex,
          nextQuestion,
          aiResponseText: skipMsg,
        });
      }

      // 2. 5-Word Hint
      if (intent === 'HINT_5_WORD') {
        let clue = currentQuestion.hint5Words?.trim();
        if (!clue || clue.length < 3 || clue.toLowerCase().includes('null') || clue.split(/\s+/).length > 8) {
          try {
            const cluePrompt = `Provide a concise 5-word clue for this technical question without giving the answer away:\nQuestion: "${currentQuestion.questionText}"\nTopic: "${currentQuestion.topic}"\nReturn EXACTLY 5 words. No punctuation, no quotes.`;
            const gen = await callLLM(cluePrompt, 'You are an expert exam coach.');
            if (gen && gen.trim()) {
              clue = gen.trim().replace(/^["']|["']$/g, '').split(/\s+/).slice(0, 5).join(' ');
              await db.question.update({
                where: { id: currentQuestion.id },
                data: { hint5Words: clue },
              });
            }
          } catch (e) {
            clue = `Recall key mechanism of ${currentQuestion.topic}`;
          }
        }
        if (!clue) clue = `Recall principles of ${currentQuestion.topic}`;

        const aiText = `Here is your 5-word hint: "${clue}".`;
        await db.conversationMessage.create({
          data: {
            sessionId: session.id,
            speaker: 'AI',
            textContent: aiText,
            intent: 'HINT_5_WORD',
          },
        });

        return NextResponse.json({
          isInterruption: true,
          intent: 'HINT_5_WORD',
          hint5Words: clue,
          aiResponseText: aiText,
          incrementHintCount: true,
          currentQuestionIndex: session.currentQuestionIndex,
        });
      }

      // 3. Detailed Hint
      if (intent === 'HINT_FULL') {
        let fullHint = currentQuestion.fullHint?.trim();
        if (!fullHint || fullHint.length < 10) {
          try {
            const hintPrompt = `Provide a clear, 1-2 sentence conceptual hint to guide a student answering this question without giving away the direct answer:\nQuestion: "${currentQuestion.questionText}"\nTopic: "${currentQuestion.topic}"\nReturn ONLY the hint sentence.`;
            const gen = await callLLM(hintPrompt, 'You are a university computer science professor.');
            if (gen && gen.trim()) {
              fullHint = gen.trim().replace(/^["']|["']$/g, '');
              await db.question.update({
                where: { id: currentQuestion.id },
                data: { fullHint },
              });
            }
          } catch (e) {
            fullHint = `Focus on the primary definition and standard operational rules of ${currentQuestion.topic}.`;
          }
        }
        if (!fullHint) fullHint = `Consider the foundational principles of ${currentQuestion.topic}.`;

        const aiText = `Detailed hint: ${fullHint}`;
        await db.conversationMessage.create({
          data: {
            sessionId: session.id,
            speaker: 'AI',
            textContent: aiText,
            intent: 'HINT_FULL',
          },
        });

        return NextResponse.json({
          isInterruption: true,
          intent: 'HINT_FULL',
          fullHint,
          aiResponseText: aiText,
          incrementHintCount: true,
          currentQuestionIndex: session.currentQuestionIndex,
        });
      }

      // 4. Explain Simply
      if (intent === 'SIMPLIFY') {
        let simpleExplanation = '';
        try {
          const simPrompt = `Rephrase and explain this technical question in very simple, conversational terms with an intuitive analogy in 1-2 sentences:\nQuestion: "${currentQuestion.questionText}"\nTopic: "${currentQuestion.topic}"\nReturn ONLY the conversational explanation.`;
          const gen = await callLLM(simPrompt, 'You are a master educator who explains complex computer science topics to beginners.');
          if (gen && gen.trim()) {
            simpleExplanation = gen.trim().replace(/^["']|["']$/g, '');
          }
        } catch (e) {
          simpleExplanation = `In simple terms, think about how ${currentQuestion.topic} works in a basic everyday system. What is its main role?`;
        }
        if (!simpleExplanation) {
          simpleExplanation = `In simple terms, how does ${currentQuestion.topic} fulfill its purpose in the system?`;
        }

        const aiText = `In simple terms: ${simpleExplanation}`;
        await db.conversationMessage.create({
          data: {
            sessionId: session.id,
            speaker: 'AI',
            textContent: aiText,
            intent: 'SIMPLIFY',
          },
        });

        return NextResponse.json({
          isInterruption: true,
          intent: 'SIMPLIFY',
          simplifiedText: simpleExplanation,
          aiResponseText: aiText,
          currentQuestionIndex: session.currentQuestionIndex,
        });
      }

      // 5. Give Example
      if (intent === 'EXAMPLE') {
        let exampleScenario = '';
        try {
          const exPrompt = `Give a concise 1-2 sentence real-world practical scenario or example illustrating the context of this question:\nQuestion: "${currentQuestion.questionText}"\nTopic: "${currentQuestion.topic}"\nReturn ONLY the practical scenario.`;
          const gen = await callLLM(exPrompt, 'You are a practical engineering lead who illustrates theory with concrete industry examples.');
          if (gen && gen.trim()) {
            exampleScenario = gen.trim().replace(/^["']|["']$/g, '');
          }
        } catch (e) {
          exampleScenario = `For example, in high-throughput applications, ${currentQuestion.topic} dictates how resources are allocated and protected.`;
        }
        if (!exampleScenario) {
          exampleScenario = `For example, imagine a system running multiple tasks simultaneously under ${currentQuestion.topic}.`;
        }

        const aiText = `For example: ${exampleScenario}. Now, how would you address the question?`;
        await db.conversationMessage.create({
          data: {
            sessionId: session.id,
            speaker: 'AI',
            textContent: aiText,
            intent: 'EXAMPLE',
          },
        });

        return NextResponse.json({
          isInterruption: true,
          intent: 'EXAMPLE',
          exampleText: exampleScenario,
          aiResponseText: aiText,
          currentQuestionIndex: session.currentQuestionIndex,
        });
      }

      // 6. Repeat Question
      if (intent === 'REPEAT') {
        const qNum = (typeof questionIndex === 'number' ? questionIndex : session.currentQuestionIndex) + 1;
        const aiText = `Let me repeat the question. Question ${qNum}: ${currentQuestion.questionText}`;
        await db.conversationMessage.create({
          data: {
            sessionId: session.id,
            speaker: 'AI',
            textContent: aiText,
            intent: 'REPEAT',
          },
        });

        return NextResponse.json({
          isInterruption: true,
          intent: 'REPEAT',
          aiResponseText: aiText,
          currentQuestionIndex: session.currentQuestionIndex,
        });
      }
    }

    return NextResponse.json({
      isInterruption: false,
      textInput,
      questionId: currentQuestion.id,
      currentQuestionIndex: session.currentQuestionIndex,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to process interaction' }, { status: 500 });
  }
}
