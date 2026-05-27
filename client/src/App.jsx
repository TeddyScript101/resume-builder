import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from './i18n';
import ApplicationList from './components/ApplicationList';
import ApplicationDetail from './components/ApplicationDetail';
import ApplicationForm from './components/ApplicationForm';

function useTheme() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  return [dark, setDark];
}

function ThemeToggle({ dark, onToggle }) {
  return (
    <button className="lang-toggle" onClick={onToggle} type="button" aria-label="Toggle theme">
      {dark ? '☀' : '☾'}
    </button>
  );
}

function LangToggle() {
  const { i18n: i18nInstance } = useTranslation();
  const isZh = i18nInstance.language === 'zh-TW';

  function toggle() {
    const next = isZh ? 'en' : 'zh-TW';
    i18nInstance.changeLanguage(next);
    localStorage.setItem('lang', next);
  }

  return (
    <button className="lang-toggle" onClick={toggle} type="button">
      {isZh ? 'EN' : '中文'}
    </button>
  );
}

export default function App() {
  const { t } = useTranslation();
  const [dark, setDark] = useTheme();

  return (
    <BrowserRouter>
      <nav>
        <Link to="/">{t('nav.title')}</Link>
        <Link to="/">{t('nav.allApplications')}</Link>
        <Link to="/new">{t('nav.new')}</Link>
        <div className="nav-actions">
          <ThemeToggle dark={dark} onToggle={() => setDark(d => !d)} />
          <LangToggle />
        </div>
      </nav>
      <main>
        <Routes>
          <Route path="/" element={<ApplicationList />} />
          <Route path="/new" element={<ApplicationForm />} />
          <Route path="/applications/:id" element={<ApplicationDetail />} />
          <Route path="/applications/:id/edit" element={<ApplicationForm />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
