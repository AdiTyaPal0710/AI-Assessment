import { IAssignment } from '../models/Assignment';

/**
 * Build a structured prompt for the LLM to generate a question paper.
 * The prompt asks for JSON output so we can parse it reliably.
 */
export function buildQuestionPaperPrompt(assignment: IAssignment): string {
  const sectionDescriptions = assignment.questionTypes
    .map(
      (qt, idx) =>
        `Section ${String.fromCharCode(65 + idx)}: "${qt.type}" — ${qt.count} questions, each worth ${qt.marks} marks`
    )
    .join('\n');

  return `You are an expert academic question paper generator. Generate a structured question paper based on the following specifications.

**Subject:** ${assignment.subject}
**Class:** ${assignment.class}
**School:** ${assignment.school}
**Total Questions:** ${assignment.totalQuestions}
**Total Marks:** ${assignment.totalMarks}

**Sections:**
${sectionDescriptions}

${assignment.additionalInstructions ? `**Additional Instructions:** ${assignment.additionalInstructions}` : ''}

**IMPORTANT RULES:**
1. Each question MUST have a difficulty level: "Easy", "Moderate", or "Challenging"
2. Distribute difficulty roughly: 40% Easy, 35% Moderate, 25% Challenging
3. Questions should be academically rigorous and grade-appropriate
4. Each section should have a clear instruction (e.g., "Attempt all questions")
5. Generate an answer key for every question
6. Number questions sequentially across all sections

**RESPOND WITH ONLY valid JSON in this exact format:**
{
  "duration": "45 minutes",
  "sections": [
    {
      "title": "Section A",
      "type": "Short Answer Questions",
      "instruction": "Attempt all questions. Each question carries 2 marks",
      "marksPerQuestion": 2,
      "questions": [
        {
          "number": 1,
          "text": "Question text here",
          "difficulty": "Easy",
          "marks": 2
        }
      ]
    }
  ],
  "answerKey": [
    {
      "questionNumber": 1,
      "answer": "Detailed answer here"
    }
  ]
}

Generate the complete question paper now. Return ONLY the JSON, no markdown formatting, no code blocks, no extra text.`;
}
