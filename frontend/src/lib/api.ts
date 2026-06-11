// Wrapper around fetch that broadcasts an event when a request comes back
// unauthorized (401), so the app can clear the auth state and redirect to /login.
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, init);
  if (res.status === 401) {
    window.dispatchEvent(new Event('auth:unauthorized'));
  }
  return res;
}
