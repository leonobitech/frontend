"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;

interface CustomArrowProps {
  className?: string;
}

const CustomArrow: React.FC<CustomArrowProps> = ({ className }) => (
  <svg
    width="16"
    height="8"
    viewBox="0 0 16 8"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M0 0C2.5 0 3.5 1.5 4.5 3C5.5 4.5 6.5 6 8 6C9.5 6 10.5 4.5 11.5 3C12.5 1.5 13.5 0 16 0H0Z"
      fill="currentColor"
    />
  </svg>
);

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 16, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 overflow-visible rounded-md px-3 py-2 text-sm font-medium shadow-md",
      "bg-gradient-to-r from-indigo-950 to-blue-500 dark:from-purple-700 dark:to-pink-500 text-white dark:text-white",
      "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
      "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  >
    {props.children}
    <CustomArrow
      className={cn(
        "text-blue-900 dark:text-pink-500",
        "absolute -bottom-[8px] left-1/2 -translate-x-1/2"
      )}
    />
  </TooltipPrimitive.Content>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
