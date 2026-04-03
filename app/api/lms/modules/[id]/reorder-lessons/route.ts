import { lmsProxy } from "@/lib/api/lmsProxy";
import { type NextRequest } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return lmsProxy(request, "PUT", `/lms/modules/${id}/reorder-lessons`);
}
