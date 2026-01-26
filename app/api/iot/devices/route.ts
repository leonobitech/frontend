import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { z } from "zod";
import { getForwardHeaders, requireAuth } from "../helpers";
import { extractServerIp } from "@/lib/extractIp";

// Schema for client metadata (from browser)
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

// Schema for listing devices
const ListDevicesSchema = z.object({
  action: z.literal("list"),
  meta: MetaSchema,
});

// Schema for device registration
const RegisterDeviceSchema = z.object({
  name: z.string().min(1, "Device name is required").max(100),
  type: z.string().min(1, "Device type is required"),
  firmwareVersion: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  meta: MetaSchema,
});

/**
 * GET /api/iot/devices
 * List all devices for the authenticated user
 */
export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const headers = await getForwardHeaders(request);

    const response = await axios.get(
      `${process.env.BACKEND_URL}/api/iot/devices`,
      {
        headers,
        withCredentials: true,
      }
    );

    const result = NextResponse.json(response.data);
    result.headers.set("Cache-Control", "no-store");
    return result;
  } catch (error) {
    console.error("[IoT Devices List Error]", error);

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
 * POST /api/iot/devices
 * Handles: list devices (action: "list") or register new device
 */
export async function POST(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const body = await request.json();
    const headers = await getForwardHeaders(request);
    const ipAddress = extractServerIp(request);

    // Check if this is a list request
    const listParsed = ListDevicesSchema.safeParse(body);
    if (listParsed.success) {
      const metaWithIp = { ...listParsed.data.meta, ipAddress };

      const response = await axios.post(
        `${process.env.BACKEND_URL}/api/iot/devices`,
        { action: "list", meta: metaWithIp },
        {
          headers,
          withCredentials: true,
        }
      );

      const result = NextResponse.json(response.data);
      result.headers.set("Cache-Control", "no-store");
      return result;
    }

    // Otherwise, treat as device registration
    const registerParsed = RegisterDeviceSchema.safeParse(body);
    if (!registerParsed.success) {
      return NextResponse.json(
        { message: "Invalid request", errors: registerParsed.error.flatten() },
        { status: 400 }
      );
    }

    const { meta, ...deviceData } = registerParsed.data;
    const metaWithIp = { ...meta, ipAddress };

    const response = await axios.post(
      `${process.env.BACKEND_URL}/api/iot/devices`,
      { ...deviceData, meta: metaWithIp },
      {
        headers,
        withCredentials: true,
      }
    );

    const result = NextResponse.json(response.data);
    result.headers.set("Cache-Control", "no-store");
    return result;
  } catch (error) {
    console.error("[IoT Devices Error]", error);

    const isAxios = axios.isAxiosError(error);
    const status = isAxios && error.response ? error.response.status : 500;
    const message =
      isAxios && error.response
        ? error.response.data?.message || error.response.statusText
        : "Internal server error";

    return NextResponse.json({ message }, { status });
  }
}
