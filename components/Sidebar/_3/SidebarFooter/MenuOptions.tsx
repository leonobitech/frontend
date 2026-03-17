import React, { useCallback } from "react";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Settings, Moon, Languages, LogOut } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { CustomSelect } from "./CustomSelect";
import { useSidebarFooter } from "./SidebarFooterContext";
import { StatusIndicator } from "./StatusIndicator";
import { statusLabels, UserStatus } from "./types/types";
import { useLogout } from "@/hooks/useLogout";

const ThemeSwitch = dynamic(() => import("../../../ThemeSwitch"), {
  ssr: false,
});

export const MenuOptions = React.memo(() => {
  const { logout, loading } = useLogout();

  const { userStatus, setUserStatus, language, setLanguage } =
    useSidebarFooter();

  const languageOptions = [
    { value: "en", label: "English" },
    { value: "es", label: "Spanish" },
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
      <DropdownMenuSeparator className="my-1 bg-white/10" />

      <DropdownMenuLabel className="px-2 py-1.5 text-[#D1D5DB] font-bold">
        Preferences
      </DropdownMenuLabel>
      <DropdownMenuItem asChild className="px-2 py-1.5 hover:bg-white/10 rounded-md transition-all duration-200">
        <Link href="/settings" className="flex items-center">
          <Settings className="mr-2 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Settings</span>
        </Link>
      </DropdownMenuItem>

      <DropdownMenuItem className="px-2 py-1.5 hover:bg-white/10 rounded-md transition-all duration-200">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center">
            <Languages
              className="mr-2 h-4 w-4 shrink-0"
              aria-hidden="true"
            />
            <span>Language</span>
          </div>
          <CustomSelect
            value={language}
            onValueChange={handleLanguageChange}
            placeholder="Select language"
            options={languageOptions}
            triggerClassName="w-28 h-7 border-none bg-transparent hover:bg-white/10 rounded-md transition-colors focus:ring-0 !text-[#D1D5DB] [&_svg]:!text-gray-400"
            contentClassName="w-28"
            alignOffset={-50}
          />
        </div>
      </DropdownMenuItem>

      <DropdownMenuItem className="px-2 py-1.5 hover:bg-white/10 rounded-md transition-all duration-200">
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
            triggerClassName="w-28 h-7 border-none bg-transparent hover:bg-white/10 rounded-md transition-colors focus:ring-0 !text-[#D1D5DB] [&_svg]:!text-gray-400"
            contentClassName="w-28"
            alignOffset={-50}
          />
        </div>
      </DropdownMenuItem>

      <DropdownMenuItem className="focus:bg-transparent px-2 py-1.5 hover:bg-white/10 rounded-md transition-all duration-200">
        <div className="flex items-center w-full">
          <Moon className="mr-2 h-4 w-4 shrink-0" aria-hidden="true" />
          <ThemeSwitch />
        </div>
      </DropdownMenuItem>

      <DropdownMenuSeparator className="my-1 bg-white/10" />

      <DropdownMenuItem
        onSelect={(event) => {
          event.preventDefault(); // 👈 evita el cierre automático
          if (!loading) logout(); // solo si no está cargando
        }}
        disabled={loading}
        className="px-2 mt-2 py-1.5 bg-[#D1D5DB] text-[#2B2B2B] rounded-md shadow-md transition-all hover:shadow-lg hover:shadow-white/15"
      >
        <LogOut className="mr-2 h-4 w-4 shrink-0" />

        <span className="font-semibold">
          {loading ? "Saliendo..." : "Cerrar sesión"}
        </span>
      </DropdownMenuItem>
    </div>
  );
});

MenuOptions.displayName = "MenuOptions";
