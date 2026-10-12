/* =========================================================
   API CLIENT

   One place that knows where the backend lives and how to talk
   to it. Authentication rides on an HTTP-only cookie; the bearer
   token is only a fallback for deployments where the frontend and
   backend sit on different sites and third-party cookies are
   blocked. No application data is ever kept in the browser.
========================================================= */

const RAW_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const API_BASE = RAW_BASE.replace(/\/+$/, "");

const TOKEN_KEY = "gears_admin_token";

/* ---------------------------------------------------------
   TOKEN FALLBACK
--------------------------------------------------------- */

export const getToken = () => {
  try {
    return window.localStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
};

export const setToken = (token) => {
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* Private browsing or blocked storage: cookies still work. */
  }
};

/* ---------------------------------------------------------
   REQUEST
--------------------------------------------------------- */

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const buildUrl = (path, params) => {
  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;

  if (!params) return url;

  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.append(key, value);
  });

  const query = search.toString();

  return query ? `${url}?${query}` : url;
};

const request = async (path, options = {}) => {
  const { params, body, method = "GET", signal, raw = false } = options;

  const headers = {};

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload;

  if (body instanceof FormData) {
    /* Let the browser set the multipart boundary. */
    payload = body;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  let response;

  try {
    response = await fetch(buildUrl(path, params), {
      method,
      headers,
      body: payload,
      credentials: "include",
      signal,
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;

    throw new ApiError(
      "Cannot reach the server. Check your connection and try again.",
      0
    );
  }

  if (raw) {
    if (!response.ok) {
      throw new ApiError("Download failed", response.status);
    }
    return response;
  }

  let data;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new ApiError(
      data?.message || `Request failed (${response.status})`,
      response.status,
      data?.details || null
    );
  }

  return data;
};

export const api = {
  get: (path, params, options) =>
    request(path, { ...options, method: "GET", params }),

  post: (path, body, options) =>
    request(path, { ...options, method: "POST", body }),

  put: (path, body, options) =>
    request(path, { ...options, method: "PUT", body }),

  patch: (path, body, options) =>
    request(path, { ...options, method: "PATCH", body }),

  delete: (path, params, options) =>
    request(path, { ...options, method: "DELETE", params }),

  /* Triggers a browser download for an authenticated endpoint. */
  async download(path, params, fallbackName = "download") {
    const response = await request(path, {
      method: "GET",
      params,
      raw: true,
    });

    const blob = await response.blob();

    const disposition =
      response.headers.get("Content-Disposition") || "";

    const match = disposition.match(/filename="?([^"]+)"?/i);

    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = match ? match[1] : fallbackName;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);
  },
};

/* ---------------------------------------------------------
   PUBLIC ENDPOINTS
--------------------------------------------------------- */

export const publicApi = {
  settings: (signal) => api.get("/public/settings", null, { signal }),
  home: (signal) => api.get("/public/home", null, { signal }),
  team: (signal) => api.get("/public/team", null, { signal }),
  gallery: (signal) => api.get("/public/gallery", null, { signal }),

  submitRegistration: (formData) =>
    api.post("/registrations/public", formData),
};
