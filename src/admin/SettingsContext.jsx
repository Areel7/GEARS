import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { api } from "../services/api";
import { useAdminAuth } from "./AdminAuthContext";

/* =========================================================
   ADMIN SITE SETTINGS

   Holds the site settings document so the topbar pill, the
   dashboard toggle and the settings page all show the same
   value and update together. MongoDB stays the source of truth.
========================================================= */

const SettingsContext = createContext(null);

export const SettingsProvider = ({ children }) => {
  const { isAuthenticated } = useAdminAuth();

  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return null;
    }

    try {
      const response = await api.get("/settings");

      setSettings(response.settings);

      return response.settings;
    } catch {
      return null;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    /*
      The state updates inside this loader all happen after an await,
      so they cannot cascade renders the way this rule guards against.
    */
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  const setRegistrationEnabled = useCallback(async (enabled) => {
    const response = await api.put("/settings/registration", {
      registrationEnabled: enabled,
    });

    setSettings(response.settings);

    return response.settings;
  }, []);

  const updateSettings = useCallback(async (payload) => {
    const response = await api.put("/settings", payload);

    setSettings(response.settings);

    return response.settings;
  }, []);

  const value = useMemo(
    () => ({
      settings,
      loading,
      refresh,
      setRegistrationEnabled,
      updateSettings,
    }),
    [settings, loading, refresh, setRegistrationEnabled, updateSettings]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

/* eslint-disable-next-line react-refresh/only-export-components */
export const useSettings = () => {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error("useSettings must be used inside SettingsProvider");
  }

  return context;
};
