import { useState, useEffect } from 'react';
import Header from '../components/Header';
import useIsDark from '../hooks/useIsDark';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_BASE;

const RELATION_ICONS = {
  mother:'??', father:'??', spouse:'??', son:'??', daughter:'??',
  brother:'??', sister:'??', grandfather:'??', grandmother:'??', other:'??'
};

const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];

export default function FamilyHealth() {
  const isDark = useIsDark();
  const { user } = useAuth();
  const uid = user?.email || 'default';

  const C = {
    page: isDark ? '#0f172a' : '#f0fdf4',
    card: isDark ? '#1e293b' : '#ffffff',
    border: isDark ? '#334155' : '#e2e8f0',
    text: isDark ? '#f1f5f9' : '#0f172a',
    sub: isDark ? '#94a3b8' : '#64748b',
    inner: isDark ? '#0f172a' : '#f8fafc',
    inBdr: isDark ? '#334155' : '#f1f5f9',
    input: isDark ? '#0f172a' : '#ffffff',
    inpBdr: isDark ? '#475569' : '#e2e8f0',
  };

  const [members, setMembers] = useState([]);
  const [relations, setRelations] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [form, setForm] = useState({ name:'', relation:'mother', age:'', gender:'female', blood_group:'', conditions:'', medications:'', allergies:'' });

  useEffect(() => { fetchMembers(); }, []);

  const fetchMembers = async () => {
    try {
      const res = await fetch(`${API}/api/family?user_id=${uid}`);
      const data = await res.json();
      setMembers(data.members || []);
      setRelations(data.relations || []);
    } catch {}
  };

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    try {
      await fetch(`${API}/api/family/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: uid, name: form.name, relation: form.relation,
          age: Number(form.age) || 0, gender: form.gender, blood_group: form.blood_group,
          conditions: form.conditions ? form.conditions.split(',').map(s=>s.trim()) : [],
          medications: form.medications ? form.medications.split(',').map(s=>s.trim()) : [],
          allergies: form.allergies ? form.allergies.split(',').map(s=>s.trim()) : [],
        }),
      });
      setForm({ name:'', relation:'mother', age:'', gender:'female', blood_group:'', conditions:'', medications:'', allergies:'' });
      setShowForm(false);
      fetchMembers();
    } catch {}
  };

  const handleDelete = async (memberId) => {
    try {
      await fetch(`${API}/api/family/delete?user_id=${uid}&member_id=${memberId}`, { method: 'DELETE' });
      if (selectedMember?.id === memberId) setSelectedMember(null);
      fetchMembers();
    } catch {}
  };

  const inputStyle = {
    width: '100%', padding: '0.55rem 0.75rem', borderRadius: 8,
    border: `1.5px solid ${C.inpBdr}`, background: C.input, color: C.text,
    fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  };
  const labelStyle = { display: 'block', fontSize: '0.7rem', fontWeight: 700, color: C.sub, marginBottom: '0.25rem', textTransform: 'uppercase' };

  return (
    <div style={{ minHeight: '100vh', background: C.page, fontFamily: "'Inter', system-ui, sans-serif", transition: 'background 0.3s' }}>
      <style>{`@keyframes fh-fade{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}`}</style>
      <Header />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem', animation: 'fh-fade 0.5s ease forwards' }}>

        {/* Hero */}
        <div style={{
          background: isDark ? 'linear-gradient(135deg,#064e3b,#0f172a)' : 'linear-gradient(135deg,#ecfdf5,#e0f2fe)',
          borderRadius: 24, padding: '2.5rem', marginBottom: '1.75rem',
          border: `1.5px solid ${isDark ? '#047857' : '#a7f3d0'}`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '2rem' }}>???????????</span>
                <h1 style={{ margin: 0, fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 900, color: C.text, fontFamily: "'Outfit',sans-serif" }}>Family Health Profiles</h1>
              </div>
              <p style={{ margin: 0, color: C.sub, fontSize: '0.9rem' }}>Manage health records for your family members in one place.</p>
            </div>
            <button onClick={() => setShowForm(s => !s)}
              style={{ padding: '0.6rem 1.25rem', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#059669,#047857)', color: '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
              + Add Member
            </button>
          </div>
        </div>

        {/* Add form */}
        {showForm && (
          <div style={{ background: C.card, borderRadius: 16, padding: '1.5rem', marginBottom: '1.5rem', border: `1.5px solid ${C.border}` }}>
            <h3 style={{ margin: '0 0 1rem', fontWeight: 800, color: C.text, fontFamily: "'Outfit',sans-serif" }}>Add Family Member</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div><label style={labelStyle}>Name</label><input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} style={inputStyle} placeholder="Full name" /></div>
              <div><label style={labelStyle}>Relation</label>
                <select value={form.relation} onChange={e=>setForm(p=>({...p,relation:e.target.value}))} style={inputStyle}>
                  {(relations.length ? relations : ['mother','father','spouse','son','daughter','brother','sister','other']).map(r => (
                    <option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div><label style={labelStyle}>Age</label><input type="number" value={form.age} onChange={e=>setForm(p=>({...p,age:e.target.value}))} style={inputStyle} min={0} max={120} /></div>
              <div><label style={labelStyle}>Gender</label>
                <select value={form.gender} onChange={e=>setForm(p=>({...p,gender:e.target.value}))} style={inputStyle}>
                  <option value="female">Female</option><option value="male">Male</option><option value="other">Other</option>
                </select>
              </div>
              <div><label style={labelStyle}>Blood Group</label>
                <select value={form.blood_group} onChange={e=>setForm(p=>({...p,blood_group:e.target.value}))} style={inputStyle}>
                  <option value="">Select</option>
                  {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
              <div><label style={labelStyle}>Conditions (comma-separated)</label><input value={form.conditions} onChange={e=>setForm(p=>({...p,conditions:e.target.value}))} style={inputStyle} placeholder="e.g. Diabetes, Hypertension" /></div>
              <div><label style={labelStyle}>Medications</label><input value={form.medications} onChange={e=>setForm(p=>({...p,medications:e.target.value}))} style={inputStyle} placeholder="e.g. Metformin, Amlodipine" /></div>
              <div><label style={labelStyle}>Allergies</label><input value={form.allergies} onChange={e=>setForm(p=>({...p,allergies:e.target.value}))} style={inputStyle} placeholder="e.g. Penicillin, Peanuts" /></div>
            </div>
            <button onClick={handleAdd} style={{ padding: '0.6rem 2rem', borderRadius: 10, border: 'none', background: '#059669', color: '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>Save Member</button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: selectedMember ? '320px 1fr' : '1fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* Member cards */}
          <div style={{ display: 'grid', gridTemplateColumns: selectedMember ? '1fr' : 'repeat(auto-fill,minmax(280px,1fr))', gap: '1rem' }}>
            {members.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', background: C.card, borderRadius: 20, border: `1.5px dashed ${C.border}`, gridColumn: '1/-1' }}>
                <span style={{ fontSize: '3rem' }}>???????????</span>
                <h3 style={{ margin: '1rem 0 0.5rem', color: C.text, fontFamily: "'Outfit',sans-serif" }}>No Family Members</h3>
                <p style={{ color: C.sub, fontSize: '0.85rem' }}>Add family members to track their health records.</p>
              </div>
            ) : members.map(m => (
              <div key={m.id} onClick={() => setSelectedMember(m)}
                style={{
                  background: C.card, borderRadius: 16, padding: '1.25rem', cursor: 'pointer',
                  border: `1.5px solid ${selectedMember?.id === m.id ? '#059669' : C.border}`,
                  transition: 'all 0.2s',
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: isDark ? '#064e3b' : '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
                    {RELATION_ICONS[m.relation] || '??'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, color: C.text, fontSize: '0.9rem' }}>{m.name}</div>
                    <div style={{ fontSize: '0.72rem', color: C.sub, textTransform: 'capitalize' }}>{m.relation} · {m.age}y · {m.gender}</div>
                  </div>
                  {m.blood_group && (
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.4rem', borderRadius: 6, background: '#fef2f2', color: '#ef4444' }}>{m.blood_group}</span>
                  )}
                </div>
                {m.conditions?.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                    {m.conditions.map((c,i) => (
                      <span key={i} style={{ fontSize: '0.65rem', fontWeight: 600, padding: '0.12rem 0.4rem', borderRadius: 99, background: isDark ? '#f59e0b20' : '#fff7ed', color: '#f59e0b' }}>{c}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Detail panel */}
          {selectedMember && (
            <div style={{ background: C.card, borderRadius: 20, padding: '1.75rem', border: `1.5px solid ${C.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                    <span style={{ fontSize: '1.3rem' }}>{RELATION_ICONS[selectedMember.relation] || '??'}</span>
                    <h3 style={{ margin: 0, fontWeight: 800, color: C.text, fontFamily: "'Outfit',sans-serif" }}>{selectedMember.name}</h3>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: C.sub, textTransform: 'capitalize' }}>
                    {selectedMember.relation} · {selectedMember.age} years · {selectedMember.gender} {selectedMember.blood_group ? `· ${selectedMember.blood_group}` : ''}
                  </div>
                </div>
                <button onClick={() => handleDelete(selectedMember.id)}
                  style={{ padding: '0.4rem 0.75rem', borderRadius: 8, border: '1.5px solid #ef4444', background: 'transparent', color: '#ef4444', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer' }}>
                  Delete
                </button>
              </div>

              {/* Conditions / Meds / Allergies */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {[
                  ['Conditions', selectedMember.conditions, '??', '#f59e0b'],
                  ['Medications', selectedMember.medications, '??', '#7c3aed'],
                  ['Allergies', selectedMember.allergies, '??', '#ef4444'],
                ].map(([label, items, icon, color]) => (
                  <div key={label} style={{ background: C.inner, borderRadius: 12, padding: '0.75rem', border: `1px solid ${C.inBdr}` }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color, textTransform: 'uppercase', marginBottom: '0.4rem' }}>{icon} {label}</div>
                    {items && items.length > 0 ? items.map((item, i) => (
                      <div key={i} style={{ fontSize: '0.78rem', color: C.text, marginBottom: '0.15rem' }}>• {item}</div>
                    )) : (
                      <div style={{ fontSize: '0.75rem', color: C.sub }}>None recorded</div>
                    )}
                  </div>
                ))}
              </div>

              {/* Health records */}
              <h4 style={{ margin: '0 0 0.75rem', fontWeight: 700, color: C.text, fontFamily: "'Outfit',sans-serif" }}>Health Records</h4>
              {(!selectedMember.health_records || selectedMember.health_records.length === 0) ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', background: C.inner, borderRadius: 12, border: `1px dashed ${C.inBdr}` }}>
                  <p style={{ color: C.sub, fontSize: '0.82rem', margin: 0 }}>No health records yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selectedMember.health_records.map((r, i) => (
                    <div key={i} style={{ padding: '0.75rem', background: C.inner, borderRadius: 10, border: `1px solid ${C.inBdr}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 700, color: C.text, fontSize: '0.82rem' }}>{r.title}</span>
                        <span style={{ fontSize: '0.7rem', color: C.sub }}>{r.date}</span>
                      </div>
                      {r.detail && <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: C.sub }}>{r.detail}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
