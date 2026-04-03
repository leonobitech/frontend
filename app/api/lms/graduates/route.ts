import { lmsProxy } from "@/lib/api/lmsProxy";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const verified = request.nextUrl.searchParams.get("verified");
  const path = verified ? `/lms/graduates?verified=${verified}` : "/lms/graduates";
  return lmsProxy(request, "GET", path);
}
