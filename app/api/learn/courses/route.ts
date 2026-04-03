import { lmsProxy } from "@/lib/api/lmsProxy";

export async function GET(request: Request) {
  return lmsProxy(request, "GET", "/learn/courses");
}
