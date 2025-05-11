// File: utils/security/getAuthorizedCookies.ts

/**
 * Retorna una string con las cookies autorizadas en formato HTTP header.
 * Solo se puede usar en cliente, ya que depende de `document.cookie`.
 *
 * @param allowedKeys - Array con nombres de cookies que queremos permitir.
 * @returns String tipo `accessKey=abc123; clientKey=xyz456` o undefined si no hay.
 */
export function getAuthorizedCookies(
  allowedKeys: string[]
): string | undefined {
  if (typeof document === "undefined") return undefined;

  const cookies = document.cookie
    .split(";")
    .map((c) => c.trim())
    .filter((cookie) => {
      const [name] = cookie.split("=");
      return allowedKeys.includes(name);
    });

  if (cookies.length === 0) return undefined;

  return cookies.join("; ");
}
