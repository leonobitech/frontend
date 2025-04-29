// File: app/api/account/me/route.ts

import { NextResponse } from "next/server";
import axios from "axios";
import { extractServerIp } from "@/lib/extractIp";
import { buildClientMeta } from "@/lib/clientMeta";

// Este handler es usado tanto por POST como por GET
async function handleRequest(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";

    // screenResolution llega solo en POST (cliente)
    const { screenResolution } =
      request.method === "POST"
        ? await request.json()
        : { screenResolution: "" };

    const ipAddress = extractServerIp(request);
    const partialMeta = buildClientMeta();
    const meta = { ...partialMeta, ipAddress, screenResolution };

    const apiRes = await axios.post(
      `${process.env.BACKEND_URL}/account/me`,
      { meta },
      {
        headers: {
          Cookie: cookieHeader,
          "Content-Type": "application/json",
        },
        withCredentials: true,
      }
    );

    return NextResponse.json(apiRes.data, {
      status: apiRes.status,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (err: unknown) {
    let msg = "Error al cargar datos del usuario";
    let status = 500;

    if (axios.isAxiosError(err) && err.response) {
      status = err.response.status;
      msg = err.response.data?.message || err.response.statusText;
    } else if (err instanceof Error) {
      msg = err.message;
    }

    return NextResponse.json(
      { message: msg },
      {
        status,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}

export async function POST(request: Request) {
  return handleRequest(request);
}

export async function GET(request: Request) {
  return handleRequest(request);
}
