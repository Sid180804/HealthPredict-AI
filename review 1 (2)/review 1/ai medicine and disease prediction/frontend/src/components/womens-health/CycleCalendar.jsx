import { useMemo } from 'react';
import useIsDark from '../../hooks/useIsDark';

/**
 * CycleCalendar
 * Props: { lastPeriodDate, cycleLength, periodDuration, onDayClick }
 * Shows a full month grid with colour-coded phases.
 */
export default function CycleCalendar({ lastPeriodDate, cycleLength = 28, periodDuration = 5, onDayClick }) {
  const isDark = useIsDark();

  const C = {
    bg:      isDark ? '#1e293b' : '#ffffff',
    border:  isDark ? '#334155' : '#f1f5f9',
    text:    isDark ? '#f1f5f9' : '#0f172a',
    sub:     isDark ? '#94a3b8' : '#64748b',
    dayHov:  isDark ? '#334155' : '#f8fafc',
    today:   isDark ? '#7c3aed' : '#7c3aed',
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build lookup: dateStr -> phase tag
  const phaseMap = useMemo(() => {
    const map = {};
    if (!lastPeriodDate) return map;

    const start = new Date(lastPeriodDate);
    start.setHours(0, 0, 0, 0);

    // Show 3 cycles worth of data
    for (let cycle = -1; cycle <= 2; cycle++) {
      const cycleStart = new Date(start);
      cycleStart.setDate(cycleStart.getDate() + cycle * cycleLength);

      const ovulationDay = cycleLength - 14; // day in cycle (1-indexed)
      const fertileStart = ovulationDay - 5;
      const fertileEnd   = ovulationDay + 1;

      for (let d = 1; d <= cycleLength; d++) {
        const date = new Date(cycleStart);
        date.setDate(date.getDate() + d - 1);
        const key = date.toISOString().split('T')[0];

        if (d <= periodDuration) {
          map[key] = 'period';
        } else if (d === ovulationDay) {
          map[key] = 'ovulation';
        } else if (d >= fertileStart && d <= fertileEnd) {
          map[key] = 'fertile';
        } else if (d > periodDuration && d < fertileStart) {
          map[key] = 'follicular';
        } else {
          map[key] = 'luteal';
        }
      }
    }
    return map;
  }, [lastPeriodDate, cycleLength, periodDuration]);

  // Calendar grid for current month (view state fixed to today's month for simplicity)
  const year  = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  function getStyle(key, isToday) {
    const phase = phaseMap[key];
    const base = {
      width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
      transition: 'all 0.15s', position: 'relative',
    };
    if (isToday) return { ...base, border: `2px solid ${C.today}`, color: C.today, fontWeight: 800 };
    if (!phase)  return { ...base, color: C.sub };
    if (phase === 'period')     return { ...base, background: '#fce7f3', color: '#be185d' };
    if (phase === 'ovulation')  return { ...base, background: '#7c3aed', color: '#fff', boxShadow: '0 0 10px rgba(124,58,237,0.4)' };
    if (phase === 'fertile')    return { ...base, background: '#ede9fe', color: '#6d28d9' };
    if (phase === 'follicular') return { ...base, color: isDark ? '#94a3b8' : '#64748b' };
    if (phase === 'luteal')     return { ...base, color: isDark ? '#94a3b8' : '#64748b' };
    return { ...base, color: C.sub };
  }

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const LEGEND = [
    { color: '#fce7f3', text: '#be185d', label: 'Period' },
    { color: '#ede9fe', text: '#6d28d9', label: 'Fertile window' },
    { color: '#7c3aed', text: '#fff',    label: 'Ovulation' },
    { color: 'transparent', text: isDark ? '#94a3b8' : '#64748b', label: 'Other days', border: `1px solid ${C.border}` },
  ];

  return (
    <div style={{ background: C.bg, borderRadius: 20, padding: '1.5rem', border: `1.5px solid ${C.border}` }}>
      {/* Month header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: C.text, fontFamily: "'Outfit',sans-serif" }}>
          {MONTHS[month]} {year}
        </h3>
        <div style={{ fontSize: '0.75rem', color: C.sub, fontWeight: 600 }}>Cycle Calendar</div>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem', marginBottom: '0.5rem' }}>
        {DAYS.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 700, color: C.sub, padding: '0.25rem 0' }}>{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem' }}>
        {cells.map((d, i) => {
          if (!d) return <div key={`e-${i}`} />;
          const dateObj = new Date(year, month, d);
          const key = dateObj.toISOString().split('T')[0];
          const isToday = dateObj.getTime() === today.getTime();
          const style = getStyle(key, isToday);
          return (
            <div key={d} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div style={style} onClick={() => onDayClick && onDayClick(key, phaseMap[key])}>
                {d}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1.25rem', paddingTop: '1rem', borderTop: `1px solid ${C.border}` }}>
        {LEGEND.map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: l.color, border: l.border || 'none', flexShrink: 0 }} />
            <span style={{ fontSize: '0.7rem', color: C.sub, fontWeight: 600 }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
