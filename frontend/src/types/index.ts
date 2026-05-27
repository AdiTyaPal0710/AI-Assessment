export interface QuestionType {
  type: string;
  count: number;
  marks: number;
}

export interface Assignment {
  _id: string;
  title: string;
  subject: string;
  class: string;
  school: string;
  dueDate: string;
  questionTypes: QuestionType[];
  additionalInstructions: string;
  uploadedFile?: string;
  totalQuestions: number;
  totalMarks: number;
  status: 'draft' | 'generating' | 'completed' | 'failed';
  generatedPaper?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  number: number;
  text: string;
  difficulty: 'Easy' | 'Moderate' | 'Challenging';
  marks: number;
  answer?: string;
}

export interface Section {
  title: string;
  type: string;
  instruction: string;
  marksPerQuestion: number;
  questions: Question[];
}

export interface AnswerKeyItem {
  questionNumber: number;
  answer: string;
}

export interface QuestionPaper {
  _id: string;
  assignmentId: string;
  school: string;
  subject: string;
  class: string;
  duration: string;
  maxMarks: number;
  sections: Section[];
  answerKey: AnswerKeyItem[];
  createdAt: string;
}

export interface CreateAssignmentPayload {
  title: string;
  subject: string;
  class: string;
  school: string;
  dueDate: string;
  questionTypes: QuestionType[];
  additionalInstructions: string;
  totalQuestions: number;
  totalMarks: number;
}

export type WSMessage = {
  type: 'connected';
  clientId: string;
} | {
  type: 'assignment_update';
  assignmentId: string;
  status: 'generating' | 'completed' | 'failed';
  message: string;
  paperId?: string;
};
