import { useState } from 'react';

const ML_API = import.meta.env.VITE_API_BASE;

const COMMON_TESTS = [
  { name: 'Complete Blood Count (CBC)', icon: '??', category: 'blood' },
  { name: 'Blood Sugar (Fasting)', icon: '??', category: 'blood' },
  { name: 'Lipid Profile', icon: '??', category: 'blood' },
  { name: 'Thyroid Panel (TSH)', icon: '??', category: 'blood' },
  { name: 'Liver Function Test (LFT)', icon: '??', category: 'blood' },
  { name: 'Kidney Function Test (KFT)', icon: '??', category: 'blood' },
  { name: 'Vitamin D', icon: '??', category: 'blood' },
  { name: 'Vitamin B12', icon: '??', category: 'blood' },
  { name: 'HbA1c', icon: '??', category: 'blood' },
  { name: 'Hemoglobin', icon: '??', category: 'blood' },
  { name: 'Urine Routine', icon: '??', category: 'urine' },
  { name: 'Urine Culture', icon: '??', category: 'urine' },
  { name: 'Chest X-Ray', icon: '??', category: 'imaging' },
  { name: 'MRI Brain', icon: '??', category: 'imaging' },
  { name: 'MRI Spine', icon: '??', category: 'imaging' },
  { name: 'CT Scan', icon: '??', category: 'imaging' },
  { name: 'Ultrasound Abdomen', icon: '??', category: 'imaging' },
  { name: 'ECG', icon: '??', category: 'cardiac' },
  { name: 'Echocardiogram', icon: '??', category: 'cardiac' },
  { name: 'Stool Test', icon: '??', category: 'other' },
];

export default function TestRecommender({ appointment, doctorName, onClose, onSaved }) {
  const [selectedTests, setSelectedTests] = useState([]);
  const [urgency, setUrgency] = useState('normal');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [filter, setFilter] = useState('all');

  const toggleTest = (testName) => {
    setSelectedTests(prev => prev.includes(testName) ? prev.filter(t => t !== testName) : [...prev, testName]);
  };

  const filtered = filter === 'all' ? COMMON_TESTS : COMMON_TESTS.filter(t => t.category === filter);

  const handleSave = async () => {
    if (selectedTests.length === 0) return;
    setSaving(true);
    try {
      await fetch(`${ML_API}/api/test-recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctor_name: doctorName,
          patient_name: appointment?.user_name || '',
          patient_email: appointment?.user_email || '',
          booking_id: appointment?.booking_id || '',
          tests: selectedTests,
          urgency,
          notes,
        }),
      });
      setSaved(true);
      onSaved?.();
      setTimeout(() => onClose?.(), 1500);
    } catch {}
    setSaving(false);
  };

  if (saved) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: '2.5rem', textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>??</div>
          <h3 style={{ margin: '0 0 0.5rem', fontWeight: 800, color: '#059669', fontFamily: "'Outfit',sans-serif" }}>Tests Recommended</h3>
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>{selectedTests.length} test(s) recommended for {appointment?.user_name}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}`}</style>
      <div style={{ background: '#fff', borderRadius: 20, width: 580, maxWidth: '95vw', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', animation: 'fadeUp 0.3s ease', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>

        {/* Header */}
        <div style={{ padding: '1.5rem 1.75rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit',sans-serif" }}>?? Recommend Tests</h2>
            <p style={{ margin: '0.15rem 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
              Patient: <strong>{appointment?.user_name}</strong> · {appointment?.disease || 'General'}
            </p>
          </div>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>?</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.75rem' }}>

          {/* Category filters */}
          <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {[['all', 'All'], ['blood', '?? Blood'], ['urine', '?? Urine'], ['imaging', '?? Imaging'], ['cardiac', '?? Cardiac']].map(([id, label]) => (
              <button key={id} onClick={() => setFilter(id)}
                style={{ padding: '0.35rem 0.7rem', borderRadius: 8, border: 'none', fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer', background: filter === id ? '#7c3aed' : '#f1f5f9', color: filter === id ? '#fff' : '#64748b' }}>
                {label}
              </button>
            ))}
          </div>

          {/* Test grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: '0.5rem', marginBottom: '1.25rem' }}>
            {filtered.map(test => {
              const selected = selectedTests.includes(test.name);
              return (
                <button key={test.name} onClick={() => toggleTest(test.name)}
                  style={{
                    padding: '0.5rem 0.7rem', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                    border: selected ? '1.5px solid #7c3aed' : '1.5px solid #e2e8f0',
                    background: selected ? '#faf5ff' : '#fff',
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                  }}>
                  <span style={{ fontSize: '0.85rem' }}>{test.icon}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: selected ? 700 : 500, color: selected ? '#7c3aed' : '#475569' }}>{test.name}</span>
                  {selected && <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#7c3aed' }}>?</span>}
                </button>
              );
            })}
          </div>

          {/* Urgency & Notes */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ flex: 1 }}>
              <p style={{ margin: '0 0 0.3rem', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Urgency</p>
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                {[['normal', '?? Normal'], ['moderate', '?? Moderate'], ['urgent', '?? Urgent']].map(([val, label]) => (
                  <button key={val} onClick={() => setUrgency(val)}
                    style={{ padding: '0.35rem 0.6rem', borderRadius: 8, border: urgency === val ? '1.5px solid #7c3aed' : '1.5px solid #e2e8f0', background: urgency === val ? '#faf5ff' : '#fff', color: urgency === val ? '#7c3aed' : '#64748b', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional notes for patient..." rows={2}
            style={{ width: '100%', padding: '0.5rem 0.7rem', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: '0.8rem', outline: 'none', fontFamily: 'inherit', resize: 'vertical', color: '#0f172a' }} />
        </div>

        {/* Footer */}
        <div style={{ padding: '1rem 1.75rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>{selectedTests.length} test(s) selected</span>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={onClose} style={{ padding: '0.6rem 1.25rem', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleSave} disabled={saving || selectedTests.length === 0}
              style={{ padding: '0.6rem 1.5rem', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving...' : '?? Recommend Tests'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
