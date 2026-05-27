import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestion {
  number: number;
  text: string;
  difficulty: 'Easy' | 'Moderate' | 'Challenging';
  marks: number;
  answer?: string;
}

export interface ISection {
  title: string;
  type: string;
  instruction: string;
  marksPerQuestion: number;
  questions: IQuestion[];
}

export interface IAnswerKey {
  questionNumber: number;
  answer: string;
}

export interface IQuestionPaper extends Document {
  assignmentId: mongoose.Types.ObjectId;
  school: string;
  subject: string;
  class: string;
  duration: string;
  maxMarks: number;
  sections: ISection[];
  answerKey: IAnswerKey[];
  createdAt: Date;
}

const QuestionSchema = new Schema<IQuestion>({
  number: { type: Number, required: true },
  text: { type: String, required: true },
  difficulty: {
    type: String,
    enum: ['Easy', 'Moderate', 'Challenging'],
    required: true,
  },
  marks: { type: Number, required: true },
  answer: { type: String },
});

const SectionSchema = new Schema<ISection>({
  title: { type: String, required: true },
  type: { type: String, required: true },
  instruction: { type: String, required: true },
  marksPerQuestion: { type: Number, required: true },
  questions: { type: [QuestionSchema], required: true },
});

const AnswerKeySchema = new Schema<IAnswerKey>({
  questionNumber: { type: Number, required: true },
  answer: { type: String, required: true },
});

const QuestionPaperSchema = new Schema<IQuestionPaper>(
  {
    assignmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true,
    },
    school: { type: String, required: true },
    subject: { type: String, required: true },
    class: { type: String, required: true },
    duration: { type: String, required: true },
    maxMarks: { type: Number, required: true },
    sections: { type: [SectionSchema], required: true },
    answerKey: { type: [AnswerKeySchema], default: [] },
  },
  { timestamps: true }
);

export const QuestionPaper = mongoose.model<IQuestionPaper>(
  'QuestionPaper',
  QuestionPaperSchema
);
