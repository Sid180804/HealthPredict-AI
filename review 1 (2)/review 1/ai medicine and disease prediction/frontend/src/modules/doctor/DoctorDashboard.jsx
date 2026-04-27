import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

// Sub-components
import PatientOverviewPanel from './PatientOverviewPanel';
import PrescriptionBuilder from './PrescriptionBuilder';
import DoctorNotes from './DoctorNotes';
import DoctorAnalytics from './DoctorAnalytics';
import PatientChat from './PatientChat';
import TestRecommender from './TestRecommender';
import FollowUpScheduler from './FollowUpScheduler';

const API = import.meta.env.VITE_API_BASE;
const ML_API = import.meta.env.VITE_API_BASE;

const todayStr = () => new Date().toISOString().split('T')[0];

const SEV_CFG = {
  urgent:   { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', label: 'URGENT' },
  critical: { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', label: 'CRITICAL' },
  high:     { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', label: 'HIGH' },
  moderate: { color: '#d97706', bg: '#fffbeb', border: '#fde68a', label: 'MODERATE' },
  low:      { color: '#059669', bg: '#ecfdf5', border: '#bbf7d0', label: 'LOW' },
  normal:   { color: '#059669', bg: '#ecfdf5', border: '#bbf7d0', label: 'NORMAL' },
};

const STATUS_CFG = {
  confirmed: { color: '#059669', bg: '#ecfdf5', label: 'Confirmed' },
  completed: { color: '#3b82f6', bg: '#eff6ff', label: 'Completed' },
  cancelled: { color: '#dc2626', bg: '#fef2f2', label: 'Cancelled' },
  pending:   { color: '#d97706', bg: '#fffbeb', label: 'Pending' },
};

const WEEK_DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

/* --------------------------------------------------------------------------- */
/*  Verification Banner                                                       */
/* --------------------------------------------------------------------------- */
function VerBanner({ status, reason }) {
  if (status === 'approved') return null;
  const cfg = {
    pending:  { bg: 'linear-gradient(135deg,#fff7ed,#ffedd5)', border: '#fed7aa', icon: '?', title: 'Verification Pending', body: 'Our admin team is reviewing your credentials. You can still use the dashboard.', color: '#c2410c' },
    rejected: { bg: 'linear-gradient(135deg,#fef2f2,#fee2e2)', border: '#fecaca', icon: '?', title: 'Application Rejected', body: reason || 'Your application was not approved. Please update your profile and contact support.', color: '#b91c1c' },
  };
  const c = cfg[status] || cfg.pending;
  return (
    <div style={{ background: c.bg, border: `1.5px solid ${c.border}`, borderRadius: 16, padding: '1.1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
      <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>{c.icon}</span>
      <div>
        <p style={{ margin: 0, fontWeight: 800, color: c.color, fontSize: '0.9rem' }}>{c.title}</p>
        <p style={{ margin: '0.2rem 0 0', color: c.color, fontSize: '0.82rem', opacity: 0.85 }}>{c.body}</p>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------- */
/*  Appointment Card (Smart Card with all patient info)                       */
/* --------------------------------------------------------------------------- */
function AppointmentCard({ appt, onViewPatient, onStartConsult, onComplete, onCancel, onPrescribe, onNotes, onChat, onTests, onFollowUp, isEmergency }) {
  const s = appt.status || 'confirmed';
  const sc = STATUS_CFG[s] || STATUS_CFG.pending;
  const severity = appt.severity || '';
  const sevCfg = SEV_CFG[severity.toLowerCase()] || null;
  const patientName = appt.user_name || appt.patient?.name || 'Patient';
  const isActive = s === 'confirmed';

  return (
    <div style={{
      background: '#fff', borderRadius: 16, overflow: 'hidden',
      border: isEmergency ? '2px solid #dc2626' : '1.5px solid #f1f5f9',
      boxShadow: isEmergency ? '0 4px 20px rgba(220,38,38,0.12)' : '0 2px 10px rgba(0,0,0,0.04)',
      transition: 'all 0.2s',
    }}>
      {/* Emergency strip */}
      {isEmergency && (
        <div style={{ background: 'linear-gradient(90deg,#dc2626,#ef4444)', padding: '0.25rem 1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ fontSize: '0.7rem' }}>??</span>
          <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Emergency Case — Priority Attention Required</span>
        </div>
      )}

      <div style={{ padding: '1.1rem 1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-start' }}>
          {/* Avatar */}
          <div onClick={() => onViewPatient(appt)} style={{
            width: 46, height: 46, borderRadius: '50%', flexShrink: 0, cursor: 'pointer',
            background: isEmergency ? 'linear-gradient(135deg,#dc2626,#ef4444)' : 'linear-gradient(135deg,#7c3aed,#a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: '1rem',
          }}>
            {patientName[0].toUpperCase()}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem', flexWrap: 'wrap' }}>
              <span onClick={() => onViewPatient(appt)} style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem', cursor: 'pointer' }}>{patientName}</span>
              <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: 99, background: sc.bg, color: sc.color }}>{sc.label}</span>
              {sevCfg && (
                <span style={{ fontSize: '0.6rem', fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: 99, background: sevCfg.bg, color: sevCfg.color, border: `1px solid ${sevCfg.border}` }}>{sevCfg.label}</span>
              )}
              {appt.appointment_type === 'priority' && (
                <span style={{ fontSize: '0.6rem', fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: 99, background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>? PRIORITY</span>
              )}
            </div>

            {/* Disease & symptoms */}
            <div style={{ fontSize: '0.76rem', color: '#64748b', marginBottom: '0.3rem' }}>
              {appt.disease && <span style={{ color: '#0f172a', fontWeight: 600 }}>?? {appt.disease}</span>}
              {appt.disease && ' · '}
              <span>{appt.consultation_type === 'video' ? '?? Video' : appt.consultation_type === 'chat' ? '?? Chat' : '?? Clinic'}</span>
              {' · '}<span>?? {appt.time || '—'}</span>
              {' · '}<span>?? ?{appt.consultation_fee || 0}</span>
            </div>

            {appt.symptoms?.length > 0 && (
              <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
                {appt.symptoms.slice(0, 5).map(sy => (
                  <span key={sy} style={{ fontSize: '0.62rem', fontWeight: 600, padding: '0.1rem 0.35rem', borderRadius: 5, background: '#fff7ed', color: '#d97706', border: '1px solid #fde68a' }}>{sy}</span>
                ))}
                {appt.symptoms.length > 5 && <span style={{ fontSize: '0.62rem', color: '#94a3b8' }}>+{appt.symptoms.length - 5}</span>}
              </div>
            )}

            {appt.doctor_notes && (
              <div style={{ fontSize: '0.72rem', color: '#3b82f6', background: '#eff6ff', padding: '0.3rem 0.5rem', borderRadius: 6, marginTop: '0.2rem', border: '1px solid #bfdbfe' }}>
                <strong>Notes:</strong> {appt.doctor_notes}
              </div>
            )}
          </div>

          {/* Booking ID */}
          <span style={{ fontSize: '0.6rem', color: '#cbd5e1', fontWeight: 600, flexShrink: 0 }}>#{appt.booking_id}</span>
        </div>

        {/* Action buttons */}
        {isActive && (
          <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.75rem', flexWrap: 'wrap', paddingLeft: '3.5rem' }}>
            <button onClick={() => onStartConsult(appt)} style={btnStyle('#059669', '#ecfdf5', '#bbf7d0')}>? Start</button>
            <button onClick={() => onComplete(appt.booking_id)} style={btnStyle('#3b82f6', '#eff6ff', '#bfdbfe')}>? Complete</button>
            <button onClick={() => onPrescribe(appt)} style={btnStyle('#7c3aed', '#faf5ff', '#e9d5ff')}>?? Rx</button>
            <button onClick={() => onTests(appt)} style={btnStyle('#0ea5e9', '#f0f9ff', '#bae6fd')}>?? Tests</button>
            <button onClick={() => onNotes(appt)} style={btnStyle('#64748b', '#f8fafc', '#e2e8f0')}>?? Notes</button>
            <button onClick={() => onChat(appt)} style={btnStyle('#8b5cf6', '#faf5ff', '#ddd6fe')}>?? Chat</button>
            <button onClick={() => onFollowUp(appt)} style={btnStyle('#059669', '#f0fdf4', '#bbf7d0')}>?? F/U</button>
            <button onClick={() => onCancel(appt.booking_id)} style={btnStyle('#dc2626', '#fef2f2', '#fecaca')}>? Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
}

function btnStyle(color, bg, border) {
  return {
    padding: '0.3rem 0.55rem', borderRadius: 7, border: `1.5px solid ${border}`,
    background: bg, color, fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
  };
}

/* --------------------------------------------------------------------------- */
/*  Tab Content Components                                                    */
/* --------------------------------------------------------------------------- */

function PatientsTabContent({ allAppts, isEmergency, onViewPatient, onPrescribe, onNotes, onChat, onTests, onFollowUp }) {
  const [search, setSearch] = useState('');
  const patientsMap = {};
  allAppts.forEach(a => {
    const key = a.user_email || a.user_name || 'unknown';
    if (!patientsMap[key]) {
      patientsMap[key] = { name: a.user_name || 'Patient', email: a.user_email || '', visits: [], diseases: [], severity: a.severity || 'normal', lastAppt: a };
    }
    patientsMap[key].visits.push(a);
    if (a.disease && !patientsMap[key].diseases.includes(a.disease)) patientsMap[key].diseases.push(a.disease);
    if (a.date > (patientsMap[key].lastAppt.date || '')) patientsMap[key].lastAppt = a;
    const sevOrder = { critical: 4, urgent: 3, high: 2, moderate: 1, low: 0, normal: 0 };
    if ((sevOrder[(a.severity || '').toLowerCase()] || 0) > (sevOrder[(patientsMap[key].severity || '').toLowerCase()] || 0)) {
      patientsMap[key].severity = a.severity;
    }
  });
  const patients = Object.values(patientsMap).filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.diseases.some(d => d.toLowerCase().includes(q)) || p.email.toLowerCase().includes(q);
  });

  return (
    <div style={{ background: '#fff', borderRadius: 20, padding: '1.5rem', border: '1.5px solid #f1f5f9', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit',sans-serif" }}>?? All Patients</h3>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, background: '#ede9fe', color: '#7c3aed', padding: '0.2rem 0.6rem', borderRadius: 99 }}>{patients.length} patient{patients.length !== 1 ? 's' : ''}</span>
      </div>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patients by name, disease, or email..."
        style={{ width: '100%', padding: '0.6rem 0.875rem', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: '0.82rem', outline: 'none', fontFamily: 'inherit', color: '#0f172a', marginBottom: '1rem' }} />
      {patients.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>??</div>
          <p style={{ fontWeight: 700, color: '#475569', margin: 0 }}>No patients found</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '0.75rem' }}>
          {patients.map((p, i) => {
            const sevCfg = SEV_CFG[(p.severity || '').toLowerCase()] || SEV_CFG.normal;
            return (
              <div key={i} style={{ background: '#f8fafc', borderRadius: 14, padding: '1rem 1.15rem', border: `1.5px solid ${isEmergency(p.lastAppt) ? '#fecaca' : '#f1f5f9'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.6rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: isEmergency(p.lastAppt) ? 'linear-gradient(135deg,#dc2626,#ef4444)' : 'linear-gradient(135deg,#7c3aed,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '0.9rem', flexShrink: 0 }}>
                    {p.name[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: '0.85rem', color: '#0f172a' }}>{p.name}</p>
                    <p style={{ margin: '0.1rem 0 0', fontSize: '0.7rem', color: '#94a3b8' }}>{p.email || 'No email'}</p>
                  </div>
                  <span style={{ fontSize: '0.6rem', fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: 99, background: sevCfg.bg, color: sevCfg.color, border: `1px solid ${sevCfg.border}` }}>{sevCfg.label}</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 700 }}>?? {p.diseases.length > 0 ? p.diseases.join(', ') : 'General'}</span>
                  <span style={{ margin: '0 0.4rem' }}>·</span>
                  <span>{p.visits.length} visit{p.visits.length !== 1 ? 's' : ''}</span>
                  <span style={{ margin: '0 0.4rem' }}>·</span>
                  <span>Last: {p.lastAppt.date || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                  <button onClick={() => onViewPatient(p.lastAppt)} style={btnStyle('#7c3aed', '#faf5ff', '#e9d5ff')}>?? View</button>
                  <button onClick={() => onPrescribe(p.lastAppt)} style={btnStyle('#059669', '#ecfdf5', '#bbf7d0')}>?? Rx</button>
                  <button onClick={() => onNotes(p.lastAppt)} style={btnStyle('#64748b', '#f8fafc', '#e2e8f0')}>?? Notes</button>
                  <button onClick={() => onChat(p.lastAppt)} style={btnStyle('#8b5cf6', '#faf5ff', '#ddd6fe')}>?? Chat</button>
                  <button onClick={() => onTests(p.lastAppt)} style={btnStyle('#0ea5e9', '#f0f9ff', '#bae6fd')}>?? Tests</button>
                  <button onClick={() => onFollowUp(p.lastAppt)} style={btnStyle('#059669', '#f0fdf4', '#bbf7d0')}>?? F/U</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PrescriptionsTabContent({ doctorName, onNewPrescription }) {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrescriptions = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (doctorName) params.append('doctor_name', doctorName);
        const res = await fetch(`${ML_API}/api/prescriptions?${params}`);
        const data = await res.json();
        setPrescriptions(data.prescriptions || []);
      } catch {}
      setLoading(false);
    };
    fetchPrescriptions();
  }, [doctorName]);

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
      <div style={{ width: 28, height: 28, border: '3px solid #e2e8f0', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 0.5rem' }} />
      Loading prescriptions...
    </div>
  );

  return (
    <div style={{ background: '#fff', borderRadius: 20, padding: '1.5rem', border: '1.5px solid #f1f5f9', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit',sans-serif" }}>?? Prescriptions</h3>
        <button onClick={onNewPrescription} style={{ padding: '0.5rem 1rem', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}>+ New Prescription</button>
      </div>
      {prescriptions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>??</div>
          <p style={{ fontWeight: 700, color: '#475569', margin: '0 0 0.3rem' }}>No prescriptions yet</p>
          <p style={{ fontSize: '0.82rem', margin: 0 }}>Prescriptions you create will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {prescriptions.map((rx, i) => (
            <div key={rx.id || i} style={{ background: '#f8fafc', borderRadius: 14, padding: '1rem 1.15rem', border: '1.5px solid #f1f5f9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: '0.85rem', color: '#0f172a' }}>{rx.patient_name || 'Patient'}</p>
                  <p style={{ margin: '0.1rem 0 0', fontSize: '0.7rem', color: '#94a3b8' }}>{rx.created_at ? new Date(rx.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'}</p>
                </div>
                <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '0.1rem 0.5rem', borderRadius: 99, background: '#ecfdf5', color: '#059669' }}>#{rx.booking_id || '—'}</span>
              </div>
              {rx.medicines && rx.medicines.length > 0 && (
                <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginTop: '0.3rem' }}>
                  {rx.medicines.map((m, j) => (
                    <span key={j} style={{ fontSize: '0.65rem', fontWeight: 600, padding: '0.15rem 0.4rem', borderRadius: 6, background: '#ede9fe', color: '#7c3aed' }}>
                      {typeof m === 'string' ? m : m.name || 'Medicine'}
                    </span>
                  ))}
                </div>
              )}
              {rx.diagnosis && <p style={{ margin: '0.4rem 0 0', fontSize: '0.75rem', color: '#64748b' }}>?? {rx.diagnosis}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NotesTabContent({ doctorName }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotes = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (doctorName) params.append('doctor_name', doctorName);
        const res = await fetch(`${ML_API}/api/doctor-notes?${params}`);
        const data = await res.json();
        setNotes(data.notes || []);
      } catch {}
      setLoading(false);
    };
    fetchNotes();
  }, [doctorName]);

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
      <div style={{ width: 28, height: 28, border: '3px solid #e2e8f0', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 0.5rem' }} />
      Loading notes...
    </div>
  );

  return (
    <div style={{ background: '#fff', borderRadius: 20, padding: '1.5rem', border: '1.5px solid #f1f5f9', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit',sans-serif" }}>?? Doctor Notes</h3>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, background: '#f1f5f9', color: '#64748b', padding: '0.2rem 0.6rem', borderRadius: 99 }}>{notes.length} note{notes.length !== 1 ? 's' : ''}</span>
      </div>
      {notes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>??</div>
          <p style={{ fontWeight: 700, color: '#475569', margin: '0 0 0.3rem' }}>No notes yet</p>
          <p style={{ fontSize: '0.82rem', margin: 0 }}>Private notes you add during consultations will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {notes.map((note, i) => (
            <div key={note.id || i} style={{ background: '#f8fafc', borderRadius: 14, padding: '1rem 1.15rem', border: '1.5px solid #f1f5f9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                <p style={{ margin: 0, fontWeight: 800, fontSize: '0.85rem', color: '#0f172a' }}>{note.patient_name || 'Patient'}</p>
                <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{note.created_at ? new Date(note.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</span>
              </div>
              {note.tags && note.tags.length > 0 && (
                <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                  {note.tags.map((tag, j) => (
                    <span key={j} style={{ fontSize: '0.6rem', fontWeight: 700, padding: '0.1rem 0.35rem', borderRadius: 5, background: tag === 'critical' ? '#fef2f2' : tag === 'allergy' ? '#fff7ed' : '#f0f9ff', color: tag === 'critical' ? '#dc2626' : tag === 'allergy' ? '#d97706' : '#0ea5e9' }}>{tag}</span>
                  ))}
                </div>
              )}
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#475569', lineHeight: 1.5 }}>{note.content || note.note || ''}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MessagesTabContent({ doctorName, bookingAppts, onOpenChat }) {
  const [showNewMsg, setShowNewMsg] = useState(false);
  const [standaloneMessages, setStandaloneMessages] = useState([]);

  const fetchStandaloneMessages = async () => {
    try {
      const params = new URLSearchParams();
      if (doctorName) params.append('doctor_name', doctorName);
      const res = await fetch(`${ML_API}/api/doctor-messages?${params}`);
      const data = await res.json();
      setStandaloneMessages(data.messages || []);
    } catch {}
  };

  useEffect(() => { fetchStandaloneMessages(); }, [doctorName]);

  const conversations = {};
  bookingAppts.forEach(a => {
    const key = a.user_email || a.user_name || 'unknown';
    if (!conversations[key] || (a.date > (conversations[key].date || ''))) {
      conversations[key] = a;
    }
  });
  const convList = Object.values(conversations);

  // Group standalone messages by patient
  const standaloneConvs = {};
  standaloneMessages.forEach(m => {
    const key = m.patient_email || m.patient_name || 'unknown';
    if (!standaloneConvs[key]) {
      standaloneConvs[key] = { patient_name: m.patient_name, patient_email: m.patient_email, messages: [], lastTimestamp: m.timestamp };
    }
    standaloneConvs[key].messages.push(m);
    if (m.timestamp > standaloneConvs[key].lastTimestamp) standaloneConvs[key].lastTimestamp = m.timestamp;
  });
  const standaloneList = Object.values(standaloneConvs).sort((a, b) => (b.lastTimestamp || '').localeCompare(a.lastTimestamp || ''));

  // Build patient list for the modal dropdown
  const patientOptions = {};
  bookingAppts.forEach(a => {
    const key = a.user_email || a.user_name || 'unknown';
    if (!patientOptions[key]) patientOptions[key] = { name: a.user_name || 'Patient', email: a.user_email || '', date: a.date || '' };
  });

  return (
    <div style={{ background: '#fff', borderRadius: 20, padding: '1.5rem', border: '1.5px solid #f1f5f9', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit',sans-serif" }}>?? Patient Messages</h3>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, background: '#ede9fe', color: '#7c3aed', padding: '0.2rem 0.6rem', borderRadius: 99 }}>{convList.length + standaloneList.length} conversation{(convList.length + standaloneList.length) !== 1 ? 's' : ''}</span>
          <button onClick={() => setShowNewMsg(true)} style={{ padding: '0.5rem 1rem', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            New Message
          </button>
        </div>
      </div>

      {convList.length === 0 && standaloneList.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>??</div>
          <p style={{ fontWeight: 700, color: '#475569', margin: '0 0 0.3rem' }}>No conversations yet</p>
          <p style={{ fontSize: '0.82rem', margin: '0 0 1rem' }}>Send a message to start a conversation with your patient.</p>
          <button onClick={() => setShowNewMsg(true)} style={{ padding: '0.65rem 1.5rem', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 4px 15px rgba(124,58,237,0.3)' }}>
            ?? Start Conversation
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {/* Booking-linked conversations */}
          {convList.map((a, i) => (
            <div key={`booking-${i}`} onClick={() => onOpenChat(a)} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.875rem 1rem', background: '#f8fafc', borderRadius: 14, border: '1.5px solid #f1f5f9', cursor: 'pointer', transition: 'all 0.15s' }}>
              <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '0.9rem', flexShrink: 0 }}>
                {(a.user_name || 'P')[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 800, fontSize: '0.85rem', color: '#0f172a' }}>{a.user_name || 'Patient'}</p>
                <p style={{ margin: '0.1rem 0 0', fontSize: '0.72rem', color: '#94a3b8' }}>{a.disease || 'General'} · {a.date || 'Recent'} · #{a.booking_id}</p>
              </div>
              <span style={{ fontSize: '0.78rem', color: '#7c3aed', fontWeight: 700 }}>Open ?</span>
            </div>
          ))}
          {/* Standalone conversations */}
          {standaloneList.map((conv, i) => (
            <div key={`standalone-${i}`} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.875rem 1rem', background: '#faf5ff', borderRadius: 14, border: '1.5px solid #e9d5ff' }}>
              <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg,#8b5cf6,#a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '0.9rem', flexShrink: 0 }}>
                {(conv.patient_name || 'P')[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 800, fontSize: '0.85rem', color: '#0f172a' }}>{conv.patient_name || 'Patient'}</p>
                <p style={{ margin: '0.1rem 0 0', fontSize: '0.72rem', color: '#94a3b8' }}>
                  {conv.messages.length} message{conv.messages.length !== 1 ? 's' : ''} · Last: {new Date(conv.lastTimestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </p>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {conv.messages[conv.messages.length - 1]?.message || ''}
                </p>
              </div>
              <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: 99, background: '#ede9fe', color: '#7c3aed' }}>Direct</span>
            </div>
          ))}
        </div>
      )}

      {/* New Message Modal */}
      {showNewMsg && (
        <NewMessageModal
          doctorName={doctorName}
          patients={Object.values(patientOptions)}
          onClose={() => setShowNewMsg(false)}
          onSent={() => { setShowNewMsg(false); fetchStandaloneMessages(); }}
        />
      )}
    </div>
  );
}

function NewMessageModal({ doctorName, patients, onClose, onSent }) {
  const [selectedPatient, setSelectedPatient] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const patientData = patients.find(p => (p.email || p.name) === selectedPatient);

  const handleSend = async () => {
    if (!message.trim() || !selectedPatient) return;
    setSending(true);
    try {
      await fetch(`${ML_API}/api/doctor-messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctor_name: doctorName,
          patient_name: patientData?.name || selectedPatient,
          patient_email: patientData?.email || '',
          message: message.trim(),
        }),
      });
      setSent(true);
      onSent?.();
      setTimeout(() => onClose?.(), 1200);
    } catch {}
    setSending(false);
  };

  if (sent) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: '2.5rem', textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>?</div>
          <h3 style={{ margin: '0 0 0.5rem', fontWeight: 800, color: '#059669', fontFamily: "'Outfit',sans-serif" }}>Message Sent</h3>
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Your message has been delivered to {patientData?.name || 'the patient'}.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}`}</style>
      <div style={{ background: '#fff', borderRadius: 20, width: 500, maxWidth: '95vw', animation: 'fadeUp 0.3s ease', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>

        {/* Header */}
        <div style={{ padding: '1.5rem 1.75rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit',sans-serif", display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              New Message
            </h2>
            <p style={{ margin: '0.15rem 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>Send a direct message to a patient</p>
          </div>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>?</button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.25rem 1.75rem' }}>
          <p style={{ margin: '0 0 0.4rem', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Select Patient</p>
          <select value={selectedPatient} onChange={e => setSelectedPatient(e.target.value)}
            style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: '0.85rem', outline: 'none', fontFamily: 'inherit', color: selectedPatient ? '#0f172a' : '#94a3b8', marginBottom: '1rem', background: '#fff' }}>
            <option value="">— Choose a patient —</option>
            {patients.map((p, i) => (
              <option key={i} value={p.email || p.name}>{p.name}{p.date ? ` · Last visit: ${p.date}` : ''}</option>
            ))}
          </select>

          <p style={{ margin: '0 0 0.4rem', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Message</p>
          <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Type your message to the patient..."
            rows={4} style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: '0.82rem', outline: 'none', fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.5, color: '#0f172a' }} />
        </div>

        {/* Footer */}
        <div style={{ padding: '1rem 1.75rem', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '0.6rem 1.25rem', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSend} disabled={sending || !message.trim() || !selectedPatient}
            style={{ padding: '0.6rem 1.5rem', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', opacity: (sending || !message.trim() || !selectedPatient) ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            {sending ? 'Sending...' : '? Send Message'}
          </button>
        </div>
      </div>
    </div>
  );
}

function TimelineTabContent({ allAppts, doctorName, bookingAppts }) {
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [customEvents, setCustomEvents] = useState([]);
  const [evtLoading, setEvtLoading] = useState(true);

  const fetchCustomEvents = async () => {
    try {
      const params = new URLSearchParams();
      if (doctorName) params.append('doctor_name', doctorName);
      const res = await fetch(`${ML_API}/api/doctor-timeline?${params}`);
      const data = await res.json();
      setCustomEvents(data.events || []);
    } catch {}
    setEvtLoading(false);
  };

  useEffect(() => { fetchCustomEvents(); }, [doctorName]);

  // Merge appointment-based entries + custom entries into one sorted list
  const apptEntries = allAppts.map(a => ({
    type: 'appointment',
    id: a.booking_id || a.id,
    date: a.date || '',
    time: a.time || '',
    title: a.user_name || 'Patient',
    subtitle: a.disease || 'Consultation',
    status: a.status || 'pending',
    fee: a.consultation_fee,
    symptoms: a.symptoms || [],
  }));

  const customEntries = customEvents.map(e => ({
    type: 'custom',
    id: e.id,
    date: e.date || '',
    time: '',
    title: e.title,
    subtitle: `${e.patient_name || 'Patient'}${e.description ? ' — ' + e.description : ''}`,
    status: e.event_type || 'custom',
    eventType: e.event_type,
    patientName: e.patient_name,
  }));

  const allEntries = [...apptEntries, ...customEntries].sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.time || '').localeCompare(a.time || ''));

  // Build patient list for modal
  const patientOptions = {};
  (bookingAppts || []).forEach(a => {
    const key = a.user_email || a.user_name || 'unknown';
    if (!patientOptions[key]) patientOptions[key] = { name: a.user_name || 'Patient', email: a.user_email || '' };
  });

  const EVENT_TYPE_CFG = {
    appointment: { color: '#3b82f6', bg: '#eff6ff', label: 'Appointment' },
    followup: { color: '#059669', bg: '#ecfdf5', label: 'Follow-up' },
    prescription: { color: '#7c3aed', bg: '#faf5ff', label: 'Prescription' },
    test: { color: '#0ea5e9', bg: '#f0f9ff', label: 'Test' },
    recovery: { color: '#059669', bg: '#ecfdf5', label: 'Recovery' },
    worsened: { color: '#dc2626', bg: '#fef2f2', label: 'Worsened' },
    custom: { color: '#64748b', bg: '#f8fafc', label: 'Note' },
  };

  return (
    <div style={{ background: '#fff', borderRadius: 20, padding: '1.5rem', border: '1.5px solid #f1f5f9', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit',sans-serif" }}>?? Medical Timeline</h3>
        <button onClick={() => setShowNewEntry(true)} style={{ padding: '0.5rem 1rem', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#059669,#047857)', color: '#fff', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
          Add Timeline Entry
        </button>
      </div>

      {allEntries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>??</div>
          <p style={{ fontWeight: 700, color: '#475569', margin: '0 0 0.3rem' }}>No timeline events yet</p>
          <p style={{ fontSize: '0.82rem', margin: '0 0 1rem' }}>Track patient progress by adding timeline entries.</p>
          <button onClick={() => setShowNewEntry(true)} style={{ padding: '0.65rem 1.5rem', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#059669,#047857)', color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 4px 15px rgba(5,150,105,0.3)' }}>
            ?? Create First Timeline Entry
          </button>
        </div>
      ) : (
        <div style={{ position: 'relative', paddingLeft: '2rem' }}>
          <div style={{ position: 'absolute', left: 7, top: 0, bottom: 0, width: 2, background: '#e2e8f0' }} />
          {allEntries.map((entry, i) => {
            let cfg;
            if (entry.type === 'appointment') {
              cfg = STATUS_CFG[entry.status] || STATUS_CFG.pending;
            } else {
              cfg = EVENT_TYPE_CFG[entry.eventType] || EVENT_TYPE_CFG.custom;
            }
            return (
              <div key={entry.id || i} style={{ position: 'relative', paddingBottom: '1.25rem' }}>
                <div style={{ position: 'absolute', left: -24, top: 2, width: 16, height: 16, borderRadius: '50%', background: cfg.bg, border: `2px solid ${cfg.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color }} />
                </div>
                <div style={{ background: entry.type === 'custom' ? '#f0fdf4' : '#f8fafc', borderRadius: 12, padding: '0.875rem 1rem', border: entry.type === 'custom' ? '1.5px solid #bbf7d0' : '1.5px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.3rem' }}>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: '0.82rem', color: '#0f172a' }}>{entry.title}</p>
                    <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: 99, background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                  </div>
                  <p style={{ margin: '0 0 0.2rem', fontSize: '0.75rem', color: '#64748b' }}>
                    {entry.type === 'appointment' ? (
                      <>
                        {entry.subtitle && <span style={{ fontWeight: 600 }}>?? {entry.subtitle}</span>}
                        {entry.subtitle && ' · '}
                        <span>?? {entry.date || 'N/A'}</span>
                        {entry.time && <span> · ?? {entry.time}</span>}
                        {entry.fee && <span> · ?? ?{entry.fee}</span>}
                      </>
                    ) : (
                      <>
                        <span>?? {entry.date || 'N/A'}</span>
                        {entry.subtitle && <span> · {entry.subtitle}</span>}
                      </>
                    )}
                  </p>
                  {entry.symptoms?.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.2rem', flexWrap: 'wrap' }}>
                      {entry.symptoms.slice(0, 4).map(sy => (
                        <span key={sy} style={{ fontSize: '0.6rem', fontWeight: 600, padding: '0.08rem 0.3rem', borderRadius: 4, background: '#fff7ed', color: '#d97706' }}>{sy}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Timeline Entry Modal */}
      {showNewEntry && (
        <TimelineEntryModal
          doctorName={doctorName}
          patients={Object.values(patientOptions)}
          onClose={() => setShowNewEntry(false)}
          onSaved={() => { setShowNewEntry(false); fetchCustomEvents(); }}
        />
      )}
    </div>
  );
}

function TimelineEntryModal({ doctorName, patients, onClose, onSaved }) {
  const [selectedPatient, setSelectedPatient] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [eventType, setEventType] = useState('custom');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const patientData = patients.find(p => (p.email || p.name) === selectedPatient);

  const QUICK_TITLES = [
    { label: 'Follow-up scheduled', type: 'followup' },
    { label: 'Prescription updated', type: 'prescription' },
    { label: 'Blood test recommended', type: 'test' },
    { label: 'Patient recovered', type: 'recovery' },
    { label: 'Condition worsened', type: 'worsened' },
  ];

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await fetch(`${ML_API}/api/doctor-timeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctor_name: doctorName,
          patient_name: patientData?.name || selectedPatient || '',
          patient_email: patientData?.email || '',
          title: title.trim(),
          description: description.trim(),
          date: eventDate,
          event_type: eventType,
        }),
      });
      setSaved(true);
      onSaved?.();
      setTimeout(() => onClose?.(), 1200);
    } catch {}
    setSaving(false);
  };

  if (saved) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: '2.5rem', textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>?</div>
          <h3 style={{ margin: '0 0 0.5rem', fontWeight: 800, color: '#059669', fontFamily: "'Outfit',sans-serif" }}>Timeline Entry Added</h3>
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>{title}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}`}</style>
      <div style={{ background: '#fff', borderRadius: 20, width: 520, maxWidth: '95vw', animation: 'fadeUp 0.3s ease', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>

        {/* Header */}
        <div style={{ padding: '1.5rem 1.75rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit',sans-serif", display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
              Add Timeline Entry
            </h2>
            <p style={{ margin: '0.15rem 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>Record a medical event for a patient</p>
          </div>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>?</button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.25rem 1.75rem' }}>

          {/* Quick Title selectors */}
          <p style={{ margin: '0 0 0.4rem', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quick Select</p>
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {QUICK_TITLES.map(qt => (
              <button key={qt.label} onClick={() => { setTitle(qt.label); setEventType(qt.type); }}
                style={{ padding: '0.35rem 0.65rem', borderRadius: 8, border: title === qt.label ? '1.5px solid #059669' : '1.5px solid #e2e8f0', background: title === qt.label ? '#ecfdf5' : '#f8fafc', color: title === qt.label ? '#059669' : '#475569', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                {qt.label}
              </button>
            ))}
          </div>

          {/* Patient select */}
          <p style={{ margin: '0 0 0.4rem', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Select Patient</p>
          <select value={selectedPatient} onChange={e => setSelectedPatient(e.target.value)}
            style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: '0.85rem', outline: 'none', fontFamily: 'inherit', color: selectedPatient ? '#0f172a' : '#94a3b8', marginBottom: '1rem', background: '#fff' }}>
            <option value="">— Choose a patient (optional) —</option>
            {patients.map((p, i) => (
              <option key={i} value={p.email || p.name}>{p.name}</option>
            ))}
          </select>

          {/* Event Title */}
          <p style={{ margin: '0 0 0.4rem', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Event Title</p>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Follow-up scheduled, Blood test recommended..."
            style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: '0.85rem', outline: 'none', fontFamily: 'inherit', color: '#0f172a', marginBottom: '1rem' }} />

          {/* Description */}
          <p style={{ margin: '0 0 0.4rem', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</p>
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Additional details about this event..."
            rows={3} style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: '0.82rem', outline: 'none', fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.5, color: '#0f172a', marginBottom: '1rem' }} />

          {/* Date */}
          <p style={{ margin: '0 0 0.4rem', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Event Date</p>
          <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)}
            style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: '0.85rem', outline: 'none', fontFamily: 'inherit', color: '#0f172a' }} />
        </div>

        {/* Footer */}
        <div style={{ padding: '1rem 1.75rem', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '0.6rem 1.25rem', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving || !title.trim()}
            style={{ padding: '0.6rem 1.5rem', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#059669,#047857)', color: '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', opacity: (saving || !title.trim()) ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            {saving ? 'Saving...' : '?? Add Entry'}
          </button>
        </div>
      </div>
    </div>
  );
}

function FollowUpsTabContent({ doctorName }) {
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFollowups = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (doctorName) params.append('doctor_name', doctorName);
        const res = await fetch(`${ML_API}/api/followups?${params}`);
        const data = await res.json();
        setFollowups(data.followups || []);
      } catch {}
      setLoading(false);
    };
    fetchFollowups();
  }, [doctorName]);

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
      <div style={{ width: 28, height: 28, border: '3px solid #e2e8f0', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 0.5rem' }} />
      Loading follow-ups...
    </div>
  );

  const upcoming = followups.filter(f => f.follow_up_date >= new Date().toISOString().split('T')[0]);
  const past = followups.filter(f => f.follow_up_date < new Date().toISOString().split('T')[0]);

  return (
    <div style={{ background: '#fff', borderRadius: 20, padding: '1.5rem', border: '1.5px solid #f1f5f9', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit',sans-serif" }}>?? Follow-Up Schedule</h3>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, background: '#ecfdf5', color: '#059669', padding: '0.2rem 0.6rem', borderRadius: 99 }}>{upcoming.length} upcoming</span>
      </div>
      {followups.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>??</div>
          <p style={{ fontWeight: 700, color: '#475569', margin: '0 0 0.3rem' }}>No follow-ups scheduled</p>
          <p style={{ fontSize: '0.82rem', margin: 0 }}>Schedule follow-ups from appointment cards.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {upcoming.length > 0 && <p style={{ margin: '0 0 0.25rem', fontSize: '0.72rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Upcoming</p>}
          {upcoming.map((f, i) => (
            <div key={f.id || i} style={{ background: '#f0fdf4', borderRadius: 14, padding: '1rem 1.15rem', border: '1.5px solid #bbf7d0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: '0.85rem', color: '#0f172a' }}>{f.patient_name || 'Patient'}</p>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: '#64748b' }}>{f.reason || 'Follow-up visit'}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: '0.82rem', color: '#059669' }}>
                    {f.follow_up_date ? new Date(f.follow_up_date + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </p>
                  <p style={{ margin: '0.1rem 0 0', fontSize: '0.65rem', color: '#94a3b8' }}>#{f.booking_id || '—'}</p>
                </div>
              </div>
            </div>
          ))}
          {past.length > 0 && <p style={{ margin: '0.75rem 0 0.25rem', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Past</p>}
          {past.map((f, i) => (
            <div key={f.id || `past-${i}`} style={{ background: '#f8fafc', borderRadius: 14, padding: '1rem 1.15rem', border: '1.5px solid #f1f5f9', opacity: 0.7 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '0.85rem', color: '#475569' }}>{f.patient_name || 'Patient'}</p>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>{f.reason || 'Follow-up visit'}</p>
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>
                  {f.follow_up_date ? new Date(f.follow_up_date + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------------------------------------- */
/*  Main Dashboard                                                            */
/* --------------------------------------------------------------------------- */
export default function DoctorDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Core state
  const [profile, setProfile] = useState(null);
  const [appts, setAppts] = useState([]);
  const [bookingAppts, setBookingAppts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [tab, setTab] = useState('overview');
  const [toast, setToast] = useState(null);

  // Filters
  const [apptFilter, setApptFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('list'); // list | calendar

  // Modals
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [prescribeAppt, setPrescribeAppt] = useState(null);
  const [notesAppt, setNotesAppt] = useState(null);
  const [chatAppt, setChatAppt] = useState(null);
  const [testsAppt, setTestsAppt] = useState(null);
  const [followUpAppt, setFollowUpAppt] = useState(null);

  // Notifications
  const [docNotifs, setDocNotifs] = useState([
    { id: 1, text: 'New appointment request from a patient', time: 'Just now', read: false, icon: '??' },
    { id: 2, text: 'New message from patient', time: '15 min ago', read: false, icon: '??' },
    { id: 3, text: 'Follow-up reminder: Check lab results', time: '1 hr ago', read: false, icon: '??' },
  ]);
  const [notifOpen, setNotifOpen] = useState(false);
  const docNotifRef = useRef(null);

  const doctorName = user?.name || '';

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* -- Data Fetching ------------------------------------------ */
  const fetchBookings = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (doctorName) params.append('doctor_name', doctorName);
      const res = await fetch(`${ML_API}/api/appointments?${params}`);
      const data = await res.json();
      setBookingAppts(data.appointments || []);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    }
  }, [doctorName]);

  const fetchAll = useCallback(async () => {
    try {
      const [pRes, aRes] = await Promise.all([
        axios.get(`${API}/api/doctor/profile`).catch(() => ({ data: {} })),
        axios.get(`${API}/api/doctor/appointments`, { params: { date: todayStr() } }).catch(() => ({ data: {} })),
      ]);
      setProfile(pRes.data.profile || pRes.data || {});
      setAppts(aRes.data.appointments || aRes.data || []);
    } catch (err) {
      console.error('Failed to fetch doctor data:', err);
    }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); fetchBookings(); }, [fetchAll, fetchBookings]);

  /* -- Actions ------------------------------------------------ */
  const toggleOnline = async () => {
    setToggling(true);
    try {
      const res = await axios.put(`${API}/api/doctor/toggle-online`);
      setProfile(p => ({ ...p, is_online: res.data.is_online ?? !p?.is_online }));
      showToast(profile?.is_online ? 'You are now offline' : 'You are now online');
    } catch { showToast('Failed to update status', 'error'); }
    setToggling(false);
  };

  const handleComplete = async (bookingId) => {
    try {
      await fetch(`${ML_API}/api/appointments/${bookingId}/status`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });
      showToast('Appointment completed');
      fetchBookings();
    } catch { showToast('Failed to update', 'error'); }
  };

  const handleCancel = async (bookingId) => {
    try {
      await fetch(`${ML_API}/api/appointments/${bookingId}/status`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });
      showToast('Appointment cancelled');
      fetchBookings();
    } catch { showToast('Failed to cancel', 'error'); }
  };

  const handleStartConsult = (appt) => {
    if (appt.video_link && appt.consultation_type === 'video') {
      window.open(appt.video_link, '_blank');
    } else {
      setSelectedPatient(appt);
    }
    showToast(`Consultation started for ${appt.user_name || 'Patient'}`);
  };

  /* -- Derived Data ------------------------------------------- */
  const isOnline = profile?.is_online;
  const verStatus = profile?.verification_status || 'pending';
  const today = todayStr();

  const todayBookings = bookingAppts.filter(a => a.date === today && a.status !== 'cancelled');
  const allAppts = [...appts, ...bookingAppts];

  // Emergency patients (high/critical/urgent severity) at top
  const isEmergency = (a) => {
    const sev = (a.severity || '').toLowerCase();
    return ['urgent', 'critical', 'high'].includes(sev) || a.appointment_type === 'priority';
  };

  // Search filter
  const searchFilter = (a) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (a.user_name || '').toLowerCase().includes(q)
      || (a.disease || '').toLowerCase().includes(q)
      || (a.date || '').includes(q)
      || (a.booking_id || '').toLowerCase().includes(q);
  };

  // Status filter
  const statusFilter = (a) => {
    if (apptFilter === 'all') return true;
    if (apptFilter === 'today') return a.date === today && a.status !== 'cancelled';
    return (a.status || 'pending') === apptFilter;
  };

  const filteredAppts = allAppts.filter(a => searchFilter(a) && statusFilter(a));

  // Sort: emergency first, then by time
  const sortedAppts = [...filteredAppts].sort((a, b) => {
    if (isEmergency(a) && !isEmergency(b)) return -1;
    if (!isEmergency(a) && isEmergency(b)) return 1;
    return (a.time || '').localeCompare(b.time || '');
  });

  // Stats
  const todayCount = todayBookings.length + appts.filter(a => a.status !== 'cancelled').length;
  const confirmedCount = allAppts.filter(a => a.status === 'confirmed').length;
  const completedCount = allAppts.filter(a => a.status === 'completed').length;
  const emergencyCount = allAppts.filter(a => isEmergency(a) && a.status === 'confirmed').length;

  // Profile strength
  const pFields = ['specialization', 'experience_years', 'fees', 'city', 'bio', 'license_number'];
  const pFilled = pFields.filter(f => profile?.[f] || profile?.[f.replace('experience_years','experience')]?.toString()).length;
  const pPct = Math.round((pFilled / pFields.length) * 100);

  const greeting = (() => { const h = new Date().getHours(); return h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening'; })();

  // Calendar view data
  const calendarDates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    calendarDates.push({
      date: dateStr,
      day: d.toLocaleDateString('en-IN', { weekday: 'short' }),
      num: d.getDate(),
      month: d.toLocaleDateString('en-IN', { month: 'short' }),
      appointments: bookingAppts.filter(a => a.date === dateStr && a.status !== 'cancelled'),
    });
  }

  /* -- Loading State ------------------------------------------ */
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', flexDirection: 'column', gap: '1rem', fontFamily: "'Inter',sans-serif" }}>
      <div style={{ width: 44, height: 44, border: '3px solid #e2e8f0', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 500 }}>Loading your dashboard…</p>
      <style>{`@keyframes spin{100%{transform:rotate(360deg)}}`}</style>
    </div>
  );

  /* -- Render ------------------------------------------------- */
  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: "'Inter',system-ui,sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@600;700;800;900&display=swap');
        @keyframes spin{100%{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        .doc-btn:hover{transform:translateY(-2px)!important}
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: '1.25rem', right: '1.25rem', zIndex: 2000, padding: '0.875rem 1.25rem', borderRadius: 12, fontWeight: 700, fontSize: '0.85rem', background: toast.type === 'error' ? '#fef2f2' : '#f0fdf4', color: toast.type === 'error' ? '#dc2626' : '#15803d', border: `1px solid ${toast.type === 'error' ? '#fecaca' : '#bbf7d0'}`, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}>
          {toast.msg}
        </div>
      )}

      {/* -- Header Bar --------------------------------------- */}
      <div style={{ background: '#fff', borderBottom: '1px solid #f1f5f9', height: 68, padding: '0 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            </div>
            <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>HealthAssist</span>
          </div>
          <span style={{ background: '#faf5ff', color: '#7e22ce', border: '1px solid #e9d5ff', padding: '0.18rem 0.6rem', borderRadius: 6, fontSize: '0.7rem', fontWeight: 700 }}>DOCTOR PANEL</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Notification Bell */}
          <div style={{ position: 'relative' }} ref={docNotifRef}>
            <button onClick={() => setNotifOpen(o => !o)} style={{
              width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: notifOpen ? '#f1f5f9' : 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', transition: 'all 0.2s'
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              {docNotifs.filter(n => !n.read).length > 0 && (
                <span style={{ position: 'absolute', top: 4, right: 2, minWidth: 16, height: 16, borderRadius: 99, background: '#ef4444', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 800, color: '#fff', padding: '0 3px' }}>
                  {docNotifs.filter(n => !n.read).length}
                </span>
              )}
            </button>
            {notifOpen && (
              <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 340, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, boxShadow: '0 12px 36px rgba(0,0,0,0.12)', overflow: 'hidden', zIndex: 200, animation: 'fadeIn 0.2s ease' }}>
                <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                  <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>Notifications</h4>
                  <button onClick={() => setDocNotifs(prev => prev.map(n => ({ ...n, read: true })))} style={{ background: 'none', border: 'none', fontSize: '0.72rem', fontWeight: 700, color: '#059669', cursor: 'pointer' }}>Mark all read</button>
                </div>
                <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                  {docNotifs.map(n => (
                    <div key={n.id} onClick={() => setDocNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))} style={{
                      padding: '0.75rem 1rem', borderBottom: '1px solid #f8fafc', display: 'flex', gap: '0.65rem', alignItems: 'flex-start',
                      background: n.read ? '#fff' : '#f8fafc', cursor: 'pointer', transition: 'all 0.15s'
                    }}>
                      <span style={{ fontSize: '1rem', flexShrink: 0 }}>{n.icon}</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: n.read ? 500 : 700, color: n.read ? '#64748b' : '#0f172a', lineHeight: 1.4 }}>{n.text}</p>
                        <p style={{ margin: '0.15rem 0 0', fontSize: '0.7rem', color: '#94a3b8' }}>{n.time}</p>
                      </div>
                      {!n.read && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#059669', flexShrink: 0, marginTop: 5 }} />}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* Online toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 99, padding: '0.4rem 0.875rem', cursor: 'pointer' }} onClick={toggleOnline}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: isOnline ? '#22c55e' : '#cbd5e1', boxShadow: isOnline ? '0 0 0 3px rgba(34,197,94,0.2)' : 'none', animation: isOnline ? 'pulse 2s infinite' : 'none' }} />
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: isOnline ? '#15803d' : '#94a3b8' }}>{toggling ? 'Updating…' : isOnline ? 'Online' : 'Offline'}</span>
            <div style={{ width: 36, height: 20, borderRadius: 99, background: isOnline ? '#059669' : '#e2e8f0', position: 'relative', transition: 'background 0.3s', flexShrink: 0 }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: isOnline ? 19 : 3, transition: 'left 0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
            </div>
          </div>
          {/* Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '0.875rem' }}>{user?.name?.[0]?.toUpperCase() || 'D'}</div>
            <div>
              <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>Dr. {user?.name}</p>
              <p style={{ margin: 0, fontSize: '0.68rem', color: '#94a3b8' }}>{profile?.specialization || 'General Physician'}</p>
            </div>
          </div>
          <button onClick={() => navigate('/doctor/onboard')} style={{ padding: '0.45rem 0.875rem', border: '1.5px solid #e9d5ff', borderRadius: 8, background: '#faf5ff', color: '#7c3aed', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>Edit Profile</button>
          <button onClick={logout} style={{ padding: '0.45rem 0.875rem', border: '1.5px solid #e2e8f0', borderRadius: 8, background: '#fff', color: '#64748b', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>Logout</button>
        </div>
      </div>

      {/* -- Body ----------------------------------------------- */}
      <div style={{ maxWidth: 1360, margin: '0 auto', padding: '2rem 1.5rem', animation: 'fadeUp 0.4s ease' }}>

        <VerBanner status={verStatus} reason={profile?.rejection_reason} />

        {/* Welcome hero */}
        <div style={{ background: 'linear-gradient(135deg,#0f172a 0%,#3b0764 60%,#0f172a 100%)', borderRadius: 22, padding: '2rem 2.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle,rgba(124,58,237,0.2) 0%,transparent 70%)', top: -100, right: 50 }} />
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)', backgroundSize: '30px 30px' }} />
          <div style={{ position: 'relative' }}>
            <p style={{ margin: '0 0 0.25rem', fontSize: '0.75rem', color: 'rgba(167,139,250,0.9)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{greeting} ??</p>
            <h1 style={{ margin: 0, fontSize: 'clamp(1.5rem,2.5vw,2.1rem)', fontWeight: 900, color: '#fff', fontFamily: "'Outfit',sans-serif" }}>Dr. {user?.name}</h1>
            <p style={{ margin: '0.35rem 0 0', color: 'rgba(255,255,255,0.55)', fontSize: '0.875rem' }}>
              {todayCount} appointment{todayCount !== 1 ? 's' : ''} today · {confirmedCount} active · {emergencyCount > 0 ? `?? ${emergencyCount} emergency` : `${completedCount} completed`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.875rem', position: 'relative', flexWrap: 'wrap' }}>
            <button className="doc-btn" onClick={() => navigate('/doctor/onboard')} style={{ padding: '0.75rem 1.4rem', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', boxShadow: '0 6px 20px rgba(124,58,237,0.4)', transition: 'all 0.25s' }}>
              ?? Update Profile
            </button>
            <button className="doc-btn" onClick={() => setTab('appointments')} style={{ padding: '0.75rem 1.4rem', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.2)', borderRadius: 12, fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.25s' }}>
              ?? All Appointments
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '0.875rem', marginBottom: '1.5rem' }}>
          {[
            { icon: '??', label: "Today", value: todayCount, color: '#7c3aed', sub: 'Appointments' },
            { icon: '?', label: 'Active', value: confirmedCount, color: '#059669', sub: 'Confirmed' },
            { icon: '??', label: 'Completed', value: completedCount, color: '#3b82f6', sub: 'All time' },
            { icon: '??', label: 'Emergency', value: emergencyCount, color: '#dc2626', sub: emergencyCount > 0 ? 'Needs attention' : 'None' },
            { icon: '?', label: 'Rating', value: profile?.rating || '4.8', color: '#f59e0b', sub: `${profile?.total_reviews || 47} reviews` },
            { icon: '??', label: 'Fee', value: profile?.fees ? `?${profile.fees}` : profile?.consultation_fee ? `?${profile.consultation_fee}` : '?500', color: '#059669', sub: 'Per session' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', borderRadius: 16, padding: '1.1rem', border: '1.5px solid #f1f5f9', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: `${s.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', marginBottom: '0.6rem' }}>{s.icon}</div>
              <p style={{ margin: '0 0 0.1rem', fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p>
              <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', fontFamily: "'Outfit',sans-serif", lineHeight: 1 }}>{s.value}</p>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.68rem', color: '#94a3b8' }}>{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '0.25rem', background: '#e2e8f0', padding: '0.3rem', borderRadius: 13, marginBottom: '1.5rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {[
            ['overview','?? Overview'],
            ['appointments','?? Appointments'],
            ['patients','?? Patients'],
            ['prescriptions','?? Prescriptions'],
            ['notes','?? Notes'],
            ['messages','?? Messages'],
            ['timeline','?? Timeline'],
            ['followups','?? Follow-ups'],
            ['analytics','?? Analytics'],
            ['emergency','?? Emergency'],
            ['profile','?? Profile'],
            ['earnings','?? Earnings'],
          ].map(([id,label]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              padding: '0.55rem 1rem', borderRadius: 10, border: 'none', fontWeight: 700,
              fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
              background: tab === id ? (id === 'emergency' ? '#fef2f2' : '#fff') : 'transparent',
              color: tab === id ? (id === 'emergency' ? '#dc2626' : '#0f172a') : '#64748b',
              boxShadow: tab === id ? '0 2px 6px rgba(0,0,0,0.1)' : 'none',
              position: 'relative',
            }}>
              {label}
              {id === 'emergency' && emergencyCount > 0 && (
                <span style={{ position: 'absolute', top: 2, right: 2, width: 8, height: 8, borderRadius: '50%', background: '#dc2626', animation: 'pulse 2s infinite' }} />
              )}
            </button>
          ))}
        </div>

        {/* -- OVERVIEW TAB ------------------------------------ */}
        {tab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              {/* Today's Appointments */}
              <div style={{ background: '#fff', borderRadius: 20, padding: '1.5rem', border: '1.5px solid #f1f5f9', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit',sans-serif" }}>Today's Schedule</h3>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, background: '#ede9fe', color: '#7c3aed', padding: '0.2rem 0.6rem', borderRadius: 99 }}>{new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'short'})}</span>
                </div>
                {todayBookings.length === 0 && appts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>???</div>
                    <p style={{ fontWeight: 700, color: '#475569', margin: '0 0 0.3rem' }}>No appointments today</p>
                    <p style={{ fontSize: '0.82rem', margin: 0 }}>{isOnline ? 'Patients will appear once they book.' : 'Go online to start.'}</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                    {todayBookings.sort((a, b) => {
                      if (isEmergency(a) && !isEmergency(b)) return -1;
                      if (!isEmergency(a) && isEmergency(b)) return 1;
                      return (a.time || '').localeCompare(b.time || '');
                    }).slice(0, 6).map(a => (
                      <AppointmentCard key={a.booking_id} appt={a} isEmergency={isEmergency(a)}
                        onViewPatient={setSelectedPatient} onStartConsult={handleStartConsult}
                        onComplete={handleComplete} onCancel={handleCancel}
                        onPrescribe={setPrescribeAppt} onNotes={setNotesAppt}
                        onChat={setChatAppt} onTests={setTestsAppt} onFollowUp={setFollowUpAppt}
                      />
                    ))}
                    {(todayBookings.length + appts.length) > 6 && (
                      <button onClick={() => setTab('appointments')} style={{ padding: '0.7rem', background: '#f8fafc', border: '1.5px dashed #e2e8f0', borderRadius: 12, color: '#7c3aed', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>View all appointments ?</button>
                    )}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div style={{ background: '#fff', borderRadius: 20, padding: '1.5rem', border: '1.5px solid #f1f5f9', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
                <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit',sans-serif" }}>Quick Actions</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '0.75rem' }}>
                  {[
                    { icon: '??', label: 'Update Profile', sub: 'Credentials & bio', path: '/doctor/onboard', color: '#7c3aed', bg: '#faf5ff', border: '#e9d5ff' },
                    { icon: '??', label: 'All Appointments', sub: 'Full schedule', action: () => setTab('appointments'), color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
                    { icon: '??', label: 'Analytics', sub: 'Performance data', action: () => setTab('analytics'), color: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd' },
                    { icon: '??', label: 'View Earnings', sub: 'Revenue report', action: () => setTab('earnings'), color: '#059669', bg: '#f0fdf4', border: '#bbf7d0' },
                  ].map((a,i) => (
                    <button key={i} onClick={a.action || (() => navigate(a.path))} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '1rem', background: a.bg, border: `1.5px solid ${a.border}`, borderRadius: 14, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
                      <span style={{ fontSize: '1.2rem' }}>{a.icon}</span>
                      <div>
                        <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 800, color: a.color }}>{a.label}</p>
                        <p style={{ margin: 0, fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.1rem' }}>{a.sub}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              {/* Profile Strength */}
              <div style={{ background: '#fff', borderRadius: 20, padding: '1.5rem', border: '1.5px solid #f1f5f9', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
                <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit',sans-serif" }}>Profile Strength</h3>
                <div style={{ position: 'relative', width: 90, height: 90, margin: '0 auto 1rem' }}>
                  <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#f1f5f9" strokeWidth="10"/>
                    <circle cx="50" cy="50" r="42" fill="none"
                      stroke={pPct >= 80 ? '#7c3aed' : pPct >= 50 ? '#f59e0b' : '#ef4444'}
                      strokeWidth="10" strokeLinecap="round"
                      strokeDasharray={`${(pPct/100)*264} 264`}
                      style={{ transition: 'stroke-dasharray 1s ease' }}
                    />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0f172a', fontFamily: "'Outfit',sans-serif" }}>{pPct}%</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.75rem' }}>
                  {[['Specialization', !!profile?.specialization],['Experience', !!(profile?.experience_years||profile?.experience)],['Fees', !!(profile?.fees||profile?.consultation_fee)],['City', !!(profile?.city||user?.city)],['Bio', !!profile?.bio],['License No.', !!profile?.license_number]].map(([label, done]) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: 14, height: 14, borderRadius: 4, background: done ? '#7c3aed' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {done && <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><polyline points="2 6 5 9 10 3"/></svg>}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: done ? '#475569' : '#94a3b8', fontWeight: done ? 600 : 400 }}>{label}</span>
                    </div>
                  ))}
                </div>
                {pPct < 100 && (
                  <button onClick={() => navigate('/doctor/onboard')} style={{ width: '100%', padding: '0.65rem', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', border: 'none', borderRadius: 11, fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>Complete Profile ?</button>
                )}
              </div>

              {/* Performance */}
              <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e293b)', borderRadius: 20, padding: '1.25rem' }}>
                <h3 style={{ margin: '0 0 0.875rem', fontSize: '0.9rem', fontWeight: 800, color: 'white', fontFamily: "'Outfit',sans-serif" }}>Performance</h3>
                {[['Patient Satisfaction','96%','#34d399'],['Appointment Completion','89%','#818cf8'],['Response Rate','94%','#fbbf24']].map(([label,val,color]) => (
                  <div key={label} style={{ marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>{label}</span>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color }}>{val}</span>
                    </div>
                    <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 99 }}>
                      <div style={{ width: val, height: '100%', background: color, borderRadius: 99, transition: 'width 1s ease' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* -- APPOINTMENTS TAB -------------------------------- */}
        {tab === 'appointments' && (
          <div style={{ background: '#fff', borderRadius: 20, padding: '1.5rem', border: '1.5px solid #f1f5f9', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>

            {/* Search & Filters */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit',sans-serif" }}>All Appointments</h3>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {/* View toggle */}
                <div style={{ display: 'flex', gap: '0.2rem', background: '#f1f5f9', padding: '0.2rem', borderRadius: 8 }}>
                  <button onClick={() => setViewMode('list')} style={{ padding: '0.3rem 0.6rem', borderRadius: 6, border: 'none', fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer', background: viewMode === 'list' ? '#fff' : 'transparent', color: viewMode === 'list' ? '#0f172a' : '#94a3b8' }}>? List</button>
                  <button onClick={() => setViewMode('calendar')} style={{ padding: '0.3rem 0.6rem', borderRadius: 6, border: 'none', fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer', background: viewMode === 'calendar' ? '#fff' : 'transparent', color: viewMode === 'calendar' ? '#0f172a' : '#94a3b8' }}>?? Calendar</button>
                </div>
              </div>
            </div>

            {/* Search bar */}
            <div style={{ marginBottom: '1rem' }}>
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by patient name, disease, date, or booking ID..."
                style={{ width: '100%', padding: '0.6rem 0.875rem', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: '0.82rem', outline: 'none', fontFamily: 'inherit', color: '#0f172a' }} />
            </div>

            {/* Status filters */}
            <div style={{ display: 'flex', gap: '0.3rem', background: '#f1f5f9', padding: '0.25rem', borderRadius: 10, marginBottom: '1rem', flexWrap: 'wrap' }}>
              {[['all','All'],['today','Today'],['confirmed','Active'],['completed','Completed'],['cancelled','Cancelled']].map(([id, label]) => (
                <button key={id} onClick={() => setApptFilter(id)} style={{ padding: '0.4rem 0.875rem', borderRadius: 8, border: 'none', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', textTransform: 'capitalize', background: apptFilter === id ? '#fff' : 'transparent', color: apptFilter === id ? '#0f172a' : '#64748b', boxShadow: apptFilter === id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>{label}</button>
              ))}
            </div>

            {/* Calendar View */}
            {viewMode === 'calendar' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '0.5rem', marginBottom: '1.25rem' }}>
                {calendarDates.map(cd => (
                  <div key={cd.date} style={{ background: cd.date === today ? '#faf5ff' : '#f8fafc', borderRadius: 12, padding: '0.75rem', border: cd.date === today ? '2px solid #7c3aed' : '1.5px solid #f1f5f9', textAlign: 'center', minHeight: 100 }}>
                    <p style={{ margin: 0, fontSize: '0.68rem', fontWeight: 700, color: cd.date === today ? '#7c3aed' : '#94a3b8' }}>{cd.day}</p>
                    <p style={{ margin: '0.1rem 0 0.4rem', fontSize: '1.2rem', fontWeight: 800, color: cd.date === today ? '#7c3aed' : '#0f172a', fontFamily: "'Outfit',sans-serif" }}>{cd.num}</p>
                    {cd.appointments.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        {cd.appointments.slice(0, 3).map(a => (
                          <div key={a.booking_id} onClick={() => setSelectedPatient(a)} style={{
                            fontSize: '0.6rem', fontWeight: 600, padding: '0.15rem 0.3rem', borderRadius: 4, cursor: 'pointer',
                            background: isEmergency(a) ? '#fef2f2' : '#ecfdf5',
                            color: isEmergency(a) ? '#dc2626' : '#059669',
                          }}>
                            {a.time?.slice(0, 5)} {(a.user_name || '').split(' ')[0]}
                          </div>
                        ))}
                        {cd.appointments.length > 3 && <span style={{ fontSize: '0.6rem', color: '#94a3b8' }}>+{cd.appointments.length - 3} more</span>}
                      </div>
                    ) : (
                      <p style={{ fontSize: '0.62rem', color: '#cbd5e1', margin: 0 }}>No appts</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              sortedAppts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>??</div>
                  <p style={{ fontWeight: 700, color: '#475569', margin: 0 }}>No {apptFilter !== 'all' ? apptFilter : ''} appointments found</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {sortedAppts.map(a => (
                    <AppointmentCard key={a.id || a.booking_id} appt={a} isEmergency={isEmergency(a)}
                      onViewPatient={setSelectedPatient} onStartConsult={handleStartConsult}
                      onComplete={handleComplete} onCancel={handleCancel}
                      onPrescribe={setPrescribeAppt} onNotes={setNotesAppt}
                      onChat={setChatAppt} onTests={setTestsAppt} onFollowUp={setFollowUpAppt}
                    />
                  ))}
                </div>
              )
            )}

            <p style={{ margin: '0.75rem 0 0', fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>
              Showing {sortedAppts.length} of {allAppts.length} total appointments
            </p>
          </div>
        )}

        {/* -- ANALYTICS TAB ----------------------------------- */}
        {tab === 'analytics' && <DoctorAnalytics doctorName={doctorName} />}

        {/* -- PROFILE TAB ------------------------------------- */}
        {tab === 'profile' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div style={{ background: '#fff', borderRadius: 20, padding: '1.75rem', border: '1.5px solid #f1f5f9', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.75rem', paddingBottom: '1.5rem', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ width: 70, height: 70, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: '1.75rem', flexShrink: 0 }}>{user?.name?.[0]?.toUpperCase()}</div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', fontFamily: "'Outfit',sans-serif" }}>Dr. {user?.name}</h2>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>{profile?.specialization || 'General Physician'} · {profile?.city || user?.city || 'Location not set'}</p>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: 99, background: verStatus === 'approved' ? '#ecfdf5' : '#fff7ed', color: verStatus === 'approved' ? '#059669' : '#d97706' }}>{verStatus === 'approved' ? '? Verified' : '? Pending'}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {[
                  ['Email', user?.email],
                  ['Specialization', profile?.specialization || 'Not set'],
                  ['Experience', profile?.experience_years || profile?.experience ? `${profile.experience_years || profile.experience} years` : 'Not set'],
                  ['Fee', profile?.fees || profile?.consultation_fee ? `?${profile.fees || profile.consultation_fee}` : 'Not set'],
                  ['City', profile?.city || user?.city || 'Not set'],
                  ['License No.', profile?.license_number || 'Not set'],
                ].map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0.875rem', background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 11 }}>
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>{label}</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>{val}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => navigate('/doctor/onboard')} style={{ marginTop: '1.25rem', width: '100%', padding: '0.75rem', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>Edit Profile ?</button>
            </div>
            <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e293b)', borderRadius: 20, padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#fff', fontFamily: "'Outfit',sans-serif" }}>About</h3>
              <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: '1.25rem', border: '1px solid rgba(255,255,255,0.08)', flex: 1 }}>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', lineHeight: 1.7, margin: 0, fontStyle: profile?.bio ? 'normal' : 'italic' }}>
                  {profile?.bio || 'No bio added yet. Complete your profile to tell patients about your expertise.'}
                </p>
              </div>
              {[['?','Rating','4.8 / 5.0'],['??','Total Patients','127'],['??','Satisfaction','96%'],['??','This Month','34']].map(([icon,label,val]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: '0.75rem 1rem', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <span style={{ fontSize: '1rem' }}>{icon}</span>
                  <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>{label}</span>
                  <span style={{ marginLeft: 'auto', fontSize: '0.9rem', fontWeight: 900, color: '#fff', fontFamily: "'Outfit',sans-serif" }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* -- EARNINGS TAB ------------------------------------ */}
        {tab === 'earnings' && (() => {
          const completed = allAppts.filter(a => a.status === 'completed');
          const totalEarnings = completed.reduce((s, a) => s + (a.consultation_fee || 0), 0);
          const totalPatients = new Set(completed.map(a => a.user_email || a.user_name)).size;
          const avgSession = completed.length > 0 ? Math.round(totalEarnings / completed.length) : 0;

          // Weekly earnings from real data
          const now = new Date();
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay() + 1); // Monday
          weekStart.setHours(0,0,0,0);
          const weekEarnings = [0,0,0,0,0,0,0];
          completed.forEach(a => {
            if (!a.date) return;
            const d = new Date(a.date + 'T12:00:00');
            if (d >= weekStart) {
              const dayIdx = (d.getDay() + 6) % 7; // Mon=0
              weekEarnings[dayIdx] += (a.consultation_fee || 0);
            }
          });
          const weekTotal = weekEarnings.reduce((s, v) => s + v, 0);

          // Monthly earnings
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          const monthEarnings = completed.filter(a => a.date && new Date(a.date + 'T12:00:00') >= monthStart).reduce((s, a) => s + (a.consultation_fee || 0), 0);

          return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1rem' }}>
              {[
                { label: 'This Week', value: `?${weekTotal.toLocaleString()}`, color: '#059669' },
                { label: 'This Month', value: `?${monthEarnings.toLocaleString()}`, color: '#7c3aed' },
                { label: 'Total Patients', value: `${totalPatients}`, color: '#0ea5e9' },
                { label: 'Avg. Per Session', value: `?${avgSession.toLocaleString()}`, color: '#f59e0b' },
              ].map(s => (
                <div key={s.label} style={{ background: '#fff', borderRadius: 18, padding: '1.4rem', border: '1.5px solid #f1f5f9' }}>
                  <p style={{ margin: '0 0 0.5rem', fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p>
                  <p style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', fontFamily: "'Outfit',sans-serif", lineHeight: 1 }}>{s.value}</p>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '0.15rem 0.5rem', borderRadius: 99, marginTop: '0.5rem', display: 'inline-block' }}>{completed.length} completed</span>
                </div>
              ))}
            </div>
            <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e293b)', borderRadius: 20, padding: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontWeight: 800, color: '#fff', fontFamily: "'Outfit',sans-serif", fontSize: '1rem' }}>Weekly Breakdown</h3>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>Revenue by day</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 900, color: '#34d399', fontFamily: "'Outfit',sans-serif", lineHeight: 1 }}>?{weekTotal.toLocaleString()}</p>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>Total this week</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.875rem', height: 140 }}>
                {WEEK_DAYS.map((d, i) => {
                  const max = Math.max(...weekEarnings, 1);
                  const barH = Math.round((weekEarnings[i] / max) * 110);
                  const isToday = i === (new Date().getDay() + 6) % 7;
                  return (
                    <div key={d} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: isToday ? '#34d399' : 'rgba(255,255,255,0.4)' }}>?{weekEarnings[i]>=1000?`${(weekEarnings[i]/1000).toFixed(1)}k`:weekEarnings[i]}</span>
                      <div style={{ width: '100%', height: barH || 2, background: isToday ? 'linear-gradient(180deg,#34d399,#059669)' : (weekEarnings[i] > 0 ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)'), borderRadius: '6px 6px 0 0', transition: 'height 0.8s ease', boxShadow: isToday ? '0 0 12px rgba(52,211,153,0.4)' : 'none' }} />
                      <span style={{ fontSize: '0.7rem', color: isToday ? '#34d399' : 'rgba(255,255,255,0.35)', fontWeight: isToday ? 800 : 500 }}>{d}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          );
        })()}

        {/* -- PATIENTS TAB ----------------------------------- */}
        {tab === 'patients' && <PatientsTabContent
          allAppts={allAppts} isEmergency={isEmergency}
          onViewPatient={setSelectedPatient} onPrescribe={setPrescribeAppt}
          onNotes={setNotesAppt} onChat={setChatAppt} onTests={setTestsAppt}
          onFollowUp={setFollowUpAppt}
        />}

        {/* -- PRESCRIPTIONS TAB ------------------------------- */}
        {tab === 'prescriptions' && <PrescriptionsTabContent
          doctorName={doctorName} onNewPrescription={() => {
            if (bookingAppts.filter(a => a.status === 'confirmed').length > 0) {
              setPrescribeAppt(bookingAppts.filter(a => a.status === 'confirmed')[0]);
            }
          }}
        />}

        {/* -- NOTES TAB --------------------------------------- */}
        {tab === 'notes' && <NotesTabContent doctorName={doctorName} />}

        {/* -- MESSAGES TAB ------------------------------------ */}
        {tab === 'messages' && <MessagesTabContent
          doctorName={doctorName} bookingAppts={bookingAppts}
          onOpenChat={setChatAppt}
        />}

        {/* -- TIMELINE TAB ------------------------------------ */}
        {tab === 'timeline' && <TimelineTabContent allAppts={allAppts} doctorName={doctorName} bookingAppts={bookingAppts} />}

        {/* -- FOLLOW-UPS TAB ---------------------------------- */}
        {tab === 'followups' && <FollowUpsTabContent doctorName={doctorName} />}

        {/* -- EMERGENCY TAB ----------------------------------- */}
        {tab === 'emergency' && (
          <div style={{ background: '#fff', borderRadius: 20, padding: '1.5rem', border: '2px solid #fecaca', boxShadow: '0 4px 20px rgba(220,38,38,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '1.5rem' }}>??</span>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#dc2626', fontFamily: "'Outfit',sans-serif" }}>Emergency Cases</h3>
                <p style={{ margin: '0.1rem 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                  {emergencyCount} active emergency patient{emergencyCount !== 1 ? 's' : ''} requiring priority attention
                </p>
              </div>
            </div>
            {allAppts.filter(a => isEmergency(a) && a.status === 'confirmed').length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>?</div>
                <p style={{ fontWeight: 700, color: '#059669', margin: '0 0 0.3rem' }}>No Emergency Cases</p>
                <p style={{ fontSize: '0.82rem', margin: 0 }}>All patients are at normal or moderate severity levels.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {allAppts
                  .filter(a => isEmergency(a) && a.status !== 'cancelled')
                  .sort((a, b) => {
                    const sevOrder = { critical: 0, urgent: 1, high: 2 };
                    return (sevOrder[(a.severity || '').toLowerCase()] ?? 3) - (sevOrder[(b.severity || '').toLowerCase()] ?? 3);
                  })
                  .map(a => (
                    <AppointmentCard key={a.id || a.booking_id} appt={a} isEmergency
                      onViewPatient={setSelectedPatient} onStartConsult={handleStartConsult}
                      onComplete={handleComplete} onCancel={handleCancel}
                      onPrescribe={setPrescribeAppt} onNotes={setNotesAppt}
                      onChat={setChatAppt} onTests={setTestsAppt} onFollowUp={setFollowUpAppt}
                    />
                  ))
                }
              </div>
            )}
          </div>
        )}
      </div>

      {/* -- MODALS --------------------------------------------- */}
      {selectedPatient && <PatientOverviewPanel patient={selectedPatient} onClose={() => setSelectedPatient(null)} />}
      {prescribeAppt && <PrescriptionBuilder appointment={prescribeAppt} doctorName={doctorName} onClose={() => setPrescribeAppt(null)} onSaved={fetchBookings} />}
      {notesAppt && <DoctorNotes appointment={notesAppt} doctorName={doctorName} onClose={() => setNotesAppt(null)} />}
      {chatAppt && <PatientChat appointment={chatAppt} doctorName={doctorName} onClose={() => setChatAppt(null)} />}
      {testsAppt && <TestRecommender appointment={testsAppt} doctorName={doctorName} onClose={() => setTestsAppt(null)} onSaved={fetchBookings} />}
      {followUpAppt && <FollowUpScheduler appointment={followUpAppt} doctorName={doctorName} onClose={() => setFollowUpAppt(null)} onSaved={fetchBookings} />}
    </div>
  );
}
