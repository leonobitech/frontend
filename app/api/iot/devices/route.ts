import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { z } from "zod";
import { getForwardHeaders } from "../helpers";

// Schema for device registration
const RegisterDeviceSchema = z.object({
  name: z.string().min(1, "Device name is required").max(100),
  type: z.string().min(1, "Device type is required"),
  firmwareVersion: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * GET /api/iot/devices
 * List all devices for the authenticated user
 */
export async function GET(request: NextRequest) {
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
 * Register a new device
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = RegisterDeviceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid request", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const headers = await getForwardHeaders(request);

    const response = await axios.post(
      `${process.env.BACKEND_URL}/api/iot/devices`,
      parsed.data,
      {
        headers,
        withCredentials: true,
      }
    );

    const result = NextResponse.json(response.data);
    result.headers.set("Cache-Control", "no-store");
    return result;
  } catch (error) {
    console.error("[IoT Device Register Error]", error);

    const isAxios = axios.isAxiosError(error);
    const status = isAxios && error.response ? error.response.status : 500;
    const message =
      isAxios && error.response
        ? error.response.data?.message || error.response.statusText
        : "Internal server error";

    return NextResponse.json({ message }, { status });
  }
}
