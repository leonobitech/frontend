// components/ui/spinner.tsx
"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils"; // tu helper de classNames, si lo tienes

export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2
      className={cn("animate-spin", className ?? "w-4 h-4")}
      aria-label="Loading"
    />
  );
}
