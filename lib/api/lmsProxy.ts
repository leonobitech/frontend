import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import axios from "axios";
import { extractServerIp } from "@/lib/extractIp";
import { createDecipheriv } from "crypto";

const FORWARD_COOKIES = ["accessKey", "clientKey"] as const;

type CookiePair = { name: string; value: string };
type CookieStore = { getAll(): CookiePair[] };

async function getCookieStore(): Promise<CookieStore> {
  const maybe = cookies() as unknown;
  if (maybe && typeof (maybe as Promise<CookieStore>).then === "function") {
    return (await (maybe as Promise<CookieStore>)) as CookieStore;
  }
  return maybe as CookieStore;
}

function buildCookieHeader(pairs: CookiePair[]): string | undefined {
  const selected = pairs
    .filter((c) => (FORWARD_COOKIES as readonly string[]).includes(c.name))
    .map((c) => `${c.name}=${c.value}`);
  return selected.length ? selected.join("; ") : undefined;
}

function forwardSetCookies(
  backendHeaders: Record<string, unknown>,
  res: NextResponse
) {
  const setCookieHeader = backendHeaders["set-cookie"];
  const arr = Array.isArray(setCookieHeader)
    ? setCookieHeader
    : typeof setCookieHeader === "string"
    ? [setCookieHeader]
    : [];
  for (const raw of arr) {
    const name = raw.split(";")[0]?.split("=")[0]?.trim();
    if (name && (FORWARD_COOKIES as readonly string[]).includes(name)) {
      res.headers.append("Set-Cookie", raw);
    }
  }
}

/**
 * Generic proxy for LMS admin API routes.
 * Handles auth cookies, IP extraction, and cookie forwarding.
 */
export async function lmsProxy(
  request: Request,
  method: "GET" | "POST" | "PUT" | "DELETE",
  backendPath: string
) {
  try {
    const store = await getCookieStore();
    const cookieHeader = buildCookieHeader(store.getAll());
    if (!cookieHeader) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const ipAddress = extractServerIp(request);
    const userAgent = request.headers.get("user-agent") || "";
    const hasBody = method !== "GET" && method !== "DELETE";
    let body: any = undefined;

    if (hasBody) {
      try {
        body = await request.json();
      } catch {
        body = undefined;
      }
    }

    // Decrypt clientMeta cookie to extract fingerprint fields
    const cookiePairs = store.getAll();
    const clientMetaCookie = cookiePairs.find((c) => c.name === "clientMeta");
    let screenResolution = "";
    let label = "leonobitech";

    if (clientMetaCookie && process.env.CLIENT_META_KEY) {
      try {
        const [ivB64, tagB64, encrypted] = clientMetaCookie.value.split(":");
        const key = Buffer.from(process.env.CLIENT_META_KEY, "hex");
        const iv = Buffer.from(ivB64, "base64");
        const tag = Buffer.from(tagB64, "base64");
        const decipher = createDecipheriv("aes-256-gcm", key, iv);
        decipher.setAuthTag(tag);
        let decrypted = decipher.update(encrypted, "base64", "utf8");
        decrypted += decipher.final("utf8");
        const meta = JSON.parse(decrypted);
        screenResolution = meta.screenResolution || "";
        label = meta.label || "leonobitech";
      } catch {}
    }

    const config = {
      method,
      url: `${process.env.BACKEND_URL}${backendPath}`,
      data: body,
      headers: {
        "Content-Type": "application/json",
        "x-core-access-key": String(process.env.CORE_API_KEY),
        "X-Real-IP": ipAddress,
        "X-Forwarded-For": ipAddress,
        "User-Agent": userAgent,
        "X-Screen-Resolution": screenResolution,
        "X-Client-Label": label,
        Cookie: cookieHeader,
      },
      timeout: 15_000,
      validateStatus: () => true,
      withCredentials: true,
    };

    const backendRes = await axios(config);

    const res = NextResponse.json(backendRes.data, {
      status: backendRes.status,
    });
    res.headers.set("Cache-Control", "no-store");
    forwardSetCookies(backendRes.headers, res);
    return res;
  } catch (err) {
    const status =
      axios.isAxiosError(err) && err.response ? err.response.status : 500;
    const message =
      axios.isAxiosError(err) && err.response
        ? err.response.data?.message || err.response.statusText
        : err instanceof Error
        ? err.message
        : "Error desconocido";
    return NextResponse.json({ message }, { status });
  }
}
