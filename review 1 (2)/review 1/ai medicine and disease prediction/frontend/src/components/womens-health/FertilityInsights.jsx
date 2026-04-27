import useIsDark from '../../hooks/useIsDark';

/**
 * FertilityInsights
 * Props: { cycleDay, phase, ovulationInDays, nextPeriodInDays, cycleLength, periodDuration, pregnancyMode }
 */
export default function FertilityInsights({
  cycleDay = 1,
  phase = 'follicular',
  ovulationInDays = 0,
  nextPeriodInDays = 0,
  cycleLength = 28,
  periodDuration = 5,
  pregnancyMode = false,
}) {
  const isDark = useIsDark();

  const C = {
    bg:     isDark ? '#1e293b' : '#ffffff',
    border: isDark ? '#334155' : '#f1f5f9',
    text:   isDark ? '#f1f5f9' : '#0f172a',
    sub:    isDark ? '#94a3b8' : '#64748b',
    inner:  isDark ? '#0f172a' : '#f8fafc',
    inBdr:  isDark ? '#334155' : '#f1f5f9',
  };

  // Phase-specific guidance
  const PHASE_DATA = {
    period: {
      icon: '🌸',
      name: 'Menstrual Phase',
      gradient: 'linear-gradient(135deg, #fce7f3, #fdf4ff)',
      gradientDark: 'linear-gradient(135deg, #4c1d3d, #2e1a4a)',
      accent: '#ec4899',
      insights: [
        { icon: '💊', text: 'Consider iron-rich foods like spinach, lentils, and lean red meat to replenish iron lost during menstruation.' },
        { icon: '🧘', text: 'Gentle yoga and light stretching can ease cramps naturally. Avoid strenuous workouts today.' },
        { icon: '🌡️', text: 'Apply a warm compress to your lower abdomen for 10–15 minutes to soothe cramping.' },
        { icon: '💧', text: 'Stay hydrated — drink at least 2L of water to help reduce bloating.' },
      ],
    },
    follicular: {
      icon: '🌱',
      name: 'Follicular Phase',
      gradient: 'linear-gradient(135deg, #ede9fe, #e0f2fe)',
      gradientDark: 'linear-gradient(135deg, #2e1a4a, #0c2340)',
      accent: '#8b5cf6',
      insights: [
        { icon: '⚡', text: 'Estrogen is rising — your energy levels are increasing. Great time for high-intensity workouts!' },
        { icon: '🥗', text: 'Eat fermented foods like yogurt and kimchi to support gut health and estrogen metabolism.' },
        { icon: '🧠', text: 'Cognitive performance peaks during this phase. Schedule important tasks and creative work now.' },
        { icon: '🌟', text: 'Social energy is high — this is a great time to meet people and collaborate.' },
      ],
    },
    ovulation: {
      icon: '✨',
      name: 'Ovulation Phase',
      gradient: 'linear-gradient(135deg, #fdf4ff, #ede9fe)',
      gradientDark: 'linear-gradient(135deg, #2e1054, #1e1b4b)',
      accent: '#7c3aed',
      insights: [
        { icon: '🌡️', text: 'Your basal body temperature rises slightly (0.2–0.5°C) during ovulation — track it each morning.' },
        { icon: '💫', text: 'LH surge triggers ovulation. You may notice clear, stretchy cervical mucus — a peak fertility sign.' },
        { icon: '🏃', text: 'Testosterone peaks — you may feel stronger and more competitive. Ideal for strength training!' },
        { icon: '❤️', text: pregnancyMode ? 'This is your highest fertility window. Tracking ovulation signs can improve conception chances.' : 'Highest fertility window. Use contraception if avoiding pregnancy.' },
      ],
    },
    luteal: {
      icon: '🌙',
      name: 'Luteal Phase',
      gradient: 'linear-gradient(135deg, #fff7ed, #fce7f3)',
      gradientDark: 'linear-gradient(135deg, #3b1a08, #4c1d3d)',
      accent: '#f59e0b',
      insights: [
        { icon: '🥜', text: 'Progesterone rises — magnesium-rich foods like nuts and dark chocolate can ease PMS symptoms.' },
        { icon: '😴', text: 'You may feel more tired than usual. Prioritise sleep and consider a short afternoon rest.' },
        { icon: '🧘', text: 'Mood dips are normal as progesterone dominates. Mindfulness and journaling can help.' },
        { icon: '🍫', text: 'Cravings for sweet or salty foods are hormonal. Keep healthy snacks within reach.' },
      ],
    },
  };

  const data = PHASE_DATA[phase] || PHASE_DATA.follicular;

  // Pregnancy-mode tips
  const PREGNANCY_TIPS = [
    { icon: '📅', text: `You are in cycle day ${cycleDay}. Track your BBT every morning before getting out of bed for accurate ovulation detection.` },
    { icon: '💊', text: 'Start taking folic acid (400–800 mcg/day) if trying to conceive — it reduces neural tube defect risk by 70%.' },
    { icon: '🌡️', text: 'Cervical mucus becomes clear and stretchy like raw egg whites near ovulation — your most fertile sign.' },
    { icon: '🏥', text: 'Consider a pre-conception check-up to optimise your health before pregnancy.' },
  ];

  const tips = pregnancyMode ? PREGNANCY_TIPS : data.insights;

  return (
    <div style={{ background: C.bg, borderRadius: 20, padding: '1.5rem', border: `1.5px solid ${C.border}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: C.text, fontFamily: "'Outfit',sans-serif" }}>
          Health Insights
        </h3>
        {pregnancyMode && (
          <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: 99, background: '#fce7f3', color: '#be185d', border: '1px solid #fbcfe8' }}>
            🤰 Pregnancy Mode
          </span>
        )}
      </div>

      {/* Current phase banner */}
      <div style={{
        background: isDark ? data.gradientDark : data.gradient,
        borderRadius: 16, padding: '1.25rem', marginBottom: '1.25rem',
        border: `1.5px solid ${data.accent}30`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '1.5rem' }}>{data.icon}</span>
          <div>
            <div style={{ fontSize: '0.72rem', color: data.accent, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Phase</div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: C.text, fontFamily: "'Outfit',sans-serif" }}>{data.name}</div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: data.accent, fontFamily: "'Outfit',sans-serif", lineHeight: 1 }}>Day {cycleDay}</div>
            <div style={{ fontSize: '0.7rem', color: C.sub }}>of {cycleLength}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <div style={{ background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.6)', borderRadius: 10, padding: '0.6rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.65rem', color: C.sub, fontWeight: 600, textTransform: 'uppercase' }}>Next Period</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ec4899', fontFamily: "'Outfit',sans-serif" }}>
              {nextPeriodInDays === 0 ? 'Today' : nextPeriodInDays < 0 ? `${Math.abs(nextPeriodInDays)}d late` : `in ${nextPeriodInDays}d`}
            </div>
          </div>
          <div style={{ background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.6)', borderRadius: 10, padding: '0.6rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.65rem', color: C.sub, fontWeight: 600, textTransform: 'uppercase' }}>Ovulation</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#7c3aed', fontFamily: "'Outfit',sans-serif" }}>
              {ovulationInDays === 0 ? 'Today!' : ovulationInDays < 0 ? `${Math.abs(ovulationInDays)}d ago` : `in ${ovulationInDays}d`}
            </div>
          </div>
        </div>
      </div>

      {/* Insight cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {tips.map((tip, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
            padding: '0.875rem', background: C.inner, borderRadius: 12, border: `1px solid ${C.inBdr}`,
          }}>
            <span style={{ fontSize: '1.1rem', flexShrink: 0, marginTop: '0.05rem' }}>{tip.icon}</span>
            <p style={{ margin: 0, fontSize: '0.82rem', color: C.sub, lineHeight: 1.6 }}>{tip.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
