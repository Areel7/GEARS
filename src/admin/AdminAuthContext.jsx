import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { api, setToken } from "../services/api";

/* =========================================================
   ADMIN AUTHENTICATION

   The session lives in an HTTP-only cookie set by the backend.
   This context only holds the safe profile the server returns
   from /auth/me - it never sees a password or a hash.

   Route guards here are a convenience for the UI. Every admin
   API is independently protected on the server.
========================================================= */

const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);

  /* "checking" until the first /auth/me resolves, so guards do not
     bounce an authenticated admin to the login screen on refresh. */
  const [status, setStatus] = useState("checking");

  const loadProfile = useCallback(async () => {
    try {
      const response = await api.get("/auth/me");

      setAdmin(response.admin);
      setStatus("authenticated");

      return response.admin;
    } catch {
      setAdmin(null);
      setToken("");
      setStatus("anonymous");

      return null;
    }
  }, []);

  useEffect(() => {
    /*
      The state updates inside this loader all happen after an await,
      so they cannot cascade renders the way this rule guards against.
    */
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProfile();
  }, [loadProfile]);

  const login = useCallback(async (email, password) => {
    const response = await api.post("/auth/login", { email, password });

    /* Fallback for deployments where the cookie cannot be set
       cross-site. The cookie is still the primary mechanism. */
    if (response.token) setToken(response.token);

    setAdmin(response.admin);
    setStatus("authenticated");

    return response.admin;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      /* Clear the client session regardless. */
    }

    setToken("");
    setAdmin(null);
    setStatus("anonymous");
  }, []);

  const value = useMemo(
    () => ({
      admin,
      status,
      isAuthenticated: status === "authenticated",
      isChecking: status === "checking",
      login,
      logout,
      refresh: loadProfile,
      setAdmin,
    }),
    [admin, status, login, logout, loadProfile]
  );

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

/* eslint-disable-next-line react-refresh/only-export-components */
export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);

  if (!context) {
    throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  }

  return context;
};
