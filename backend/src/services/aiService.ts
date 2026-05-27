// src/services/aiService.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/env';
import { IAssignment } from '../models/Assignment';

// Initialize the Google Generative AI SDK
const genAI = config.geminiApiKey
  ? new GoogleGenerativeAI(config.geminiApiKey)
  : null;

/**
 * Calls the Gemini API to generate the assignment structure.
 * Configured specifically to enforce unique questions and return strict JSON.
 */
export async function generateWithGemini(prompt: string): Promise<string> {
  if (!genAI) {
    throw new Error('MISSING_API_KEY');
  }

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: "You are an expert academic examiner. You must generate a highly structured exam paper based on the provided parameters. CRITICAL: Every single question must be 100% unique. Do not repeat scenarios, numerical values, or wording across questions. Return the response ONLY as a valid JSON object.",
    generationConfig: {
      temperature: 0.8, // High temperature to encourage variety and prevent looping/repetition bias
      responseMimeType: "application/json", // Forces Gemini to return pure JSON without markdown code blocks
    }
  });

  const result = await model.generateContent(prompt);
  const response = result.response;
  return response.text();
}

/**
 * Generate highly detailed, academic-grade mock questions based on the assignment specs.
 * Used as a fallback when no valid Gemini API Key is configured.
 */
export function generateMockQuestionPaper(assignment: IAssignment): any {
  console.log('🤖 System: Generating realistic fallback academic question paper');

  const subject = assignment.subject.toLowerCase();
  const sections = assignment.questionTypes.map((qt, idx) => {
    const sectionLetter = String.fromCharCode(65 + idx);
    const questionsList: any[] = [];

    for (let i = 1; i <= qt.count; i++) {
      const qNum = questionsList.length + 1; // Temporary section index, will correct layout below
      let difficulty: 'Easy' | 'Moderate' | 'Challenging' = 'Easy';
      if (i % 3 === 1) difficulty = 'Easy';
      else if (i % 3 === 2) difficulty = 'Moderate';
      else difficulty = 'Challenging';

      let text = '';
      let answer = '';

      const randomId = Math.random().toString(36).substring(2, 6).toUpperCase();
      const topic = assignment.title ? assignment.title : 'the core syllabus';

      if (qt.type.includes('Multiple Choice')) {
        text = `[ID: ${randomId}] Regarding ${topic} in ${assignment.subject}, which of the following is most accurate? A) Primary parameter, B) Secondary node, C) Constant variable, D) None of the above.`;
        answer = `Option A is correct based on the fundamental rules of ${topic}.`;
      } else if (qt.type.includes('Short')) {
        text = `[ID: ${randomId}] Briefly explain the primary function of ${topic} within the context of ${assignment.subject}.`;
        answer = `It serves to regulate state transitions for ${topic}, ensuring operational efficiency.`;
      } else if (qt.type.includes('Numerical') || qt.type.includes('Diagram')) {
        text = `[ID: ${randomId}] Given a system based on ${topic} with input = ${Math.floor(Math.random() * 100)} and efficiency = ${Math.floor(Math.random() * 50) + 50}%, calculate the net output value.`;
        answer = `Formula: Net Output = Input * Efficiency. Step-by-step resolution provided based on ${topic} principles.`;
      } else {
        text = `[ID: ${randomId}] Provide a comprehensive analysis of how ${topic} affects modern applications of ${assignment.subject}.`;
        answer = `Balanced feedback requires analyzing both theoretical impacts and practical limitations of ${topic}.`;
      }

      questionsList.push({
        number: qNum,
        text,
        difficulty,
        marks: qt.marks,
        answer
      });
    }

    return {
      title: `Section ${sectionLetter}`,
      type: qt.type,
      instruction: `Attempt all questions from this section. Each question carries ${qt.marks} mark(s).`,
      marksPerQuestion: qt.marks,
      questions: questionsList
    };
  });

  // Re-number questions sequentially across all sections
  let currentNum = 1;
  const answerKey: any[] = [];
  sections.forEach((sec) => {
    sec.questions.forEach((q) => {
      q.number = currentNum;
      answerKey.push({
        questionNumber: currentNum,
        answer: q.answer
      });
      currentNum++;
    });
  });

  return {
    duration: '45 minutes',
    sections,
    answerKey
  };
}

/**
 * Parse the LLM response to extract clean JSON.
 * Simplified because generationConfig.responseMimeType handles the markdown stripping naturally.
 */
export function parseGeneratedJSON(text: string): any {
  try {
    return JSON.parse(text);
  } catch (error) {
    console.error('Failed to parse LLM response as JSON:', error);
    console.error('Raw text:', text.substring(0, 500));
    throw new Error('AI response was not valid JSON. Please try again.');
  }
}