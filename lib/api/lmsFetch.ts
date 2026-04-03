/**
 * Fetch wrapper for LMS API routes.
 * Automatically includes auth credentials and device fingerprint headers
 * needed for clientKey validation on the backend.
 */
export function lmsFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const screenResolution =
    typeof window !== "undefined"
      ? `${window.screen.width}x${window.screen.height}`
      : "";

  return fetch(url, {
    credentials: "include",
    ...options,
    headers: {
      "X-Screen-Resolution": screenResolution,
      "X-Client-Label": "leonobitech",
      ...(options?.headers || {}),
    },
  });
}
