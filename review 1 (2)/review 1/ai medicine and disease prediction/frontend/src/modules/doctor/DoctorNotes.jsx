import { useState, useEffect } from 'react';

const ML_API = import.meta.env.VITE_API_BASE;

const TAG_OPTIONS = ['allergy', 'family-history', 'follow-up', 'critical', 'lifestyle', 'medication', 'observation'];
const TAG_COLORS = { allergy: '#dc2626', 'family-history': '#7c3aed', 'follow-up': '#0ea5e9', critical: '#e11d48', lifestyle: '#059669', medication: '#d97706', observation: '#64748b' };

export default function DoctorNotes({ appointment, doctorName, onClose }) {
  const [notes, setNotes] = useState([]);
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (doctorName) params.append('doctor_name', doctorName);
      if (appointment?.user_name) params.append('patient_name', appointment.user_name);
      const res = await fetch(`${ML_API}/api/doctor-notes?${params}`);
      const data = await res.json();
      setNotes(data.notes || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchNotes(); }, []);

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      await fetch(`${ML_API}/api/doctor-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctor_name: doctorName,
          patient_name: appointment?.user_name || '',
          booking_id: appointment?.booking_id || '',
          content,
          tags: selectedTags,
        }),
      });
      setContent('');
      setSelectedTags([]);
      fetchNotes();
    } catch {}
    setSaving(false);
  };

  const toggleTag = (tag) => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}`}</style>
      <div style={{ background: '#fff', borderRadius: 20, width: 540, maxWidth: '95vw', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', animation: 'fadeUp 0.3s ease', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>

        {/* Header */}
        <div style={{ padding: '1.5rem 1.75rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit',sans-serif" }}>?? Private Notes</h2>
            <p style={{ margin: '0.15rem 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
              Patient: <strong>{appointment?.user_name}</strong> · Visible only to you
            </p>
          </div>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>?</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.75rem' }}>

          {/* New note */}
          <div style={{ marginBottom: '1.5rem' }}>
            <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Write a private note about this patient..." rows={3}
              style={{ width: '100%', padding: '0.7rem 0.875rem', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: '0.82rem', outline: 'none', fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.5, color: '#0f172a' }} />
            <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              {TAG_OPTIONS.map(tag => (
                <button key={tag} onClick={() => toggleTag(tag)}
                  style={{
                    padding: '0.2rem 0.5rem', borderRadius: 6, fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    border: selectedTags.includes(tag) ? `1.5px solid ${TAG_COLORS[tag]}` : '1.5px solid #e2e8f0',
                    background: selectedTags.includes(tag) ? `${TAG_COLORS[tag]}10` : '#f8fafc',
                    color: selectedTags.includes(tag) ? TAG_COLORS[tag] : '#94a3b8',
                  }}>
                  {tag}
                </button>
              ))}
            </div>
            <button onClick={handleSave} disabled={saving || !content.trim()}
              style={{ marginTop: '0.75rem', padding: '0.5rem 1.25rem', borderRadius: 8, border: 'none', background: '#7c3aed', color: '#fff', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving...' : '?? Save Note'}
            </button>
          </div>

          {/* Existing notes */}
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Previous Notes</h3>
          {loading ? (
            <p style={{ color: '#94a3b8', fontSize: '0.82rem' }}>Loading...</p>
          ) : notes.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '0.82rem', fontStyle: 'italic' }}>No notes yet for this patient</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {notes.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')).map(note => (
                <div key={note.id} style={{ padding: '0.75rem', background: '#faf5ff', borderRadius: 10, border: '1px solid #e9d5ff' }}>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#1e293b', lineHeight: 1.5 }}>{note.content}</p>
                  <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {note.tags?.map(tag => (
                      <span key={tag} style={{ fontSize: '0.62rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: 4, background: `${TAG_COLORS[tag] || '#64748b'}15`, color: TAG_COLORS[tag] || '#64748b' }}>{tag}</span>
                    ))}
                    <span style={{ fontSize: '0.65rem', color: '#94a3b8', marginLeft: 'auto' }}>{new Date(note.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
