import { useEffect, useRef, useState } from "react";

/* =========================================================
   useRemoteData

   Loads public content from the backend but starts from — and
   falls back to — the content that already shipped with the
   site. The page therefore renders the same markup immediately,
   never flashes an empty state, and still looks correct if the
   API is unreachable.

   `select` maps the API response to the shape the component
   already expects, so components keep their existing JSX.
========================================================= */

export const useRemoteData = (fetcher, select, fallback) => {
  const [data, setData] = useState(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* Keeps the effect from re-running when a caller passes inline
     functions, which is the normal way these are used. The initial
     ref values are already correct for the first render, so the
     fetch below always sees the right callbacks. */
  const fetcherRef = useRef(fetcher);
  const selectRef = useRef(select);

  useEffect(() => {
    fetcherRef.current = fetcher;
    selectRef.current = select;
  });

  useEffect(() => {
    const controller = new AbortController();

    let active = true;

    (async () => {
      try {
        const response = await fetcherRef.current(controller.signal);

        if (!active) return;

        const next = selectRef.current(response);

        /* An empty collection means "not migrated yet": keep the
           bundled content rather than blanking the section. */
        if (Array.isArray(next) && next.length === 0) {
          setLoading(false);
          return;
        }

        if (next) setData(next);
        setError(null);
      } catch (caught) {
        if (!active || caught.name === "AbortError") return;
        setError(caught);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  return { data, loading, error };
};
