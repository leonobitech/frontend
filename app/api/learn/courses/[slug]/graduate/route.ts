import { lmsProxy } from "@/lib/api/lmsProxy";
import { type NextRequest } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  return lmsProxy(request, "POST", `/learn/courses/${slug}/graduate`);
}
