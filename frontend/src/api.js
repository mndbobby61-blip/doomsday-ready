export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function request(path, { method = 'GET', body } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(res.status, data?.error ?? 'ERROR', data?.message ?? res.statusText, data?.details);
  }
  return data;
}

export const api = {
  listMovies: () => request('/movies'),
  createMovie: (body) => request('/movies', { method: 'POST', body }),
  updateMovie: (id, body) => request(`/movies/${id}`, { method: 'PATCH', body }),
  deleteMovie: (id) => request(`/movies/${id}`, { method: 'DELETE' }),
  rewatchOrder: (id) => request(`/movies/${id}/rewatch-order`),
  listCinemas: () => request('/cinemas'),
  createCinema: (body) => request('/cinemas', { method: 'POST', body }),
  booking: (id, groupSize) => request(`/cinemas/${id}/booking?groupSize=${encodeURIComponent(groupSize)}`),
};

/** যেকোনো এররের জন্য সহজ, মানুষের পড়ার মতো মেসেজ। */
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