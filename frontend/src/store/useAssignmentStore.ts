import { create } from 'zustand';
import { Assignment, QuestionPaper, CreateAssignmentPayload, QuestionType } from '@/types';
import { api } from '@/lib/api';

interface AssignmentStore {
  // Assignments list
  assignments: Assignment[];
  loading: boolean;
  error: string | null;

  // Current assignment creation form state
  formData: {
    title: string;
    subject: string;
    class: string;
    school: string;
    dueDate: string;
    questionTypes: QuestionType[];
    additionalInstructions: string;
  };

  // Current question paper
  currentPaper: QuestionPaper | null;
  paperLoading: boolean;

  // Actions
  fetchAssignments: () => Promise<void>;
  createAssignment: (data: CreateAssignmentPayload) => Promise<Assignment>;
  deleteAssignment: (id: string) => Promise<void>;
  fetchQuestionPaper: (assignmentId: string) => Promise<void>;
  regeneratePaper: (assignmentId: string) => Promise<void>;
  updateAssignmentStatus: (id: string, status: Assignment['status']) => void;

  // Form actions
  setFormField: (field: string, value: any) => void;
  addQuestionType: () => void;
  removeQuestionType: (index: number) => void;
  updateQuestionType: (index: number, field: keyof QuestionType, value: any) => void;
  resetForm: () => void;
}

const defaultFormData = {
  title: '',
  subject: '',
  class: '',
  school: 'Delhi Public School, Sector-4, Bokaro',
  dueDate: '',
  questionTypes: [
    { type: 'Multiple Choice Questions', count: 4, marks: 1 },
  ],
  additionalInstructions: '',
};

export const useAssignmentStore = create<AssignmentStore>((set, get) => ({
  assignments: [],
  loading: false,
  error: null,
  formData: { ...defaultFormData },
  currentPaper: null,
  paperLoading: false,

  fetchAssignments: async () => {
    set({ loading: true, error: null });
    try {
      const { assignments } = await api.getAssignments();
      set({ assignments, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  createAssignment: async (data) => {
    set({ loading: true, error: null });
    try {
      const { assignment } = await api.createAssignment(data);
      set((state) => ({
        assignments: [assignment, ...state.assignments],
        loading: false,
      }));
      return assignment;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  deleteAssignment: async (id) => {
    try {
      await api.deleteAssignment(id);
      set((state) => ({
        assignments: state.assignments.filter((a) => a._id !== id),
      }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  fetchQuestionPaper: async (assignmentId) => {
    set({ paperLoading: true });
    try {
      const { paper } = await api.getQuestionPaper(assignmentId);
      set({ currentPaper: paper, paperLoading: false });
    } catch (err: any) {
      set({ paperLoading: false });
      throw err;
    }
  },

  regeneratePaper: async (assignmentId) => {
    set({ paperLoading: true, currentPaper: null });
    try {
      await api.regeneratePaper(assignmentId);
      // Status update will come via WebSocket
    } catch (err: any) {
      set({ paperLoading: false });
      throw err;
    }
  },

  updateAssignmentStatus: (id, status) => {
    set((state) => ({
      assignments: state.assignments.map((a) =>
        a._id === id ? { ...a, status } : a
      ),
    }));
  },

  setFormField: (field, value) => {
    set((state) => ({
      formData: { ...state.formData, [field]: value },
    }));
  },

  addQuestionType: () => {
    set((state) => ({
      formData: {
        ...state.formData,
        questionTypes: [
          ...state.formData.questionTypes,
          { type: 'Short Questions', count: 3, marks: 2 },
        ],
      },
    }));
  },

  removeQuestionType: (index) => {
    set((state) => ({
      formData: {
        ...state.formData,
        questionTypes: state.formData.questionTypes.filter((_, i) => i !== index),
      },
    }));
  },

  updateQuestionType: (index, field, value) => {
    set((state) => ({
      formData: {
        ...state.formData,
        questionTypes: state.formData.questionTypes.map((qt, i) =>
          i === index ? { ...qt, [field]: value } : qt
        ),
      },
    }));
  },

  resetForm: () => {
    set({ formData: { ...defaultFormData } });
  },
}));
