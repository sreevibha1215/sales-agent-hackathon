// src/api/client.js
const BASE = 'http://127.0.0.1:8000';

function getToken() {
  return localStorage.getItem('access_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Request failed');
  }
  return res.json();
}

// ─── Auth ──────────────────────────────────────────────────────────────────
export const auth = {
  signup: (email, password) =>
    request('/api/auth/signup', { method: 'POST', body: JSON.stringify({ email, password }) }),
  login: (email, password) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me: () => request('/api/auth/me'),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
};

// ─── Workspaces ────────────────────────────────────────────────────────────
export const workspaces = {
  list: () => request('/api/workspaces'),
  create: (name) => request('/api/workspaces', { method: 'POST', body: JSON.stringify({ name }) }),
  get: (id) => request(`/api/workspaces/${id}`),
  delete: (id) => request(`/api/workspaces/${id}`, { method: 'DELETE' }),
  companies: (id) => request(`/api/workspaces/${id}/companies`),
};

// ─── Config extraction (NLP) ───────────────────────────────────────────────
export const config = {
  extract: (text, workspace_id = null) =>
    request('/api/config/extract', {
      method: 'POST',
      body: JSON.stringify({ description: text, workspace_id }),
    }),
};


// ─── Discovery pipeline ────────────────────────────────────────────────────
export const discovery = {
  start: (workspace_id, cfg) =>
    request('/api/discovery/start', {
      method: 'POST',
      body: JSON.stringify({ workspace_id, config: cfg }),
    }),
  results: (workspace_id) => request(`/api/discovery/workspace/${workspace_id}`),
  status: (run_id) => request(`/api/discovery/${run_id}/status`),
};
