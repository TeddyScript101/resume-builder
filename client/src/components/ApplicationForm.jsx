import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getApplication, createApplication, updateApplication } from '../api/applications';

const DEFAULT_FORM = {
  company_name: '',
  position: '',
  status: 'applied',
  resume_content: '',
  cover_letter_content: ''
};

export default function ApplicationForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isEdit) return;
    getApplication(id)
      .then(data => setForm({
        company_name: data.company_name,
        position: data.position,
        status: data.status,
        resume_content: data.resume_content || '',
        cover_letter_content: data.cover_letter_content || ''
      }))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (isEdit) {
        await updateApplication(id, form);
        navigate('/');
      } else {
        const created = await createApplication(form);
        navigate(`/applications/${created._id}`);
      }
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  if (loading) return <p className="empty">Loading...</p>;

  return (
    <div>
      <button className="back-link" onClick={() => navigate(-1)}>Back</button>
      <h1>{isEdit ? 'Edit Application' : 'New Application'}</h1>

      <form onSubmit={handleSubmit}>
        {error && (
          <p style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</p>
        )}

        <div className="field">
          <label>Company Name</label>
          <input
            name="company_name"
            value={form.company_name}
            onChange={handleChange}
            placeholder="e.g. Atlassian"
            required
          />
        </div>

        <div className="field">
          <label>Position</label>
          <input
            name="position"
            value={form.position}
            onChange={handleChange}
            placeholder="e.g. Software Engineer"
            required
          />
        </div>

        <div className="field">
          <label>Status</label>
          <select name="status" value={form.status} onChange={handleChange}>
            <option value="applied">未有消息 (Applied)</option>
            <option value="interview">面試中 (Interview)</option>
            <option value="rejected">失敗 (Rejected)</option>
            <option value="offer">錄取 (Offer)</option>
          </select>
        </div>

        <div className="field">
          <label>Resume Content <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span></label>
          <textarea
            name="resume_content"
            value={form.resume_content}
            onChange={handleChange}
            rows={8}
            placeholder="Paste resume JSON or text here..."
          />
        </div>

        <div className="field">
          <label>Cover Letter <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span></label>
          <textarea
            name="cover_letter_content"
            value={form.cover_letter_content}
            onChange={handleChange}
            rows={8}
            placeholder="Paste cover letter text here..."
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Application'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
