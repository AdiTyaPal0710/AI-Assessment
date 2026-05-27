'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAssignmentStore } from '@/store/useAssignmentStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import Header from '../layout/Header';

export default function Dashboard() {
  const router = useRouter();
  const {
    assignments,
    loading,
    fetchAssignments,
    deleteAssignment,
    updateAssignmentStatus
  } = useAssignmentStore();

  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState('All');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Connect WebSocket and listen for job completion/updates
  useWebSocket((msg) => {
    if (msg.type === 'assignment_update') {
      console.log('Received real-time update:', msg);
      updateAssignmentStatus(msg.assignmentId, msg.status);
      // Re-fetch assignments from backend to sync details
      fetchAssignments();
    }
  });

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this assignment?')) {
      await deleteAssignment(id);
      setActiveMenuId(null);
    }
  };

  const handleCardClick = (id: string, status: string) => {
    if (status === 'completed') {
      router.push(`/output/${id}`);
    } else if (status === 'generating') {
      alert('AI is still generating the question paper. Please wait.');
    } else if (status === 'failed') {
      alert('AI generation failed. You can delete or try recreating.');
    }
  };

  // Get unique subjects for dropdown filter
  const subjects = ['All', ...Array.from(new Set(assignments.map((a) => a.subject)))];

  const filteredAssignments = assignments.filter((a) => {
    const matchesSearch = a.title.toLowerCase().includes(search.toLowerCase()) ||
                          a.subject.toLowerCase().includes(search.toLowerCase());
    const matchesSubject = filterSubject === 'All' || a.subject === filterSubject;
    return matchesSearch && matchesSubject;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      <Header title="Assignment" />

      {/* Top Banner / Breadcrumb block from Figma screenshot */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '28px',
        backgroundColor: '#FFFFFF',
        padding: '20px 24px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)' }}>Assignments</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Manage and create assignments for your classes.
          </p>
        </div>
        {assignments.length > 0 && (
          <button
            className="btn btn-primary"
            onClick={() => router.push('/create')}
            style={{ padding: '10px 20px', fontSize: '13px' }}
          >
            + Create Assignment
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1, padding: '40px' }}>
          <div className="spinner" />
          <span style={{ marginLeft: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>Loading assignments...</span>
        </div>
      ) : assignments.length === 0 ? (
        /* Empty State */
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 40px',
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          textAlign: 'center',
          flexGrow: 1,
          boxShadow: 'var(--shadow-premium)',
          maxWidth: '800px',
          margin: '0 auto',
          width: '100%'
        }}>
          {/* Custom empty state graphic exactly like Figma */}
          <div style={{ position: 'relative', width: '220px', height: '220px', marginBottom: '24px' }}>
            <div style={{
              width: '180px',
              height: '180px',
              borderRadius: '50%',
              backgroundColor: '#F8F9FA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto'
            }}>
              {/* Paper graphic */}
              <div style={{
                width: '90px',
                height: '120px',
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                boxShadow: '0 8px 24px rgba(148, 163, 184, 0.15)',
                border: '2px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                padding: '16px 12px',
                gap: '8px'
              }}>
                <div style={{ height: '8px', width: '40px', backgroundColor: '#E2E8F0', borderRadius: '4px' }} />
                <div style={{ height: '8px', width: '60px', backgroundColor: '#E2E8F0', borderRadius: '4px' }} />
                <div style={{ height: '8px', width: '50px', backgroundColor: '#E2E8F0', borderRadius: '4px' }} />
              </div>
            </div>
            {/* Red Circle "X" indicator */}
            <div style={{
              position: 'absolute',
              bottom: '30px',
              right: '30px',
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              backgroundColor: '#FCE8E6',
              border: '4px solid #FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 16px rgba(197, 34, 31, 0.15)'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C5221F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '12px' }}>
            No assignments yet
          </h2>
          <p style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            maxWidth: '480px',
            lineHeight: '1.6',
            marginBottom: '32px'
          }}>
            Create your first assignment to start collecting and grading student submissions. You can set up rubrics, define marking criteria, and let AI assist with grading.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => router.push('/create')}
            style={{ gap: '10px', height: '48px', padding: '0 28px' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Create Your First Assignment
          </button>
        </div>
      ) : (
        /* Filled State */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Filters Bar */}
          <div style={{
            display: 'flex',
            gap: '16px',
            alignItems: 'center',
            backgroundColor: '#FFFFFF',
            padding: '16px 20px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ position: 'relative', flexGrow: 1 }}>
              <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search Assignment..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input"
                style={{ width: '100%', paddingLeft: '40px', height: '44px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-full)' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Filter By:</span>
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="form-select"
                style={{ height: '44px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-color)' }}
              >
                {subjects.map((subj) => (
                  <option key={subj} value={subj}>{subj}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid-container">
            {filteredAssignments.map((a) => {
              const formattedDate = new Date(a.dueDate).toLocaleDateString('en-GB');
              const assignedDate = new Date(a.createdAt).toLocaleDateString('en-GB');

              return (
                <div
                  key={a._id}
                  className="assignment-card"
                  onClick={() => handleCardClick(a._id, a.status)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                    <div>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '700',
                        color: 'var(--primary)',
                        backgroundColor: 'var(--primary-light)',
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-full)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        {a.subject}
                      </span>
                      <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '8px' }}>
                        {a.title}
                      </h3>
                    </div>

                    {/* Menu Button */}
                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === a._id ? null : a._id);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--text-secondary)',
                          padding: '4px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F1F5F9'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="1" />
                          <circle cx="12" cy="5" r="1" />
                          <circle cx="12" cy="19" r="1" />
                        </svg>
                      </button>

                      {/* Dropdown Menu */}
                      {activeMenuId === a._id && (
                        <div style={{
                          position: 'absolute',
                          right: '0',
                          top: '28px',
                          backgroundColor: '#FFFFFF',
                          border: '1px solid var(--border-color)',
                          borderRadius: '12px',
                          boxShadow: 'var(--shadow-lg)',
                          zIndex: '50',
                          minWidth: '150px',
                          overflow: 'hidden'
                        }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/output/${a._id}`);
                            }}
                            disabled={a.status !== 'completed'}
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              textAlign: 'left',
                              border: 'none',
                              background: 'none',
                              fontSize: '13px',
                              fontWeight: '600',
                              color: a.status === 'completed' ? 'var(--text-primary)' : 'var(--text-muted)',
                              cursor: a.status === 'completed' ? 'pointer' : 'not-allowed',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}
                          >
                            View Assignment
                          </button>
                          <button
                            onClick={(e) => handleDelete(a._id, e)}
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              textAlign: 'left',
                              border: 'none',
                              background: 'none',
                              fontSize: '13px',
                              fontWeight: '600',
                              color: '#C5221F',
                              cursor: 'pointer',
                              borderTop: '1px solid var(--border-color)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stats details (Questions, Marks, Class) */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    marginBottom: '16px',
                    borderBottom: '1px solid var(--border-color)',
                    paddingBottom: '16px'
                  }}>
                    <span>Class: <strong style={{ color: 'var(--text-primary)' }}>{a.class}</strong></span>
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--text-muted)' }} />
                    <span>Questions: <strong style={{ color: 'var(--text-primary)' }}>{a.totalQuestions}</strong></span>
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--text-muted)' }} />
                    <span>Marks: <strong style={{ color: 'var(--text-primary)' }}>{a.totalMarks}</strong></span>
                  </div>

                  {/* Bottom section with dates and real-time status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500' }}>Assigned on: {assignedDate}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>Due: {formattedDate}</span>
                    </div>

                    {/* Status Badge */}
                    {a.status === 'completed' && (
                      <span className="badge badge-easy" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--easy-text)' }} />
                        Completed
                      </span>
                    )}
                    {a.status === 'generating' && (
                      <span className="badge" style={{ backgroundColor: 'rgba(255, 90, 54, 0.1)', color: '#FF5A36', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="pulsing-dot" />
                        Generating
                      </span>
                    )}
                    {a.status === 'failed' && (
                      <span className="badge badge-challenging" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--challenging-text)' }} />
                        Failed
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style jsx global>{`
        .grid-container {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
          gap: 24px;
        }
        
        .assignment-card {
          background-color: #FFFFFF;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-color);
          padding: 24px;
          cursor: pointer;
          transition: var(--transition);
          box-shadow: var(--shadow-sm);
          position: relative;
        }
        
        .assignment-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
          border-color: #CBD5E1;
        }

        .spinner {
          width: 24px;
          height: 24px;
          border: 3px solid var(--border-color);
          border-top: 3px solid var(--primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .pulsing-dot {
          width: 8px;
          height: 8px;
          background-color: #FF5A36;
          border-radius: 50%;
          animation: pulse 1.5s infinite ease-in-out;
        }

        @keyframes pulse {
          0% { transform: scale(0.8); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(0.8); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
