import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getForwardHeaders } from "../../../helpers";

interface RouteParams {
  params: Promise<{ deviceId: string }>;
}

/**
 * GET /api/iot/devices/[deviceId]/telemetry
 * Get telemetry data for device (with optional limit and since params)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { deviceId } = await params;
    const { searchParams } = new URL(request.url);

    // Forward query params
    const limit = searchParams.get("limit") || "50";
    const since = searchParams.get("since");

    const queryParams = new URLSearchParams({ limit });
    if (since) queryParams.set("since", since);

    const headers = await getForwardHeaders(request);

    const response = await axios.get(
      `${process.env.BACKEND_URL}/api/iot/devices/${deviceId}/telemetry?${queryParams}`,
      {
        headers,
        withCredentials: true,
      }
    );

    const result = NextResponse.json(response.data);
    result.headers.set("Cache-Control", "no-store");
    return result;
  } catch (error) {
    console.error("[IoT Telemetry Error]", error);

    const isAxios = axios.isAxiosError(error);
    const status = isAxios && error.response ? error.response.status : 500;
    const message =
      isAxios && error.response
        ? error.response.data?.message || error.response.statusText
        : "Internal server error";

    return NextResponse.json({ message }, { status });
  }
}
