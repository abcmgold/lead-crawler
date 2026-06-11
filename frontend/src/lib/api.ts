// Wrapper around fetch that broadcasts an event when a request comes back
// unauthorized (401), so the app can clear the auth state and redirect to /login.
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let url = input;
  if (typeof url === 'string' && url.startsWith('/api')) {
    const apiBase = import.meta.env.VITE_API_BASE_URL || '';
    url = `${apiBase}${url}`;
  }

  const options: RequestInit = {
    ...init,
    credentials: init?.credentials || 'include',
  };

  const res = await fetch(url, options);
  if (res.status === 401) {
    window.dispatchEvent(new Event('auth:unauthorized'));
  }
  return res;
}
