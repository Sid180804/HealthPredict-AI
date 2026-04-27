import { useState } from 'react';

const ML_API = import.meta.env.VITE_API_BASE;

const TEMPLATES = {
  fever: [
    { name: 'Paracetamol', dosage: '500mg', frequency: 'Twice daily', duration: '5 days' },
    { name: 'Cetirizine', dosage: '10mg', frequency: 'Once daily', duration: '3 days' },
  ],
  infection: [
    { name: 'Amoxicillin', dosage: '500mg', frequency: 'Three times daily', duration: '7 days' },
    { name: 'Paracetamol', dosage: '500mg', frequency: 'As needed', duration: '5 days' },
  ],
  pain_relief: [
    { name: 'Ibuprofen', dosage: '400mg', frequency: 'Twice daily', duration: '5 days' },
    { name: 'Pantoprazole', dosage: '40mg', frequency: 'Once daily (before breakfast)', duration: '5 days' },
  ],
  allergy: [
    { name: 'Cetirizine', dosage: '10mg', frequency: 'Once daily', duration: '7 days' },
    { name: 'Montelukast', dosage: '10mg', frequency: 'Once at night', duration: '14 days' },
  ],
  diabetes: [
    { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', duration: '30 days' },
  ],
  hypertension: [
    { name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily', duration: '30 days' },
  ],
};

const TEMPLATE_LIST = [
  { id: 'fever', label: '?? Fever', color: '#dc2626' },
  { id: 'infection', label: '?? Infection', color: '#7c3aed' },
  { id: 'pain_relief', label: '?? Pain Relief', color: '#0ea5e9' },
  { id: 'allergy', label: '?? Allergy', color: '#d97706' },
  { id: 'diabetes', label: '?? Diabetes', color: '#059669' },
  { id: 'hypertension', label: '?? BP', color: '#e11d48' },
];

const EMPTY_MED = { name: '', dosage: '', frequency: 'Twice daily', duration: '5 days' };

export default function PrescriptionBuilder({ appointment, doctorName, onClose, onSaved }) {
  const [medicines, setMedicines] = useState([{ ...EMPTY_MED }]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const addMedicine = () => setMedicines(prev => [...prev, { ...EMPTY_MED }]);
  const removeMedicine = (i) => setMedicines(prev => prev.filter((_, idx) => idx !== i));
  const updateMedicine = (i, field, val) => setMedicines(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: val } : m));

  const applyTemplate = (templateId) => {
    const tpl = TEMPLATES[templateId];
    if (tpl) setMedicines([...tpl.map(m => ({ ...m }))]);
  };

  const handleSave = async () => {
    const validMeds = medicines.filter(m => m.name.trim());
    if (validMeds.length === 0) return;
    setSaving(true);
    try {
      await fetch(`${ML_API}/api/prescriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: appointment?.booking_id || '',
          doctor_name: doctorName,
          patient_name: appointment?.user_name || '',
          patient_email: appointment?.user_email || '',
          disease: appointment?.disease || '',
          medicines: validMeds,
          notes,
        }),
      });
      setSaved(true);
      onSaved?.();
      setTimeout(() => onClose?.(), 1500);
    } catch {}
    setSaving(false);
  };

  const inputStyle = {
    padding: '0.5rem 0.7rem', borderRadius: 8, border: '1.5px solid #e2e8f0',
    fontSize: '0.8rem', outline: 'none', fontFamily: 'inherit', color: '#0f172a',
    background: '#fff', width: '100%',
  };

  if (saved) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: '2.5rem', textAlign: 'center', maxWidth: 400, animation: 'fadeUp 0.3s ease' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>?</div>
          <h3 style={{ margin: '0 0 0.5rem', fontWeight: 800, color: '#059669', fontFamily: "'Outfit',sans-serif" }}>Prescription Saved</h3>
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>{medicines.filter(m => m.name).length} medicine(s) prescribed for {appointment?.user_name}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}`}</style>
      <div style={{ background: '#fff', borderRadius: 20, width: 640, maxWidth: '95vw', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', animation: 'fadeUp 0.3s ease', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>

        {/* Header */}
        <div style={{ padding: '1.5rem 1.75rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit',sans-serif" }}>?? Prescription Builder</h2>
            <p style={{ margin: '0.15rem 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
              Patient: <strong>{appointment?.user_name}</strong> · {appointment?.disease || 'General'}
            </p>
          </div>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>?</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.75rem' }}>

          {/* Quick Templates */}
          <div style={{ marginBottom: '1.25rem' }}>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quick Templates</p>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {TEMPLATE_LIST.map(t => (
                <button key={t.id} onClick={() => applyTemplate(t.id)}
                  style={{ padding: '0.35rem 0.7rem', borderRadius: 8, border: `1.5px solid ${t.color}25`, background: `${t.color}08`, color: t.color, fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Medicines */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
            {medicines.map((med, i) => (
              <div key={i} style={{ padding: '0.875rem', background: '#f8fafc', borderRadius: 12, border: '1.5px solid #f1f5f9' }}>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#7c3aed', background: '#faf5ff', padding: '0.15rem 0.5rem', borderRadius: 6 }}>#{i + 1}</span>
                  {medicines.length > 1 && (
                    <button onClick={() => removeMedicine(i)} style={{ marginLeft: 'auto', background: '#fef2f2', border: 'none', borderRadius: 6, padding: '0.2rem 0.5rem', color: '#dc2626', fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer' }}>Remove</button>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input value={med.name} onChange={e => updateMedicine(i, 'name', e.target.value)} placeholder="Medicine name" style={inputStyle} />
                  <input value={med.dosage} onChange={e => updateMedicine(i, 'dosage', e.target.value)} placeholder="Dosage" style={inputStyle} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <select value={med.frequency} onChange={e => updateMedicine(i, 'frequency', e.target.value)} style={inputStyle}>
                    <option>Once daily</option>
                    <option>Twice daily</option>
                    <option>Three times daily</option>
                    <option>Once at night</option>
                    <option>Once daily (before breakfast)</option>
                    <option>As needed</option>
                    <option>Every 8 hours</option>
                  </select>
                  <select value={med.duration} onChange={e => updateMedicine(i, 'duration', e.target.value)} style={inputStyle}>
                    <option>3 days</option>
                    <option>5 days</option>
                    <option>7 days</option>
                    <option>10 days</option>
                    <option>14 days</option>
                    <option>21 days</option>
                    <option>30 days</option>
                    <option>60 days</option>
                    <option>90 days</option>
                  </select>
                </div>
              </div>
            ))}
            <button onClick={addMedicine} style={{ padding: '0.6rem', borderRadius: 10, border: '1.5px dashed #cbd5e1', background: 'transparent', color: '#7c3aed', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
              + Add Medicine
            </button>
          </div>

          {/* Notes */}
          <div>
            <p style={{ margin: '0 0 0.4rem', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Additional Notes</p>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Diet advice, precautions, follow-up instructions..." rows={3}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '1rem 1.75rem', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '0.6rem 1.25rem', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving || medicines.every(m => !m.name.trim())}
            style={{ padding: '0.6rem 1.5rem', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#059669,#047857)', color: '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving...' : '?? Save Prescription'}
          </button>
        </div>
      </div>
    </div>
  );
}
