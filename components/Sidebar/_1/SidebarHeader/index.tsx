"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  SidebarHeader as ShadcnSidebarHeader,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

export const SidebarHeader = () => {
  const { state } = useSidebar();

  return (
    <ShadcnSidebarHeader
      className={cn(
        "h-14 bg-linear-to-r from-blue-600 to-indigo-950 hover:from-blue-600 hover:to-indigo-600",
        // Dark mode based on sidebar state
        state === "collapsed"
          ? "dark:from-background dark:to-background"
          : "dark:from-pink-600 dark:to-purple-600"
      )}
    >
      <div className="flex items-center justify-between w-full h-full px-2">
        {/* Sidebar Logo */}
        <div
          className={cn(
            "flex items-center gap-2 transition-all duration-300 overflow-hidden",
            state === "collapsed" && "w-0 opacity-0"
          )}
        >
          <div className="relative w-9 h-9 shrink-0">
            <Image
              src="/icon_512x512.png"
              alt="Leonobitech"
              fill
              sizes="36px"
              className="object-contain"
              priority
            />
          </div>
          <span className="text-3xl font-extrabold tracking-tight text-white whitespace-nowrap">
            Leonobitech
          </span>
        </div>
        {/* Sidebar Collapse/Expand Button */}
        <div className="relative">
          <div className="absolute inset-0 bg-white/20 blur-md transition-opacity duration-300 opacity-0 group-hover:opacity-100" />
          <Tooltip>
            <TooltipTrigger asChild>
              <SidebarTrigger
                className={cn(
                  "transition-all duration-300 text-white hover:bg-white/20 p-1.5 relative z-10",
                  state === "collapsed" ? "-rotate-180" : "rotate-0"
                )}
                aria-label={
                  state === "collapsed" ? "Expand sidebar" : "Collapse sidebar"
                }
              />
            </TooltipTrigger>
            {state === "collapsed" && (
              <TooltipContent side="right" align="center" variant="glass">
                Abrir
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </div>
    </ShadcnSidebarHeader>
  );
};
