/**
 * Shared fetch helper for the internal /api routes.
 *
 * The route handlers signal failure with a non-2xx status and a JSON
 * `{ error }` body. Calling `res.json()` without checking `res.ok` hands that
 * error object to React Query as if it were data, so `isError` never fires and
 * components render against a payload with every field undefined. This throws
 * instead, so the query enters its error state and the UI can react.
 */
export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    let detail = body.slice(0, 200);
    try {
      const parsed = JSON.parse(body);
      if (parsed?.error) detail = parsed.error;
    } catch {
      // Body is not JSON — fall back to the raw text captured above.
    }
    throw new Error(
      `Request to ${url} failed with ${res.status} ${res.statusText}${
        detail ? `: ${detail}` : ""
      }`
    );
  }

  return res.json() as Promise<T>;
}
