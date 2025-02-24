import React, { useCallback, useRef, RefObject } from "react";
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

/**
 * Interface defining the shape of the avatarSmallRef prop.
 * This is exported so it can be used by other components that need to interact with the small avatar.
 */
export interface AvatarRefProps {
  avatarRef: RefObject<HTMLDivElement>;
}

export const UserDropdown = React.memo(() => {
  // Get the current state of the sidebar (expanded or collapsed)
  const { state } = useSidebar();

  // Get the open state, setter function, and user status from the SidebarFooter context
  const { isOpen, setIsOpen, userStatus } = useSidebarFooter();

  /**
   * Create a ref for the small avatar container.
   * This ref will be used to get the DOM element of the avatar for position calculations in animations.
   */
  const avatarRef = useRef<HTMLDivElement>(null);

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
        >
          <div className="flex items-center w-full">
            <div className="flex items-center gap-2 flex-grow">
              {/* 
                Container for the small avatar.
                The ref (avatarSmallRef) is attached here to allow precise positioning for animations.
                This ref will be used in the DropdownMenuContent component to calculate
                the end position of the closing animation.
              */}
              <div ref={avatarRef}>
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
        It receives:
        - state: The current state of the sidebar (expanded/collapsed)
        - avatarSmallRef: The ref to the small avatar container, used for animation calculations
      */}
      <DropdownMenuContent state={state} avatarRef={avatarRef} />
    </DropdownMenu>
  );
});

// Set a display name for the component, useful for debugging
UserDropdown.displayName = "UserDropdown";
