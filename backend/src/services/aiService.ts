import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/env';
import { IAssignment } from '../models/Assignment';

const genAI = config.geminiApiKey
  ? new GoogleGenerativeAI(config.geminiApiKey)
  : null;

export async function generateWithGemini(prompt: string): Promise<string> {
  if (!genAI) {
    throw new Error('MISSING_API_KEY');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  return text;
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

      if (qt.type.includes('Multiple Choice')) {
        text = `Which of the following best defines a key concept in ${assignment.subject}? A) Primary observation, B) Auxiliary parameter, C) Theoretical constant, D) Experimental variable.`;
        answer = 'Option A is correct because the primary observation forms the initial ground truth for academic formulation.';
      } else if (qt.type.includes('Short')) {
        text = `Explain the primary function and significance of a critical element in ${assignment.subject}. What are its real-world implications?`;
        answer = 'The critical element serves to regulate state transitions. Real-world implications include higher operational efficiency and predictable system parameters.';
      } else if (qt.type.includes('Numerical') || qt.type.includes('Diagram')) {
        text = `Solve the following equation or interpret the key layout: Given a system of parameters with input = 45 and efficiency = 80%, calculate the net output value in ${assignment.subject}.`;
        answer = 'Formula: Net Output = Input * Efficiency. Thus, Net Output = 45 * 0.8 = 36 units. Showing step-by-step resolution.';
      } else {
        text = `Provide a comprehensive critique or analysis regarding current research methodologies used in ${assignment.subject}.`;
        answer = 'Research methodologies are split into empirical validations and theoretical simulations. Balanced feedback requires both approaches.';
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
 * Handles cases where the model wraps JSON in markdown code blocks.
 */
export function parseGeneratedJSON(text: string): any {
  let cleaned = text.trim();

  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }

  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }

  cleaned = cleaned.trim();

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('Failed to parse LLM response as JSON:', error);
    console.error('Raw text:', text.substring(0, 500));
    throw new Error('AI response was not valid JSON. Please try again.');
  }
}
