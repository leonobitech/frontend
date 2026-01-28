import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { z } from "zod";
import { requireAuth, getForwardHeaders } from "../helpers";
import { extractServerIp } from "@/lib/extractIp";

const MetaSchema = z.object({
  deviceInfo: z.object({
    device: z.string(),
    os: z.string(),
    browser: z.string(),
  }),
  userAgent: z.string(),
  language: z.string(),
  platform: z.string(),
  timezone: z.string(),
  screenResolution: z.string(),
  label: z.string(),
});

const WsTokenSchema = z.object({
  meta: MetaSchema,
});

export async function POST(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const body = await request.json();
    const parsed = WsTokenSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid request", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const headers = await getForwardHeaders(request);
    const ipAddress = extractServerIp(request);
    const metaWithIp = { ...parsed.data.meta, ipAddress };

    const response = await axios.post(
      `${process.env.BACKEND_URL}/api/iot/ws-token`,
      { meta: metaWithIp },
      {
        headers,
        withCredentials: true,
      }
    );

    const result = NextResponse.json(response.data);
    result.headers.set("Cache-Control", "no-store");
    return result;
  } catch (error) {
    const isAxios = axios.isAxiosError(error);
    const status = isAxios && error.response ? error.response.status : 500;
    const message =
      isAxios && error.response
        ? error.response.data?.message
        : "Internal server error";
    return NextResponse.json({ message }, { status });
  }
}
