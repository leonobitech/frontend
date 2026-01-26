import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getForwardHeaders, requireAuth } from "../../helpers";

interface RouteParams {
  params: Promise<{ deviceId: string }>;
}

/**
 * GET /api/iot/devices/[deviceId]
 * Get device details with recent telemetry
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const { deviceId } = await params;
    const headers = await getForwardHeaders(request);

    // Get device info and telemetry in parallel
    const [deviceResponse, telemetryResponse] = await Promise.all([
      axios.get(`${process.env.BACKEND_URL}/api/iot/devices/${deviceId}`, {
        headers,
        withCredentials: true,
      }),
      axios.get(`${process.env.BACKEND_URL}/api/iot/devices/${deviceId}/telemetry?limit=50`, {
        headers,
        withCredentials: true,
      }).catch(() => ({ data: { telemetry: [] } })), // Don't fail if no telemetry
    ]);

    const result = NextResponse.json({
      device: deviceResponse.data.device,
      telemetry: telemetryResponse.data.telemetry || [],
    });
    result.headers.set("Cache-Control", "no-store");
    return result;
  } catch (error) {
    console.error("[IoT Device Detail Error]", error);

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
 * DELETE /api/iot/devices/[deviceId]
 * Delete a device
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const { deviceId } = await params;
    const headers = await getForwardHeaders(request);

    await axios.delete(`${process.env.BACKEND_URL}/api/iot/devices/${deviceId}`, {
      headers,
      withCredentials: true,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[IoT Device Delete Error]", error);

    const isAxios = axios.isAxiosError(error);
    const status = isAxios && error.response ? error.response.status : 500;
    const message =
      isAxios && error.response
        ? error.response.data?.message || error.response.statusText
        : "Internal server error";

    return NextResponse.json({ message }, { status });
  }
}
