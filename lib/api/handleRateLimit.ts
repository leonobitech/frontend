// lib/api/handleRateLimit.ts

/**
 * 🛡️ Maneja respuestas de rate limiting (HTTP 429)
 * Extrae información de headers y muestra mensaje apropiado al usuario
 */

export interface RateLimitInfo {
  isRateLimited: boolean;
  retryAfter?: number; // segundos
  limit?: number;
  remaining?: number;
  reset?: number; // timestamp
  message: string;
}

export function parseRateLimitHeaders(headers: Headers): RateLimitInfo {
  const rateLimitLimit = headers.get("RateLimit-Limit");
  const rateLimitRemaining = headers.get("RateLimit-Remaining");
  const rateLimitReset = headers.get("RateLimit-Reset");
  const retryAfter = headers.get("Retry-After");

  const limit = rateLimitLimit ? parseInt(rateLimitLimit, 10) : undefined;
  const remaining = rateLimitRemaining
    ? parseInt(rateLimitRemaining, 10)
    : undefined;
  const reset = rateLimitReset ? parseInt(rateLimitReset, 10) : undefined;
  const retryAfterSeconds = retryAfter ? parseInt(retryAfter, 10) : undefined;

  return {
    isRateLimited: true,
    limit,
    remaining,
    reset,
    retryAfter: retryAfterSeconds,
    message: buildRateLimitMessage(retryAfterSeconds),
  };
}

function buildRateLimitMessage(retryAfter?: number): string {
  if (!retryAfter) {
    return "Has excedido el límite de intentos. Por favor, intenta más tarde.";
  }

  if (retryAfter < 60) {
    return `Has excedido el límite de intentos. Intenta nuevamente en ${retryAfter} segundos.`;
  }

  const minutes = Math.ceil(retryAfter / 60);
  if (minutes < 60) {
    return `Has excedido el límite de intentos. Intenta nuevamente en ${minutes} minuto${
      minutes > 1 ? "s" : ""
    }.`;
  }

  const hours = Math.ceil(minutes / 60);
  return `Has excedido el límite de intentos. Intenta nuevamente en ${hours} hora${
    hours > 1 ? "s" : ""
  }.`;
}

/**
 * 🚦 Hook para React que maneja rate limiting automáticamente
 */
export function useRateLimitHandler() {
  const handleResponse = async (response: Response): Promise<RateLimitInfo | null> => {
    if (response.status === 429) {
      return parseRateLimitHeaders(response.headers);
    }
    return null;
  };

  return { handleResponse };
}
