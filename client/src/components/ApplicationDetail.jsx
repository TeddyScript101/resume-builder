import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getApplication, deleteApplication } from '../api/applications';

const STATUS_LABEL = {
  applied:   '未有消息',
  interview: '面試中',
  rejected:  '失敗',
  offer:     '錄取'
};

const BADGE_CLS = {
  applied:   'badge badge-applied',
  interview: 'badge badge-interview',
  rejected:  'badge badge-rejected',
  offer:     'badge badge-offer'
};

export default function ApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getApplication(id)
      .then(setApp)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    if (!confirm(`Delete application for ${app.company_name}?`)) return;
    try {
      await deleteApplication(id);
      navigate('/');
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  }

  if (loading) return <p className="empty">Loading...</p>;
  if (error) return <p className="empty" style={{ color: '#ef4444' }}>Error: {error}</p>;
  if (!app) return <p className="empty">Application not found.</p>;

  return (
    <div>
      <button className="back-link" onClick={() => navigate(-1)}>Back</button>

      <div className="card">
        <div className="page-header" style={{ marginBottom: '0.5rem' }}>
          <div>
            <h1 style={{ marginBottom: '0.25rem' }}>{app.company_name}</h1>
            <p style={{ color: '#475569', fontSize: '1.05rem' }}>{app.position}</p>
          </div>
          <span className={BADGE_CLS[app.status] || 'badge badge-applied'} style={{ fontSize: '0.9rem', padding: '0.3rem 0.8rem' }}>
            {STATUS_LABEL[app.status] || app.status}
          </span>
        </div>

        <div className="meta-row" style={{ marginTop: '0.75rem' }}>
          <div className="meta-item">
            <strong>Applied: </strong>
            {new Date(app.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          <div className="meta-item">
            <strong>ID: </strong>
            <span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{app._id}</span>
          </div>
        </div>
      </div>

      {app.resume_content && (
        <div className="card">
          <h3>Resume Content</h3>
          <pre>{app.resume_content}</pre>
        </div>
      )}

      {app.cover_letter_content && (
        <div className="card">
          <h3>Cover Letter</h3>
          <pre>{app.cover_letter_content}</pre>
        </div>
      )}

      {!app.resume_content && !app.cover_letter_content && (
        <div className="card" style={{ color: '#94a3b8', fontStyle: 'italic' }}>
          No resume or cover letter content stored for this application.
        </div>
      )}

      <div className="actions" style={{ marginTop: '0.5rem' }}>
        <button className="btn-primary" onClick={() => navigate(`/applications/${id}/edit`)}>Edit</button>
        <button className="btn-danger" onClick={handleDelete}>Delete</button>
      </div>
    </div>
  );
}
