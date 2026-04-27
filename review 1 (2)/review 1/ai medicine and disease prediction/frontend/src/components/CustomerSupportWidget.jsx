import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const SUPPORT_PHONE = '+91 9876543210';

export default function CustomerSupportWidget() {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState('menu'); // menu | chat | email
  const [chatMessages, setChatMessages] = useState([
    { from: 'bot', text: 'Hello! How can we help you today?' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const chatEndRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        const btn = document.getElementById('cs-widget-btn');
        if (btn && btn.contains(e.target)) return;
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  if (!isAuthenticated) return null;

  const sendChat = () => {
    if (!chatInput.trim()) return;
    setChatMessages(prev => [...prev, { from: 'user', text: chatInput.trim() }]);
    setChatInput('');
    setTimeout(() => {
      setChatMessages(prev => [...prev, {
        from: 'bot',
        text: 'Thank you for reaching out! A support agent will get back to you shortly. For urgent matters, please call us at ' + SUPPORT_PHONE,
      }]);
    }, 1000);
  };

  const sendEmail = () => {
    if (!emailSubject.trim() || !emailMessage.trim()) return;
    setEmailSent(true);
    setTimeout(() => {
      setEmailSent(false);
      setEmailSubject('');
      setEmailMessage('');
      setPanel('menu');
    }, 2500);
  };

  const goBack = () => setPanel('menu');

  return (
    <>
      <style>{`
        @keyframes cs-pop-in{from{opacity:0;transform:scale(0.85) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes cs-pulse{0%,100%{box-shadow:0 4px 20px rgba(5,150,105,0.35)}50%{box-shadow:0 4px 30px rgba(5,150,105,0.55)}}
        @keyframes cs-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
        .cs-fab{position:fixed;bottom:28px;right:28px;z-index:9999;width:58px;height:58px;border-radius:50%;border:none;
          background:linear-gradient(135deg,#059669,#047857);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;
          box-shadow:0 4px 20px rgba(5,150,105,0.35);transition:all 0.3s ease;animation:cs-pulse 3s ease-in-out infinite}
        .cs-fab:hover{transform:scale(1.08);box-shadow:0 6px 28px rgba(5,150,105,0.5)}
        .cs-fab svg{transition:transform 0.3s ease}
        .cs-fab.open svg{transform:rotate(45deg)}
        .cs-panel{position:fixed;bottom:100px;right:28px;z-index:9999;width:380px;max-width:calc(100vw - 56px);
          border-radius:20px;overflow:hidden;background:#fff;box-shadow:0 20px 60px rgba(0,0,0,0.18);
          animation:cs-pop-in 0.3s ease;display:flex;flex-direction:column;max-height:min(520px,70vh)}
        .cs-header{padding:1.25rem 1.5rem;background:linear-gradient(135deg,#059669,#047857);color:#fff;display:flex;align-items:center;justify-content:space-between}
        .cs-header h3{margin:0;font-size:1rem;font-weight:800;font-family:'Outfit',sans-serif}
        .cs-option{display:flex;align-items:center;gap:1rem;padding:1rem 1.5rem;border:none;background:#fff;width:100%;
          cursor:pointer;transition:all 0.2s;text-align:left;border-bottom:1px solid #f1f5f9}
        .cs-option:hover{background:#f8fafc;padding-left:1.75rem}
        .cs-option:last-child{border-bottom:none}
        .cs-back-btn{background:none;border:none;color:#059669;font-weight:700;font-size:0.82rem;cursor:pointer;display:flex;align-items:center;gap:0.3rem;padding:0;margin-bottom:0.75rem}
        .cs-back-btn:hover{color:#047857}
        .cs-input{width:100%;padding:0.7rem 1rem;border:1.5px solid #e2e8f0;border-radius:12px;font-size:0.85rem;font-family:inherit;outline:none;transition:all 0.2s;color:#0f172a}
        .cs-input:focus{border-color:#059669;box-shadow:0 0 0 3px rgba(5,150,105,0.1)}
        .cs-send-btn{padding:0.6rem 1.5rem;border-radius:12px;border:none;background:linear-gradient(135deg,#059669,#047857);color:#fff;font-weight:700;font-size:0.82rem;cursor:pointer;transition:all 0.25s}
        .cs-send-btn:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(5,150,105,0.3)}
        .cs-send-btn:disabled{opacity:0.5;cursor:not-allowed;transform:none}
      `}</style>

      {/* FAB Button */}
      <button
        id="cs-widget-btn"
        className={`cs-fab ${open ? 'open' : ''}`}
        onClick={() => { setOpen(o => !o); if (!open) setPanel('menu'); }}
        title="Customer Support"
      >
        {open ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        ) : (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
            <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
          </svg>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="cs-panel" ref={panelRef}>
          {/* Header */}
          <div className="cs-header">
            <div>
              <h3>{panel === 'menu' ? 'Customer Support' : panel === 'chat' ? 'Live Chat' : 'Email Support'}</h3>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', opacity: 0.8 }}>
                {panel === 'menu' ? 'We\'re here to help!' : panel === 'chat' ? 'Chat with our team' : 'Send us a message'}
              </p>
            </div>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {panel === 'menu' ? '🎧' : panel === 'chat' ? '💬' : '✉️'}
            </div>
          </div>

          {/* Menu */}
          {panel === 'menu' && (
            <div>
              <button className="cs-option" onClick={() => setPanel('chat')}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>💬</div>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>Live Chat</p>
                  <p style={{ margin: '0.1rem 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>Chat with a support agent</p>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" style={{ marginLeft: 'auto', flexShrink: 0 }}><path d="M9 18l6-6-6-6"/></svg>
              </button>

              <button className="cs-option" onClick={() => window.location.href = `tel:${SUPPORT_PHONE}`}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>📞</div>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>Call Support</p>
                  <p style={{ margin: '0.1rem 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>{SUPPORT_PHONE}</p>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" style={{ marginLeft: 'auto', flexShrink: 0 }}><path d="M9 18l6-6-6-6"/></svg>
              </button>

              <button className="cs-option" onClick={() => setPanel('email')}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#faf5ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>✉️</div>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>Email Support</p>
                  <p style={{ margin: '0.1rem 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>Send a detailed message</p>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" style={{ marginLeft: 'auto', flexShrink: 0 }}><path d="M9 18l6-6-6-6"/></svg>
              </button>

              {/* Online indicator */}
              <div style={{ padding: '0.875rem 1.5rem', background: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px rgba(34,197,94,0.5)' }} />
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Support team is online</span>
              </div>
            </div>
          )}

          {/* Chat */}
          {panel === 'chat' && (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div style={{ padding: '0.5rem 1rem' }}>
                <button className="cs-back-btn" onClick={goBack}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
                  Back
                </button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '0 1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', minHeight: 200, maxHeight: 280 }}>
                {chatMessages.map((msg, i) => (
                  <div key={i} style={{
                    maxWidth: '80%', padding: '0.7rem 1rem', borderRadius: 14, fontSize: '0.84rem', lineHeight: 1.5,
                    alignSelf: msg.from === 'user' ? 'flex-end' : 'flex-start',
                    background: msg.from === 'user' ? 'linear-gradient(135deg,#059669,#047857)' : '#f1f5f9',
                    color: msg.from === 'user' ? '#fff' : '#0f172a',
                    borderBottomRightRadius: msg.from === 'user' ? 4 : 14,
                    borderBottomLeftRadius: msg.from === 'bot' ? 4 : 14,
                    animation: 'fadeIn 0.3s ease',
                  }}>
                    {msg.text}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '0.5rem' }}>
                <input
                  className="cs-input"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendChat()}
                  placeholder="Type your message..."
                  style={{ flex: 1 }}
                />
                <button className="cs-send-btn" onClick={sendChat} disabled={!chatInput.trim()}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </button>
              </div>
            </div>
          )}

          {/* Email */}
          {panel === 'email' && (
            <div style={{ padding: '1rem 1.5rem' }}>
              <button className="cs-back-btn" onClick={goBack}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
                Back
              </button>

              {emailSent ? (
                <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '0.75rem', animation: 'cs-bounce 0.6s ease' }}>✅</div>
                  <p style={{ fontWeight: 800, color: '#059669', fontSize: '1rem', margin: '0 0 0.3rem' }}>Email Sent!</p>
                  <p style={{ color: '#94a3b8', fontSize: '0.82rem' }}>We'll get back to you within 24 hours.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Subject</label>
                    <input
                      className="cs-input"
                      value={emailSubject}
                      onChange={e => setEmailSubject(e.target.value)}
                      placeholder="What do you need help with?"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Message</label>
                    <textarea
                      className="cs-input"
                      value={emailMessage}
                      onChange={e => setEmailMessage(e.target.value)}
                      placeholder="Describe your issue in detail..."
                      rows={4}
                      style={{ resize: 'vertical', lineHeight: 1.6 }}
                    />
                  </div>
                  <button
                    className="cs-send-btn"
                    onClick={sendEmail}
                    disabled={!emailSubject.trim() || !emailMessage.trim()}
                    style={{ width: '100%', padding: '0.75rem' }}
                  >
                    Send Email
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
