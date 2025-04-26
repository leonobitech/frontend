"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  SidebarHeader as ShadcnSidebarHeader,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

export interface SidebarHeaderProps {
  // You can add specific props here if needed
  props?: string;
}

export const SidebarHeader = ({ props }: SidebarHeaderProps) => {
  const { state } = useSidebar();

  // NOTE: props testing
  console.log(props);
  return (
    <ShadcnSidebarHeader
      className={cn(
        "h-14 bg-gradient-to-r from-blue-600 to-indigo-950 hover:from-blue-600 hover:to-indigo-600",
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
            "flex relative w-60 h-12 transition-all duration-300 overflow-hidden",
            state === "collapsed" && "w-0 opacity-0"
          )}
        >
          <div className="relative w-12 h-12">
            <Image
              src="/icon.png"
              alt="icon"
              fill
              sizes="48px"
              className="object-contain"
              priority
            />
          </div>
          <div className="relative w-48 h-12">
            <Image
              src="/logo.png"
              alt="Sidebar logo"
              fill
              sizes="192px"
              className="object-contain"
              priority
            />
          </div>
        </div>
        {/* Sidebar Collapse/Expand Button */}
        <div className="relative">
          <div className="absolute inset-0 bg-white/20 blur-md transition-opacity duration-300 opacity-0 group-hover:opacity-100" />
          <SidebarTrigger
            className={cn(
              "transition-all duration-300 text-white hover:bg-white/20 p-1.5 relative z-10",

              state === "collapsed" ? "-rotate-180" : "rotate-0"
            )}
            aria-label={
              state === "collapsed" ? "Expand sidebar" : "Collapse sidebar"
            }
          />
        </div>
      </div>
    </ShadcnSidebarHeader>
  );
};
