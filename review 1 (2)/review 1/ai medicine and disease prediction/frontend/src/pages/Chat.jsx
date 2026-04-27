import { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';

const API_BASE = import.meta.env.VITE_API_BASE;
const CHAT_ENDPOINT = `${API_BASE}/api/ai/chat`;

const LANGUAGES = [
  { code: 'auto', name: 'Auto-detect',       format: 'en-IN' },
  { code: 'en',   name: 'English',           format: 'en-IN' },
  { code: 'hi',   name: 'Hindi (?????)',     format: 'hi-IN' },
  { code: 'ta',   name: 'Tamil (?????)',    format: 'ta-IN' },
  { code: 'te',   name: 'Telugu (??????)',  format: 'te-IN' },
  { code: 'ml',   name: 'Malayalam (??????)', format: 'ml-IN' },
  { code: 'kn',   name: 'Kannada (?????)',   format: 'kn-IN' },
  { code: 'pa',   name: 'Punjabi (??????)',  format: 'pa-IN' },
  { code: 'gu',   name: 'Gujarati (???????)', format: 'gu-IN' },
  { code: 'mr',   name: 'Marathi (?????)',   format: 'mr-IN' },
  { code: 'bn',   name: 'Bengali (?????)',   format: 'bn-IN' },
  { code: 'ur',   name: 'Urdu (????)',       format: 'ur-IN' },
  { code: 'es',   name: 'Spanish (Español)', format: 'es-ES' },
  { code: 'fr',   name: 'French (Français)', format: 'fr-FR' },
  { code: 'de',   name: 'German (Deutsch)',  format: 'de-DE' },
  { code: 'ar',   name: 'Arabic (???????)',  format: 'ar-SA' },
];

const INITIAL_CHIPS = ['Describe symptoms', 'Explain a report', 'Book a doctor', 'Medication info'];

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

/* -- Icons (kit-style) -------------------------------------- */
const Icon = ({ d, size = 18, s = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth={s} strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const IconMic   = (p) => <Icon {...p} d={<><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 19v3"/></>}/>;
const IconSend  = (p) => <Icon {...p} d={<><path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/></>}/>;
const IconImage = (p) => <Icon {...p} d={<><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></>}/>;
const IconVolume= (p) => <Icon {...p} d={<><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></>}/>;
const IconClose = (p) => <Icon {...p} d={<><path d="M18 6 6 18"/><path d="M6 6l12 12"/></>}/>;

export default function Chat() {
  const [messages, setMessages] = useState([
    {
      id: 1, role: 'bot',
      text: "Namaste! I'm your AI Copilot. How can I help you today?",
      chips: INITIAL_CHIPS,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('auto');
  const [emergency, setEmergency] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImage, setModalImage] = useState(null);

  const endRef = useRef(null);
  const scrollRef = useRef(null);
  const recognitionRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const formatText = (text = '') =>
    text
      .replace(/\*\*(.*?)\*\*/g, '<strong style="color:inherit;font-weight:700">$1</strong>')
      .replace(/\n/g, '<br/>');

  /* -- Image upload --------------------------------------- */
  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) { alert('Please upload a JPG, PNG, WEBP, or GIF.'); return; }
    if (file.size > 10 * 1024 * 1024) { alert('Image size must be under 10MB.'); return; }
    const previewUrl = URL.createObjectURL(file);
    const base64 = await fileToBase64(file);
    setUploadedImage({ file, previewUrl, base64, mimeType: file.type });
    e.target.value = '';
  };
  const removeUploadedImage = () => {
    if (uploadedImage?.previewUrl) URL.revokeObjectURL(uploadedImage.previewUrl);
    setUploadedImage(null);
  };

  /* -- API call ------------------------------------------- */
  const getAIResponse = async (userText, chatHistory, imageData = null) => {
    const history = chatHistory.map(m => ({
      role: m.role === 'bot' ? 'assistant' : 'user',
      content: m.text,
    }));
    const payload = {
      message: userText,
      history,
      language: language === 'auto' ? 'auto' : language,
    };
    if (imageData) payload.image = { base64: imageData.base64, mime_type: imageData.mimeType };

    const res = await fetch(CHAT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || `Chat API returned ${res.status}`);
    }
    const data = await res.json();
    return {
      text: data.response,
      language: data.language_name,
      source: data.source,
      isEmergency: data.is_emergency,
      emergency: data.emergency,
    };
  };

  /* -- Send ----------------------------------------------- */
  const sendMessage = async (textArg) => {
    const text = (textArg ?? input).trim();
    if (!text || loading) return;

    const imageSnapshot = uploadedImage;
    setInput('');
    setUploadedImage(null);

    const userMsg = {
      id: Date.now(),
      role: 'user',
      text,
      image: imageSnapshot ? imageSnapshot.previewUrl : null,
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const chatHistory = messages.slice(-6);
      const result = await getAIResponse(
        text,
        chatHistory,
        imageSnapshot ? { base64: imageSnapshot.base64, mimeType: imageSnapshot.mimeType } : null
      );
      if (result.isEmergency) {
        setEmergency({
          message: result.emergency?.message
            || 'Possible emergency detected. Please seek immediate medical attention.',
        });
      }
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'bot',
        text: result.text,
        language: result.language || 'English',
        source: result.source || 'AI',
        isEmergency: result.isEmergency,
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1, role: 'bot',
        text: `Error: ${err.message}. If experiencing an emergency, dial 108.`,
        isEmergency: false,
      }]);
    }
    setLoading(false);
  };

  /* -- Voice ---------------------------------------------- */
  const speakText = (text) => {
    const clean = text.replace(/<[^>]+>/g, '').replace(/\*\*/g, '');
    const langConfig = LANGUAGES.find(l => l.code === language);
    const targetLang = langConfig ? langConfig.format : 'en-IN';
    const speak = () => {
      const voices = speechSynthesis.getVoices();
      const voice =
        voices.find(v => v.lang === targetLang) ||
        voices.find(v => v.lang.startsWith(targetLang.split('-')[0]));
      const utter = new SpeechSynthesisUtterance(clean);
      utter.lang = targetLang;
      if (voice) utter.voice = voice;
      speechSynthesis.speak(utter);
    };
    if (speechSynthesis.getVoices().length === 0) {
      speechSynthesis.onvoiceschanged = () => { speechSynthesis.onvoiceschanged = null; speak(); };
    } else {
      speak();
    }
  };

  const toggleVoice = () => {
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); return; }
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Voice typing is not supported in this browser. Please try Chrome.');
      return;
    }
    navigator.mediaDevices.getUserMedia({ audio: true }).then(() => {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SR();
      recognitionRef.current = recognition;
      const langConfig = LANGUAGES.find(l => l.code === language);
      recognition.lang = (langConfig && langConfig.code !== 'auto') ? langConfig.format : 'en-IN';
      recognition.interimResults = true;
      recognition.continuous = false;
      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (e) => {
        const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
        setInput(transcript);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      try { recognition.start(); } catch { setIsListening(false); }
    }).catch(() => {
      alert('Microphone permission was denied.');
      setIsListening(false);
    });
  };

  const clearChat = () => {
    setMessages([{
      id: Date.now(), role: 'bot',
      text: "Namaste! I'm your AI Copilot. How can I help you today?",
      chips: INITIAL_CHIPS,
    }]);
    setEmergency(null);
  };

  return (
    <>
      <Header/>
      <div
        className="hp-fade-up"
        style={{
          maxWidth: 840, margin: '0 auto',
          padding: '32px 32px 0',
          height: 'calc(100vh - 68px)',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* -- Header row --- */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20,
          }}>??</div>
          <div style={{ flex: 1 }}>
            <h2 className="hp-sh" style={{ fontSize: 20 }}>AI Copilot</h2>
            <div style={{
              fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981' }}/>
              Online · {LANGUAGES.length} languages supported
            </div>
          </div>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="hp-btn hp-btn-secondary hp-btn-sm"
            style={{ cursor: 'pointer' }}
          >
            {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
          </select>
          <button className="hp-btn hp-btn-secondary hp-btn-sm" onClick={clearChat}>Clear chat</button>
        </div>

        {/* -- Emergency banner --- */}
        {emergency && (
          <div style={{
            padding: 14, borderRadius: 16, marginBottom: 12,
            background: 'linear-gradient(135deg,#fef2f2,#fee2e2)',
            border: '1.5px solid #fecaca',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: '#dc2626', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
            }}>??</div>
            <div style={{ flex: 1, fontSize: 13, color: '#7f1d1d', fontWeight: 600 }}>
              {emergency.message}
            </div>
            <button className="hp-btn hp-btn-sm hp-btn-secondary" onClick={() => setEmergency(null)}>
              <IconClose size={14}/>
            </button>
          </div>
        )}

        {/* -- Messages --- */}
        <div
          ref={scrollRef}
          style={{
            flex: 1, overflowY: 'auto',
            padding: '16px 4px',
            display: 'flex', flexDirection: 'column', gap: 12,
          }}
        >
          {messages.map(m => (
            <div
              key={m.id}
              style={{
                display: 'flex', gap: 10, alignItems: 'flex-end',
                justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              {m.role !== 'user' && (
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, flexShrink: 0,
                }}>??</div>
              )}
              <div style={{
                padding: '11px 15px', borderRadius: 16,
                fontSize: 14, lineHeight: 1.5, maxWidth: '75%',
                background: m.role === 'user'
                  ? 'linear-gradient(135deg,#059669,#047857)'
                  : '#fff',
                color: m.role === 'user' ? '#fff' : '#0f172a',
                border: m.role === 'user' ? 'none' : '1px solid #e2e8f0',
                borderBottomLeftRadius:  m.role === 'user' ? 16 : 4,
                borderBottomRightRadius: m.role === 'user' ? 4  : 16,
              }}>
                {m.image && (
                  <img
                    src={m.image}
                    alt="Uploaded"
                    onClick={() => { setModalImage(m.image); setShowImageModal(true); }}
                    style={{
                      width: '100%', maxWidth: 260, borderRadius: 10,
                      marginBottom: 8, cursor: 'zoom-in',
                    }}
                  />
                )}
                <div dangerouslySetInnerHTML={{ __html: formatText(m.text) }}/>
                {m.chips && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                    {m.chips.map(c => (
                      <span
                        key={c}
                        onClick={() => sendMessage(c)}
                        style={{
                          padding: '6px 12px', borderRadius: 9999,
                          background: '#f5f3ff', color: '#6d28d9',
                          fontSize: 11.5, fontWeight: 600,
                          border: '1px solid #ddd6fe', cursor: 'pointer',
                        }}
                      >{c}</span>
                    ))}
                  </div>
                )}
                {m.role === 'bot' && m.id !== 1 && (
                  <button
                    onClick={() => speakText(m.text)}
                    title="Read aloud"
                    style={{
                      marginTop: 8, background: 'transparent', border: 'none',
                      color: '#7c3aed', cursor: 'pointer',
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      fontSize: 11, fontWeight: 600,
                    }}
                  >
                    <IconVolume size={14}/> Read aloud
                  </button>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, flexShrink: 0,
              }}>??</div>
              <div style={{
                padding: '11px 15px', borderRadius: 16,
                background: '#fff', border: '1px solid #e2e8f0',
                borderBottomLeftRadius: 4, fontSize: 14,
              }}>
                <span style={{ display: 'inline-block', animation: 'hp-glow 1.2s infinite' }}>·····</span>
              </div>
            </div>
          )}
          <div ref={endRef}/>
        </div>

        {/* -- Composer --- */}
        <div style={{ padding: '16px 0 24px', borderTop: '1px solid #f1f5f9' }}>
          {/* Image preview chip */}
          {uploadedImage && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: 6, marginBottom: 10,
              background: '#f5f3ff', border: '1px solid #ddd6fe',
              borderRadius: 12,
            }}>
              <img
                src={uploadedImage.previewUrl}
                alt=""
                style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }}
              />
              <span style={{ fontSize: 12, color: '#6d28d9', fontWeight: 600 }}>
                {uploadedImage.file.name.slice(0, 24)}
              </span>
              <button
                onClick={removeUploadedImage}
                className="hp-icon-btn"
                style={{ width: 28, height: 28, background: 'transparent' }}
              >
                <IconClose size={14}/>
              </button>
            </div>
          )}

          <div style={{
            display: 'flex', gap: 8, alignItems: 'center',
            padding: '8px 10px', borderRadius: 16,
            border: '1.5px solid #e2e8f0', background: '#fff',
          }}>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageSelect}
            />
            <button
              className="hp-icon-btn"
              style={{ background: 'transparent' }}
              onClick={() => fileInputRef.current?.click()}
              title="Upload image"
            >
              <IconImage size={18}/>
            </button>
            <button
              className="hp-icon-btn"
              style={{
                background: isListening ? '#fee2e2' : 'transparent',
                color: isListening ? '#dc2626' : '#475569',
              }}
              onClick={toggleVoice}
              title="Voice input"
            >
              <IconMic size={18}/>
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Describe your symptoms or ask anything…"
              style={{
                flex: 1, border: 'none', outline: 'none',
                fontSize: 14, color: '#0f172a',
                padding: '8px 4px', fontFamily: 'inherit',
              }}
            />
            <button
              className="hp-btn hp-btn-primary hp-btn-sm"
              onClick={() => sendMessage()}
              disabled={loading || (!input.trim() && !uploadedImage)}
              style={{ padding: '10px 16px' }}
            >
              <IconSend size={14}/>
            </button>
          </div>
          <div style={{
            fontSize: 11, color: '#94a3b8',
            marginTop: 8, textAlign: 'center',
          }}>
            Copilot is for decision support only. For emergencies, call national emergency services.
          </div>
        </div>
      </div>

      {/* Image modal */}
      {showImageModal && modalImage && (
        <div
          onClick={() => setShowImageModal(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(15,23,42,.75)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, cursor: 'zoom-out', padding: 20,
          }}
        >
          <img
            src={modalImage}
            alt="Full"
            style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 16 }}
          />
        </div>
      )}
    </>
  );
}
