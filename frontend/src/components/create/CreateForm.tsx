'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAssignmentStore } from '@/store/useAssignmentStore';
import Header from '../layout/Header';

export default function CreateForm() {
  const router = useRouter();
  const {
    formData,
    setFormField,
    addQuestionType,
    removeQuestionType,
    updateQuestionType,
    createAssignment,
    resetForm
  } = useAssignmentStore();

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [classGrade, setClassGrade] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Dynamic calculations
  const totalQuestions = formData.questionTypes.reduce((acc, curr) => acc + curr.count, 0);
  const totalMarks = formData.questionTypes.reduce((acc, curr) => acc + (curr.count * curr.marks), 0);

  const questionTypeOptions = [
    'Multiple Choice Questions',
    'Short Questions',
    'Diagram/Graph-Based Questions',
    'Numerical Problems',
    'Fill in the Blanks',
    'True or False',
    'Long Essay Questions'
  ];

  const handleIncrement = (index: number, field: 'count' | 'marks') => {
    const currentVal = formData.questionTypes[index][field];
    updateQuestionType(index, field, currentVal + 1);
  };

  const handleDecrement = (index: number, field: 'count' | 'marks') => {
    const currentVal = formData.questionTypes[index][field];
    if (currentVal > 1) {
      updateQuestionType(index, field, currentVal - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Validations
    if (!title.trim()) return setErrorMsg('Assignment Title is required.');
    if (!subject.trim()) return setErrorMsg('Subject is required.');
    if (!classGrade.trim()) return setErrorMsg('Class/Grade is required.');
    if (!formData.dueDate) return setErrorMsg('Due Date is required.');
    if (formData.questionTypes.length === 0) return setErrorMsg('At least one Question Type must be configured.');

    // Validate that all question types have positive integers
    for (const qt of formData.questionTypes) {
      if (qt.count <= 0 || qt.marks <= 0) {
        return setErrorMsg('Question counts and marks must be greater than zero.');
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        title,
        subject,
        class: classGrade,
        school: formData.school || 'Delhi Public School, Sector-4, Bokaro',
        dueDate: formData.dueDate,
        questionTypes: formData.questionTypes,
        additionalInstructions: formData.additionalInstructions,
        totalQuestions,
        totalMarks
      };

      const result = await createAssignment(payload);
      // Clean form state
      resetForm();
      // Redirect back to dashboard to see generation progress!
      router.push('/');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create assignment. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
      <Header title="Create Assignment" showBack />

      {/* Top Creation indicator */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        padding: '32px',
        boxShadow: 'var(--shadow-premium)',
        marginBottom: '32px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600', marginBottom: '24px' }}>
          <span style={{ color: 'var(--primary)', backgroundColor: 'var(--primary-light)', padding: '4px 10px', borderRadius: 'var(--radius-full)' }}>Step 1 of 2</span>
          <span>•</span>
          <span>Generate Assignment Specs</span>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {errorMsg && (
            <div style={{
              backgroundColor: '#FCE8E6',
              border: '1px solid #C5221F',
              color: '#C5221F',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Core Basic Info */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px'
          }}>
            <div className="form-group">
              <label className="form-label">Assignment Title</label>
              <input
                type="text"
                placeholder="e.g. Quiz on Electricity, Final Exam"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Subject</label>
              <input
                type="text"
                placeholder="e.g. Science, Mathematics, English"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Class / Grade</label>
              <input
                type="text"
                placeholder="e.g. Grade 8, Class 5th"
                value={classGrade}
                onChange={(e) => setClassGrade(e.target.value)}
                className="form-input"
                required
              />
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', margin: '12px 0' }} />

          {/* Upload and Due Date */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px'
          }}>
            {/* Upload Area Visualizer */}
            <div className="form-group">
              <label className="form-label">Upload Reference Material (Optional)</label>
              <div style={{
                border: '2px dashed var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '30px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'var(--transition)',
                backgroundColor: 'var(--app-bg)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
              >
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>☁️</div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  Choose a file or drag & drop it here
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  JPEG, PNG, PDF upto 10MB
                </div>
                <button type="button" className="btn btn-secondary" style={{ marginTop: '16px', padding: '6px 14px', fontSize: '12px' }}>
                  Browse Files
                </button>
              </div>
            </div>

            {/* Due date picker */}
            <div className="form-group" style={{ justifyContent: 'start' }}>
              <label className="form-label">Due Date</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormField('dueDate', e.target.value)}
                className="form-input"
                required
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', margin: '12px 0' }} />

          {/* Question Types List */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Question Types Configuration</span>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Configure sections & scoring</span>
            </label>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {formData.questionTypes.map((qt, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  backgroundColor: 'var(--app-bg)',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)'
                }}>
                  {/* Select Dropdown */}
                  <select
                    value={qt.type}
                    onChange={(e) => updateQuestionType(idx, 'type', e.target.value)}
                    className="form-select"
                    style={{ flexGrow: 1, minWidth: '220px' }}
                  >
                    {questionTypeOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>

                  {/* Stepper Count */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', minWidth: '90px' }}>No. of Questions</span>
                    <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '2px' }}>
                      <button type="button" onClick={() => handleDecrement(idx, 'count')} style={{ border: 'none', background: 'none', width: '28px', height: '28px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
                      <span style={{ minWidth: '32px', textAlign: 'center', fontSize: '13px', fontWeight: '700' }}>{qt.count}</span>
                      <button type="button" onClick={() => handleIncrement(idx, 'count')} style={{ border: 'none', background: 'none', width: '28px', height: '28px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                    </div>
                  </div>

                  {/* Stepper Marks */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', minWidth: '40px' }}>Marks</span>
                    <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '2px' }}>
                      <button type="button" onClick={() => handleDecrement(idx, 'marks')} style={{ border: 'none', background: 'none', width: '28px', height: '28px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
                      <span style={{ minWidth: '32px', textAlign: 'center', fontSize: '13px', fontWeight: '700' }}>{qt.marks}</span>
                      <button type="button" onClick={() => handleIncrement(idx, 'marks')} style={{ border: 'none', background: 'none', width: '28px', height: '28px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                    </div>
                  </div>

                  {/* Delete row */}
                  {formData.questionTypes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestionType(idx)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '4px'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#C5221F'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={addQuestionType}
                style={{ fontSize: '13px', padding: '10px 18px' }}
              >
                + Add Question Type
              </button>

              <div style={{ textAlign: 'right', display: 'flex', gap: '20px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Total Questions: <strong style={{ color: 'var(--text-primary)', fontSize: '15px' }}>{totalQuestions}</strong>
                </span>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Total Marks: <strong style={{ color: 'var(--text-primary)', fontSize: '15px' }}>{totalMarks}</strong>
                </span>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', margin: '12px 0' }} />

          {/* Additional Information */}
          <div className="form-group" style={{ position: 'relative' }}>
            <label className="form-label">Additional Information (For better output)</label>
            <textarea
              rows={4}
              placeholder="e.g. Generate a question paper for a 3 hour exam duration. Focus on electrostatics and battery cell construction. Include balanced moderate and challenging questions..."
              value={formData.additionalInstructions}
              onChange={(e) => setFormField('additionalInstructions', e.target.value)}
              className="form-textarea"
              style={{ width: '100%', paddingRight: '48px', resize: 'vertical' }}
            />
            {/* Microphone visual indicator */}
            <span style={{
              position: 'absolute',
              right: '16px',
              bottom: '16px',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'var(--app-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              border: '1px solid var(--border-color)',
              transition: 'var(--transition)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
            title="Voice input (Visual placeholder)"
            >
              🎤
            </span>
          </div>

          {/* Action Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '20px',
            borderTop: '1px solid var(--border-color)',
            paddingTop: '24px'
          }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                resetForm();
                router.push('/');
              }}
              style={{ height: '48px', padding: '0 24px' }}
            >
              ← Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{ height: '48px', padding: '0 32px' }}
            >
              {submitting ? 'Creating Assignment...' : 'Generate & Next →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
