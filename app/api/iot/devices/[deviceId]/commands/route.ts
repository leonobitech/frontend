import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { z } from "zod";
import { getForwardHeaders, requireAuth } from "../../../helpers";
import { extractServerIp } from "@/lib/extractIp";

// Schema for client metadata
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

// Schema for listing commands
const ListCommandsSchema = z.object({
  action: z.literal("list"),
  meta: MetaSchema,
});

// Schema for sending commands
const SendCommandSchema = z.object({
  action: z.literal("send"),
  command: z.string().min(1, "Command is required"),
  payload: z.record(z.string(), z.unknown()).optional(),
  meta: MetaSchema,
});

interface RouteParams {
  params: Promise<{ deviceId: string }>;
}

/**
 * GET /api/iot/devices/[deviceId]/commands
 * Get command history for device
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const { deviceId } = await params;
    const headers = await getForwardHeaders(request);

    const response = await axios.get(
      `${process.env.BACKEND_URL}/api/iot/devices/${deviceId}/commands`,
      {
        headers,
        withCredentials: true,
      }
    );

    const result = NextResponse.json(response.data);
    result.headers.set("Cache-Control", "no-store");
    return result;
  } catch (error) {
    console.error("[IoT Commands List Error]", error);

    const isAxios = axios.isAxiosError(error);
    const status = isAxios && error.response ? error.response.status : 500;
    const message =
      isAxios && error.response
        ? error.response.data?.message || error.response.statusText
        : "Internal server error";

    return NextResponse.json({ message }, { status });
  }
}

/**
 * POST /api/iot/devices/[deviceId]/commands
 * List commands (action: "list") or Send a command (action: "send")
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const { deviceId } = await params;
    const body = await request.json();
    const headers = await getForwardHeaders(request);
    const ipAddress = extractServerIp(request);

    // Check if this is a list action
    const listParsed = ListCommandsSchema.safeParse(body);
    if (listParsed.success) {
      const metaWithIp = { ...listParsed.data.meta, ipAddress };

      const response = await axios.post(
        `${process.env.BACKEND_URL}/api/iot/devices/${deviceId}/commands`,
        {
          action: "list",
          meta: metaWithIp,
        },
        {
          headers,
          withCredentials: true,
        }
      );

      const result = NextResponse.json(response.data);
      result.headers.set("Cache-Control", "no-store");
      return result;
    }

    // Check if this is a send action
    const sendParsed = SendCommandSchema.safeParse(body);
    if (sendParsed.success) {
      const metaWithIp = { ...sendParsed.data.meta, ipAddress };

      const response = await axios.post(
        `${process.env.BACKEND_URL}/api/iot/devices/${deviceId}/commands`,
        {
          action: "send",
          command: sendParsed.data.command,
          params: sendParsed.data.payload,
          meta: metaWithIp,
        },
        {
          headers,
          withCredentials: true,
        }
      );

      const result = NextResponse.json(response.data);
      result.headers.set("Cache-Control", "no-store");
      return result;
    }

    return NextResponse.json(
      { message: "Invalid request - must include action and meta" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[IoT Commands Error]", error);

    const isAxios = axios.isAxiosError(error);
    const status = isAxios && error.response ? error.response.status : 500;
    const message =
      isAxios && error.response
        ? error.response.data?.message || error.response.statusText
        : "Internal server error";

    return NextResponse.json({ message }, { status });
  }
}
