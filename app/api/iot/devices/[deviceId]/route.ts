import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { z } from "zod";
import { getForwardHeaders, requireAuth } from "../../helpers";
import { extractServerIp } from "@/lib/extractIp";

interface RouteParams {
  params: Promise<{ deviceId: string }>;
}

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

// Schema for POST actions
const ActionSchema = z.object({
  action: z.enum(["get", "delete"]),
  meta: MetaSchema,
});

/**
 * POST /api/iot/devices/[deviceId]
 * Handles: get device details (action: "get") or delete device (action: "delete")
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const { deviceId } = await params;
    const body = await request.json();
    const parsed = ActionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid request", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const headers = await getForwardHeaders(request);
    const ipAddress = extractServerIp(request);
    const metaWithIp = { ...parsed.data.meta, ipAddress };

    if (parsed.data.action === "get") {
      // Get device info and telemetry in parallel
      const [deviceResponse, telemetryResponse] = await Promise.all([
        axios.get(`${process.env.BACKEND_URL}/api/iot/devices/${deviceId}`, {
          headers,
          data: { meta: metaWithIp },
          withCredentials: true,
        }),
        axios.get(`${process.env.BACKEND_URL}/api/iot/devices/${deviceId}/telemetry?limit=50`, {
          headers,
          data: { meta: metaWithIp },
          withCredentials: true,
        }).catch(() => ({ data: { telemetry: [] } })),
      ]);

      const result = NextResponse.json({
        device: deviceResponse.data.device,
        telemetry: telemetryResponse.data.telemetry || [],
      });
      result.headers.set("Cache-Control", "no-store");
      return result;
    }

    if (parsed.data.action === "delete") {
      await axios.delete(`${process.env.BACKEND_URL}/api/iot/devices/${deviceId}`, {
        headers,
        data: { meta: metaWithIp },
        withCredentials: true,
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ message: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("[IoT Device Error]", error);

    const isAxios = axios.isAxiosError(error);
    const status = isAxios && error.response ? error.response.status : 500;
    const message =
      isAxios && error.response
        ? error.response.data?.message || error.response.statusText
        : "Internal server error";

    return NextResponse.json({ message }, { status });
  }
}
