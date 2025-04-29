// 2) Optional: API route to resend OTP
// File: app/api/resend-otp/route.ts

import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    const apiRes = await axios.post(
      `${process.env.BACKEND_URL}/account/resend-otp`,
      { email },
      { headers: { "Content-Type": "application/json" } }
    );
    return NextResponse.json(apiRes.data, { status: apiRes.status });
  } catch (error: unknown) {
    let message = "Error al reenviar el código";
    let statusCode = 500;
    if (axios.isAxiosError(error) && error.response) {
      statusCode = error.response.status;
      message = error.response.data?.message || error.response.statusText;
    } else if (error instanceof Error) {
      message = error.message;
    }
    return NextResponse.json({ message }, { status: statusCode });
  }
}
