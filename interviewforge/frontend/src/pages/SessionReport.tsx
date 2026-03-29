import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSession } from '../utils/api'; // ✅ removed completeSession import
import { Session, Question, SessionReport as SessionReportType } from '../utils/types';

const HIRE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  strong_yes: { label: '⭐ Strong Hire', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  yes:        { label: '✅ Hire',        color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
  maybe:      { label: '🤔 Maybe',       color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  no:         { label: '❌ No Hire',     color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
};

export default function SessionReport() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<Session | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [report, setReport] = useState<SessionReportType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      // ✅ Only fetch the session — completeSession already called in InterviewRoom
      const res = await getSession(Number(id));
      const data = (res as any).data;

      setSession(data.session);
      setQuestions(data.questions);

      // ✅ Report comes from session data directly — no second API call needed
      if (data.report) {
        setReport(data.report);
      }

    } catch {
      setError('Failed to load report.');
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = (score: number | null) => {
    if (score === null) return 'var(--text-muted)';
    if (score >= 7) return 'var(--success)';
    if (score >= 5) return 'var(--warning)';
    return 'var(--danger)';
  };

  if (loading) return (
    <div className="loading" style={{ minHeight: '60vh', flexDirection: 'column', gap: 16 }}>
      <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
      <span>Loading your report...</span>
    </div>
  );

  if (error) return <div className="page"><div className="error-msg">{error}</div></div>;

  const hire = report ? HIRE_LABELS[report.hire_recommendation] || HIRE_LABELS['maybe'] : null;

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h1 className="page-title">Interview Report</h1>
          <p className="page-subtitle">{session?.candidate_name} — {session?.role} ({session?.experience_level})</p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/')}>← Dashboard</button>
      </div>

      {/* Score + Hire Banner */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Overall Score</div>
          <div style={{
            fontSize: '3rem', fontFamily: 'Syne', fontWeight: 800,
            color: scoreColor(session?.overall_score ?? null)
          }}>
            {session?.overall_score?.toFixed(1) ?? '—'}
            <span style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>/10</span>
          </div>
        </div>

        {hire && (
          <div className="card" style={{ textAlign: 'center', background: hire.bg, borderColor: `${hire.color}40` }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Recommendation</div>
            <div style={{ fontSize: '1.8rem', fontFamily: 'Syne', fontWeight: 800, color: hire.color }}>
              {hire.label}
            </div>
          </div>
        )}
      </div>

      {/* AI Report */}
      {report && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
          <div className="card">
            <h3 style={{ marginBottom: 12, fontSize: '1rem', color: 'var(--accent2)' }}>📋 Overall Assessment</h3>
            <p style={{ lineHeight: 1.7, color: 'var(--text)' }}>{report.overall_assessment}</p>
          </div>

          <div className="grid-2">
            <div className="card">
              <h3 style={{ marginBottom: 12, fontSize: '1rem', color: 'var(--success)' }}>✅ Key Strengths</h3>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {report.key_strengths.map((s, i) => (
                  <li key={i} style={{ fontSize: '0.85rem', paddingLeft: 16, borderLeft: '2px solid var(--success)', color: 'var(--text)' }}>
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            <div className="card">
              <h3 style={{ marginBottom: 12, fontSize: '1rem', color: 'var(--warning)' }}>⚠️ Areas for Growth</h3>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {report.areas_for_growth.map((a, i) => (
                  <li key={i} style={{ fontSize: '0.85rem', paddingLeft: 16, borderLeft: '2px solid var(--warning)', color: 'var(--text)' }}>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 12, fontSize: '1rem', color: 'var(--accent)' }}>📚 Suggested Resources</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {report.suggested_resources.map((r, i) => (
                <span key={i} className="badge badge-technical" style={{ fontSize: '0.8rem', padding: '5px 12px' }}>{r}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Question-by-question breakdown */}
      <h2 style={{ fontSize: '1.1rem', marginBottom: 16, color: 'var(--text-muted)' }}>QUESTION BREAKDOWN</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {questions.map((q, i) => (
          <div key={q.id} className="card" style={{ borderLeft: `3px solid ${q.score !== null ? scoreColor(q.score) : 'var(--border)'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'Syne', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Q{i + 1}</span>
                <span className={`badge badge-${q.category}`}>{q.category}</span>
                <span className={`badge badge-${q.difficulty}`}>{q.difficulty}</span>
              </div>
              {q.score !== null && (
                <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1.1rem', color: scoreColor(q.score) }}>
                  {q.score}/10
                </span>
              )}
            </div>

            <p style={{ fontWeight: 500, marginBottom: 10, lineHeight: 1.5 }}>{q.question_text}</p>

            {q.candidate_answer && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Answer</div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{q.candidate_answer}</p>
              </div>
            )}

            {q.ai_feedback && (
              <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 4 }}>AI Feedback</div>
                <p style={{ fontSize: '0.85rem', lineHeight: 1.6 }}>{q.ai_feedback}</p>
              </div>
            )}

            {!q.candidate_answer && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Not answered</p>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 32, display: 'flex', gap: 12, justifyContent: 'center' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/')}>← Back to Dashboard</button>
        <button className="btn btn-primary" onClick={() => navigate('/new')}>⚡ New Interview</button>
      </div>
    </div>
  );
}