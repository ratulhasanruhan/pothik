/** Sends a request and returns the parsed JSON, throwing the server's message on failure. */
export async function request<T>(url: string, init: RequestInit, fallback: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { method: "POST", ...init });
  } catch {
    throw new Error(fallback);
  }
  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(data.error ?? fallback);
  return data;
}

/** POSTs a JSON body. */
export function postJson<T>(url: string, body: unknown, fallback: string) {
  return request<T>(
    url,
    { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
    fallback,
  );
}
