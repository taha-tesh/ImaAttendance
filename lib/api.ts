export async function fetchJson<T>(
  input: RequestInfo,
  init?: RequestInit,
  errorMessage = 'Request failed'
): Promise<T> {
  const headers = init?.headers
    ? { ...(init.headers as Record<string, string>) }
    : {};

  if (init?.body) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(input, {
    ...init,
    headers,
    credentials: 'same-origin',
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error ?? errorMessage);
  }

  return data as T;
}
