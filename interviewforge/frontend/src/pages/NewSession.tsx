import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSession } from '../utils/api';

const ROLES = ['Frontend Engineer', 'Backend Engineer', 'Full Stack Engineer', 'DevOps Engineer', 'Data Engineer', 'ML Engineer', 'Mobile Engineer', 'QA Engineer'];
const LEVELS = ['junior', 'mid', 'senior', 'lead'];
const COUNTS = [3, 5, 7, 10];

export default function NewSession() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    candidate_name: '',
    role: '',
    experience_level: 'mid',
    tech_stack: '',
    question_count: 5,
  });

  const set = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

 const handleSubmit = async () => {
  if (!form.candidate_name || !form.role || !form.tech_stack) {
    setError('Please fill in all fields.');
    return;
  }

  setLoading(true);
  setError('');

  try {
    const res = await createSession(form);
    const data = (res as any).data;

    navigate(`/interview/${data.session.id}`);
  } catch (err: any) {
    setError(err.response?.data?.error || 'Failed to create session. Check your Groq API key.');
    setLoading(false);
  }
};
  return (
    <div className="page" style={{ maxWidth: 700 }}>
      <div className="page-header">
        <h1 className="page-title">New Interview</h1>
        <p className="page-subtitle">Set up an AI-powered interview session</p>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        <div className="form-group">
          <label className="form-label">Candidate Name</label>
          <input
            className="form-input"
            placeholder="e.g. John Doe"
            value={form.candidate_name}
            onChange={e => set('candidate_name', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Role</label>
          <select className="form-select" value={form.role} onChange={e => set('role', e.target.value)}>
            <option value="">Select a role...</option>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Experience Level</label>
            <select className="form-select" value={form.experience_level} onChange={e => set('experience_level', e.target.value)}>
              {LEVELS.map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Number of Questions</label>
            <select className="form-select" value={form.question_count} onChange={e => set('question_count', Number(e.target.value))}>
              {COUNTS.map(c => <option key={c} value={c}>{c} questions</option>)}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Tech Stack</label>
          <input
            className="form-input"
            placeholder="e.g. React, Node.js, PostgreSQL, Docker"
            value={form.tech_stack}
            onChange={e => set('tech_stack', e.target.value)}
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            List the technologies relevant to this role
          </span>
        </div>

        {error && <div className="error-msg">{error}</div>}

        {loading && (
          <div style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 8, padding: 16, textAlign: 'center' }}>
            <div className="loading" style={{ padding: 0, marginBottom: 8 }}>
              <div className="spinner" />
              <span>AI is generating your questions...</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>This takes 5–10 seconds</p>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/')} disabled={loading}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Generating...' : '⚡ Start Interview'}
          </button>
        </div>
      </div>

      {/* Info box */}
      <div style={{ marginTop: 24, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
        <h4 style={{ marginBottom: 12, fontSize: '0.9rem', color: 'var(--accent2)' }}>🤖 How it works</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.83rem', color: 'var(--text-muted)' }}>
          <span>1. AI generates tailored questions based on your role & tech stack</span>
          <span>2. Candidate answers each question in the interview room</span>
          <span>3. AI evaluates each answer with a score + detailed feedback</span>
          <span>4. Final report with hire recommendation is generated</span>
        </div>
      </div>
    </div>
  );
}
