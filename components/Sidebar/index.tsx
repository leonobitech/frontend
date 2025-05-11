"use client";

import { SidebarHeader, SidebarHeaderProps } from "./_1/SidebarHeader";
import { SidebarContent } from "./_2/SidebarContent";
import { SidebarFooter } from "./_3/SidebarFooter";
import {
  Sidebar as ShadcnSidebar,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

// Main Sidebar component
export const Sidebar = () => {
  return (
    <ShadcnSidebar
      collapsible="icon"
      className="border-r border-gray-200 border-hidden"
    >
      {/* Sidebar Header */}
      <SidebarHeader />

      {/* Sidebar Main Content */}
      <SidebarContent />

      {/* Sidebar Footer */}
      <SidebarFooter />

      {/* Sidebar Rail */}
      <SidebarRail />
    </ShadcnSidebar>
  );
};

// Export the useSidebar hook for use in other components like Navbar,Main,Footer,etc.
export { useSidebar };
