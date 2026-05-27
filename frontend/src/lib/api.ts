const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `Request failed: ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Assignments
  getAssignments: () =>
    request<{ assignments: import('@/types').Assignment[] }>('/assignments'),

  getAssignment: (id: string) =>
    request<{ assignment: import('@/types').Assignment }>(`/assignments/${id}`),

  createAssignment: (data: import('@/types').CreateAssignmentPayload) =>
    request<{ message: string; assignment: import('@/types').Assignment }>('/assignments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteAssignment: (id: string) =>
    request<{ message: string }>(`/assignments/${id}`, { method: 'DELETE' }),

  // Question Papers
  getQuestionPaper: (assignmentId: string) =>
    request<{ paper: import('@/types').QuestionPaper; source: string }>(
      `/assignments/${assignmentId}/paper`
    ),

  regeneratePaper: (assignmentId: string) =>
    request<{ message: string; assignment: import('@/types').Assignment }>(
      `/assignments/${assignmentId}/regenerate`,
      { method: 'POST' }
    ),
};
