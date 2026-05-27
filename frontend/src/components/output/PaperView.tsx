'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAssignmentStore } from '@/store/useAssignmentStore';
import Header from '../layout/Header';

export default function PaperView() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params?.id as string;

  const {
    currentPaper,
    paperLoading,
    fetchQuestionPaper,
    regeneratePaper
  } = useAssignmentStore();

  const [activeTab, setActiveTab] = useState<'paper' | 'answers'>('paper');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (assignmentId) {
      fetchQuestionPaper(assignmentId).catch((err) => {
        console.error('Error fetching paper:', err);
      });
    }
  }, [assignmentId, fetchQuestionPaper]);

  const handleRegenerate = async () => {
    if (confirm('Are you sure you want to regenerate this question paper? This will delete the current paper.')) {
      try {
        await regeneratePaper(assignmentId);
        alert('Regeneration started! Redirecting to dashboard to track progress.');
        router.push('/');
      } catch (err: any) {
        alert(err.message || 'Failed to start regeneration.');
      }
    }
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      // Dynamically import html2pdf.js only on the client side
      const html2pdf = (await import('html2pdf.js')).default;
      
      const element = document.getElementById('printable-question-paper');
      if (!element) {
        alert('Could not find paper element to print');
        setDownloading(false);
        return;
      }

      // Add a printable-specific class
      element.classList.add('pdf-mode');

      const opt = {
        margin: 10,
        filename: `${currentPaper?.subject.replace(/\s+/g, '_')}_Question_Paper.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
      };

      await html2pdf().set(opt).from(element).save();
      element.classList.remove('pdf-mode');
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Error generating PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  if (paperLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
        <Header title="Assignment Output" showBack />
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', flexGrow: 1, padding: '60px' }}>
          <div className="spinner" />
          <span style={{ marginTop: '16px', color: 'var(--text-secondary)', fontWeight: '600' }}>
            Fetching generated assessment...
          </span>
        </div>
        <style jsx global>{`
          .spinner {
            width: 32px;
            height: 32px;
            border: 4px solid var(--border-color);
            border-top: 4px solid var(--primary);
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!currentPaper) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
        <Header title="Assignment Output" showBack />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, padding: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>Question Paper Not Found</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '8px' }}>
            The assessment either hasn't completed generating or failed.
          </p>
          <button className="btn btn-primary" onClick={() => router.push('/')} style={{ marginTop: '20px' }}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '960px', margin: '0 auto' }}>
      <Header title="Assignment Output" showBack />

      {/* Action Bar (Download & Regenerate) */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        backgroundColor: '#FFFFFF',
        padding: '16px 24px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {/* Toggle between Question Paper and Answer Key */}
        <div style={{
          display: 'flex',
          backgroundColor: 'var(--app-bg)',
          padding: '4px',
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--border-color)'
        }}>
          <button
            onClick={() => setActiveTab('paper')}
            style={{
              padding: '8px 18px',
              border: 'none',
              borderRadius: 'var(--radius-full)',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              backgroundColor: activeTab === 'paper' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'paper' ? 'var(--primary)' : 'var(--text-secondary)',
              boxShadow: activeTab === 'paper' ? 'var(--shadow-sm)' : 'none',
              transition: 'var(--transition)'
            }}
          >
            Question Paper
          </button>
          <button
            onClick={() => setActiveTab('answers')}
            style={{
              padding: '8px 18px',
              border: 'none',
              borderRadius: 'var(--radius-full)',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              backgroundColor: activeTab === 'answers' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'answers' ? 'var(--primary)' : 'var(--text-secondary)',
              boxShadow: activeTab === 'answers' ? 'var(--shadow-sm)' : 'none',
              transition: 'var(--transition)'
            }}
          >
            Answer Key
          </button>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            className="btn btn-secondary"
            onClick={handleRegenerate}
            style={{ padding: '8px 18px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            🔄 Regenerate
          </button>

          <button
            className="btn btn-primary"
            onClick={handleDownloadPDF}
            disabled={downloading}
            style={{ padding: '8px 20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {downloading ? 'Downloading...' : '📥 Download as PDF'}
          </button>
        </div>
      </div>

      {/* Main assessment sheet */}
      <div
        id="printable-question-paper"
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          padding: '48px 40px',
          boxShadow: 'var(--shadow-premium)',
          display: 'flex',
          flexDirection: 'column',
          gap: '28px',
          position: 'relative'
        }}
      >
        {/* Header Block (School, Class, Exam Specs) */}
        <div style={{ textAlign: 'center', borderBottom: '2px solid #1E293B', paddingBottom: '20px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B', fontFamily: 'var(--font-title)' }}>
            {currentPaper.school}
          </h1>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Subject: {currentPaper.subject}
          </h3>
          <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Class: {currentPaper.class}
          </h3>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '20px',
            fontSize: '13px',
            fontWeight: '700',
            color: 'var(--text-primary)'
          }}>
            <span>Time Allowed: {currentPaper.duration || '45 minutes'}</span>
            <span>Maximum Marks: {currentPaper.maxMarks}</span>
          </div>
        </div>

        {/* Instructions Block */}
        <div style={{
          backgroundColor: 'var(--app-bg)',
          borderRadius: 'var(--radius-md)',
          padding: '16px 20px',
          borderLeft: '4px solid #1E293B',
          fontSize: '13px',
          lineHeight: '1.6',
          color: 'var(--text-primary)'
        }}>
          <strong>General Instructions:</strong>
          <ul style={{ paddingLeft: '20px', marginTop: '6px' }}>
            <li>All questions are compulsory unless stated otherwise.</li>
            <li>Write your Name, Roll Number, and Section clearly at the top.</li>
            <li>Maintain proper presentation and structural neatness in your answers.</li>
          </ul>
        </div>

        {/* Student details fill slots */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr',
          gap: '24px',
          padding: '8px 0',
          borderBottom: '1px dashed var(--border-color)',
          paddingBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'end', gap: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
            <span>Name:</span>
            <div style={{ flexGrow: 1, borderBottom: '1px solid var(--text-muted)', height: '20px' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'end', gap: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
            <span>Roll Number:</span>
            <div style={{ flexGrow: 1, borderBottom: '1px solid var(--text-muted)', height: '20px' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'end', gap: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
            <span>Section:</span>
            <div style={{ flexGrow: 1, borderBottom: '1px solid var(--text-muted)', height: '20px' }} />
          </div>
        </div>

        {/* Mode switcher contents */}
        {activeTab === 'paper' ? (
          /* Question Sections list */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {currentPaper.sections.map((section, sIdx) => (
              <div key={sIdx} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Section Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: '#F8F9FA',
                  padding: '10px 16px',
                  borderRadius: 'var(--radius-sm)',
                  borderLeft: '3px solid var(--primary)'
                }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>
                    {section.title}: {section.type}
                  </h3>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                    ({section.questions.length} questions • {section.marksPerQuestion} Marks each)
                  </span>
                </div>

                {section.instruction && (
                  <p style={{ fontSize: '12px', fontStyle: 'italic', color: 'var(--text-secondary)', paddingLeft: '4px' }}>
                    {section.instruction}
                  </p>
                )}

                {/* Questions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {section.questions.map((q, qIdx) => (
                    <div
                      key={qIdx}
                      style={{
                        padding: '16px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                        backgroundColor: '#FFFFFF',
                        transition: 'var(--transition)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}
                      className="question-block-hover"
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '20px' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)', minWidth: '20px' }}>
                            Q{q.number}.
                          </span>
                          <p style={{ fontSize: '14px', lineHeight: '1.6', fontWeight: '500', color: 'var(--text-primary)' }}>
                            {q.text}
                          </p>
                        </div>

                        {/* Marks Badge */}
                        <span style={{
                          fontSize: '12px',
                          fontWeight: '700',
                          color: 'var(--text-secondary)',
                          backgroundColor: 'var(--app-bg)',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-color)',
                          whiteSpace: 'nowrap'
                        }}>
                          [{q.marks} Mark{q.marks > 1 ? 's' : ''}]
                        </span>
                      </div>

                      {/* Difficulty Indicator tag */}
                      <div style={{ display: 'flex', paddingLeft: '32px' }}>
                        <span className={`badge badge-${q.difficulty.toLowerCase()}`}>
                          {q.difficulty}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Answer Key list */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{
              backgroundColor: '#F8F9FA',
              padding: '12px 18px',
              borderRadius: 'var(--radius-md)',
              borderLeft: '4px solid var(--primary)',
              marginBottom: '10px'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>
                Comprehensive Answer Key & Solution Guide
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {currentPaper.answerKey && currentPaper.answerKey.length > 0 ? (
                currentPaper.answerKey.map((item, idx) => (
                  <div key={idx} style={{
                    padding: '16px 20px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: '#FFFFFF'
                  }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--primary)', marginBottom: '8px' }}>
                      Question {item.questionNumber} Answer Guide:
                    </div>
                    <p style={{ fontSize: '13.5px', lineHeight: '1.6', color: 'var(--text-primary)', whiteSpace: 'pre-line' }}>
                      {item.answer}
                    </p>
                  </div>
                ))
              ) : (
                /* Fallback extraction from sections */
                currentPaper.sections.flatMap((s) => s.questions).map((q, idx) => (
                  <div key={idx} style={{
                    padding: '16px 20px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: '#FFFFFF'
                  }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--primary)', marginBottom: '8px' }}>
                      Question {q.number} Answer Guide:
                    </div>
                    <p style={{ fontSize: '13.5px', lineHeight: '1.6', color: 'var(--text-primary)', whiteSpace: 'pre-line' }}>
                      {q.answer || 'Refer to reference text guides for complete evaluation schema.'}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        .question-block-hover:hover {
          border-color: #CBD5E1 !important;
          background-color: #FAFBFB !important;
        }

        /* Printable custom classes */
        .pdf-mode {
          box-shadow: none !important;
          border: none !important;
          padding: 0 !important;
        }
      `}</style>
    </div>
  );
}
