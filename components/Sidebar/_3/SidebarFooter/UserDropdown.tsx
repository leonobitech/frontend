import React, { useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { UserAvatar } from "./UserAvatar";
import { UserInfo } from "./UserInfo";
import { DropdownMenuContent } from "./DropdownMenuContent";
import { useSidebarFooter } from "./SidebarFooterContext";

export const UserDropdown = React.memo(() => {
  const { state, isMobile } = useSidebar();
  const { isOpen, setIsOpen, userStatus } = useSidebarFooter();

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open);
    },
    [setIsOpen]
  );

  const triggerButton = (
    <Button
      variant="ghost"
      className="w-full h-14 px-2 justify-start gap-2 rounded-none overflow-hidden transition-colors duration-200 ease-in-out
            hover:bg-white/5 focus:outline-none focus-visible:outline-none"
      aria-label="Open user menu"
      data-sidebar-dropdown-trigger="true"
    >
      <div className="flex items-center w-full">
        <div className="flex items-center gap-2 grow">
          <div>
            <UserAvatar status={userStatus} size="small" />
          </div>
          <UserInfo state={state} />
        </div>
        <ChevronUp
          className={cn(
            "h-5 w-5 text-white opacity-50 ml-2 transition-transform duration-200 shrink-0",
            isOpen ? "rotate-180" : "rotate-0"
          )}
          aria-hidden="true"
        />
      </div>
    </Button>
  );

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      {state === "collapsed" && !isMobile ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>{triggerButton}</DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="right" align="center" variant="glass" hidden={isOpen}>
            Menu
          </TooltipContent>
        </Tooltip>
      ) : (
        <DropdownMenuTrigger asChild>{triggerButton}</DropdownMenuTrigger>
      )}
      <DropdownMenuContent state={state} />
    </DropdownMenu>
  );
});

UserDropdown.displayName = "UserDropdown";
