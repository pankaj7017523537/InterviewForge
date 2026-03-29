import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSessions, deleteSession } from '../utils/api';
import { Session } from '../utils/types';

export default function Dashboard() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await getSessions();
      const data = (res as any).data;
      setSessions(data);
    } catch {
      setError('Failed to load sessions.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this session?')) return;
    try {
      await deleteSession(id);
      setSessions(prev => prev.filter(s => s.id !== id));
    } catch {
      alert('Failed to delete session.');
    }
  };

  const completed = sessions.filter(s => s.status === 'completed');
  const active = sessions.filter(s => s.status === 'active');
  const avgScore = completed.length
    ? (completed.reduce((a, s) => a + (s.overall_score || 0), 0) / completed.length).toFixed(1)
    : '—';

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">All your interview sessions in one place</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/new')}>
          ⚡ New Interview
        </button>
      </div>

      {/* Stats */}
      <div className="grid-3" style={{ marginBottom: 32 }}>
        {[
          { label: 'Total Sessions', value: sessions.length, icon: '📋' },
          { label: 'Completed', value: completed.length, icon: '✅' },
          { label: 'Avg Score', value: avgScore, icon: '⭐' },
        ].map(stat => (
          <div key={stat.label} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>{stat.icon}</div>
            <div style={{ fontSize: '2rem', fontFamily: 'Syne', fontWeight: 800, color: 'var(--accent)' }}>
              {stat.value}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 4 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {error && <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>}

      {loading ? (
        <div className="loading"><div className="spinner" /><span>Loading sessions...</span></div>
      ) : sessions.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>🎯</div>
          <h3 style={{ marginBottom: 8 }}>No interviews yet</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Start your first AI-powered interview session</p>
          <button className="btn btn-primary" onClick={() => navigate('/new')}>⚡ Start Now</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h2 style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: 4 }}>
            RECENT SESSIONS ({sessions.length})
          </h2>
          {sessions.map(session => (
            <div
              key={session.id}
              className="card"
              onClick={() => navigate(session.status === 'active' ? `/interview/${session.id}` : `/report/${session.id}`)}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16 }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontFamily: 'Syne', fontWeight: 700 }}>{session.candidate_name}</span>
                  <span className={`badge badge-${session.status}`}>{session.status}</span>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', gap: 16 }}>
                  <span>🎯 {session.role}</span>
                  <span>📊 {session.experience_level}</span>
                  <span>❓ {session.question_count} questions</span>
                  <span>🛠 {session.tech_stack}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {session.overall_score !== null && (
                  <div style={{
                    background: session.overall_score >= 7 ? 'rgba(16,185,129,0.15)' : session.overall_score >= 5 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                    color: session.overall_score >= 7 ? 'var(--success)' : session.overall_score >= 5 ? 'var(--warning)' : 'var(--danger)',
                    border: `1px solid ${session.overall_score >= 7 ? 'rgba(16,185,129,0.3)' : session.overall_score >= 5 ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    borderRadius: 8, padding: '6px 12px', fontFamily: 'Syne', fontWeight: 700, fontSize: '1rem'
                  }}>
                    {session.overall_score.toFixed(1)}/10
                  </div>
                )}
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  {new Date(session.created_at).toLocaleDateString()}
                </span>
                <button
                  className="btn btn-danger"
                  style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                  onClick={(e) => handleDelete(session.id, e)}
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
