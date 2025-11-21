import React from "react";
import { cn } from "@/lib/utils";
import { useSession } from "@/app/context/SessionContext";

interface UserInfoProps {
  state: "expanded" | "collapsed";
}

export function UserInfo({ state }: UserInfoProps) {
  const { user } = useSession();

  return (
    <div
      className={cn(
        "flex flex-col items-start text-left min-w-0",
        state === "collapsed" ? "opacity-0 w-0" : "opacity-100 w-auto"
      )}
    >
      <span className="text-base font-semibold text-black dark:text-white truncate w-full">
        {user?.name || "User"}
      </span>
      <span className="text-sm dark:text-white/50 font-semibold truncate w-full">
        {user?.roleLabel || user?.role || "User"}
      </span>
    </div>
  );
}
