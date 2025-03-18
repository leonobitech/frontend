import React from "react";
import { cn } from "@/lib/utils";

interface UserInfoProps {
  state: "expanded" | "collapsed";
}

export function UserInfo({ state }: UserInfoProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-start text-left min-w-0",
        state === "collapsed" ? "opacity-0 w-0" : "opacity-100 w-auto"
      )}
    >
      <span className="text-base font-semibold text-black dark:text-white truncate w-full">
        Felix Figueroa
      </span>
      <span className="text-sm dark:text-white/50 font-semibold truncate w-full">
        Premium
      </span>
    </div>
  );
}
