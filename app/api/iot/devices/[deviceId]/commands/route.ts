import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { z } from "zod";
import { getForwardHeaders, requireAuth } from "../../../helpers";

// Schema for sending commands
const SendCommandSchema = z.object({
  command: z.string().min(1, "Command is required"),
  payload: z.record(z.string(), z.unknown()).optional(),
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
 * Send a command to device
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const { deviceId } = await params;
    const body = await request.json();
    const parsed = SendCommandSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid request", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const headers = await getForwardHeaders(request);

    // Transform frontend format (command/payload) to backend format (action/params)
    const response = await axios.post(
      `${process.env.BACKEND_URL}/api/iot/devices/${deviceId}/commands`,
      {
        action: parsed.data.command,
        params: parsed.data.payload,
      },
      {
        headers,
        withCredentials: true,
      }
    );

    const result = NextResponse.json(response.data);
    result.headers.set("Cache-Control", "no-store");
    return result;
  } catch (error) {
    console.error("[IoT Send Command Error]", error);

    const isAxios = axios.isAxiosError(error);
    const status = isAxios && error.response ? error.response.status : 500;
    const message =
      isAxios && error.response
        ? error.response.data?.message || error.response.statusText
        : "Internal server error";

    return NextResponse.json({ message }, { status });
  }
}
