import { lmsProxy } from "@/lib/api/lmsProxy";

export async function GET(request: Request) {
  return lmsProxy(request, "GET", "/lms/courses");
}

export async function POST(request: Request) {
  return lmsProxy(request, "POST", "/lms/courses");
}
