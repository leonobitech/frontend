// File: app/api/logout/route.ts
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { extractServerIp } from "@/lib/extractIp";

export async function POST(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const { meta } = await request.json();

    meta.ipAddress = extractServerIp(request);

    const apiRes = await axios.post(
      `${process.env.BACKEND_URL}/account/logout`,
      { meta },
      {
        headers: {
          Cookie: cookieHeader,
          "Content-Type": "application/json",
          "x-core-access-key": process.env.CORE_API_KEY,
        },
        withCredentials: true,
      }
    );

    const response = NextResponse.json(apiRes.data, {
      status: apiRes.status,
    });

    const setCookies = apiRes.headers["set-cookie"];
    if (Array.isArray(setCookies)) {
      setCookies.forEach((c) => response.headers.append("Set-Cookie", c));
    } else if (typeof setCookies === "string") {
      response.headers.set("Set-Cookie", setCookies);
    }

    return response;
  } catch (err: unknown) {
    let msg = "Error al cerrar sesión";
    let status = 500;

    if (axios.isAxiosError(err) && err.response) {
      status = err.response.status;
      msg = err.response.data?.message || err.response.statusText;
    } else if (err instanceof Error) {
      msg = err.message;
    }

    return NextResponse.json({ message: msg }, { status });
  }
}
