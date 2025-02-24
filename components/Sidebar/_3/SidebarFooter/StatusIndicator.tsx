import React from "react";
import { cn } from "@/lib/utils";
import { UserStatus } from "./types/types";

interface StatusIndicatorProps {
  status: UserStatus;
  className?: string;
  size: "small" | "large" | "select";
}

export const StatusIndicator = React.memo(function StatusIndicator({
  status,
  className,
  size,
}: StatusIndicatorProps) {
  const statusClasses = {
    online: "bg-green-500",
    idle: "bg-yellow-500",
    dnd: "bg-red-500",
    offline: "bg-gray-500",
  };

  const sizeClasses = {
    small: "w-2.5 h-2.5",
    large: "w-4 h-4",
    select: "w-2.5 h-2.5 relative inline-block mr-3",
  };

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center",
        sizeClasses[size],
        className
      )}
    >
      <div
        className={cn(
          "rounded-full w-full h-full",
          statusClasses[status],
          `shadow-[0_0_0_2px_rgba(${
            status === "online"
              ? "34,197,94"
              : status === "idle"
              ? "234,179,8"
              : status === "dnd"
              ? "239,68,68"
              : "107,114,128"
          },0.2)]`
        )}
      />
    </div>
  );
});

StatusIndicator.displayName = "StatusIndicator";
