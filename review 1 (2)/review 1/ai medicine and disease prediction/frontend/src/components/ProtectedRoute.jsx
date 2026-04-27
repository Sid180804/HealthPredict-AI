import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * ProtectedRoute
 *
 * Props:
 *   roles   — optional string[] of allowed roles e.g. ['doctor']
 *             If omitted, any authenticated user is allowed.
 *   children — the component to render if access is granted
 *
 * Redirects:
 *   • not logged in → /login
 *   • wrong role    → their own default dashboard (homePath)
 */
export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, loading, user, homePath } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", background: "#f8fafc", flexDirection: "column", gap: "1rem",
        fontFamily: "'Inter', sans-serif",
      }}>
        <div style={{
          width: 44, height: 44, border: "3px solid #e2e8f0",
          borderTopColor: "#059669", borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />
        <p style={{ fontSize: "0.9rem", color: "#64748b", fontWeight: 500 }}>Loading…</p>
        <style>{`@keyframes spin { 100%{ transform:rotate(360deg) } }`}</style>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/select-role" replace />;

  // Role-gated route — redirect to the user's own dashboard if they don't qualify
  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to={homePath} replace />;
  }

  return children;
}
