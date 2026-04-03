import { lmsProxy } from "@/lib/api/lmsProxy";
import { type NextRequest } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return lmsProxy(request, "POST", `/lms/modules/${id}/lessons`);
}
