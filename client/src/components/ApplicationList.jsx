import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getApplications, deleteApplication } from '../api/applications';

const BADGE = {
  applied:   { label: '未有消息', cls: 'badge badge-applied' },
  interview: { label: '面試中',   cls: 'badge badge-interview' },
  rejected:  { label: '失敗',     cls: 'badge badge-rejected' },
  offer:     { label: '錄取',     cls: 'badge badge-offer' }
};

export default function ApplicationList() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    getApplications()
      .then(setApplications)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id, company) {
    if (!confirm(`Delete application for ${company}?`)) return;
    try {
      await deleteApplication(id);
      setApplications(prev => prev.filter(a => a._id !== id));
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  }

  if (loading) return <p className="empty">Loading...</p>;
  if (error) return <p className="empty" style={{ color: '#ef4444' }}>Error: {error}</p>;

  const counts = applications.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  const q = search.trim().toLowerCase();
  const filtered = applications.filter(a => {
    const matchesSearch = !q ||
      a.company_name?.toLowerCase().includes(q) ||
      a.position?.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const FILTER_BTNS = [
    { key: 'all',       label: '全部',    cls: 'filter-btn filter-btn-all' },
    { key: 'applied',   label: '未有消息', cls: 'filter-btn badge-applied' },
    { key: 'interview', label: '面試中',   cls: 'filter-btn filter-btn-interview' },
    { key: 'rejected',  label: '失敗',     cls: 'filter-btn filter-btn-rejected' },
    { key: 'offer',     label: '錄取',     cls: 'filter-btn filter-btn-offer' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Applications ({applications.length})</h1>
        <Link to="/new"><button className="btn-primary">+ New Application</button></Link>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {Object.entries(BADGE).map(([key, { label, cls }]) => (
          counts[key] ? (
            <span key={key} className={cls}>
              {label}: {counts[key]}
            </span>
          ) : null
        ))}
      </div>

      <div className="search-filter-bar">
        <input
          className="search-input"
          type="text"
          placeholder="搜尋公司或職位..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {FILTER_BTNS.map(({ key, label, cls }) => (
          <button
            key={key}
            className={`${cls}${statusFilter === key ? ' active' : ''}`}
            onClick={() => setStatusFilter(key)}
          >
            {label}{key !== 'all' && counts[key] ? ` (${counts[key]})` : ''}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="empty">
          {applications.length === 0
            ? 'No applications yet. Click "+ New Application" to add one.'
            : '找不到符合條件的申請。'}
        </p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Company</th>
              <th>Position</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(app => {
              const badge = BADGE[app.status] || BADGE.applied;
              return (
                <tr key={app._id}>
                  <td style={{ whiteSpace: 'nowrap', color: '#64748b' }}>
                    {new Date(app.created_at).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={{ fontWeight: 600 }}>{app.company_name}</td>
                  <td>{app.position}</td>
                  <td><span className={badge.cls}>{badge.label}</span></td>
                  <td>
                    <div className="actions">
                      <button className="btn-secondary" onClick={() => navigate(`/applications/${app._id}`)}>View</button>
                      <button className="btn-secondary" onClick={() => navigate(`/applications/${app._id}/edit`)}>Edit</button>
                      <button className="btn-danger" onClick={() => handleDelete(app._id, app.company_name)}>Delete</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
