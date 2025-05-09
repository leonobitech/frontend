// app/hooks/useSessionGuard.ts
"use client";

import { useSession } from "@/app/context/SessionContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type Options = {
  redirectTo?: string;
  skipIfLoading?: boolean;
};

export function useSessionGuard({
  redirectTo = "/login",
  skipIfLoading = true,
}: Options = {}) {
  const { user, session, loading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (skipIfLoading && loading) return;
    if (!user || !session) {
      router.replace(redirectTo);
    }
  }, [user, session, loading, redirectTo, skipIfLoading, router]);

  return { user, session, loading };
}
