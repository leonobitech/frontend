import { lmsProxy } from "@/lib/api/lmsProxy";
import { type NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; lessonSlug: string }> }
) {
  const { slug, lessonSlug } = await params;
  return lmsProxy(request, "GET", `/learn/courses/${slug}/lessons/${lessonSlug}`);
}
