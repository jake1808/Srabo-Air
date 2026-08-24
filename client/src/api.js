const API_URL = import.meta.env.VITE_API_URL || '';

let unauthorizedHandler = null;

// App registers a handler; any 401 from the API triggers it (token expired/invalid)
export function setUnauthorizedHandler(fn) {
  unauthorizedHandler = fn;
}

export function reportUnauthorized() {
  if (unauthorizedHandler) unauthorizedHandler();
}

export async function api(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['x-access-token'] = token;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Error responses may be JSON or plain HTML (e.g. Flask 404 pages)
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* not JSON */
  }
  if (res.status === 401) {
    reportUnauthorized();
    throw new Error(
      data?.error || data?.message || 'Session expired — please log in again.'
    );
  }
  if (!res.ok) {
    throw new Error(
      data?.error || data?.message || `Request failed (${res.status})`
    );
  }
  return data;
}
