import { useCallback, useEffect, useRef, useState } from "react";

import { api } from "../services/api";
import { useToast } from "./ToastContext";

/* =========================================================
   useResourceList

   Shared list behaviour for every admin table and card grid:
   fetching, searching (debounced), filtering, sorting and
   pagination, with a reload hook after a mutation.
========================================================= */

export const useResourceList = (path, options = {}) => {
  const { limit = 25, initialFilters = {}, initialSort = "" } = options;

  const toast = useToast();

  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ total: 0, counts: {} });

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState(initialFilters);
  const [sort, setSort] = useState(initialSort);

  const [loading, setLoading] = useState(true);

  /* Bumping this re-runs the fetch without changing any query state. */
  const [reloadKey, setReloadKey] = useState(0);

  /* Held in a ref so the fetch effect does not depend on the toast
     context identity and re-run on every render. */
  const toastRef = useRef(toast);

  useEffect(() => {
    toastRef.current = toast;
  });

  /* Debounce typing so a search does not fire a request per keystroke. */
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 320);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();

    let active = true;

    (async () => {
      setLoading(true);

      try {
        const response = await api.get(
          path,
          {
            page,
            limit,
            search: debouncedSearch || undefined,
            sort: sort || undefined,
            ...filters,
          },
          { signal: controller.signal }
        );

        if (!active) return;

        setItems(response.items || []);

        setMeta({
          total: response.total || 0,
          counts: response.counts || {},
          designations: response.designations,
          categories: response.categories,
        });
      } catch (error) {
        if (!active || error.name === "AbortError") return;

        toastRef.current.error(error.message || "Could not load data");
        setItems([]);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
      controller.abort();
    };
  }, [path, page, limit, debouncedSearch, filters, sort, reloadKey]);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  const setFilter = useCallback((key, value) => {
    setFilters((current) => {
      const next = { ...current };

      if (value === "" || value === undefined || value === null) {
        delete next[key];
      } else {
        next[key] = value;
      }

      return next;
    });

    setPage(1);
  }, []);

  /* Toggles between ascending and descending on the same column. */
  const toggleSort = useCallback((field) => {
    setSort((current) => {
      if (current === field) return `-${field}`;
      if (current === `-${field}`) return "";
      return field;
    });
  }, []);

  return {
    items,
    meta,
    total: meta.total,
    counts: meta.counts,
    loading,
    page,
    setPage,
    limit,
    search,
    setSearch,
    filters,
    setFilter,
    sort,
    toggleSort,
    reload,
  };
};
