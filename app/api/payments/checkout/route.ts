import { lmsProxy } from "@/lib/api/lmsProxy";

export async function POST(request: Request) {
  return lmsProxy(request, "POST", "/payments/checkout");
}
