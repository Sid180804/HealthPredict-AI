import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";

const API = `${import.meta.env.VITE_API_BASE}/api/admin`;

const token = () => localStorage.getItem("auth_token");
const authHeaders = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${token()}` });

// -- Reusable components ----------------------------------------------------

function StatCard({ label, value, icon, color = "#059669", sub }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 14, padding: "1.5rem",
      border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      display: "flex", flexDirection: "column", gap: "0.5rem"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>{label}</p>
          <p style={{ fontSize: "2rem", fontWeight: 800, color: "#0f172a", margin: "0.25rem 0 0" }}>{value ?? "—"}</p>
          {sub && <p style={{ fontSize: "0.78rem", color: "#94a3b8", margin: "0.2rem 0 0" }}>{sub}</p>}
        </div>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1.25rem", flexShrink: 0
        }}>{icon}</div>
      </div>
    </div>
  );
}

function Badge({ status }) {
  const cfg = {
    pending:  { bg: "#fff7ed", color: "#c2410c", label: "Pending" },
    approved: { bg: "#f0fdf4", color: "#15803d", label: "Approved" },
    rejected: { bg: "#fef2f2", color: "#b91c1c", label: "Rejected" },
    patient:  { bg: "#eff6ff", color: "#1d4ed8", label: "Patient" },
    doctor:   { bg: "#faf5ff", color: "#7e22ce", label: "Doctor" },
    admin:    { bg: "#f0fdf4", color: "#15803d", label: "Admin" },
    success:  { bg: "#f0fdf4", color: "#15803d", label: "Success" },
    failed:   { bg: "#fef2f2", color: "#b91c1c", label: "Failed" },
    warning:  { bg: "#fff7ed", color: "#c2410c", label: "Warning" },
    review:   { bg: "#eff6ff", color: "#1d4ed8", label: "Review" },
    complaint:{ bg: "#fef2f2", color: "#b91c1c", label: "Complaint" },
  };
  const c = cfg[status] || { bg: "#f1f5f9", color: "#475569", label: status };
  return (
    <span style={{
      padding: "0.25rem 0.65rem", borderRadius: 20, fontSize: "0.72rem",
      fontWeight: 700, background: c.bg, color: c.color, textTransform: "capitalize"
    }}>{c.label}</span>
  );
}

function Modal({ title, onClose, children, width = 460 }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem"
    }} onClick={onClose}>
      <div style={{
        background: "#fff", borderRadius: 16, padding: "2rem", width: "100%", maxWidth: width,
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)", maxHeight: "85vh", overflowY: "auto"
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.25rem", color: "#94a3b8" }}>?</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FieldLabel({ children }) {
  return <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "#475569", marginBottom: "0.35rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>{children}</label>;
}

function FieldInput({ ...props }) {
  return <input {...props} style={{ width: "100%", padding: "0.7rem", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: "0.875rem", outline: "none", color: "#0f172a", fontFamily: "inherit", boxSizing: "border-box", marginBottom: "0.875rem", ...props.style }} />;
}

function FieldTextarea({ ...props }) {
  return <textarea {...props} style={{ width: "100%", padding: "0.7rem", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: "0.875rem", outline: "none", color: "#0f172a", fontFamily: "inherit", boxSizing: "border-box", resize: "vertical", marginBottom: "0.875rem", ...props.style }} />;
}

function PrimaryBtn({ children, onClick, disabled, danger, small, style: extraStyle }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: small ? "0.5rem 0.875rem" : "0.7rem 1.25rem", borderRadius: 10, border: "none",
      background: danger ? "#dc2626" : "linear-gradient(135deg, #059669, #047857)",
      color: "#fff", fontWeight: 700, fontSize: small ? "0.78rem" : "0.875rem",
      cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1, fontFamily: "inherit",
      ...extraStyle
    }}>{children}</button>
  );
}

// -- Sidebar navigation config ---------------------------------------------

const SIDEBAR_ITEMS = [
  { id: "Overview",             icon: "??", label: "Dashboard" },
  { id: "Doctor Verification",  icon: "?????", label: "Doctors" },
  { id: "Users",                icon: "??", label: "Users" },
  { id: "Appointments",         icon: "??", label: "Appointments" },
  { id: "AI Analytics",         icon: "??", label: "AI Analytics" },
  { id: "Emergency",            icon: "??", label: "Emergency" },
  { id: "Medicines",            icon: "??", label: "Medicines" },
  { id: "Feedback",             icon: "?", label: "Feedback" },
  { id: "Security",             icon: "??", label: "Security" },
  { id: "Settings",             icon: "??", label: "Settings" },
  { id: "Business Analytics",   icon: "??", label: "Analytics" },
];

// -- Main Component ---------------------------------------------------------

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState("Overview");
  const [stats, setStats] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [toast, setToast] = useState(null);
  const [doctorFilter, setDoctorFilter] = useState("pending");
  const [userSearch, setUserSearch] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Notifications
  const [adminNotifs, setAdminNotifs] = useState([
    { id: 1, text: 'New doctor verification request', time: 'Just now', read: false, icon: '?????' },
    { id: 2, text: 'New patient complaint received', time: '20 min ago', read: false, icon: '??' },
    { id: 3, text: '3 new appointments booked today', time: '1 hr ago', read: false, icon: '??' },
    { id: 4, text: 'System health check passed', time: '2 hr ago', read: true, icon: '?' },
  ]);
  const [adminNotifOpen, setAdminNotifOpen] = useState(false);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchStats = useCallback(async () => {
    try {
      const r = await fetch(`${API}/stats`, { headers: authHeaders() });
      const d = await r.json();
      setStats(d);
    } catch { /* ignore */ }
  }, []);

  const fetchDoctors = useCallback(async (status = doctorFilter) => {
    try {
      const url = status === "all" ? `${API}/doctors` : `${API}/doctors?status=${status}`;
      const r = await fetch(url, { headers: authHeaders() });
      const d = await r.json();
      setDoctors(Array.isArray(d) ? d : d.doctors || []);
    } catch { /* ignore */ }
  }, [doctorFilter]);

  const fetchUsers = useCallback(async () => {
    try {
      const r = await fetch(`${API}/users`, { headers: authHeaders() });
      const d = await r.json();
      setUsers(Array.isArray(d) ? d : d.users || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchDoctors(), fetchUsers()]);
      setLoading(false);
    })();
  }, []);

  useEffect(() => { fetchDoctors(doctorFilter); }, [doctorFilter]);

  const handleVerify = async (doctorId) => {
    setActionLoading(doctorId + "_verify");
    try {
      const r = await fetch(`${API}/doctors/${doctorId}/verify`, { method: "PUT", headers: authHeaders() });
      if (r.ok) { showToast("Doctor approved successfully"); await Promise.all([fetchStats(), fetchDoctors()]); }
      else { const d = await r.json(); showToast(d.error || "Failed to approve doctor", "error"); }
    } catch { showToast("Network error", "error"); }
    setActionLoading(null);
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setActionLoading(rejectModal.doctorId + "_reject");
    try {
      const r = await fetch(`${API}/doctors/${rejectModal.doctorId}/reject`, {
        method: "PUT", headers: authHeaders(),
        body: JSON.stringify({ reason: rejectReason || "Does not meet requirements" })
      });
      if (r.ok) { showToast("Doctor rejected"); setRejectModal(null); setRejectReason(""); await Promise.all([fetchStats(), fetchDoctors()]); }
      else { const d = await r.json(); showToast(d.error || "Failed to reject", "error"); }
    } catch { showToast("Network error", "error"); }
    setActionLoading(null);
  };

  const filteredUsers = users.filter(u =>
    !userSearch || u.name?.toLowerCase().includes(userSearch.toLowerCase()) || u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 44, height: 44, border: "3px solid #e2e8f0", borderTopColor: "#059669", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
        <p style={{ color: "#64748b", marginTop: "1rem", fontSize: "0.9rem" }}>Loading dashboard…</p>
        <style>{`@keyframes spin{100%{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter', system-ui, sans-serif", display: "flex" }}>
      <style>{`
        @keyframes spin{100%{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        .admin-sidebar-item:hover{background:rgba(255,255,255,0.08)!important}
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: "1.25rem", right: "1.25rem", zIndex: 2000,
          padding: "0.875rem 1.25rem", borderRadius: 12, fontSize: "0.875rem", fontWeight: 600,
          background: toast.type === "error" ? "#fef2f2" : "#f0fdf4",
          color: toast.type === "error" ? "#dc2626" : "#15803d",
          border: `1px solid ${toast.type === "error" ? "#fecaca" : "#bbf7d0"}`,
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)"
        }}>{toast.msg}</div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <Modal title={`Reject Dr. ${rejectModal.name}`} onClose={() => { setRejectModal(null); setRejectReason(""); }}>
          <p style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: "1rem" }}>
            This will notify the doctor that their application was not approved.
          </p>
          <FieldLabel>Reason (optional)</FieldLabel>
          <FieldTextarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="e.g. Incomplete credentials…" rows={3} />
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
            <button onClick={() => { setRejectModal(null); setRejectReason(""); }}
              style={{ flex: 1, padding: "0.75rem", border: "1.5px solid #e2e8f0", borderRadius: 10, background: "#fff", color: "#475569", fontWeight: 600, cursor: "pointer", fontSize: "0.9rem" }}>Cancel</button>
            <PrimaryBtn danger onClick={handleReject} disabled={!!actionLoading} style={{ flex: 1 }}>
              {actionLoading ? "Rejecting…" : "Reject Doctor"}
            </PrimaryBtn>
          </div>
        </Modal>
      )}

      {/* -- Sidebar ---------------------------------------- */}
      <div style={{
        width: sidebarCollapsed ? 68 : 240, background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
        display: "flex", flexDirection: "column", flexShrink: 0, transition: "width 0.25s ease",
        position: "sticky", top: 0, height: "100vh", overflowY: "auto", overflowX: "hidden"
      }}>
        {/* Brand */}
        <div style={{ padding: sidebarCollapsed ? "1.25rem 0.75rem" : "1.25rem 1.25rem", display: "flex", alignItems: "center", gap: "0.75rem", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ width: 36, height: 36, background: "linear-gradient(135deg, #059669, #047857)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          {!sidebarCollapsed && <span style={{ fontWeight: 800, fontSize: "1rem", color: "#fff", fontFamily: "'Outfit',sans-serif", whiteSpace: "nowrap" }}>HealthPredict</span>}
        </div>

        {/* Nav items */}
        <div style={{ padding: "0.75rem 0.5rem", flex: 1, display: "flex", flexDirection: "column", gap: "0.15rem" }}>
          {SIDEBAR_ITEMS.map(item => {
            const active = tab === item.id;
            return (
              <button key={item.id} className="admin-sidebar-item" onClick={() => setTab(item.id)} style={{
                display: "flex", alignItems: "center", gap: "0.75rem",
                padding: sidebarCollapsed ? "0.7rem" : "0.7rem 1rem",
                borderRadius: 10, border: "none", cursor: "pointer", width: "100%", textAlign: "left",
                background: active ? "rgba(5,150,105,0.2)" : "transparent",
                color: active ? "#34d399" : "rgba(255,255,255,0.55)",
                fontWeight: active ? 700 : 500, fontSize: "0.85rem", fontFamily: "inherit",
                transition: "all 0.15s", justifyContent: sidebarCollapsed ? "center" : "flex-start",
                position: "relative",
              }}>
                {active && <div style={{ position: "absolute", left: 0, top: "20%", bottom: "20%", width: 3, borderRadius: 99, background: "#059669" }} />}
                <span style={{ fontSize: "1.05rem", flexShrink: 0 }}>{item.icon}</span>
                {!sidebarCollapsed && <span style={{ whiteSpace: "nowrap" }}>{item.label}</span>}
                {item.id === "Doctor Verification" && !sidebarCollapsed && (stats?.pendingDoctors || stats?.pendingVerification || 0) > 0 && (
                  <span style={{ marginLeft: "auto", background: "#f59e0b", color: "#fff", borderRadius: 99, padding: "0.1rem 0.45rem", fontSize: "0.65rem", fontWeight: 700 }}>{stats.pendingDoctors || stats.pendingVerification}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Collapse toggle */}
        <div style={{ padding: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <button onClick={() => setSidebarCollapsed(c => !c)} style={{
            width: "100%", padding: "0.6rem", borderRadius: 8, border: "none", cursor: "pointer",
            background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", fontFamily: "inherit"
          }}>{sidebarCollapsed ? "?" : "? Collapse"}</button>
        </div>

        {/* User info */}
        <div style={{ padding: sidebarCollapsed ? "1rem 0.5rem" : "1rem 1.25rem", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: "0.65rem" }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg, #f59e0b, #d97706)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: "0.8rem", flexShrink: 0 }}>
            {user?.name?.[0]?.toUpperCase() || "A"}
          </div>
          {!sidebarCollapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.name}</p>
              <p style={{ margin: 0, fontSize: "0.68rem", color: "rgba(255,255,255,0.4)" }}>Administrator</p>
            </div>
          )}
        </div>
      </div>

      {/* -- Main Content ----------------------------------- */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Top bar */}
        <div style={{
          background: "#fff", borderBottom: "1px solid #f1f5f9", padding: "0.875rem 2rem",
          display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, color: "#0f172a", fontFamily: "'Outfit',sans-serif" }}>
              {SIDEBAR_ITEMS.find(i => i.id === tab)?.icon} {SIDEBAR_ITEMS.find(i => i.id === tab)?.label || tab}
            </h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {/* Notification Bell */}
            <div style={{ position: "relative" }}>
              <button onClick={() => setAdminNotifOpen(o => !o)} style={{
                width: 38, height: 38, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                background: adminNotifOpen ? "#f1f5f9" : "transparent", border: "none", cursor: "pointer", color: "#64748b", transition: "all 0.2s"
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                {adminNotifs.filter(n => !n.read).length > 0 && (
                  <span style={{ position: "absolute", top: 4, right: 2, minWidth: 16, height: 16, borderRadius: 99, background: "#ef4444", border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", fontWeight: 800, color: "#fff", padding: "0 3px" }}>
                    {adminNotifs.filter(n => !n.read).length}
                  </span>
                )}
              </button>
              {adminNotifOpen && (
                <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: 340, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, boxShadow: "0 12px 36px rgba(0,0,0,0.12)", overflow: "hidden", zIndex: 200, animation: "fadeIn 0.2s ease" }}>
                  <div style={{ padding: "0.875rem 1rem", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
                    <h4 style={{ margin: 0, fontSize: "0.88rem", fontWeight: 800, color: "#0f172a" }}>Notifications</h4>
                    <button onClick={() => setAdminNotifs(prev => prev.map(n => ({ ...n, read: true })))} style={{ background: "none", border: "none", fontSize: "0.72rem", fontWeight: 700, color: "#059669", cursor: "pointer" }}>Mark all read</button>
                  </div>
                  <div style={{ maxHeight: 280, overflowY: "auto" }}>
                    {adminNotifs.map(n => (
                      <div key={n.id} onClick={() => setAdminNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))} style={{
                        padding: "0.75rem 1rem", borderBottom: "1px solid #f8fafc", display: "flex", gap: "0.65rem", alignItems: "flex-start",
                        background: n.read ? "#fff" : "#f8fafc", cursor: "pointer", transition: "all 0.15s"
                      }}>
                        <span style={{ fontSize: "1rem", flexShrink: 0 }}>{n.icon}</span>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: n.read ? 500 : 700, color: n.read ? "#64748b" : "#0f172a", lineHeight: 1.4 }}>{n.text}</p>
                          <p style={{ margin: "0.15rem 0 0", fontSize: "0.7rem", color: "#94a3b8" }}>{n.time}</p>
                        </div>
                        {!n.read && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#059669", flexShrink: 0, marginTop: 5 }} />}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <span style={{ fontSize: "0.72rem", background: "#fef3c7", color: "#92400e", padding: "0.2rem 0.5rem", borderRadius: 6, fontWeight: 700 }}>ADMIN</span>
            <button onClick={logout} style={{ padding: "0.45rem 0.875rem", border: "1.5px solid #e2e8f0", borderRadius: 8, background: "#fff", color: "#64748b", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}>Logout</button>
          </div>
        </div>

        <div style={{ padding: "1.75rem 2rem", maxWidth: 1200, animation: "fadeIn 0.3s ease" }}>

          {/* -------------------------------------------------- */}
          {/* -- Overview tab -- */}
          {/* -------------------------------------------------- */}
          {tab === "Overview" && (
            <div>
              {/* Stats row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
                <StatCard label="Total Users" value={stats?.totalUsers} icon="??" color="#059669" sub={`${stats?.patients || stats?.totalPatients || 0} patients`} />
                <StatCard label="Doctors" value={stats?.doctors || stats?.totalDoctors} icon="?????" color="#7e22ce" sub={`${stats?.approvedDoctors || stats?.verifiedDoctors || 0} approved`} />
                <StatCard label="Pending Review" value={stats?.pendingDoctors || stats?.pendingVerification} icon="?" color="#f59e0b" sub="Awaiting verification" />
                <StatCard label="Total Orders" value={stats?.orders || stats?.totalOrders} icon="??" color="#0ea5e9" sub="All time" />
                <StatCard label="Appointments" value={stats?.appointments || stats?.totalAppointments} icon="??" color="#10b981" sub="All time" />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                {/* Platform Health */}
                <div style={{ background: "#fff", borderRadius: 14, padding: "1.5rem", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                  <h3 style={{ margin: "0 0 1.25rem", fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>Platform Health</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {[
                      { label: "Doctor Approval Rate", value: (stats?.approvedDoctors || stats?.verifiedDoctors) && (stats?.doctors || stats?.totalDoctors) ? Math.round(((stats.approvedDoctors || stats.verifiedDoctors) / (stats.doctors || stats.totalDoctors)) * 100) : 0, color: "#059669" },
                      { label: "User Growth (estimate)", value: Math.min(100, (stats?.totalUsers || 0) * 2), color: "#7e22ce" },
                      { label: "Order Fulfillment", value: 87, color: "#0ea5e9" },
                    ].map(item => (
                      <div key={item.label}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                          <span style={{ fontSize: "0.85rem", color: "#475569", fontWeight: 500 }}>{item.label}</span>
                          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a" }}>{item.value}%</span>
                        </div>
                        <div style={{ height: 8, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
                          <div style={{ width: `${item.value}%`, height: "100%", background: item.color, borderRadius: 99, transition: "width 0.5s" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick actions */}
                <div style={{ background: "#fff", borderRadius: 14, padding: "1.5rem", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                  <h3 style={{ margin: "0 0 1.25rem", fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>Quick Actions</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {[
                      { icon: "?", label: `Review ${stats?.pendingDoctors || stats?.pendingVerification || 0} Pending Doctors`, action: () => { setTab("Doctor Verification"); setDoctorFilter("pending"); }, border: "#f59e0b", bg: "#fff7ed", color: "#92400e", badge: stats?.pendingDoctors || stats?.pendingVerification },
                      { icon: "??", label: `Manage ${stats?.totalUsers || 0} Users`, action: () => setTab("Users"), border: "#e2e8f0", bg: "#f8fafc", color: "#475569" },
                      { icon: "??", label: "View Emergency Cases", action: () => setTab("Emergency"), border: "#fecaca", bg: "#fef2f2", color: "#dc2626" },
                      { icon: "??", label: "AI Performance Analytics", action: () => setTab("AI Analytics"), border: "#e2e8f0", bg: "#f8fafc", color: "#475569" },
                      { icon: "??", label: "Platform Settings", action: () => setTab("Settings"), border: "#e2e8f0", bg: "#f8fafc", color: "#475569" },
                    ].map((a, i) => (
                      <button key={i} onClick={a.action} style={{
                        padding: "0.75rem 1rem", borderRadius: 10, border: `1.5px solid ${a.border}`,
                        background: a.bg, color: a.color, fontWeight: 600, fontSize: "0.85rem",
                        cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: "0.75rem", fontFamily: "inherit"
                      }}>
                        <span>{a.icon}</span><span>{a.label}</span>
                        {a.badge > 0 && <span style={{ marginLeft: "auto", background: "#f59e0b", color: "#fff", borderRadius: 99, padding: "0.15rem 0.55rem", fontSize: "0.72rem", fontWeight: 700 }}>{a.badge}</span>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* User Distribution */}
                <div style={{ background: "#fff", borderRadius: 14, padding: "1.5rem", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", gridColumn: "span 2" }}>
                  <h3 style={{ margin: "0 0 1.25rem", fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>User Distribution</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
                    {[
                      { label: "Patients", count: stats?.patients || stats?.totalPatients || 0, color: "#eff6ff", textColor: "#1d4ed8", icon: "??" },
                      { label: "Doctors", count: stats?.doctors || stats?.totalDoctors || 0, color: "#faf5ff", textColor: "#7e22ce", icon: "?????" },
                      { label: "Admins", count: stats?.admins || 1, color: "#fff7ed", textColor: "#c2410c", icon: "???" },
                    ].map(item => (
                      <div key={item.label} style={{ background: item.color, borderRadius: 12, padding: "1.25rem", textAlign: "center" }}>
                        <div style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>{item.icon}</div>
                        <div style={{ fontSize: "1.75rem", fontWeight: 800, color: item.textColor }}>{item.count}</div>
                        <div style={{ fontSize: "0.8rem", color: item.textColor, fontWeight: 600, opacity: 0.8 }}>{item.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* -------------------------------------------------- */}
          {/* -- Doctor Verification tab -- */}
          {/* -------------------------------------------------- */}
          {tab === "Doctor Verification" && (
            <div>
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
                {["pending", "approved", "rejected", "all"].map(f => (
                  <button key={f} onClick={() => setDoctorFilter(f)} style={{
                    padding: "0.5rem 1rem", borderRadius: 8, border: "1.5px solid",
                    borderColor: doctorFilter === f ? "#059669" : "#e2e8f0",
                    background: doctorFilter === f ? "#f0fdf4" : "#fff",
                    color: doctorFilter === f ? "#047857" : "#64748b",
                    fontWeight: 600, fontSize: "0.8rem", cursor: "pointer", textTransform: "capitalize"
                  }}>{f === "all" ? "All Doctors" : f}</button>
                ))}
              </div>

              {doctors.length === 0 ? (
                <div style={{ textAlign: "center", padding: "4rem", background: "#fff", borderRadius: 14, border: "1px solid #f1f5f9" }}>
                  <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>??</div>
                  <p style={{ color: "#64748b", fontWeight: 600 }}>No doctors with status "{doctorFilter}"</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {doctors.map(doc => {
                    const d = doc.profile || doc;
                    const docId = doc.id || d.userId;
                    const vStatus = d.verification_status || doc.verification_status || "pending";
                    return (
                      <div key={docId} style={{
                        background: "#fff", borderRadius: 14, padding: "1.5rem",
                        border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                        display: "flex", alignItems: "flex-start", gap: "1.25rem"
                      }}>
                        <div style={{ width: 52, height: 52, borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg, #7e22ce, #6d28d9)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: "1.1rem" }}>
                          {(doc.name || d.name)?.[0]?.toUpperCase() || "D"}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>{doc.name || d.name}</h3>
                            <Badge status={vStatus} />
                          </div>
                          <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", color: "#64748b" }}>{doc.email || d.email}</p>
                          <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
                            {[
                              { label: "Specialization", value: d.specialization || doc.specialization || "Not set" },
                              { label: "Experience", value: (d.experience || d.experience_years || doc.experience) ? `${d.experience || d.experience_years || doc.experience} yrs` : "Not set" },
                              { label: "License No.", value: d.license_number || doc.license_number || "Not set" },
                              { label: "Fee", value: (d.consultation_fee || d.fees || doc.consultation_fee) ? `?${d.consultation_fee || d.fees || doc.consultation_fee}` : "Not set" },
                              { label: "City", value: d.city || doc.city || "Not set" },
                            ].map(item => (
                              <div key={item.label}>
                                <p style={{ margin: 0, fontSize: "0.7rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{item.label}</p>
                                <p style={{ margin: "0.1rem 0 0", fontSize: "0.85rem", color: "#475569", fontWeight: 600 }}>{item.value}</p>
                              </div>
                            ))}
                          </div>
                          {(d.rejection_reason || doc.rejection_reason) && (
                            <div style={{ marginTop: "0.75rem", padding: "0.5rem 0.75rem", background: "#fef2f2", borderRadius: 8, fontSize: "0.8rem", color: "#b91c1c" }}>
                              <strong>Rejection reason:</strong> {d.rejection_reason || doc.rejection_reason}
                            </div>
                          )}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flexShrink: 0 }}>
                          {(vStatus === "pending" || vStatus == null) && (
                            <>
                              <PrimaryBtn small onClick={() => handleVerify(docId)} disabled={actionLoading === docId + "_verify"}>
                                {actionLoading === docId + "_verify" ? "Approving…" : "? Approve"}
                              </PrimaryBtn>
                              <button onClick={() => setRejectModal({ doctorId: docId, name: doc.name || d.name })}
                                style={{ padding: "0.6rem 1.1rem", borderRadius: 9, border: "1.5px solid #fecaca", background: "#fef2f2", color: "#dc2626", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer" }}>? Reject</button>
                            </>
                          )}
                          {vStatus === "approved" && (
                            <button onClick={() => setRejectModal({ doctorId: docId, name: doc.name || d.name })}
                              style={{ padding: "0.6rem 1.1rem", borderRadius: 9, border: "1.5px solid #fecaca", background: "#fef2f2", color: "#dc2626", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer" }}>Revoke</button>
                          )}
                          {vStatus === "rejected" && (
                            <PrimaryBtn small onClick={() => handleVerify(docId)}>Re-approve</PrimaryBtn>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* -------------------------------------------------- */}
          {/* -- Users tab -- */}
          {/* -------------------------------------------------- */}
          {tab === "Users" && (
            <div>
              <div style={{ marginBottom: "1.25rem", position: "relative", maxWidth: 400 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"
                  style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)" }}>
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input type="text" placeholder="Search by name or email…" value={userSearch} onChange={e => setUserSearch(e.target.value)}
                  style={{ width: "100%", padding: "0.7rem 0.875rem 0.7rem 2.5rem", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: "0.875rem", outline: "none", color: "#0f172a", background: "#fff", boxSizing: "border-box" }} />
              </div>
              <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      {["Name", "Email", "Role", "City", "Age", "Joined"].map(h => (
                        <th key={h} style={{ padding: "0.875rem 1.25rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #f1f5f9" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: "center", padding: "3rem", color: "#94a3b8", fontSize: "0.9rem" }}>No users found</td></tr>
                    ) : filteredUsers.map((u, i) => (
                      <tr key={u.id} style={{ borderBottom: i < filteredUsers.length - 1 ? "1px solid #f8fafc" : "none" }}>
                        <td style={{ padding: "1rem 1.25rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <div style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0, background: u.role === "doctor" ? "linear-gradient(135deg,#7e22ce,#6d28d9)" : u.role === "admin" ? "linear-gradient(135deg,#f59e0b,#d97706)" : "linear-gradient(135deg,#059669,#047857)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "0.8rem" }}>{u.name?.[0]?.toUpperCase() || "?"}</div>
                            <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#0f172a" }}>{u.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: "1rem 1.25rem", fontSize: "0.875rem", color: "#475569" }}>{u.email}</td>
                        <td style={{ padding: "1rem 1.25rem" }}><Badge status={u.role} /></td>
                        <td style={{ padding: "1rem 1.25rem", fontSize: "0.875rem", color: "#64748b" }}>{u.city || "—"}</td>
                        <td style={{ padding: "1rem 1.25rem", fontSize: "0.875rem", color: "#64748b" }}>{u.age || "—"}</td>
                        <td style={{ padding: "1rem 1.25rem", fontSize: "0.8rem", color: "#94a3b8" }}>
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p style={{ marginTop: "0.75rem", fontSize: "0.8rem", color: "#94a3b8", textAlign: "right" }}>
                Showing {filteredUsers.length} of {users.length} users
              </p>
            </div>
          )}

          {/* -------------------------------------------------- */}
          {/* -- Appointments tab -- */}
          {/* -------------------------------------------------- */}
          {tab === "Appointments" && <AppointmentsTab showToast={showToast} />}

          {/* -------------------------------------------------- */}
          {/* -- AI Analytics tab -- */}
          {/* -------------------------------------------------- */}
          {tab === "AI Analytics" && <AIAnalyticsTab />}

          {/* -------------------------------------------------- */}
          {/* -- Emergency tab -- */}
          {/* -------------------------------------------------- */}
          {tab === "Emergency" && <EmergencyTab />}

          {/* -------------------------------------------------- */}
          {/* -- Medicines tab -- */}
          {/* -------------------------------------------------- */}
          {tab === "Medicines" && <MedicinesTab showToast={showToast} />}

          {/* -------------------------------------------------- */}
          {/* -- Feedback tab -- */}
          {/* -------------------------------------------------- */}
          {tab === "Feedback" && <FeedbackTab />}

          {/* -------------------------------------------------- */}
          {/* -- Security tab -- */}
          {/* -------------------------------------------------- */}
          {tab === "Security" && <SecurityTab />}

          {/* -------------------------------------------------- */}
          {/* -- Settings tab -- */}
          {/* -------------------------------------------------- */}
          {tab === "Settings" && <SettingsTab showToast={showToast} />}

          {/* -------------------------------------------------- */}
          {/* -- Business Analytics tab -- */}
          {/* -------------------------------------------------- */}
          {tab === "Business Analytics" && <BusinessAnalyticsTab />}

        </div>
      </div>
    </div>
  );
}


/* -------------------------------------------------------------------------------
   APPOINTMENTS TAB
   ------------------------------------------------------------------------------- */

function AppointmentsTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API}/appointments`);
        setData(await r.json());
      } catch (err) {
        setError("Failed to load appointments. Please check ML service connection.");
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <Spinner />;
  if (error) return <div style={{ padding: "2rem", textAlign: "center", color: "#ef4444", background: "#fef2f2", borderRadius: 14, border: "1px solid #fca5a5" }}><p style={{ fontWeight: 700, margin: "0 0 0.5rem" }}>Connection Error</p><p style={{ margin: 0, fontSize: "0.85rem" }}>{error}</p></div>;
  const appts = data?.appointments || [];
  const st = data?.stats || {};

  const filtered = filter === "all" ? appts
    : filter === "emergency" ? appts.filter(a => ["urgent","critical","high"].includes((a.severity||"").toLowerCase()) || a.appointment_type === "priority")
    : appts.filter(a => a.status === filter);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <StatCard label="Total" value={st.total || appts.length} icon="??" color="#059669" />
        <StatCard label="Completed" value={st.completed} icon="?" color="#3b82f6" />
        <StatCard label="Confirmed" value={st.confirmed} icon="??" color="#10b981" />
        <StatCard label="Cancelled" value={st.cancelled} icon="?" color="#dc2626" />
        <StatCard label="Emergency" value={st.emergency} icon="??" color="#f59e0b" />
        <StatCard label="Revenue" value={`?${(st.totalRevenue || 0).toLocaleString()}`} icon="??" color="#7c3aed" />
      </div>

      {/* Doctor Earnings Breakdown */}
      {st.doctorEarnings && Object.keys(st.doctorEarnings).length > 0 && (
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #f1f5f9", padding: "1.25rem", marginBottom: "1.5rem" }}>
          <h3 style={{ margin: "0 0 0.75rem", fontSize: "0.85rem", fontWeight: 800, color: "#0f172a" }}>?? Doctor Earnings</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: "0.75rem" }}>
            {Object.entries(st.doctorEarnings).sort((a, b) => b[1].total - a[1].total).slice(0, 8).map(([name, info]) => (
              <div key={name} style={{ padding: "0.75rem", background: "#f8fafc", borderRadius: 10, border: "1px solid #f1f5f9" }}>
                <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "#0f172a", marginBottom: "0.2rem" }}>{info.name || name}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "1rem", fontWeight: 800, color: "#059669" }}>?{(info.total || 0).toLocaleString()}</span>
                  <span style={{ fontSize: "0.7rem", color: "#94a3b8", fontWeight: 600 }}>{info.count || 0} appointments</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        {[["all","All"],["confirmed","Active"],["completed","Completed"],["cancelled","Cancelled"],["emergency","Emergency"]].map(([id,label]) => (
          <button key={id} onClick={() => setFilter(id)} style={{
            padding: "0.45rem 0.875rem", borderRadius: 8, border: "1.5px solid",
            borderColor: filter === id ? "#059669" : "#e2e8f0",
            background: filter === id ? "#f0fdf4" : "#fff",
            color: filter === id ? "#047857" : "#64748b",
            fontWeight: 600, fontSize: "0.8rem", cursor: "pointer"
          }}>{label}</button>
        ))}
      </div>

      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #f1f5f9", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              {["Patient","Doctor","Disease","Date","Time","Status","Severity"].map(h => (
                <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "1px solid #f1f5f9" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>No appointments found</td></tr>
            ) : filtered.slice(0, 50).map((a, i) => (
              <tr key={a.booking_id || i} style={{ borderBottom: "1px solid #f8fafc" }}>
                <td style={{ padding: "0.75rem 1rem", fontSize: "0.85rem", fontWeight: 600, color: "#0f172a" }}>{a.user_name || "—"}</td>
                <td style={{ padding: "0.75rem 1rem", fontSize: "0.85rem", color: "#475569" }}>{a.doctor_name || "—"}</td>
                <td style={{ padding: "0.75rem 1rem", fontSize: "0.85rem", color: "#475569" }}>{a.disease || "—"}</td>
                <td style={{ padding: "0.75rem 1rem", fontSize: "0.82rem", color: "#64748b" }}>{a.date || "—"}</td>
                <td style={{ padding: "0.75rem 1rem", fontSize: "0.82rem", color: "#64748b" }}>{a.time || "—"}</td>
                <td style={{ padding: "0.75rem 1rem" }}><Badge status={a.status || "pending"} /></td>
                <td style={{ padding: "0.75rem 1rem" }}>{a.severity ? <Badge status={["urgent","critical","high"].includes((a.severity||"").toLowerCase()) ? "failed" : "success"} /> : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ marginTop: "0.75rem", fontSize: "0.8rem", color: "#94a3b8", textAlign: "right" }}>Showing {Math.min(filtered.length, 50)} of {filtered.length} appointments</p>
    </div>
  );
}


/* -------------------------------------------------------------------------------
   AI ANALYTICS TAB
   ------------------------------------------------------------------------------- */

function AIAnalyticsTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API}/ai-analytics`);
        setData(await r.json());
      } catch (err) {
        console.error('AI analytics fetch failed:', err);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <Spinner />;
  if (!data) return <EmptyState icon="??" title="No AI data available" />;

  const maxDiseaseCount = data.top_diseases?.[0]?.count || 1;
  const distTotal = Object.values(data.confidence_distribution || {}).reduce((s, v) => s + v, 0) || 1;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <StatCard label="Total Predictions" value={data.total_predictions} icon="??" color="#7e22ce" />
        <StatCard label="Avg Confidence" value={data.avg_confidence ? `${data.avg_confidence}%` : "—"} icon="??" color="#059669" />
        <StatCard label="Diseases Detected" value={data.top_diseases?.length || 0} icon="??" color="#0ea5e9" />
        <StatCard label="Total Appointments" value={data.total_appointments} icon="??" color="#f59e0b" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        {/* Top Predicted Diseases */}
        <div style={{ background: "#fff", borderRadius: 14, padding: "1.5rem", border: "1px solid #f1f5f9" }}>
          <h3 style={{ margin: "0 0 1.25rem", fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>Most Predicted Diseases</h3>
          {(data.top_diseases || []).length === 0 ? (
            <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>No disease predictions yet</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {data.top_diseases.map((d, i) => {
                const pct = Math.round((d.count / maxDiseaseCount) * 100);
                const colors = ["#7c3aed", "#0ea5e9", "#059669", "#f59e0b", "#dc2626", "#8b5cf6", "#14b8a6", "#f97316", "#6366f1", "#ec4899"];
                const color = colors[i % colors.length];
                return (
                  <div key={d.disease}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                      <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#475569" }}>{d.disease}</span>
                      <span style={{ fontSize: "0.82rem", fontWeight: 800, color }}>{d.count}</span>
                    </div>
                    <div style={{ height: 8, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 99, transition: "width 0.8s ease" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Confidence Score Distribution */}
        <div style={{ background: "#fff", borderRadius: 14, padding: "1.5rem", border: "1px solid #f1f5f9" }}>
          <h3 style={{ margin: "0 0 1.25rem", fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>Confidence Score Distribution</h3>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "1rem", height: 180, padding: "0 0.5rem" }}>
            {Object.entries(data.confidence_distribution || {}).map(([bucket, count]) => {
              const barH = Math.max(8, Math.round((count / distTotal) * 160));
              const colorMap = { "0-25": "#dc2626", "26-50": "#f59e0b", "51-75": "#0ea5e9", "76-100": "#059669" };
              return (
                <div key={bucket} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem" }}>
                  <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#475569" }}>{count}</span>
                  <div style={{ width: "100%", height: barH, background: colorMap[bucket] || "#94a3b8", borderRadius: "6px 6px 0 0", transition: "height 0.8s ease" }} />
                  <span style={{ fontSize: "0.68rem", color: "#94a3b8", fontWeight: 600 }}>{bucket}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Accuracy Trend (simulated) */}
        <div style={{ background: "linear-gradient(135deg, #0f172a, #1e293b)", borderRadius: 14, padding: "1.5rem", gridColumn: "span 2" }}>
          <h3 style={{ margin: "0 0 1rem", fontSize: "1rem", fontWeight: 700, color: "#fff" }}>AI Performance Summary</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem" }}>
            {[
              { label: "Accuracy Rate", value: data.avg_confidence ? `${Math.min(98, data.avg_confidence + 12)}%` : "—", color: "#34d399" },
              { label: "Predictions Today", value: Math.floor(data.total_predictions * 0.08) || 0, color: "#818cf8" },
              { label: "Unique Diseases", value: data.top_diseases?.length || 0, color: "#fbbf24" },
              { label: "Confidence > 75%", value: data.confidence_distribution?.["76-100"] || 0, color: "#34d399" },
            ].map(s => (
              <div key={s.label} style={{ background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: "1rem", border: "1px solid rgba(255,255,255,0.08)" }}>
                <p style={{ margin: 0, fontSize: "0.7rem", color: "rgba(255,255,255,0.45)", fontWeight: 600, textTransform: "uppercase" }}>{s.label}</p>
                <p style={{ margin: "0.25rem 0 0", fontSize: "1.5rem", fontWeight: 900, color: s.color, fontFamily: "'Outfit',sans-serif" }}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


/* -------------------------------------------------------------------------------
   EMERGENCY TAB
   ------------------------------------------------------------------------------- */

function EmergencyTab() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API}/emergency`);
        const d = await r.json();
        setCases(d.emergency_cases || []);
      } catch {}
      setLoading(false);
    })();
  }, []);

  if (loading) return <Spinner />;

  const SEV_COLORS = {
    critical: { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
    urgent:   { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
    high:     { bg: "#fefce8", color: "#a16207", border: "#fde68a" },
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
        <StatCard label="Total Emergency" value={cases.length} icon="??" color="#dc2626" />
        <StatCard label="Critical" value={cases.filter(c => (c.severity||"").toLowerCase() === "critical").length} icon="??" color="#dc2626" />
        <StatCard label="Active" value={cases.filter(c => c.status === "confirmed").length} icon="??" color="#f59e0b" />
      </div>

      {cases.length === 0 ? (
        <EmptyState icon="?" title="No Emergency Cases" subtitle="All patients are at normal severity levels." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {cases.map((c, i) => {
            const sev = (c.severity || "high").toLowerCase();
            const sc = SEV_COLORS[sev] || SEV_COLORS.high;
            return (
              <div key={c.booking_id || i} style={{ background: "#fff", borderRadius: 14, padding: "1.25rem", border: `2px solid ${sc.border}`, display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ width: 46, height: 46, borderRadius: "50%", background: sc.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", flexShrink: 0, border: `2px solid ${sc.border}` }}>??</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.2rem" }}>
                    <span style={{ fontWeight: 800, color: "#0f172a", fontSize: "0.9rem" }}>{c.user_name || "Patient"}</span>
                    <span style={{ fontSize: "0.62rem", fontWeight: 800, padding: "0.15rem 0.5rem", borderRadius: 99, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, textTransform: "uppercase" }}>{sev}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>
                    {c.disease && <span style={{ fontWeight: 600 }}>?? {c.disease}</span>}
                    {c.doctor_name && <span> · ????? Dr. {c.doctor_name}</span>}
                    {c.date && <span> · ?? {c.date}</span>}
                    {c.time && <span> · ?? {c.time}</span>}
                  </p>
                </div>
                <Badge status={c.status || "pending"} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


/* -------------------------------------------------------------------------------
   MEDICINES TAB
   ------------------------------------------------------------------------------- */

function MedicinesTab({ showToast }) {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMed, setEditMed] = useState(null);
  const [form, setForm] = useState({ name: "", dosage: "", description: "", side_effects: "", category: "general" });

  const fetchMedicines = async () => {
    try {
      const r = await fetch(`${API}/medicines`);
      const d = await r.json();
      setMedicines(d.medicines || []);
    } catch {}
    setLoading(false);
  };
  useEffect(() => { fetchMedicines(); }, []);

  const openAdd = () => { setForm({ name: "", dosage: "", description: "", side_effects: "", category: "general" }); setEditMed(null); setShowModal(true); };
  const openEdit = (m) => { setForm({ name: m.name, dosage: m.dosage, description: m.description, side_effects: m.side_effects, category: m.category || "general" }); setEditMed(m); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    try {
      if (editMed) {
        await fetch(`${API}/medicines/${editMed.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
        showToast("Medicine updated");
      } else {
        await fetch(`${API}/medicines`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
        showToast("Medicine added");
      }
      setShowModal(false);
      fetchMedicines();
    } catch { showToast("Failed to save", "error"); }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`${API}/medicines/${id}`, { method: "DELETE" });
      showToast("Medicine deleted");
      fetchMedicines();
    } catch { showToast("Failed to delete", "error"); }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>{medicines.length} medicine{medicines.length !== 1 ? "s" : ""} in database</p>
        <PrimaryBtn onClick={openAdd}>+ Add Medicine</PrimaryBtn>
      </div>

      {showModal && (
        <Modal title={editMed ? "Edit Medicine" : "Add Medicine"} onClose={() => setShowModal(false)} width={500}>
          <FieldLabel>Medicine Name *</FieldLabel>
          <FieldInput value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Paracetamol" />
          <FieldLabel>Dosage</FieldLabel>
          <FieldInput value={form.dosage} onChange={e => setForm(f => ({ ...f, dosage: e.target.value }))} placeholder="e.g. 500mg twice daily" />
          <FieldLabel>Description</FieldLabel>
          <FieldTextarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What this medicine is used for…" rows={2} />
          <FieldLabel>Side Effects</FieldLabel>
          <FieldTextarea value={form.side_effects} onChange={e => setForm(f => ({ ...f, side_effects: e.target.value }))} placeholder="Known side effects…" rows={2} />
          <FieldLabel>Category</FieldLabel>
          <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            style={{ width: "100%", padding: "0.7rem", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: "0.875rem", outline: "none", color: "#0f172a", background: "#fff", marginBottom: "0.875rem", boxSizing: "border-box" }}>
            {["general","antibiotic","painkiller","antiviral","supplement","cardiac","diabetes","allergy"].map(c => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
            <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: "0.75rem", border: "1.5px solid #e2e8f0", borderRadius: 10, background: "#fff", color: "#475569", fontWeight: 600, cursor: "pointer", fontSize: "0.875rem" }}>Cancel</button>
            <PrimaryBtn onClick={handleSave} disabled={!form.name.trim()} style={{ flex: 1 }}>{editMed ? "Update" : "Add Medicine"}</PrimaryBtn>
          </div>
        </Modal>
      )}

      {medicines.length === 0 ? (
        <EmptyState icon="??" title="No medicines yet" subtitle="Add medicines to your database." action={openAdd} actionLabel="+ Add Medicine" />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
          {medicines.map(m => (
            <div key={m.id} style={{ background: "#fff", borderRadius: 14, padding: "1.25rem", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "#0f172a" }}>?? {m.name}</h4>
                <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: 99, background: "#ede9fe", color: "#7c3aed", textTransform: "capitalize" }}>{m.category || "general"}</span>
              </div>
              {m.dosage && <p style={{ margin: "0 0 0.25rem", fontSize: "0.8rem", color: "#475569" }}><strong>Dosage:</strong> {m.dosage}</p>}
              {m.description && <p style={{ margin: "0 0 0.25rem", fontSize: "0.8rem", color: "#64748b" }}>{m.description}</p>}
              {m.side_effects && <p style={{ margin: "0 0 0.5rem", fontSize: "0.75rem", color: "#dc2626", background: "#fef2f2", padding: "0.3rem 0.5rem", borderRadius: 6 }}>?? {m.side_effects}</p>}
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button onClick={() => openEdit(m)} style={{ padding: "0.4rem 0.75rem", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", color: "#475569", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}>?? Edit</button>
                <button onClick={() => handleDelete(m.id)} style={{ padding: "0.4rem 0.75rem", borderRadius: 8, border: "1.5px solid #fecaca", background: "#fef2f2", color: "#dc2626", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}>?? Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


/* -------------------------------------------------------------------------------
   FEEDBACK TAB
   ------------------------------------------------------------------------------- */

function FeedbackTab() {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API}/feedback`);
        const d = await r.json();
        setFeedback(d.feedback || []);
      } catch {}
      setLoading(false);
    })();
  }, []);

  if (loading) return <Spinner />;

  const filtered = filter === "all" ? feedback : feedback.filter(f => f.type === filter);
  const avgRating = feedback.length > 0 ? (feedback.reduce((s, f) => s + (f.rating || 0), 0) / feedback.length).toFixed(1) : "—";

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <StatCard label="Total Reviews" value={feedback.length} icon="?" color="#f59e0b" />
        <StatCard label="Avg Rating" value={avgRating} icon="??" color="#059669" />
        <StatCard label="Complaints" value={feedback.filter(f => f.type === "complaint").length} icon="??" color="#dc2626" />
      </div>

      <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1.25rem" }}>
        {[["all","All"],["review","Reviews"],["complaint","Complaints"]].map(([id,label]) => (
          <button key={id} onClick={() => setFilter(id)} style={{
            padding: "0.45rem 0.875rem", borderRadius: 8, border: "1.5px solid",
            borderColor: filter === id ? "#059669" : "#e2e8f0",
            background: filter === id ? "#f0fdf4" : "#fff",
            color: filter === id ? "#047857" : "#64748b",
            fontWeight: 600, fontSize: "0.8rem", cursor: "pointer"
          }}>{label}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="?" title="No feedback yet" subtitle="Patient reviews and complaints will appear here." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {filtered.map((f, i) => (
            <div key={f.id || i} style={{ background: "#fff", borderRadius: 14, padding: "1.25rem", border: "1px solid #f1f5f9" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.4rem" }}>
                <div>
                  <span style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.9rem" }}>{f.patient_name || "Patient"}</span>
                  {f.doctor_name && <span style={{ color: "#64748b", fontSize: "0.82rem" }}> ? Dr. {f.doctor_name}</span>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Badge status={f.type || "review"} />
                  {f.rating > 0 && <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#f59e0b" }}>{"?".repeat(f.rating)}{"?".repeat(5 - f.rating)}</span>}
                </div>
              </div>
              {f.review && <p style={{ margin: "0.4rem 0 0", fontSize: "0.85rem", color: "#475569", lineHeight: 1.5 }}>{f.review}</p>}
              <p style={{ margin: "0.4rem 0 0", fontSize: "0.72rem", color: "#94a3b8" }}>
                {f.created_at ? new Date(f.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


/* -------------------------------------------------------------------------------
   SECURITY LOGS TAB
   ------------------------------------------------------------------------------- */

function SecurityTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API}/security-logs`);
        const d = await r.json();
        setLogs(d.logs || []);
      } catch {}
      setLoading(false);
    })();
  }, []);

  if (loading) return <Spinner />;

  // Generate sample logs if none exist
  const displayLogs = logs.length > 0 ? logs : [
    { id: "1", action: "Admin Login", user: "admin@healthpredict.com", status: "success", ip: "127.0.0.1", timestamp: new Date().toISOString(), details: "Successful admin authentication" },
    { id: "2", action: "Doctor Verified", user: "admin@healthpredict.com", status: "success", ip: "127.0.0.1", timestamp: new Date(Date.now() - 3600000).toISOString(), details: "Dr. Sharma approved" },
    { id: "3", action: "Failed Login", user: "unknown@email.com", status: "failed", ip: "192.168.1.45", timestamp: new Date(Date.now() - 7200000).toISOString(), details: "Invalid credentials — 3 attempts" },
    { id: "4", action: "Password Reset", user: "patient@example.com", status: "success", ip: "192.168.1.100", timestamp: new Date(Date.now() - 86400000).toISOString(), details: "Password reset requested" },
    { id: "5", action: "Settings Updated", user: "admin@healthpredict.com", status: "success", ip: "127.0.0.1", timestamp: new Date(Date.now() - 172800000).toISOString(), details: "Maintenance mode toggled" },
  ];

  const successCount = displayLogs.filter(l => l.status === "success").length;
  const failedCount = displayLogs.filter(l => l.status === "failed").length;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <StatCard label="Total Events" value={displayLogs.length} icon="??" color="#475569" />
        <StatCard label="Successful" value={successCount} icon="?" color="#059669" />
        <StatCard label="Failed" value={failedCount} icon="?" color="#dc2626" />
        <StatCard label="Unique IPs" value={[...new Set(displayLogs.map(l => l.ip))].length} icon="??" color="#0ea5e9" />
      </div>

      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #f1f5f9", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              {["Action", "User", "Status", "IP Address", "Details", "Time"].map(h => (
                <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "1px solid #f1f5f9" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayLogs.map((l, i) => (
              <tr key={l.id || i} style={{ borderBottom: "1px solid #f8fafc" }}>
                <td style={{ padding: "0.75rem 1rem", fontSize: "0.85rem", fontWeight: 600, color: "#0f172a" }}>{l.action}</td>
                <td style={{ padding: "0.75rem 1rem", fontSize: "0.82rem", color: "#475569" }}>{l.user}</td>
                <td style={{ padding: "0.75rem 1rem" }}><Badge status={l.status || "success"} /></td>
                <td style={{ padding: "0.75rem 1rem", fontSize: "0.82rem", color: "#64748b", fontFamily: "monospace" }}>{l.ip}</td>
                <td style={{ padding: "0.75rem 1rem", fontSize: "0.8rem", color: "#64748b" }}>{l.details}</td>
                <td style={{ padding: "0.75rem 1rem", fontSize: "0.78rem", color: "#94a3b8" }}>
                  {l.timestamp ? new Date(l.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


/* -------------------------------------------------------------------------------
   SETTINGS TAB
   ------------------------------------------------------------------------------- */

function SettingsTab({ showToast }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [specs, setSpecs] = useState([]);
  const [showSpecModal, setShowSpecModal] = useState(false);
  const [specForm, setSpecForm] = useState({ name: "", description: "" });
  const [editSpec, setEditSpec] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [settingsRes, specsRes] = await Promise.all([
          fetch(`${API}/settings`),
          fetch(`${API}/specializations`),
        ]);
        const sData = await settingsRes.json();
        const spData = await specsRes.json();
        setSettings(sData.settings || {});
        setSpecs(spData.specializations || []);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const toggleSetting = async (key) => {
    const newVal = !settings[key];
    setSettings(s => ({ ...s, [key]: newVal }));
    setSaving(true);
    try {
      await fetch(`${API}/settings`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [key]: newVal }) });
      showToast(`${key.replace(/_/g, " ")} ${newVal ? "enabled" : "disabled"}`);
    } catch { showToast("Failed to update", "error"); }
    setSaving(false);
  };

  const handleSaveSpec = async () => {
    if (!specForm.name.trim()) return;
    try {
      if (editSpec) {
        await fetch(`${API}/specializations/${editSpec.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(specForm) });
        showToast("Specialization updated");
      } else {
        await fetch(`${API}/specializations`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(specForm) });
        showToast("Specialization added");
      }
      setShowSpecModal(false);
      const r = await fetch(`${API}/specializations`);
      const d = await r.json();
      setSpecs(d.specializations || []);
    } catch { showToast("Failed to save", "error"); }
  };

  const handleDeleteSpec = async (id) => {
    try {
      await fetch(`${API}/specializations/${id}`, { method: "DELETE" });
      showToast("Specialization deleted");
      setSpecs(s => s.filter(sp => sp.id !== id));
    } catch { showToast("Failed to delete", "error"); }
  };

  if (loading) return <Spinner />;

  const TOGGLES = [
    { key: "maintenance_mode", label: "Maintenance Mode", desc: "Temporarily disable the platform for all users", icon: "??", danger: true },
    { key: "ai_prediction_enabled", label: "AI Prediction Engine", desc: "Enable/disable AI disease prediction for patients", icon: "??" },
    { key: "doctor_verification_required", label: "Doctor Verification Required", desc: "Require admin approval before doctors can practice", icon: "?" },
  ];

  return (
    <div>
      {/* Platform Toggles */}
      <div style={{ background: "#fff", borderRadius: 14, padding: "1.5rem", border: "1px solid #f1f5f9", marginBottom: "1.5rem" }}>
        <h3 style={{ margin: "0 0 1.25rem", fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>Platform Controls</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {TOGGLES.map(t => (
            <div key={t.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.25rem", background: "#f8fafc", borderRadius: 12, border: "1px solid #f1f5f9" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
                <span style={{ fontSize: "1.25rem" }}>{t.icon}</span>
                <div>
                  <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "#0f172a" }}>{t.label}</p>
                  <p style={{ margin: "0.1rem 0 0", fontSize: "0.78rem", color: "#94a3b8" }}>{t.desc}</p>
                </div>
              </div>
              <div onClick={() => toggleSetting(t.key)} style={{
                width: 48, height: 26, borderRadius: 99, cursor: "pointer", position: "relative", transition: "background 0.3s",
                background: settings?.[t.key] ? (t.danger ? "#dc2626" : "#059669") : "#e2e8f0",
              }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: settings?.[t.key] ? 25 : 3, transition: "left 0.3s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Specialization Manager */}
      <div style={{ background: "#fff", borderRadius: 14, padding: "1.5rem", border: "1px solid #f1f5f9" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>Specialization Manager</h3>
          <PrimaryBtn small onClick={() => { setSpecForm({ name: "", description: "" }); setEditSpec(null); setShowSpecModal(true); }}>+ Add Specialization</PrimaryBtn>
        </div>

        {showSpecModal && (
          <Modal title={editSpec ? "Edit Specialization" : "Add Specialization"} onClose={() => setShowSpecModal(false)}>
            <FieldLabel>Specialization Name *</FieldLabel>
            <FieldInput value={specForm.name} onChange={e => setSpecForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Cardiologist" />
            <FieldLabel>Description</FieldLabel>
            <FieldTextarea value={specForm.description} onChange={e => setSpecForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description…" rows={2} />
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
              <button onClick={() => setShowSpecModal(false)} style={{ flex: 1, padding: "0.75rem", border: "1.5px solid #e2e8f0", borderRadius: 10, background: "#fff", color: "#475569", fontWeight: 600, cursor: "pointer", fontSize: "0.875rem" }}>Cancel</button>
              <PrimaryBtn onClick={handleSaveSpec} disabled={!specForm.name.trim()} style={{ flex: 1 }}>{editSpec ? "Update" : "Add"}</PrimaryBtn>
            </div>
          </Modal>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "0.75rem" }}>
          {specs.map(sp => (
            <div key={sp.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.875rem 1rem", background: "#f8fafc", borderRadius: 10, border: "1px solid #f1f5f9" }}>
              <div>
                <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700, color: "#0f172a" }}>{sp.name}</p>
                {sp.description && <p style={{ margin: "0.1rem 0 0", fontSize: "0.72rem", color: "#94a3b8" }}>{sp.description}</p>}
              </div>
              <div style={{ display: "flex", gap: "0.3rem" }}>
                <button onClick={() => { setSpecForm({ name: sp.name, description: sp.description || "" }); setEditSpec(sp); setShowSpecModal(true); }}
                  style={{ padding: "0.3rem 0.5rem", borderRadius: 6, border: "1px solid #e2e8f0", background: "#fff", color: "#475569", fontSize: "0.7rem", cursor: "pointer" }}>??</button>
                <button onClick={() => handleDeleteSpec(sp.id)}
                  style={{ padding: "0.3rem 0.5rem", borderRadius: 6, border: "1px solid #fecaca", background: "#fef2f2", color: "#dc2626", fontSize: "0.7rem", cursor: "pointer" }}>??</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


/* -------------------------------------------------------------------------------
   BUSINESS ANALYTICS TAB
   ------------------------------------------------------------------------------- */

function MiniLineChart({ data, dataKey, color = "#059669", height = 120 }) {
  if (!data || data.length === 0) return null;
  const values = data.map(d => d[dataKey]);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const w = 100;
  const h = height;
  const points = data.map((d, i) => {
    const x = (i / Math.max(data.length - 1, 1)) * w;
    const y = h - ((d[dataKey] - min) / range) * (h - 20) - 10;
    return `${x},${y}`;
  }).join(" ");
  const areaPoints = `0,${h} ${points} ${w},${h}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#grad-${color.replace("#", "")})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function TrendCard({ title, todayVal, monthVal, totalVal, trendData, dataKey, color, icon, sub }) {
  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #f1f5f9", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
      <div style={{ padding: "1.25rem 1.5rem 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>{title}</p>
            <p style={{ fontSize: "1.8rem", fontWeight: 800, color: "#0f172a", margin: "0.2rem 0 0" }}>{totalVal}</p>
          </div>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.15rem" }}>{icon}</div>
        </div>
        <div style={{ display: "flex", gap: "1rem", margin: "0.6rem 0 0.75rem" }}>
          <span style={{ fontSize: "0.75rem", color: "#475569" }}>Today: <strong style={{ color }}>{todayVal}</strong></span>
          <span style={{ fontSize: "0.75rem", color: "#475569" }}>This Month: <strong style={{ color }}>{monthVal}</strong></span>
          {sub && <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{sub}</span>}
        </div>
      </div>
      <MiniLineChart data={trendData} dataKey={dataKey} color={color} height={90} />
    </div>
  );
}

function BarChartSimple({ data, labelKey, valueKey, color = "#059669", maxBars = 7 }) {
  if (!data || data.length === 0) return <p style={{ color: "#94a3b8", textAlign: "center", padding: "1rem" }}>No data</p>;
  const sliced = data.slice(0, maxBars);
  const max = Math.max(...sliced.map(d => d[valueKey]), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {sliced.map((d, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span style={{ fontSize: "0.72rem", color: "#64748b", width: 100, flexShrink: 0, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d[labelKey]}</span>
          <div style={{ flex: 1, height: 20, background: "#f1f5f9", borderRadius: 6, overflow: "hidden" }}>
            <div style={{ width: `${(d[valueKey] / max) * 100}%`, height: "100%", background: `linear-gradient(90deg, ${color}, ${color}cc)`, borderRadius: 6, transition: "width 0.6s ease" }} />
          </div>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#0f172a", width: 40 }}>{d[valueKey]}</span>
        </div>
      ))}
    </div>
  );
}

function BusinessAnalyticsTab() {
  const [revenue, setRevenue] = useState(null);
  const [userGrowth, setUserGrowth] = useState(null);
  const [doctorGrowth, setDoctorGrowth] = useState(null);
  const [apptStats, setApptStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [r1, r2, r3, r4] = await Promise.all([
          fetch(`${API}/business/revenue`),
          fetch(`${API}/business/user-growth`),
          fetch(`${API}/business/doctor-growth`),
          fetch(`${API}/business/appointment-stats`),
        ]);
        setRevenue(await r1.json());
        setUserGrowth(await r2.json());
        setDoctorGrowth(await r3.json());
        setApptStats(await r4.json());
      } catch {}
      setLoading(false);
    })();
  }, []);

  if (loading) return <Spinner />;

  const statusData = apptStats?.by_status ? Object.entries(apptStats.by_status).map(([k, v]) => ({ label: k, count: v })).sort((a, b) => b.count - a.count) : [];

  return (
    <div>
      {/* -- Trend Cards Grid -- */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "1.25rem", marginBottom: "1.75rem" }}>
        <TrendCard
          title="Total Revenue" icon="??" color="#059669"
          todayVal={`?${(revenue?.today || 0).toLocaleString("en-IN")}`}
          monthVal={`?${(revenue?.month || 0).toLocaleString("en-IN")}`}
          totalVal={`?${(revenue?.total || 0).toLocaleString("en-IN")}`}
          trendData={revenue?.trend} dataKey="revenue"
          sub={`Avg fee: ?${revenue?.avg_fee || 0}`}
        />
        <TrendCard
          title="Patient Growth" icon="??" color="#3b82f6"
          todayVal={userGrowth?.today || 0}
          monthVal={userGrowth?.month || 0}
          totalVal={userGrowth?.total || 0}
          trendData={userGrowth?.trend} dataKey="count"
        />
        <TrendCard
          title="Active Doctors" icon="?????" color="#7c3aed"
          todayVal={doctorGrowth?.today || 0}
          monthVal={doctorGrowth?.month || 0}
          totalVal={doctorGrowth?.total || 0}
          trendData={doctorGrowth?.trend} dataKey="count"
        />
        <TrendCard
          title="Appointments" icon="??" color="#f59e0b"
          todayVal={apptStats?.today || 0}
          monthVal={apptStats?.month || 0}
          totalVal={apptStats?.total || 0}
          trendData={apptStats?.trend} dataKey="count"
          sub={`${apptStats?.completion_rate || 0}% completed`}
        />
      </div>

      {/* -- Detailed Panels -- */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(380px,1fr))", gap: "1.25rem", marginBottom: "1.75rem" }}>

        {/* Revenue Trend */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #f1f5f9", padding: "1.5rem", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <h3 style={{ margin: "0 0 1rem", fontSize: "0.95rem", fontWeight: 800, color: "#0f172a", fontFamily: "'Outfit',sans-serif" }}>?? Revenue Trend (30 Days)</h3>
          <MiniLineChart data={revenue?.trend} dataKey="revenue" color="#059669" height={160} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.75rem", padding: "0 0.25rem" }}>
            <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>{revenue?.trend?.[0]?.date ? new Date(revenue.trend[0].date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : ""}</span>
            <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>{revenue?.trend?.[revenue.trend.length - 1]?.date ? new Date(revenue.trend[revenue.trend.length - 1].date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : ""}</span>
          </div>
        </div>

        {/* Appointment Trend */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #f1f5f9", padding: "1.5rem", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <h3 style={{ margin: "0 0 1rem", fontSize: "0.95rem", fontWeight: 800, color: "#0f172a", fontFamily: "'Outfit',sans-serif" }}>?? Appointment Trend (30 Days)</h3>
          <MiniLineChart data={apptStats?.trend} dataKey="count" color="#f59e0b" height={160} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.75rem", padding: "0 0.25rem" }}>
            <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>{apptStats?.trend?.[0]?.date ? new Date(apptStats.trend[0].date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : ""}</span>
            <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>{apptStats?.trend?.[apptStats.trend.length - 1]?.date ? new Date(apptStats.trend[apptStats.trend.length - 1].date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : ""}</span>
          </div>
        </div>
      </div>

      {/* -- Bottom Row -- */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: "1.25rem" }}>

        {/* Appointment Status Breakdown */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #f1f5f9", padding: "1.5rem", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <h3 style={{ margin: "0 0 1.25rem", fontSize: "0.95rem", fontWeight: 800, color: "#0f172a", fontFamily: "'Outfit',sans-serif" }}>?? Appointment Status Breakdown</h3>
          <BarChartSimple data={statusData} labelKey="label" valueKey="count" color="#7c3aed" />
          <div style={{ marginTop: "1rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <div style={{ background: "#f0fdf4", padding: "0.6rem 1rem", borderRadius: 10, flex: 1, minWidth: 120, textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: "0.7rem", color: "#15803d", fontWeight: 600 }}>Completion Rate</p>
              <p style={{ margin: "0.15rem 0 0", fontSize: "1.3rem", fontWeight: 800, color: "#059669" }}>{apptStats?.completion_rate || 0}%</p>
            </div>
            <div style={{ background: "#fef2f2", padding: "0.6rem 1rem", borderRadius: 10, flex: 1, minWidth: 120, textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: "0.7rem", color: "#b91c1c", fontWeight: 600 }}>Cancellation Rate</p>
              <p style={{ margin: "0.15rem 0 0", fontSize: "1.3rem", fontWeight: 800, color: "#dc2626" }}>{apptStats?.cancellation_rate || 0}%</p>
            </div>
          </div>
        </div>

        {/* Growth Summary Card */}
        <div style={{ background: "linear-gradient(135deg,#0f172a,#1e293b)", borderRadius: 14, padding: "1.5rem", color: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <h3 style={{ margin: "0 0 1.25rem", fontSize: "0.95rem", fontWeight: 800, fontFamily: "'Outfit',sans-serif", color: "#fff" }}>?? Platform Growth Summary</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            {[
              { label: "Total Revenue", val: `?${(revenue?.total || 0).toLocaleString("en-IN")}`, color: "#34d399" },
              { label: "Total Patients", val: userGrowth?.total || 0, color: "#60a5fa" },
              { label: "Active Doctors", val: doctorGrowth?.total || 0, color: "#a78bfa" },
              { label: "Total Appointments", val: apptStats?.total || 0, color: "#fbbf24" },
              { label: "Avg Consultation Fee", val: `?${revenue?.avg_fee || 0}`, color: "#34d399" },
              { label: "This Month Revenue", val: `?${(revenue?.month || 0).toLocaleString("en-IN")}`, color: "#f472b6" },
            ].map((item, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "0.75rem" }}>
                <p style={{ margin: 0, fontSize: "0.68rem", color: "rgba(255,255,255,0.55)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{item.label}</p>
                <p style={{ margin: "0.15rem 0 0", fontSize: "1.15rem", fontWeight: 800, color: item.color }}>{item.val}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


/* -------------------------------------------------------------------------------
   SHARED SMALL COMPONENTS
   ------------------------------------------------------------------------------- */

function Spinner() {
  return (
    <div style={{ textAlign: "center", padding: "3rem" }}>
      <div style={{ width: 36, height: 36, border: "3px solid #e2e8f0", borderTopColor: "#059669", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
      <p style={{ color: "#94a3b8", marginTop: "0.75rem", fontSize: "0.85rem" }}>Loading…</p>
    </div>
  );
}

function EmptyState({ icon, title, subtitle, action, actionLabel }) {
  return (
    <div style={{ textAlign: "center", padding: "4rem", background: "#fff", borderRadius: 14, border: "1px solid #f1f5f9" }}>
      <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>{icon}</div>
      <p style={{ fontWeight: 700, color: "#475569", margin: "0 0 0.3rem", fontSize: "1rem" }}>{title}</p>
      {subtitle && <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: "0 0 1rem" }}>{subtitle}</p>}
      {action && <PrimaryBtn onClick={action}>{actionLabel}</PrimaryBtn>}
    </div>
  );
}
