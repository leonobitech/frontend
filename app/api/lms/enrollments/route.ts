import { lmsProxy } from "@/lib/api/lmsProxy";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const courseId = request.nextUrl.searchParams.get("courseId");
  const path = courseId
    ? `/lms/enrollments?courseId=${courseId}`
    : "/lms/enrollments";
  return lmsProxy(request, "GET", path);
}
