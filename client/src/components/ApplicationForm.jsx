import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getApplication, createApplication, updateApplication } from '../api/applications';

const DEFAULT_FORM = {
  company_name: '',
  position: '',
  status: 'applied',
  resume_content: '',
  cover_letter_content: ''
};

export default function ApplicationForm() {
  const { t } = useTranslation();
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

  if (loading) return <p className="empty">{t('common.loading')}</p>;

  return (
    <div>
      <button className="back-link" onClick={() => navigate(-1)}>{t('common.back')}</button>
      <h1>{t(isEdit ? 'form.editTitle' : 'form.newTitle')}</h1>

      <form onSubmit={handleSubmit}>
        {error && (
          <p style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</p>
        )}

        <div className="field">
          <label>{t('form.companyLabel')}</label>
          <input
            name="company_name"
            value={form.company_name}
            onChange={handleChange}
            placeholder={t('form.companyPlaceholder')}
            required
          />
        </div>

        <div className="field">
          <label>{t('form.positionLabel')}</label>
          <input
            name="position"
            value={form.position}
            onChange={handleChange}
            placeholder={t('form.positionPlaceholder')}
            required
          />
        </div>

        <div className="field">
          <label>{t('form.statusLabel')}</label>
          <select name="status" value={form.status} onChange={handleChange}>
            <option value="applied">{t('status.applied')}</option>
            <option value="ghosted">{t('status.ghosted')}</option>
            <option value="rejected">{t('status.rejected')}</option>
            <option value="offer">{t('status.offer')}</option>
          </select>
        </div>

        <div className="field">
          <label>{t('form.resumeLabel')} <span style={{ color: '#94a3b8', fontWeight: 400 }}>{t('form.optional')}</span></label>
          <textarea
            name="resume_content"
            value={form.resume_content}
            onChange={handleChange}
            rows={8}
            placeholder={t('form.resumePlaceholder')}
          />
        </div>

        <div className="field">
          <label>{t('form.coverLetterLabel')} <span style={{ color: '#94a3b8', fontWeight: 400 }}>{t('form.optional')}</span></label>
          <textarea
            name="cover_letter_content"
            value={form.cover_letter_content}
            onChange={handleChange}
            rows={8}
            placeholder={t('form.coverLetterPlaceholder')}
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? t('common.saving') : t(isEdit ? 'form.saveChanges' : 'form.createApplication')}
          </button>
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
            {t('common.cancel')}
          </button>
        </div>
      </form>
    </div>
  );
}
