import React, { useCallback } from "react";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Edit, Moon, Languages, LogOut } from "lucide-react";
import dynamic from "next/dynamic";
import { CustomSelect } from "./CustomSelect";
import { useSidebarFooter } from "./SidebarFooterContext";
import { StatusIndicator } from "./StatusIndicator";
import { statusLabels, UserStatus } from "./types/types";
import { useLogout } from "./hooks/useLogout";

const ThemeSwitch = dynamic(() => import("../../../ThemeSwitch"), {
  ssr: false,
});

export const MenuOptions = React.memo(() => {
  const logout = useLogout();
  const { userStatus, setUserStatus, language, setLanguage } =
    useSidebarFooter();

  const languageOptions = [
    { value: "en", label: "English" },
    { value: "es", label: "Español" },
    { value: "fr", label: "Français" },
    { value: "de", label: "Deutsch" },
  ];

  const statusOptions = Object.entries(statusLabels).map(([value, label]) => ({
    value,
    label,
  }));

  const handleLanguageChange = useCallback(
    (value: string) => {
      setLanguage(value);
    },
    [setLanguage]
  );

  const handleStatusChange = useCallback(
    (value: string) => {
      setUserStatus(value as UserStatus);
    },
    [setUserStatus]
  );

  return (
    <div className="px-2 pb-2">
      <DropdownMenuSeparator className="my-1 bg-gradient-to-r from-blue-500 to-blue-500 dark:from-pink-600 dark:to-purple-600" />

      <DropdownMenuLabel className="px-2 py-1.5 text-blue-700 dark:text-pink-600 font-bold">
        Preferences
      </DropdownMenuLabel>
      <DropdownMenuItem className="px-2 py-1.5 hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-blue-700/20 dark:hover:from-pink-500/20 dark:hover:to-pink-700/20 rounded-md transition-all duration-200">
        <Edit className=" h-4 w-4 flex-shrink-0" aria-hidden="true" />
        <span>Edit Profile</span>
      </DropdownMenuItem>

      <DropdownMenuItem className="px-2 py-1.5 hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-blue-700/20 dark:hover:from-pink-500/20 dark:hover:to-pink-700/20 rounded-md transition-all duration-200">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center">
            <Languages
              className="mr-2 h-4 w-4 flex-shrink-0"
              aria-hidden="true"
            />
            <span>Language</span>
          </div>
          <CustomSelect
            value={language}
            onValueChange={handleLanguageChange}
            placeholder="Select language"
            options={languageOptions}
            triggerClassName="w-28 h-7 border-none bg-transparent hover:bg-blue-100/50 dark:hover:bg-pink-700/50 rounded-md transition-colors focus:ring-2 focus:ring-blue-500 dark:focus:ring-pink-500"
            contentClassName="w-28"
            alignOffset={-50}
          />
        </div>
      </DropdownMenuItem>

      <DropdownMenuItem className="px-2 py-1.5 hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-blue-700/20 dark:hover:from-pink-500/20 dark:hover:to-pink-700/20 rounded-md transition-all duration-200">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center">
            <StatusIndicator status={userStatus} size="select" />
            <span>Status</span>
          </div>
          <CustomSelect
            value={userStatus}
            onValueChange={handleStatusChange}
            placeholder="Set status"
            options={statusOptions}
            triggerClassName="w-28 h-7 border-none bg-transparent hover:bg-blue-100/50 dark:hover:bg-pink-700/50 rounded-md transition-colors focus:ring-2 focus:ring-blue-500 dark:focus:ring-pink-500"
            contentClassName="w-28"
            alignOffset={-50}
          />
        </div>
      </DropdownMenuItem>

      <DropdownMenuItem className="focus:bg-transparent px-2 py-1.5 hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-blue-700/20 dark:hover:from-pink-500/20 dark:hover:to-pink-700/20 rounded-md transition-all duration-200">
        <div className="flex items-center w-full">
          <Moon className="mr-2 h-4 w-4 flex-shrink-0" aria-hidden="true" />
          <ThemeSwitch />
        </div>
      </DropdownMenuItem>

      <DropdownMenuSeparator className="my-1 bg-gradient-to-r from-blue-500 to-blue-500 dark:from-pink-600 dark:to-purple-600" />

      <DropdownMenuItem
        onClick={logout}
        className="px-2 mt-2 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-950 hover:from-blue-600 hover:to-indigo-600 
                   dark:from-pink-600 dark:to-purple-600 dark:hover:from-pink-600 dark:hover:to-purple-500
                   text-white rounded-md hover:shadow-lg hover:scale-105  
                   transition-all duration-300 ease-out"
      >
        <LogOut className="mr-2 h-4 w-4 flex-shrink-0" aria-hidden="true" />
        <span className="font-semibold">Sign Out</span>
      </DropdownMenuItem>
    </div>
  );
});

MenuOptions.displayName = "MenuOptions";
