// Thin fetch wrapper around the GreatHire Teamora backend API.
// Base URL comes from VITE_API_BASE_URL (see .env.example).
// In production on Vercel:
// - Uses VITE_API_BASE_URL if explicitly set.
// - Falls back to the deployed backend on Vercel:
//   "https://backend-sravans-projects-d52b9dc4.vercel.app/api"
// - In local dev: defaults to "http://localhost:5000/api".

const configuredApiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD
    ? "https://backend-sravans-projects-d52b9dc4.vercel.app/api"
    : "http://localhost:5000/api");

const normalizedApiBaseUrl = configuredApiBaseUrl.replace(/\/+$/, "");
const API_BASE_URL = /\/api$/i.test(normalizedApiBaseUrl)
  ? normalizedApiBaseUrl
  : `${normalizedApiBaseUrl}/api`;

const TOKEN_KEY = "gh_teamora_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

async function request(path, { method = "GET", body, params, headers, raw = false } = {}) {
  let url = new URL(API_BASE_URL.replace(/\/$/, "") + path, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, value);
    });
  }

  let token = getToken();
  let res;
  try {
    res = await fetch(url.toString(), {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    if (err instanceof TypeError || err.name === "TypeError") {
      throw new ApiError(
        `Unable to reach backend server (${API_BASE_URL}). Please verify that your backend server is running (port 5000) or check network connection.`,
        0,
        { originalError: err.message }
      );
    }
    throw err;
  }

 if (raw) {
  if (!res.ok) {
    const json = await res.json().catch(() => null);

    throw new ApiError(
      json?.error || json?.message || `Request failed (${res.status})`,
      res.status,
      json
    );
  }

  return res;
}

  let json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(json?.error || json?.message || `Request failed (${res.status})`, res.status, json);
  }
  return json?.data !== undefined ? json.data : json;
}

export const api = {
  get: (path, params) => request(path, { method: "GET", params }),
  post: (path, body) => request(path, { method: "POST", body }),
  put: (path, body) => request(path, { method: "PUT", body }),
  patch: (path, body) => request(path, { method: "PATCH", body }),
  delete: (path) => request(path, { method: "DELETE" }),
  download: (path, params) => request(path, { method: "GET", params, raw: true }),
};

export { API_BASE_URL };
