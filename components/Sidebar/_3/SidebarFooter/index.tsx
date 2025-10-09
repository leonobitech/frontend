"use client";

import React from "react";
import { SidebarFooter as ShadcnSidebarFooter } from "@/components/ui/sidebar";
import { UserDropdown } from "./UserDropdown";
import { SidebarFooterProvider } from "./SidebarFooterContext";

export function SidebarFooter() {
  return (
    <SidebarFooterProvider>
      <ShadcnSidebarFooter
        className="p-1 bg-background relative"
        data-sidebar-hover-exempt="true"
      >
        <UserDropdown />
      </ShadcnSidebarFooter>
    </SidebarFooterProvider>
  );
}
