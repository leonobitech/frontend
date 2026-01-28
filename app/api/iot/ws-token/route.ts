import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { requireAuth, getForwardHeaders } from "../helpers";

export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const response = await axios.get(
      `${process.env.BACKEND_URL}/api/iot/ws-token`,
      {
        headers: await getForwardHeaders(request),
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
