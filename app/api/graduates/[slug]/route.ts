import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://core.leonobitech.com";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const res = await fetch(`${API_URL}/graduates/${slug}`, { next: { revalidate: 60 } });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
