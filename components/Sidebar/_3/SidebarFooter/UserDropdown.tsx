import React, { useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";
import { UserAvatar } from "./UserAvatar";
import { UserInfo } from "./UserInfo";
import { DropdownMenuContent } from "./DropdownMenuContent";
import { useSidebarFooter } from "./SidebarFooterContext";

export const UserDropdown = React.memo(() => {
  // Get the current state of the sidebar (expanded or collapsed)
  const { state } = useSidebar();

  // Get the open state, setter function, and user status from the SidebarFooter context
  const { isOpen, setIsOpen, userStatus } = useSidebarFooter();

  /**
   * Memoized callback to handle opening and closing of the dropdown.
   * This function is memoized to prevent unnecessary re-renders.
   */
  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open);
    },
    [setIsOpen]
  );

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-full h-14 px-2 justify-start gap-2 rounded-lg overflow-hidden transition-all duration-200 ease-in-out
                hover:bg-white/10 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/20"
          aria-label="Open user menu"
          data-sidebar-dropdown-trigger="true"
        >
          <div className="flex items-center w-full">
            <div className="flex items-center gap-2 flex-grow">
              <div>
                <UserAvatar status={userStatus} size="small" />
              </div>
              {/* 
                UserInfo component displays user information.
                It receives the sidebar state to adjust its appearance based on whether
                the sidebar is expanded or collapsed.
              */}
              <UserInfo state={state} />
            </div>
            {/* 
              ChevronUp icon that rotates based on the open state of the dropdown.
              The rotation is controlled by the 'rotate-180' class which is applied when isOpen is true.
            */}
            <ChevronUp
              className={cn(
                "h-5 w-5 text-white opacity-50 ml-2 transition-transform duration-200 flex-shrink-0",
                isOpen ? "rotate-180" : "rotate-0"
              )}
              aria-hidden="true"
            />
          </div>
        </Button>
      </DropdownMenuTrigger>
      {/* 
        DropdownMenuContent component renders the actual content of the dropdown.
        It receives the current sidebar state (expanded/collapsed) to adjust alignment.
      */}
      <DropdownMenuContent state={state} />
    </DropdownMenu>
  );
});

// Set a display name for the component, useful for debugging
UserDropdown.displayName = "UserDropdown";
