"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/custom-tooltip";

const ThemeSwitch = () => {
  const { theme, setTheme } = useTheme();

  const themes = [
    { value: "system", icon: Monitor },
    { value: "light", icon: Sun },
    { value: "dark", icon: Moon },
  ];

  return (
    <TooltipProvider>
      <div className="flex items-center justify-between w-full">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Theme
        </span>
        <div
          className="px-0.5 flex items-center bg-gradient-to-r from-indigo-950 to-blue-500  
               dark:from-purple-700 dark:to-pink-500 rounded-full p-1"
        >
          {themes.map(({ value, icon: Icon }) => (
            <Tooltip key={value}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setTheme(value)}
                  className={cn(
                    "flex items-center justify-center mx-0.5 py-2.5 rounded-full w-5 h-4 transition-all duration-300 ease-in-out",
                    theme === value
                      ? "bg-white text-blue-600 shadow-md scale-105"
                      : "text-white hover:bg-white/30"
                  )}
                  aria-label={`Set theme to ${value}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent sideOffset={20}>
                <p>{value.charAt(0).toUpperCase() + value.slice(1)}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default ThemeSwitch;
