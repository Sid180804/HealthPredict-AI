import { useState, useEffect } from 'react';

const ML_API = import.meta.env.VITE_API_BASE;

function StatCard({ icon, label, value, sub, color = '#059669', trend }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: '1.25rem', border: '1.5px solid #f1f5f9', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.15rem' }}>{icon}</div>
        {trend && <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: 99, background: '#ecfdf5', color: '#059669' }}>{trend}</span>}
      </div>
      <p style={{ margin: '0 0 0.15rem', fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
      <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', fontFamily: "'Outfit',sans-serif", lineHeight: 1.1 }}>{value}</p>
      {sub && <p style={{ margin: '0.2rem 0 0', fontSize: '0.72rem', color: '#94a3b8' }}>{sub}</p>}
    </div>
  );
}

export default function DoctorAnalytics({ doctorName }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (doctorName) params.append('doctor_name', doctorName);
      const res = await fetch(`${ML_API}/api/doctor-analytics?${params}`);
      setAnalytics(await res.json());
    } catch (err) {
      setError('Failed to load analytics. Please check your connection.');
    }
    setLoading(false);
  };

  useEffect(() => { fetchAnalytics(); }, [doctorName]);

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
      <div style={{ width: 28, height: 28, border: '3px solid #e2e8f0', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 0.5rem' }} />
      Loading analytics...
    </div>
  );

  if (error) return (
    <div style={{ padding: '2rem', textAlign: 'center', background: '#fef2f2', borderRadius: 14, border: '1px solid #fca5a5' }}>
      <p style={{ margin: '0 0 0.5rem', fontWeight: 700, color: '#ef4444' }}>?? Analytics Unavailable</p>
      <p style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', color: '#64748b' }}>{error}</p>
      <button onClick={fetchAnalytics} style={{ padding: '0.4rem 1rem', borderRadius: 8, border: 'none', background: '#7c3aed', color: '#fff', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>Retry</button>
    </div>
  );

  if (!analytics) return null;

  return (
    <div>
      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: '0.875rem', marginBottom: '1.5rem' }}>
        <StatCard icon="??" label="Total Patients" value={analytics.total_patients} color="#7c3aed" sub="All time" />
        <StatCard icon="??" label="Today" value={analytics.today_count} color="#0ea5e9" sub="Appointments" />
        <StatCard icon="?" label="Completed" value={analytics.completed} color="#059669" sub={`${analytics.completion_rate}% rate`} trend={`${analytics.completion_rate}%`} />
        <StatCard icon="??" label="This Month" value={analytics.this_month} color="#d97706" sub="Appointments" />
        <StatCard icon="??" label="Revenue" value={`?${(analytics.total_revenue || 0).toLocaleString('en-IN')}`} color="#059669" sub="Total earned" />
        <StatCard icon="?" label="Cancelled" value={analytics.cancelled} color="#dc2626" sub="All time" />
      </div>

      {/* Top Diseases */}
      {analytics.top_diseases?.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 16, padding: '1.25rem', border: '1.5px solid #f1f5f9' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit',sans-serif" }}>Common Conditions Treated</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {analytics.top_diseases.map((d, i) => {
              const maxCount = analytics.top_diseases[0]?.count || 1;
              const pct = Math.round((d.count / maxCount) * 100);
              const colors = ['#7c3aed', '#0ea5e9', '#059669', '#d97706', '#dc2626'];
              const color = colors[i % colors.length];
              return (
                <div key={d.disease}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>{d.disease || 'General'}</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color }}>{d.count} patients</span>
                  </div>
                  <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.8s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
