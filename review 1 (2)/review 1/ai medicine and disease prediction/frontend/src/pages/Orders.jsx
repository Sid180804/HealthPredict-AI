import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import useIsDark from '../hooks/useIsDark';

const MOCK_USER_ID = "user_123"; 

export default function Orders() {
    const location = useLocation();
    const navigate = useNavigate();
    const isDark = useIsDark();
    const D = {
        page:   isDark ? '#0f172a' : '#f8fafc',
        card:   isDark ? '#1e293b' : 'white',
        cardBdr:isDark ? '#334155' : '#e2e8f0',
        inner:  isDark ? '#0f172a' : '#f8fafc',
        innerBdr:isDark? '#334155' : '#e2e8f0',
        text:   isDark ? '#f1f5f9' : '#0f172a',
        sub:    isDark ? '#94a3b8' : '#64748b',
        muted:  isDark ? '#475569' : '#334155',
        totBg:  isDark ? '#0f172a' : '#f1f5f9',
        idBg:   isDark ? '#0f172a' : '#f1f5f9',
        histBdr:isDark ? '#334155' : '#f1f5f9',
    };
    const [medicines, setMedicines] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (location.state?.prescription?.extracted?.medicines) {
            setMedicines(location.state.prescription.extracted.medicines);
        }
        fetchOrders();
    }, [location.state]);

    const fetchOrders = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_BASE}/api/orders/user/${MOCK_USER_ID}`);
            setOrders(res.data.orders.reverse());
        } catch (err) {
            console.error("Failed to fetch orders", err);
        }
    };

    const handlePlaceOrder = async () => {
        setLoading(true);
        try {
            await axios.post(`${import.meta.env.VITE_API_BASE}/api/orders`, {
                userId: MOCK_USER_ID,
                medicines: medicines,
                address: "123 Health St, Wellness City",
                prescriptionId: "pres_mock_id"
            });
            setSuccess(true);
            setMedicines([]); 
            fetchOrders(); 
            setTimeout(() => setSuccess(false), 5000);
        } catch (err) {
            console.error(err);
            alert("Failed to confirm clinical order.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: "100vh", background: D.page, fontFamily: "'Inter', sans-serif", transition: "background 0.3s" }}>
            <Header title="Clinical Orders" />

            <main style={{ maxWidth: 1200, margin: "0 auto", padding: "3rem 2rem" }}>

                <div style={{ marginBottom: "2.5rem" }}>
                  <h1 style={{ fontSize: "2rem", fontWeight: 800, color: D.text, fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.02em", marginBottom: "0.5rem" }}>
                    Pharmacy Orders
                  </h1>
                  <p style={{ color: D.sub, fontSize: "1.05rem", margin: 0, maxWidth: 600 }}>
                    View your active prescriptions and review your order history.
                  </p>
                </div>

                <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start", flexWrap: "wrap" }}>

                    {/* Left/Main Column: Active Cart */}
                    <div style={{ flex: "1 1 600px", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                        <div style={{ background: D.card, border: `1px solid ${D.cardBdr}`, borderRadius: 16, padding: "2rem", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.06)" }}>

                            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: D.text, fontFamily: "'Outfit', sans-serif", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                <div style={{ background: "#e0e7ff", color: "#4f46e5", padding: "0.5rem", borderRadius: 8 }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                                </div>
                                Current Prescription
                            </h2>

                            {success ? (
                                <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 12, padding: "3rem 2rem", textAlign: "center", animation: "fadeIn 0.4s ease-out" }}>
                                    <div style={{ width: 64, height: 64, background: "#10b981", color: "white", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                    </div>
                                    <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#065f46", margin: "0 0 0.5rem 0" }}>Order Placed!</h3>
                                    <p style={{ color: "#047857", fontSize: "0.95rem", margin: 0 }}>Your medicines have been added to the processing queue.</p>
                                </div>
                            ) : medicines.length > 0 ? (
                                <div style={{ animation: "fadeIn 0.3s ease-out" }}>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
                                        {medicines.map((med, idx) => (
                                            <div key={idx} style={{ padding: "1.25rem", background: D.inner, border: `1px solid ${D.innerBdr}`, borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <div>
                                                    <p style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: D.text }}>{med.name}</p>
                                                    <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.85rem", color: D.sub, fontWeight: 500 }}>
                                                        <span style={{ color: D.muted }}>{med.dosage}</span> &bull; {med.frequency} &bull; {med.duration}
                                                    </p>
                                                </div>
                                                <div style={{ fontSize: "1.1rem", fontFamily: "monospace", fontWeight: 700, color: D.muted, background: D.card, padding: "0.4rem 0.75rem", borderRadius: 8, border: `1px solid ${D.cardBdr}` }}>
                                                    ?120
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.5rem", background: D.totBg, borderRadius: 12, marginBottom: "2rem" }}>
                                        <span style={{ fontSize: "1rem", fontWeight: 700, color: D.sub, textTransform: "uppercase", letterSpacing: "0.05em" }}>Subtotal</span>
                                        <span style={{ fontSize: "1.8rem", fontWeight: 800, color: D.text, fontFamily: "'Outfit', sans-serif" }}>?{(medicines.length * 120)}</span>
                                    </div>

                                    <button
                                        onClick={handlePlaceOrder}
                                        disabled={loading}
                                        style={{ width: "100%", padding: "1.1rem", background: loading ? "#94a3b8" : "linear-gradient(135deg, #0f172a, #1e293b)", color: "white", border: "none", borderRadius: 12, fontSize: "1.05rem", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", display: "flex", justifyContent: "center", alignItems: "center", gap: "0.75rem" }}
                                    >
                                        {loading ? <div className="spin-loader" /> : 'Confirm Order'}
                                    </button>
                                    <p style={{ textAlign: "center", fontSize: "0.75rem", color: "#94a3b8", marginTop: "1rem" }}>
                                        By confirming, you agree that these details are correct.
                                    </p>
                                </div>
                            ) : (
                                <div 
                                  onClick={() => navigate('/ocr')}
                                  style={{ padding: "4rem 2rem", textAlign: "center", background: D.inner, border: `2px dashed ${D.innerBdr}`, borderRadius: 12, cursor: "pointer", transition: "all 0.2s" }}
                                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#059669"; e.currentTarget.style.background = "#ecfdf5"; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = D.innerBdr; e.currentTarget.style.background = D.inner; }}
                                >
                                    <div style={{ width: 48, height: 48, background: "#f1f5f9", color: "#64748b", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", transition: "all 0.2s" }}>
                                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                    </div>
                                    <p style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: D.text }}>Queue Empty</p>
                                    <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.85rem", color: D.sub, fontWeight: 500 }}>Click here to upload via the Pharmacy OCR module.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Order History */}
                    <div style={{ flex: "1 1 350px", display: "flex", flexDirection: "column", gap: "1rem" }}>
                        <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: D.text, fontFamily: "'Outfit', sans-serif", margin: "0 0 0.5rem 0" }}>Order History</h3>

                        {orders.map((order) => (
                            <div key={order.id} style={{ background: D.card, border: `1px solid ${D.cardBdr}`, borderRadius: 12, padding: "1.25rem", boxShadow: "0 2px 4px rgba(0,0,0,0.06)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                                    <span style={{ fontSize: "0.75rem", fontFamily: "monospace", color: D.sub, fontWeight: 600, background: D.idBg, padding: "0.2rem 0.5rem", borderRadius: 4 }}>
                                      #{order.id.slice(0, 8)}
                                    </span>
                                    <span style={{ 
                                      fontSize: "0.7rem", fontWeight: 700, padding: "0.25rem 0.6rem", borderRadius: 20, textTransform: "uppercase", letterSpacing: "0.05em",
                                      background: order.status === 'placed' ? "#e0e7ff" : order.status === 'delivered' ? "#ecfdf5" : "#f1f5f9",
                                      color: order.status === 'placed' ? "#4f46e5" : order.status === 'delivered' ? "#059669" : "#475569"
                                    }}>
                                        {order.status}
                                    </span>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", marginBottom: "1rem" }}>
                                    {order.medicines.slice(0, 2).map((m, i) => (
                                        <p key={i} style={{ margin: 0, fontSize: "0.9rem", color: D.muted, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                          &bull; {m.name}
                                        </p>
                                    ))}
                                    {order.medicines.length > 2 && <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.75rem", color: "#94a3b8", fontWeight: 600 }}>+ {order.medicines.length - 2} additional units</p>}
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "1rem", borderTop: `1px solid ${D.histBdr}` }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", color: D.sub, fontWeight: 500 }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                        {new Date(order.createdAt).toLocaleDateString()}
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", color: D.text, fontWeight: 600, cursor: "pointer" }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                                        Track
                                    </div>
                                </div>
                            </div>
                        ))}
                        {orders.length === 0 && <p style={{ textAlign: "center", color: D.sub, fontSize: "0.85rem", padding: "2rem", background: D.inner, borderRadius: 12, border: `1px dashed ${D.innerBdr}` }}>No past orders found.</p>}
                    </div>
                </div>
            </main>

            <style>
                {`
                    .spin-loader { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 1s linear infinite; }
                    @keyframes spin { 100% { transform: rotate(360deg); } }
                    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                `}
            </style>
        </div>
    );
}
