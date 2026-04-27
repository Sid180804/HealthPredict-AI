import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE;

// localStorage keys — single source of truth
const LS_TOKEN = "auth_token";
const LS_ROLE  = "auth_role";
const LS_USER  = "auth_user";

const AuthContext = createContext();

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/** Restore user from localStorage without a network call. */
function restoreSession() {
  try {
    const token = localStorage.getItem(LS_TOKEN);
    const raw   = localStorage.getItem(LS_USER);
    if (token && raw) {
      const user = JSON.parse(raw);
      return { token, user };
    }
  } catch { /* corrupted storage — will be wiped on logout */ }
  return { token: null, user: null };
}

/** Write session to localStorage + set axios header. */
function persistSession(token, user) {
  localStorage.setItem(LS_TOKEN, token);
  localStorage.setItem(LS_ROLE,  user.role ?? "");
  localStorage.setItem(LS_USER,  JSON.stringify(user));
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

/** Completely wipe every auth key from localStorage + axios header. */
function clearSession() {
  localStorage.removeItem(LS_TOKEN);
  localStorage.removeItem(LS_ROLE);
  localStorage.removeItem(LS_USER);
  // Also clear legacy keys that may exist from older code paths
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("user");
  delete axios.defaults.headers.common["Authorization"];
}

export function AuthProvider({ children }) {
  const initial = restoreSession();
  const [user,    setUser]    = useState(initial.user);
  const [token,   setToken]   = useState(initial.token);
  const [loading, setLoading] = useState(!!initial.token); // only load if we have a stored token

  // On mount: if we have a cached token, verify it's still valid server-side.
  // On success we refresh the user object; on failure we wipe the stale session.
  useEffect(() => {
    if (!initial.token) return;
    axios.defaults.headers.common["Authorization"] = `Bearer ${initial.token}`;

    axios.get(`${API_BASE}/api/auth/me`)
      .then(res => {
        const freshUser = res.data.user;
        setUser(freshUser);
        // Re-persist with fresh data so localStorage stays up to date
        localStorage.setItem(LS_ROLE, freshUser.role ?? "");
        localStorage.setItem(LS_USER, JSON.stringify(freshUser));
      })
      .catch(() => {
        // Token rejected by server — clear everything
        _resetState();
        clearSession();
      })
      .finally(() => setLoading(false));
  }, []); // runs once on mount

  // Internal: reset React state only (no localStorage side-effects)
  const _resetState = () => {
    setToken(null);
    setUser(null);
  };

  const login = useCallback(async (email, password, expectedRole) => {
    try {
      const payload = { email, password };
      if (expectedRole) payload.expectedRole = expectedRole;

      const res = await axios.post(`${API_BASE}/api/auth/login`, payload);
      const { token: t, user: u } = res.data;
      if (!t || !u) return { success: false, error: "Invalid server response" };

      // Clear previous session BEFORE writing new one to avoid stale data
      clearSession();
      persistSession(t, u);
      setToken(t);
      setUser(u);

      return { success: true, user: u };
    } catch (err) {
      // On login failure, ensure no stale session persists
      clearSession();
      _resetState();
      const data = err.response?.data;
      return {
        success: false,
        error: data?.error || "Login failed",
        // Pass through role mismatch metadata so the login page can show a redirect link
        actualRole: data?.actualRole || null,
        correctPortal: data?.correctPortal || null,
      };
    }
  }, []);

  const register = useCallback(async (data) => {
    try {
      const res = await axios.post(`${API_BASE}/api/auth/register`, data, {
        headers: { "Content-Type": "application/json" },
        timeout: 10000,
      });
      if (res.status === 201 && res.data.token) {
        clearSession();
        persistSession(res.data.token, res.data.user);
        setToken(res.data.token);
        setUser(res.data.user);
        return { success: true, user: res.data.user };
      }
      return { success: false, error: res.data?.error || "Registration failed" };
    } catch (err) {
      const msg = err.response?.data?.error
        || (err.code === "ERR_NETWORK" ? "Cannot reach server — is the backend running?" : err.message);
      return { success: false, error: msg };
    }
  }, []);

  const logout = useCallback(async () => {
    // Best-effort server-side logout; never block on it
    try { if (token) await axios.post(`${API_BASE}/api/auth/logout`); } catch { /* no-op */ }
    _resetState();
    clearSession();
  }, [token]);

  const updateProfile = useCallback(async (profileData) => {
    try {
      const res = await axios.put(`${API_BASE}/api/auth/profile`, profileData);
      const updatedUser = res.data.user;
      setUser(updatedUser);
      localStorage.setItem(LS_USER, JSON.stringify(updatedUser));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || "Update failed" };
    }
  }, []);

  /**
   * setSession — hydrate AuthContext from any externally-obtained token + user.
   * Used by login pages that call a different backend (e.g. Flask on port 5002)
   * instead of going through the Node AuthContext.login() path.
   */
  const setSession = useCallback((t, u) => {
    clearSession();
    persistSession(t, u);
    setToken(t);
    setUser(u);
  }, []);

  const isAuthenticated = !!token && !!user;
  const isPatient = isAuthenticated && user?.role === "patient";
  const isDoctor  = isAuthenticated && user?.role === "doctor";
  const isAdmin   = isAuthenticated && user?.role === "admin";

  const homePath = useMemo(() => {
    if (!user) return "/select-role";
    if (user.role === "admin")  return "/admin/dashboard";
    if (user.role === "doctor") return "/doctor/dashboard";
    return "/dashboard";
  }, [user]);

  const value = {
    user, token, loading,
    login, register, logout, updateProfile, setSession,
    isAuthenticated, isPatient, isDoctor, isAdmin,
    homePath,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
