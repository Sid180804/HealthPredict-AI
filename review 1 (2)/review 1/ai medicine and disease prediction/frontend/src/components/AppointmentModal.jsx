import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useIsDark from '../hooks/useIsDark';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_BASE;

export default function AppointmentModal({ doctor, onClose, disease = '', symptoms = [], severity = '' }) {
  const isDark = useIsDark();
  const navigate = useNavigate();
  const { user } = useAuth();

  const C = {
    card: isDark ? '#1e293b' : '#ffffff',
    border: isDark ? '#334155' : '#e2e8f0',
    text: isDark ? '#f1f5f9' : '#0f172a',
    sub: isDark ? '#94a3b8' : '#64748b',
    inner: isDark ? '#0f172a' : '#f8fafc',
    inBdr: isDark ? '#334155' : '#f1f5f9',
    input: isDark ? '#0f172a' : '#ffffff',
    inpBdr: isDark ? '#475569' : '#e2e8f0',
  };

  const [slots, setSlots] = useState({});
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [consultType, setConsultType] = useState('in_person');
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [slotsError, setSlotsError] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);

  const isPriority = severity && ['high', 'critical', 'urgent'].includes(severity.toLowerCase());

  useEffect(() => {
    if (!doctor) return;
    const fetchSlots = async () => {
      setSlotsLoading(true);
      try {
        const res = await fetch(`${API}/api/doctors/${doctor.id}/future-slots?days=7`);
        const data = await res.json();
        setSlots(data.slots || {});

        // Auto-select first Sunday if priority booking
        if (isPriority) {
          const sundayDate = Object.entries(data.slots || {}).find(([, v]) => v.is_sunday);
          if (sundayDate) {
            setSelectedDate(sundayDate[0]);
          }
        }
      } catch (err) {
        setSlots({});
        setSlotsError('Failed to load available slots. Please try again.');
      }
      setSlotsLoading(false);
    };
    fetchSlots();
  }, [doctor]);

  const handleBook = async () => {
    if (!selectedDate || !selectedTime) return;
    setBookingLoading(true);
    try {
      const res = await fetch(`${API}/api/book-appointment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctor_id: doctor.id,
          user_name: user?.name || 'Patient',
          user_email: user?.email || '',
          user_id: user?.email || 'default',
          date: selectedDate,
          time: selectedTime,
          symptoms,
          disease,
          severity,
          consultation_type: consultType,
          appointment_type: isPriority ? 'priority' : 'normal',
        }),
      });
      const data = await res.json();
      setBookingResult(data);
      if (data.success) {
        setSlots(prev => {
          const copy = JSON.parse(JSON.stringify(prev));
          if (copy[selectedDate]?.slots) {
            copy[selectedDate].slots = copy[selectedDate].slots.filter(t => t !== selectedTime);
          }
          return copy;
        });
      }
    } catch (err) {
      setBookingResult({ success: false, error: 'Network error — please check your connection and try again.' });
    }
    setBookingLoading(false);
  };

  const sortedDates = Object.keys(slots).sort();

  // Separate Sunday priority dates
  const sundayDates = sortedDates.filter(d => slots[d]?.is_sunday);
  const regularDates = sortedDates.filter(d => !slots[d]?.is_sunday);

  const selectedDayInfo = slots[selectedDate];
  const isSundaySelected = selectedDayInfo?.is_sunday;
  const currentSlots = selectedDayInfo?.slots || [];

  if (!doctor) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: C.card, borderRadius: 24, padding: '2rem', width: '100%', maxWidth: 560,
        maxHeight: '92vh', overflowY: 'auto', border: `1.5px solid ${C.border}`,
        animation: 'bd-modal 0.25s ease forwards',
      }}>
        <style>{`@keyframes bd-modal{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}`}</style>

        {bookingResult?.success ? (
          /* -- SUCCESS -- */
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#ecfdf5,#d1fae5)', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.2rem', boxShadow: '0 8px 30px rgba(5,150,105,0.2)' }}>?</div>
            <h2 style={{ margin: '0 0 0.3rem', fontWeight: 900, color: C.text, fontFamily: "'Outfit',sans-serif", fontSize: '1.3rem' }}>Appointment Confirmed!</h2>
            <p style={{ color: C.sub, fontSize: '0.85rem', marginBottom: '1.5rem' }}>{bookingResult.message}</p>

            {bookingResult.appointment?.appointment_type === 'priority' && (
              <div style={{ padding: '0.6rem 1rem', background: 'linear-gradient(135deg,#fef3c7,#fff7ed)', borderRadius: 10, border: '1.5px solid #fbbf24', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                <span style={{ fontSize: '1rem' }}>??</span>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#92400e' }}>Priority Emergency Booking</span>
              </div>
            )}

            <div style={{ background: C.inner, borderRadius: 14, padding: '1.25rem', textAlign: 'left', border: `1px solid ${C.inBdr}`, marginBottom: '1.25rem' }}>
              {[
                ['Booking ID', `#${bookingResult.booking_id}`],
                ['Doctor', bookingResult.appointment?.doctor_name],
                ['Specialty', bookingResult.appointment?.specialization],
                ['Date', bookingResult.appointment?.date],
                ['Time', bookingResult.appointment?.time],
                ['Type', bookingResult.appointment?.consultation_type === 'video' ? '?? Video Call' : bookingResult.appointment?.consultation_type === 'chat' ? '?? Chat' : '?? Clinic Visit'],
                ['Fee', `?${bookingResult.appointment?.consultation_fee}`],
              ].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.45rem 0', borderBottom: `1px solid ${C.inBdr}` }}>
                  <span style={{ fontSize: '0.82rem', color: C.sub }}>{label}</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: C.text }}>{val}</span>
                </div>
              ))}
            </div>

            {bookingResult.appointment?.video_link && (
              <div style={{ padding: '0.75rem', background: isDark ? '#7c3aed20' : '#ede9fe', borderRadius: 10, marginBottom: '1rem', border: '1px solid #7c3aed30' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase' }}>Video Call Link</div>
                <div style={{ fontSize: '0.8rem', color: C.text, fontWeight: 600, wordBreak: 'break-all' }}>{bookingResult.appointment.video_link}</div>
              </div>
            )}

            <p style={{ fontSize: '0.78rem', color: C.sub, marginBottom: '1.25rem' }}>?? {bookingResult.reminder}</p>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => navigate('/appointments')}
                style={{ flex: 1, padding: '0.7rem', borderRadius: 10, border: `1.5px solid ${C.border}`, background: 'transparent', color: C.text, fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
                ?? View All
              </button>
              <button onClick={onClose}
                style={{ flex: 1, padding: '0.7rem', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#059669,#047857)', color: '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
                Done ?
              </button>
            </div>
          </div>
        ) : (
          /* -- BOOKING FORM -- */
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ margin: '0 0 0.25rem', fontWeight: 900, color: C.text, fontFamily: "'Outfit',sans-serif", fontSize: '1.2rem' }}>Book Appointment</h2>
                <p style={{ margin: 0, color: C.sub, fontSize: '0.82rem' }}>with {doctor.name}</p>
              </div>
              <button onClick={onClose} style={{ background: C.inner, border: `1px solid ${C.inBdr}`, width: 32, height: 32, borderRadius: '50%', fontSize: '1.1rem', color: C.sub, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            </div>

            {/* Doctor summary */}
            <div style={{ display: 'flex', gap: '0.875rem', padding: '1rem', background: C.inner, borderRadius: 14, border: `1px solid ${C.inBdr}`, marginBottom: '1.25rem' }}>
              <img src={doctor.profile_image} alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ fontWeight: 700, color: C.text, fontSize: '0.88rem' }}>{doctor.name}</span>
                  {doctor.verified && <span style={{ fontSize: '0.55rem', fontWeight: 700, padding: '0.08rem 0.3rem', borderRadius: 4, background: '#ecfdf5', color: '#059669' }}>?? Verified</span>}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>{doctor.specialization}</div>
                <div style={{ fontSize: '0.72rem', color: C.sub }}>{doctor.clinic} · ?{doctor.consultation_fee} · {doctor.experience_years}y exp</div>
              </div>
            </div>

            {/* Diagnosis badge */}
            {disease && (
              <div style={{ padding: '0.65rem 0.875rem', background: isDark ? '#f59e0b15' : '#fff7ed', borderRadius: 10, border: '1.5px solid #f59e0b30', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.88rem' }}>??</span>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 700 }}>Diagnosis: {disease}</span>
                  {severity && <span style={{ marginLeft: '0.5rem', fontSize: '0.65rem', fontWeight: 700, padding: '0.1rem 0.35rem', borderRadius: 4, background: isPriority ? '#fef2f2' : '#f1f5f9', color: isPriority ? '#dc2626' : '#64748b' }}>{severity.toUpperCase()}</span>}
                </div>
              </div>
            )}

            {/* Priority notice */}
            {isPriority && (
              <div style={{
                padding: '0.75rem 1rem', marginBottom: '1.25rem', borderRadius: 12,
                background: 'linear-gradient(135deg,#fef2f2,#fff7ed)',
                border: '1.5px solid #fca5a5',
                display: 'flex', gap: '0.6rem', alignItems: 'flex-start',
              }}>
                <span style={{ fontSize: '1.2rem' }}>??</span>
                <div>
                  <p style={{ margin: 0, fontWeight: 800, color: '#dc2626', fontSize: '0.82rem' }}>Priority Consultation Recommended</p>
                  <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: '#92400e' }}>
                    Based on diagnosis severity. Sunday priority slots are highlighted below.
                  </p>
                </div>
              </div>
            )}

            {/* Consultation type */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: C.sub, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Consultation Type</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {[
                  { id: 'in_person', icon: '??', label: 'Clinic Visit' },
                  { id: 'video', icon: '??', label: 'Video Call' },
                  { id: 'chat', icon: '??', label: 'Chat Consult' },
                ].map(ct => (
                  <button key={ct.id}
                    disabled={ct.id === 'video' && !doctor.video_consultation}
                    onClick={() => setConsultType(ct.id)}
                    style={{
                      flex: 1, padding: '0.65rem 0.5rem', borderRadius: 12, cursor: (ct.id === 'video' && !doctor.video_consultation) ? 'not-allowed' : 'pointer',
                      border: `1.5px solid ${consultType === ct.id ? '#059669' : C.border}`,
                      background: consultType === ct.id ? (isDark ? '#05966920' : '#ecfdf5') : C.input,
                      opacity: (ct.id === 'video' && !doctor.video_consultation) ? 0.4 : 1,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem',
                      transition: 'all 0.15s',
                    }}>
                    <span style={{ fontSize: '1.1rem' }}>{ct.icon}</span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: consultType === ct.id ? '#059669' : C.sub }}>{ct.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Date selection */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: C.sub, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Select Date</label>
              {slotsLoading ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: C.sub, fontSize: '0.85rem' }}>
                  <div style={{ width: 28, height: 28, border: '3px solid #e2e8f0', borderTopColor: '#059669', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 0.5rem' }} />
                  Loading available slots...
                  <style>{`@keyframes spin{100%{transform:rotate(360deg)}}`}</style>
                </div>
              ) : slotsError ? (
                <div style={{ padding: '1rem', background: isDark ? '#7f1d1d20' : '#fef2f2', borderRadius: 10, border: '1px solid #fca5a5', textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#ef4444', fontWeight: 600 }}>{slotsError}</p>
                  <button onClick={() => { setSlotsError(''); setSlotsLoading(true); }} style={{ marginTop: '0.5rem', padding: '0.4rem 1rem', borderRadius: 8, border: `1px solid ${C.border}`, background: C.input, color: C.text, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>Retry</button>
                </div>
              ) : sortedDates.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: C.sub, background: C.inner, borderRadius: 10 }}>No available slots this week</div>
              ) : (
                <>
                  {/* Sunday priority dates first if priority booking */}
                  {isPriority && sundayDates.length > 0 && (
                    <div style={{ marginBottom: '0.6rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.05em' }}>? Priority Consultation Day</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {sundayDates.map(d => {
                          const dateObj = new Date(d + 'T12:00:00');
                          const dayNum = dateObj.getDate();
                          const month = dateObj.toLocaleDateString('en-IN', { month: 'short' });
                          const isActive = selectedDate === d;
                          return (
                            <button key={d} onClick={() => { setSelectedDate(d); setSelectedTime(''); }}
                              style={{
                                padding: '0.55rem 0.8rem', borderRadius: 12, cursor: 'pointer',
                                border: `2px solid ${isActive ? '#d97706' : '#fbbf24'}`,
                                background: isActive ? 'linear-gradient(135deg,#fef3c7,#fff7ed)' : (isDark ? '#78350f20' : '#fffbeb'),
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.1rem', minWidth: 60,
                                boxShadow: isActive ? '0 0 12px rgba(251,191,36,0.3)' : '0 0 8px rgba(251,191,36,0.15)',
                                position: 'relative',
                              }}>
                              <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#d97706' }}>Sun</span>
                              <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#92400e' }}>{dayNum}</span>
                              <span style={{ fontSize: '0.58rem', color: '#b45309' }}>{month}</span>
                              <span style={{ position: 'absolute', top: -6, right: -6, fontSize: '0.55rem', fontWeight: 800, padding: '0.08rem 0.25rem', borderRadius: 4, background: '#dc2626', color: '#fff' }}>??</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Regular dates */}
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {(isPriority ? regularDates : sortedDates).map(d => {
                      const dayInfo = slots[d];
                      const dateObj = new Date(d + 'T12:00:00');
                      const dayName = dateObj.toLocaleDateString('en-IN', { weekday: 'short' });
                      const dayNum = dateObj.getDate();
                      const month = dateObj.toLocaleDateString('en-IN', { month: 'short' });
                      const isActive = selectedDate === d;
                      const isSunday = dayInfo?.is_sunday;
                      return (
                        <button key={d} onClick={() => { setSelectedDate(d); setSelectedTime(''); }}
                          style={{
                            padding: '0.55rem 0.8rem', borderRadius: 12, cursor: 'pointer',
                            border: `1.5px solid ${isActive ? (isSunday ? '#fbbf24' : '#059669') : C.border}`,
                            background: isActive ? (isSunday ? (isDark ? '#78350f20' : '#fffbeb') : (isDark ? '#05966920' : '#ecfdf5')) : C.input,
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.1rem', minWidth: 55,
                            boxShadow: isSunday ? '0 0 8px rgba(251,191,36,0.15)' : 'none',
                            position: 'relative',
                          }}>
                          <span style={{ fontSize: '0.62rem', fontWeight: 600, color: isActive ? (isSunday ? '#d97706' : '#059669') : C.sub }}>{dayName}</span>
                          <span style={{ fontSize: '1rem', fontWeight: 800, color: isActive ? (isSunday ? '#92400e' : '#059669') : C.text }}>{dayNum}</span>
                          <span style={{ fontSize: '0.58rem', color: C.sub }}>{month}</span>
                          {isSunday && (
                            <span style={{ position: 'absolute', top: -5, right: -5, fontSize: '0.55rem', fontWeight: 800, padding: '0.06rem 0.2rem', borderRadius: 4, background: '#fbbf24', color: '#78350f' }}>?</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Time slots */}
            {selectedDate && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: C.sub, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {isSundaySelected ? '? Priority Time Slots' : 'Select Time Slot'}
                  </label>
                  {isSundaySelected && (
                    <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '0.1rem 0.35rem', borderRadius: 4, background: '#fef3c7', color: '#92400e', border: '1px solid #fbbf24' }}>
                      Emergency Available
                    </span>
                  )}
                </div>

                {currentSlots.length === 0 ? (
                  <div style={{ padding: '1rem', textAlign: 'center', color: C.sub, fontSize: '0.82rem', background: C.inner, borderRadius: 10 }}>
                    No available slots for this day
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {currentSlots.map(t => {
                      const isActive = selectedTime === t;
                      return (
                        <button key={t} onClick={() => setSelectedTime(t)}
                          style={{
                            padding: '0.5rem 0.8rem', borderRadius: 10, cursor: 'pointer',
                            border: `1.5px solid ${isActive ? (isSundaySelected ? '#fbbf24' : '#059669') : C.border}`,
                            background: isActive
                              ? (isSundaySelected ? 'linear-gradient(135deg,#fbbf24,#f59e0b)' : '#059669')
                              : C.input,
                            color: isActive ? '#fff' : C.text,
                            fontWeight: 600, fontSize: '0.78rem', fontFamily: 'inherit',
                            boxShadow: isActive
                              ? (isSundaySelected ? '0 0 12px rgba(251,191,36,0.4)' : '0 0 10px rgba(5,150,105,0.3)')
                              : 'none',
                            transition: 'all 0.15s',
                          }}>
                          {t}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Booking summary */}
            {selectedDate && selectedTime && (
              <div style={{
                padding: '1rem', borderRadius: 14, marginBottom: '1.25rem',
                background: isSundaySelected
                  ? 'linear-gradient(135deg,#fef3c7,#fff7ed)'
                  : (isDark ? '#05966915' : '#ecfdf5'),
                border: `1.5px solid ${isSundaySelected ? '#fbbf24' : '#a7f3d0'}`,
              }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: isSundaySelected ? '#92400e' : '#059669', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.04em' }}>
                  {isSundaySelected ? '? Priority Booking Summary' : 'Booking Summary'}
                </div>
                <div style={{ fontSize: '0.85rem', color: C.text, fontWeight: 600 }}>
                  <strong>{doctor.name}</strong> — {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} at <strong>{selectedTime}</strong>
                </div>
                <div style={{ fontSize: '0.78rem', color: C.sub, marginTop: '0.2rem' }}>
                  {consultType === 'video' ? '?? Video' : consultType === 'chat' ? '?? Chat' : '?? Clinic'} · ?{doctor.consultation_fee}
                  {isSundaySelected && ' · ?? Priority Slot'}
                </div>
              </div>
            )}

            {/* Error */}
            {bookingResult && !bookingResult.success && (
              <div style={{ padding: '0.75rem', background: isDark ? '#7f1d1d20' : '#fef2f2', borderRadius: 10, border: '1px solid #fca5a5', marginBottom: '1rem' }}>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#ef4444', fontWeight: 600 }}>?? {bookingResult.error}</p>
              </div>
            )}

            {/* Book button */}
            <button onClick={handleBook} disabled={!selectedDate || !selectedTime || bookingLoading}
              style={{
                width: '100%', padding: '0.8rem', borderRadius: 14, border: 'none', fontFamily: 'inherit',
                background: (selectedDate && selectedTime)
                  ? (isSundaySelected ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'linear-gradient(135deg,#059669,#047857)')
                  : (isDark ? '#334155' : '#e2e8f0'),
                color: (selectedDate && selectedTime) ? '#fff' : C.sub,
                fontWeight: 800, fontSize: '0.92rem',
                cursor: (selectedDate && selectedTime) ? 'pointer' : 'not-allowed',
                boxShadow: (selectedDate && selectedTime)
                  ? (isSundaySelected ? '0 6px 20px rgba(245,158,11,0.35)' : '0 6px 20px rgba(5,150,105,0.3)')
                  : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              }}>
              {bookingLoading ? (
                <>
                  <div style={{ width: 18, height: 18, border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Booking...
                </>
              ) : (
                <>
                  {isSundaySelected && selectedDate && selectedTime ? '?? Confirm Priority Booking' : '? Confirm Appointment'}
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
