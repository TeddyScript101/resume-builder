import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getApplications, deleteApplication } from '../api/applications';
import DateRangePicker, { POST_485_DATE } from './DateRangePicker';

const BADGE_CLS = {
  applied:   'badge badge-applied',
  interview: 'badge badge-interview',
  rejected:  'badge badge-rejected',
  offer:     'badge badge-offer',
  ghosted:   'badge badge-ghosted',
};

const SORTERS = {
  date:     (a, b) => new Date(a.created_at) - new Date(b.created_at),
  company:  (a, b) => (a.company_name || '').localeCompare(b.company_name || ''),
  position: (a, b) => (a.position || '').localeCompare(b.position || ''),
  status:   (a, b) => (a.status || '').localeCompare(b.status || ''),
};

function SortIcon({ col, sortKey, sortDir }) {
  if (sortKey !== col) return <span className="sort-icon sort-icon-inactive">↕</span>;
  return <span className="sort-icon">{sortDir === 'asc' ? '↑' : '↓'}</span>;
}

export default function ApplicationList() {
  const { t } = useTranslation();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom]         = useState('');
  const [dateTo, setDateTo]             = useState('');
  const [sortKey, setSortKey]           = useState('date');
  const [sortDir, setSortDir]           = useState('desc');
  const navigate = useNavigate();

  useEffect(() => {
    getApplications()
      .then(setApplications)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id, company) {
    if (!confirm(t('list.deleteConfirm', { company }))) return;
    try {
      await deleteApplication(id);
      setApplications(prev => prev.filter(a => a._id !== id));
    } catch (err) {
      alert(t('list.deleteFailed', { error: err.message }));
    }
  }

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  function clearFilters() {
    setSearch('');
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
    setSortKey('date');
    setSortDir('desc');
  }

  const hasActiveFilters = search || statusFilter !== 'all' || dateFrom || dateTo;

  if (loading) return <p className="empty">{t('common.loading')}</p>;
  if (error)   return <p className="empty" style={{ color: '#ef4444' }}>Error: {error}</p>;

  const dateFiltered = applications.filter(a => {
    const appDate = new Date(a.created_at);
    const matchesFrom = !dateFrom || appDate >= new Date(dateFrom);
    const matchesTo   = !dateTo   || appDate <= new Date(dateTo + 'T23:59:59');
    return matchesFrom && matchesTo;
  });

  const counts = dateFiltered.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  const q = search.trim().toLowerCase();
  const filtered = dateFiltered.filter(a => {
    const matchesSearch = !q ||
      a.company_name?.toLowerCase().includes(q) ||
      a.position?.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sorted = [...filtered].sort((a, b) => {
    const cmp = SORTERS[sortKey](a, b);
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const FILTER_BTNS = [
    { key: 'all',      label: t('list.filter.all'),  cls: 'filter-btn filter-btn-all' },
    { key: 'applied',  label: t('status.applied'),   cls: 'filter-btn badge-applied' },
    { key: 'ghosted',  label: t('status.ghosted'),   cls: 'filter-btn filter-btn-ghosted' },
    { key: 'rejected', label: t('status.rejected'),  cls: 'filter-btn filter-btn-rejected' },
    { key: 'offer',    label: t('status.offer'),     cls: 'filter-btn filter-btn-offer' },
  ];

  const BADGE = {
    applied:   { label: t('status.applied'),   cls: BADGE_CLS.applied },
    interview: { label: t('status.interview'), cls: BADGE_CLS.interview },
    rejected:  { label: t('status.rejected'),  cls: BADGE_CLS.rejected },
    offer:     { label: t('status.offer'),     cls: BADGE_CLS.offer },
    ghosted:   { label: t('status.ghosted'),   cls: BADGE_CLS.ghosted },
  };

  return (
    <div>
      <div className="page-header">
        <h1>{t('list.title', { count: filtered.length })}</h1>
        <Link to="/new"><button className="btn-primary">{t('list.newBtn')}</button></Link>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {Object.entries(BADGE).map(([key, { label, cls }]) => (
          counts[key] ? (
            <span key={key} className={cls}>{label}: {counts[key]}</span>
          ) : null
        ))}
        {((counts.rejected || 0) + (counts.ghosted || 0)) > 0 && (
          <span className="badge badge-rejected" style={{ opacity: 0.7 }}>
            {t('status.unsuccessful')}: {(counts.rejected || 0) + (counts.ghosted || 0)}
          </span>
        )}
      </div>

      <div className="search-filter-bar">
        <input
          className="search-input"
          type="text"
          placeholder={t('list.searchPlaceholder')}
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

      <div className="date-filter-bar">
        <span className="date-filter-label">{t('list.dateLabel')}</span>
        <DateRangePicker
          dateFrom={dateFrom}
          dateTo={dateTo}
          onChange={(from, to) => { setDateFrom(from); setDateTo(to); }}
        />
        <button
          className={`filter-btn${dateFrom === POST_485_DATE && !dateTo ? ' active' : ''}`}
          onClick={() => {
            if (dateFrom === POST_485_DATE && !dateTo) { setDateFrom(''); setDateTo(''); }
            else { setDateFrom(POST_485_DATE); setDateTo(''); }
          }}
        >
          {t('drp.post485')}
        </button>
        {hasActiveFilters && (
          <button className="btn-clear" onClick={clearFilters}>{t('list.clearFilter')}</button>
        )}
        <span className="results-count">
          {filtered.length < applications.length
            ? t('list.resultsFiltered', { filtered: filtered.length, total: applications.length })
            : t('list.resultsTotal', { total: applications.length })}
        </span>
      </div>

      {sorted.length === 0 ? (
        <p className="empty">
          {applications.length === 0 ? t('list.noApplications') : t('list.noResults')}
        </p>
      ) : (
        <table>
          <thead>
            <tr>
              <th className="sortable-th" onClick={() => handleSort('date')}>
                {t('list.col.date')} <SortIcon col="date" sortKey={sortKey} sortDir={sortDir} />
              </th>
              <th className="sortable-th" onClick={() => handleSort('company')}>
                {t('list.col.company')} <SortIcon col="company" sortKey={sortKey} sortDir={sortDir} />
              </th>
              <th className="sortable-th" onClick={() => handleSort('position')}>
                {t('list.col.position')} <SortIcon col="position" sortKey={sortKey} sortDir={sortDir} />
              </th>
              <th className="sortable-th" onClick={() => handleSort('status')}>
                {t('list.col.status')} <SortIcon col="status" sortKey={sortKey} sortDir={sortDir} />
              </th>
              <th>{t('list.col.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(app => {
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
                      <button className="btn-secondary" onClick={() => navigate(`/applications/${app._id}`)}>{t('common.view')}</button>
                      <button className="btn-secondary" onClick={() => navigate(`/applications/${app._id}/edit`)}>{t('common.edit')}</button>
                      <button className="btn-danger" onClick={() => handleDelete(app._id, app.company_name)}>{t('common.delete')}</button>
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
