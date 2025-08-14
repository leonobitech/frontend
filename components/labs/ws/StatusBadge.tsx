// components/labs/ws/StatusBadge.tsx
"use client";

import type { WsStatus } from "@/hooks/useWsMetrics";

export function StatusBadge({ status }: { status: WsStatus }) {
  const base = "px-2 py-0.5 rounded text-xs font-mono";
  switch (status) {
    case "open":
      return (
        <span className={`${base} bg-green-100 text-green-800`}>OPEN</span>
      );
    case "connecting":
      return (
        <span className={`${base} bg-yellow-100 text-yellow-800`}>
          CONNECTING
        </span>
      );
    case "error":
      return <span className={`${base} bg-red-100 text-red-800`}>ERROR</span>;
    case "closed":
      return (
        <span className={`${base} bg-gray-200 text-gray-800`}>CLOSED</span>
      );
    default:
      return <span className={`${base} bg-gray-100 text-gray-600`}>IDLE</span>;
  }
}
