import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { publicApi } from "../services/api";

/* =========================================================
   PUBLIC SITE SETTINGS

   The registration switch lives in MongoDB. This provider reads
   it once for the whole public site so the header, footer and
   registration page always agree.

   It starts "off" while loading, so a disabled registration link
   never flashes into view before the real value arrives. The
   backend rejects submissions independently, so this is only
   ever a display decision.
========================================================= */

const SiteSettingsContext = createContext({
  registrationEnabled: false,
  registrationClosedMessage: "Registration is currently closed.",
  loading: true,
  refresh: () => {},
});

export const SiteSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    registrationEnabled: false,
    registrationClosedMessage: "Registration is currently closed.",
  });

  const [loading, setLoading] = useState(true);

  const load = useCallback(async (signal) => {
    try {
      const response = await publicApi.settings(signal);

      if (response?.settings) setSettings(response.settings);
    } catch {
      /* Backend unreachable: leave registration hidden. */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    /*
      The state updates inside this loader all happen after an await,
      so they cannot cascade renders the way this rule guards against.
    */
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(controller.signal);

    return () => controller.abort();
  }, [load]);

  const value = useMemo(
    () => ({
      ...settings,
      loading,
      refresh: () => load(),
    }),
    [settings, loading, load]
  );

  return (
    <SiteSettingsContext.Provider value={value}>
      {children}
    </SiteSettingsContext.Provider>
  );
};

/* eslint-disable-next-line react-refresh/only-export-components */
export const useSiteSettings = () => useContext(SiteSettingsContext);
