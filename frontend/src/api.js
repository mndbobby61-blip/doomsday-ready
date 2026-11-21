export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const TOKEN_KEY = 'dr_token';

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable: the session just won't survive a reload */
  }
}

// Called when the server says our session is no longer valid.
let onUnauthorized = () => {};
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

async function request(path, { method = 'GET', body } = {}) {
  const token = getToken();
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`/api${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && token && !path.startsWith('/auth/')) onUnauthorized();
    throw new ApiError(res.status, data?.error ?? 'ERROR', data?.message ?? res.statusText, data?.details);
  }
  return data;
}

export const api = {
  // auth
  register: (body) => request('/auth/register', { method: 'POST', body }),
  login: (body) => request('/auth/login', { method: 'POST', body }),
  guest: () => request('/auth/guest', { method: 'POST' }),
  me: () => request('/auth/me'),
  logout: () => request('/auth/logout', { method: 'POST' }),
  // movies
  listMovies: () => request('/movies'),
  createMovie: (body) => request('/movies', { method: 'POST', body }),
  updateMovie: (id, body) => request(`/movies/${id}`, { method: 'PATCH', body }),
  deleteMovie: (id) => request(`/movies/${id}`, { method: 'DELETE' }),
  rewatchOrder: (id) => request(`/movies/${id}/rewatch-order`),
  // cinemas
  listCinemas: () => request('/cinemas'),
  createCinema: (body) => request('/cinemas', { method: 'POST', body }),
  booking: (id, groupSize) => request(`/cinemas/${id}/booking?groupSize=${encodeURIComponent(groupSize)}`),
};

/** A short, human-friendly message for any thrown error. */
export function describeError(error) {
  if (error?.code === 'CIRCULAR_DEPENDENCY') {
    return 'That would create a loop: a movie cannot depend on itself, even through other movies.';
  }
  if (error?.details?.length) return error.details.map((d) => d.message).join('. ');
  return error?.message ?? 'Something went wrong. Please try again.';
}

export function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}