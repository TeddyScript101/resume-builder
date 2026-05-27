import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

function toStr(d) {
  if (!d) return '';
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}

function fmtDisplay(str) {
  if (!str) return '';
  const [y, m, d] = str.split('-');
  return `${d}/${m}/${y}`;
}

function getPresetDates(v) {
  const todayStr = toStr(new Date());
  if (v === 'all') return { from: '', to: '' };
  const s = new Date();
  if (v === '7d')  s.setDate(s.getDate() - 6);
  if (v === '30d') s.setDate(s.getDate() - 29);
  if (v === '3m')  s.setMonth(s.getMonth() - 3);
  return { from: toStr(s), to: todayStr };
}

export default function DateRangePicker({ dateFrom, dateTo, onChange }) {
  const { t } = useTranslation();
  const [open, setOpen]       = useState(false);
  const [leftY, setLeftY]     = useState(() => new Date().getFullYear());
  const [leftM, setLeftM]     = useState(() => new Date().getMonth());
  const [calFrom, setCalFrom] = useState(dateFrom);
  const [calTo, setCalTo]     = useState(dateTo);
  const [selecting, setSelecting] = useState(false);
  const [hover, setHover]     = useState(null);
  const [preset, setPreset]   = useState('all');
  const wrapRef = useRef(null);

  const MONTHS  = t('drp.months', { returnObjects: true });
  const DOWS    = t('drp.days',   { returnObjects: true });
  const PRESETS = [
    { v: 'all',    l: t('drp.allTime') },
    { v: '7d',     l: t('drp.last7Days') },
    { v: '30d',    l: t('drp.last30Days') },
    { v: '3m',     l: t('drp.last3Months') },
    { v: 'custom', l: t('drp.custom') },
  ];

  useEffect(() => {
    setPreset(!dateFrom && !dateTo ? 'all' : 'custom');
  }, [dateFrom, dateTo]);

  useEffect(() => {
    function onMouseDown(e) {
      if (open && wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [open]);

  function toggleOpen() {
    if (open) { setOpen(false); return; }
    setCalFrom(dateFrom);
    setCalTo(dateTo);
    setSelecting(false);
    setHover(null);
    setOpen(true);
  }

  const rightM = leftM === 11 ? 0 : leftM + 1;
  const rightY = leftM === 11 ? leftY + 1 : leftY;

  function navMonth(dir) {
    let m = leftM + dir, y = leftY;
    if (m > 11) { m = 0; y++; }
    if (m < 0)  { m = 11; y--; }
    setLeftM(m); setLeftY(y);
  }

  function handleDayClick(dateStr) {
    if (!calFrom || (calFrom && calTo)) {
      setCalFrom(dateStr); setCalTo(''); setSelecting(true);
    } else {
      let from = calFrom, to = dateStr;
      if (to < from) { const t = from; from = to; to = t; }
      setCalFrom(from); setCalTo(to);
      setSelecting(false); setHover(null);
      setPreset('custom');
    }
  }

  function handleDayHover(dateStr) {
    if (selecting) setHover(dateStr);
  }

  function handlePreset(v) {
    setPreset(v);
    if (v === 'custom') {
      setCalFrom(''); setCalTo(''); setSelecting(false); setHover(null);
      return;
    }
    const { from, to } = getPresetDates(v);
    setCalFrom(from); setCalTo(to);
    setSelecting(false); setHover(null);
    onChange(from, to);
    setOpen(false);
  }

  function handleApply() {
    onChange(calFrom, calTo);
    setOpen(false);
  }

  function handleClear() {
    setCalFrom(''); setCalTo('');
    setSelecting(false); setHover(null);
    setPreset('all');
    onChange('', '');
    setOpen(false);
  }

  const btnLabel = (dateFrom || dateTo)
    ? (dateFrom ? fmtDisplay(dateFrom) : '...') + ' – ' + (dateTo ? fmtDisplay(dateTo) : '...')
    : t('drp.allTime');

  let rangeLabel;
  if (!calFrom) {
    rangeLabel = t('drp.selectStart');
  } else if (calFrom && selecting) {
    rangeLabel = `${fmtDisplay(calFrom)} ${t('drp.selectEnd')}`;
  } else if (calFrom && calTo) {
    rangeLabel = `${fmtDisplay(calFrom)} – ${fmtDisplay(calTo)}`;
  } else {
    rangeLabel = fmtDisplay(calFrom);
  }

  const isActive = !!(dateFrom || dateTo);

  return (
    <div ref={wrapRef} className="drp-wrap">
      <button
        className={`drp-btn${open ? ' drp-btn-open' : ''}${isActive ? ' drp-btn-active' : ''}`}
        onClick={toggleOpen}
        type="button"
      >
        <CalIcon />
        <span>{btnLabel}</span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className="drp-dropdown">
          <div className="drp-presets">
            {PRESETS.map(p => (
              <button
                key={p.v}
                type="button"
                className={`drp-preset${preset === p.v ? ' drp-preset-active' : ''}`}
                onClick={() => handlePreset(p.v)}
              >
                {p.l}
              </button>
            ))}
          </div>

          <div className="drp-cals" onMouseLeave={() => selecting && setHover(null)}>
            <CalMonth
              year={leftY} month={leftM} showPrev months={MONTHS} days={DOWS}
              calTitle={t('drp.calTitle')}
              onPrev={() => navMonth(-1)}
              calFrom={calFrom} calTo={calTo}
              selecting={selecting} hover={hover}
              onDayClick={handleDayClick} onDayHover={handleDayHover}
            />
            <CalMonth
              year={rightY} month={rightM} showNext months={MONTHS} days={DOWS}
              calTitle={t('drp.calTitle')}
              onNext={() => navMonth(1)}
              calFrom={calFrom} calTo={calTo}
              selecting={selecting} hover={hover}
              onDayClick={handleDayClick} onDayHover={handleDayHover}
            />
          </div>

          <div className="drp-footer">
            <span className="drp-range-label">{rangeLabel}</span>
            <button type="button" className="drp-btn-ghost" onClick={handleClear}>{t('drp.clear')}</button>
            <button
              type="button"
              className="drp-btn-apply"
              disabled={!calFrom}
              onClick={handleApply}
            >
              {t('drp.apply')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CalMonth({ year, month, showPrev, showNext, onPrev, onNext, calFrom, calTo, selecting, hover, onDayClick, onDayHover, months, days, calTitle }) {
  const firstDow = new Date(year, month, 1).getDay();
  const offset = firstDow === 0 ? 6 : firstDow - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = toStr(new Date());

  const effTo = calTo || (selecting && hover ? hover : null);
  let rangeFrom = calFrom, rangeTo = effTo;
  if (rangeFrom && rangeTo && rangeFrom > rangeTo) {
    const t = rangeFrom; rangeFrom = rangeTo; rangeTo = t;
  }

  const title = calTitle
    .replace('{{year}}', year)
    .replace('{{month}}', months[month]);

  return (
    <div className="drp-cal">
      <div className="drp-cal-head">
        {showPrev
          ? <button type="button" className="drp-cal-nav" onClick={onPrev}>‹</button>
          : <div />
        }
        <span className="drp-cal-title">{title}</span>
        {showNext
          ? <button type="button" className="drp-cal-nav" onClick={onNext}>›</button>
          : <div />
        }
      </div>

      <div className="drp-cal-grid">
        {days.map(d => <div key={d} className="drp-cal-dow">{d}</div>)}
        {Array.from({ length: offset }, (_, i) => <div key={'e' + i} />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const d = i + 1;
          const dateStr = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
          const isSel   = dateStr === calFrom || dateStr === calTo;
          const inRange = rangeFrom && rangeTo && dateStr > rangeFrom && dateStr < rangeTo;
          const isStart = rangeFrom && dateStr === rangeFrom && rangeTo && rangeFrom !== rangeTo;
          const isEnd   = rangeTo   && dateStr === rangeTo   && rangeFrom && rangeFrom !== rangeTo;
          const isToday = dateStr === todayStr && !isSel;

          let wrapCls = 'drp-day-wrap';
          if (inRange) wrapCls += ' drp-range-bg';
          if (isStart) wrapCls += ' drp-range-start';
          if (isEnd)   wrapCls += ' drp-range-end';

          let dayCls = 'drp-day';
          if (isSel)   dayCls += ' drp-day-sel';
          else if (inRange) dayCls += ' drp-day-range';
          if (isToday) dayCls += ' drp-day-today';

          return (
            <div key={d} className={wrapCls}>
              <div
                className={dayCls}
                onClick={() => onDayClick(dateStr)}
                onMouseEnter={() => onDayHover(dateStr)}
              >
                {d}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CalIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
}

function ChevronIcon({ open }) {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      style={{ flexShrink: 0, opacity: 0.45, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.14s' }}>
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
}
