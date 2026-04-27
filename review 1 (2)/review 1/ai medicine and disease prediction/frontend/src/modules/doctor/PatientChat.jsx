import { useState, useEffect, useRef } from 'react';

const ML_API = import.meta.env.VITE_API_BASE;

export default function PatientChat({ appointment, doctorName, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${ML_API}/api/doctor-chat?booking_id=${appointment?.booking_id || ''}`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch {}
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    setSending(true);
    try {
      await fetch(`${ML_API}/api/doctor-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: appointment?.booking_id || '',
          sender: doctorName,
          sender_role: 'doctor',
          recipient: appointment?.user_name || '',
          message: input.trim(),
        }),
      });
      setInput('');
      fetchMessages();
    } catch {}
    setSending(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}`}</style>
      <div style={{ background: '#fff', borderRadius: 20, width: 480, maxWidth: '95vw', height: '70vh', maxHeight: 600, overflow: 'hidden', display: 'flex', flexDirection: 'column', animation: 'fadeUp 0.3s ease', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>

        {/* Header */}
        <div style={{ padding: '1rem 1.5rem', background: 'linear-gradient(135deg,#0f172a,#1e293b)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '0.9rem' }}>
            {(appointment?.user_name || 'P')[0].toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>{appointment?.user_name || 'Patient'}</p>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem' }}>
              {appointment?.disease || 'Consultation'} · #{appointment?.booking_id}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: '#fff', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>?</button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>??</div>
              <p style={{ fontSize: '0.82rem', margin: 0 }}>Start the conversation with your patient</p>
            </div>
          )}
          {messages.map(msg => {
            const isDoctor = msg.sender_role === 'doctor';
            return (
              <div key={msg.id} style={{ display: 'flex', justifyContent: isDoctor ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '75%', padding: '0.6rem 0.875rem', borderRadius: 14,
                  background: isDoctor ? 'linear-gradient(135deg,#7c3aed,#6d28d9)' : '#fff',
                  color: isDoctor ? '#fff' : '#0f172a',
                  border: isDoctor ? 'none' : '1px solid #e2e8f0',
                  borderBottomRightRadius: isDoctor ? 4 : 14,
                  borderBottomLeftRadius: isDoctor ? 14 : 4,
                }}>
                  <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: 1.5 }}>{msg.message}</p>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.6rem', opacity: 0.6, textAlign: 'right' }}>
                    {new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '0.75rem 1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '0.5rem', background: '#fff' }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            style={{ flex: 1, padding: '0.6rem 0.875rem', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: '0.82rem', outline: 'none', fontFamily: 'inherit', color: '#0f172a' }} />
          <button onClick={handleSend} disabled={sending || !input.trim()}
            style={{ padding: '0.6rem 1rem', borderRadius: 10, border: 'none', background: '#7c3aed', color: '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', opacity: sending ? 0.7 : 1 }}>
            {sending ? '...' : '?'}
          </button>
        </div>
      </div>
    </div>
  );
}
