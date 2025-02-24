"use client";

import * as React from "react";
import {
  SidebarFooter as ShadcnSidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  ChevronUp,
  Languages,
  LogOut,
  Settings,
  Edit,
  Edit2,
  MapPin,
  Link as LinkIcon,
  Twitter,
  Linkedin,
  Instagram,
  Github,
  Moon,
} from "lucide-react";
import ThemeSwitch from "../../../ThemeSwitch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";

// REVIEW: Consider using an enum for UserStatus to ensure type safety
type UserStatus = "online" | "idle" | "dnd" | "offline";

// Labels for each user status
const statusLabels: Record<UserStatus, string> = {
  online: "Online",
  idle: "Absent",
  dnd: "Busy",
  offline: "Invisible",
};

// Props for the StatusIndicator component
interface StatusIndicatorProps {
  status: UserStatus;
  className?: string;
  size?: "small" | "large" | "select";
}

// StatusIndicator component: Displays a visual indicator of the user's status
const StatusIndicator = React.memo(function StatusIndicator({
  status,
  className,
  size = "small",
}: StatusIndicatorProps) {
  // CSS classes for each status
  const statusClasses = {
    online: "bg-green-500",
    idle: "bg-yellow-500",
    dnd: "bg-red-500",
    offline: "bg-gray-500",
  };

  // CSS classes for each size
  const sizeClasses = {
    small: "w-2.5 h-2.5",
    large: "w-3.5 h-3.5",
    select: "w-2 h-2 relative inline-block mr-2",
  };

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center",
        sizeClasses[size],
        className
      )}
    >
      <div
        className={cn(
          "rounded-full w-full h-full",
          statusClasses[status],
          `shadow-[0_0_0_2px_rgba(${
            status === "online"
              ? "34,197,94"
              : status === "idle"
              ? "234,179,8"
              : status === "dnd"
              ? "239,68,68"
              : "107,114,128"
          },0.2)]`
        )}
      />
    </div>
  );
});

StatusIndicator.displayName = "StatusIndicator";

// Props for the CustomSelect component
interface CustomSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
  triggerClassName?: string;
  contentClassName?: string;
  alignOffset?: number;
}

// CustomSelect component: A customized select dropdown
const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onValueChange,
  placeholder,
  options,
  triggerClassName,
  contentClassName,
  alignOffset = 0,
}) => {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={triggerClassName}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent
        className={cn(
          "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
          contentClassName
        )}
        position="popper"
        sideOffset={5}
        align="end"
        alignOffset={alignOffset}
        side="top"
      >
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            className="hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-blue-700/20 dark:hover:from-pink-500/20 dark:hover:to-pink-700/20 transition-all duration-200"
          >
            <span>{option.label}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export const SidebarFooter = () => {
  // Get the current state of the sidebar (expanded or collapsed)
  const { state } = useSidebar();

  // State for language, menu open state, user status, and avatar position
  const [language, setLanguage] = React.useState("en");
  const [isOpen, setIsOpen] = React.useState(false);
  const [userStatus, setUserStatus] = React.useState<UserStatus>("online");
  const avatarRef = React.useRef<HTMLDivElement>(null);
  const [avatarPosition, setAvatarPosition] = React.useState({ x: 0, y: 0 });

  // Language options for the selector
  const languageOptions = [
    { value: "en", label: "English" },
    { value: "es", label: "Español" },
    { value: "fr", label: "Français" },
    { value: "de", label: "Deutsch" },
  ];

  // Status options for the selector
  const statusOptions = Object.entries(statusLabels).map(([value, label]) => ({
    value,
    label,
  }));

  // Effect to update avatar position when the menu is opened
  React.useEffect(() => {
    if (avatarRef.current) {
      const rect = avatarRef.current.getBoundingClientRect();
      setAvatarPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
    }
  }, [isOpen]);

  // DEBUG: Log sidebar state changes
  React.useEffect(() => {
    console.log("Sidebar state changed:", state);
  }, [state]);
  return (
    <ShadcnSidebarFooter
      className="p-1 bg-gradient-to-r from-indigo-950 to-blue-500  
        dark:from-purple-700 dark:to-pink-500 relative"
    >
      {/* User Dropdown Menu */}
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="w-full h-14 px-2 justify-start gap-2 rounded-lg overflow-hidden transition-all duration-200 ease-in-out
                   hover:bg-white/10 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/20"
            aria-label="Open user menu"
          >
            <div className="flex items-center w-full">
              <div className="flex items-center gap-2 flex-grow">
                {/* User Avatar */}
                <div
                  ref={avatarRef}
                  className="relative h-10 w-10 mr-1 flex-shrink-0"
                >
                  <div className="absolute inset-0 rounded-full animate-rotate-gradient">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500" />
                  </div>
                  <div className="absolute inset-[2px] bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <Image
                      src="/avatar.png"
                      alt="User avatar"
                      width={36}
                      height={36}
                      className="rounded-full"
                    />
                  </div>
                  <StatusIndicator
                    status={userStatus}
                    className="absolute bottom-0 right-0 border-2 border-white dark:border-gray-800"
                  />
                </div>
                {/* User Name and Status */}
                <div
                  className={cn(
                    "flex flex-col items-start text-left min-w-0",
                    state === "collapsed"
                      ? "opacity-0 w-0"
                      : "opacity-100 w-auto"
                  )}
                >
                  <span className="text-base font-semibold text-white truncate w-full">
                    John Doe
                  </span>
                  <span className="text-sm text-emerald-400 font-semibold truncate w-full">
                    Premium
                  </span>
                </div>
              </div>
              {/* Dropdown Arrow Icon */}
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
        {/* Dropdown Menu Content */}
        <AnimatePresence>
          {isOpen && (
            <DropdownMenuContent
              forceMount
              asChild
              align="end"
              alignOffset={state === "collapsed" ? -255 : -30}
              sideOffset={16}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: "-100%" }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{
                  opacity: 0,
                  scale: 0,
                  x: avatarPosition.x - 150,
                  y: avatarPosition.y - window.scrollY - 240,
                }}
                transition={{
                  enter: {
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  },
                  exit: {
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                    mass: 0.5,
                  },
                }}
                className="w-[300px] max-w-[calc(100vw-2rem)] bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <div className="relative">
                  {/* Blurred Background Effect */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -left-1/2 -top-1/2 w-full h-full bg-gradient-to-br from-blue-400/30 to-blue-600/30 dark:from-pink-400/40 dark:to-pink-600/40 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[32px] animate-blob"></div>
                    <div className="absolute -right-1/2 -bottom-1/2 w-full h-full bg-gradient-to-br from-blue-500/30 to-blue-700/30 dark:from-pink-500/40 dark:to-pink-700/40 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[32px] animate-blob animation-delay-2000"></div>
                    <div className="absolute left-1/4 top-1/4 w-1/2 h-1/2 bg-gradient-to-br from-blue-300/30 to-blue-500/30 dark:from-pink-300/40 dark:to-pink-500/40 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[32px] animate-blob animation-delay-4000"></div>
                  </div>

                  {/* Dropdown Menu Content */}
                  <div className="relative z-10">
                    {/* User Banner and Avatar */}
                    <div className="relative">
                      {/* Banner */}
                      <div className="h-24 bg-gradient-to-r from-blue-400 to-blue-600 dark:from-pink-400 dark:to-pink-600 relative rounded-t-lg overflow-hidden">
                        <Image
                          src="/banner.png"
                          alt="User banner"
                          width={300}
                          height={96}
                          className="w-full h-full object-cover"
                        />
                        <button
                          className="absolute top-2 right-2 p-1 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors"
                          aria-label="Edit banner"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      </div>
                      {/* Avatar */}
                      <div className="absolute bottom-0 left-4 transform translate-y-1/2">
                        <div className="relative h-16 w-16">
                          <div className="absolute inset-0 rounded-full animate-rotate-gradient">
                            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500" />
                          </div>
                          <div className="absolute inset-[2px] bg-white dark:bg-gray-800 rounded-full flex items-center justify-center overflow-hidden">
                            <Image
                              src="/avatar.png"
                              alt="User avatar"
                              width={60}
                              height={60}
                              className="rounded-full w-full h-full object-cover"
                            />
                          </div>
                          <StatusIndicator
                            status={userStatus}
                            size="large"
                            className="absolute bottom-0 right-0 border-2 border-white dark:border-gray-800"
                          />
                        </div>
                      </div>
                      {/* Social Media Icons */}
                      <div className="absolute right-4 top-28 flex flex-col space-y-2">
                        {[
                          {
                            icon: Twitter,
                            href: "#",
                            label: "Twitter profile",
                          },
                          {
                            icon: Linkedin,
                            href: "#",
                            label: "LinkedIn profile",
                          },
                          {
                            icon: Instagram,
                            href: "#",
                            label: "Instagram profile",
                          },
                          {
                            icon: Github,
                            href: "#",
                            label: "GitHub profile",
                          },
                        ].map((social, index) => (
                          <Link
                            key={index}
                            href={social.href}
                            aria-label={social.label}
                            className={`
                                relative p-2 rounded-full
                                bg-white/10 backdrop-blur-md
                                text-blue-500 dark:text-pink-400
                                shadow-lg
                                hover:bg-white/20 hover:text-blue-600 dark:hover:text-pink-500
                                hover:scale-110 hover:shadow-xl
                                transition-all duration-300 ease-in-out
                                group
                              `}
                          >
                            <social.icon className="h-4 w-4 relative z-10" />
                            <span className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400/50 to-blue-600/50 dark:from-pink-400/50 dark:to-pink-600/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out" />
                            <span className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 animate-shimmer" />
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* User Information */}
                    <div className="pt-10 px-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            John Doe
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            johndoe@gmail.com
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 w-full">
                        Passionate developer, coffee enthusiast, and avid
                        traveler.
                      </p>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                        San Francisco, CA
                      </div>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <LinkIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                        <Link
                          href="https://johndoe.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline truncate"
                        >
                          johndoe.com
                        </Link>
                      </div>
                    </div>

                    <DropdownMenuSeparator className="my-1 border-gray-200 dark:border-gray-700" />

                    {/* Menu Options */}
                    <div className="p-2">
                      <DropdownMenuItem className="px-2 py-1.5 hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-blue-700/20 dark:hover:from-pink-500/20 dark:hover:to-pink-700/20 rounded-md transition-all duration-200">
                        <Edit
                          className="mr-2 h-4 w-4 flex-shrink-0"
                          aria-hidden="true"
                        />
                        <span>Edit Profile</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="px-2 py-1.5 hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-blue-700/20 dark:hover:from-pink-500/20 dark:hover:to-pink-700/20 rounded-md transition-all duration-200">
                        <Settings
                          className="mr-2 h-4 w-4 flex-shrink-0"
                          aria-hidden="true"
                        />
                        <span>Settings</span>
                      </DropdownMenuItem>

                      <DropdownMenuSeparator className="my-1 border-gray-200 dark:border-gray-700" />

                      <DropdownMenuLabel className="px-2 py-1.5 text-blue-600 dark:text-pink-400 font-bold">
                        Preferences
                      </DropdownMenuLabel>
                      {/* Theme Switcher */}
                      <DropdownMenuItem className="focus:bg-transparent px-2 py-1.5 hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-blue-700/20 dark:hover:from-pink-500/20 dark:hover:to-pink-700/20 rounded-md transition-all duration-200">
                        <div className="flex items-center w-full">
                          <Moon
                            className="mr-2 h-4 w-4 flex-shrink-0"
                            aria-hidden="true"
                          />
                          <ThemeSwitch />
                        </div>
                      </DropdownMenuItem>
                      {/* Language Selector */}
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
                            onValueChange={setLanguage}
                            placeholder="Select language"
                            options={languageOptions}
                            triggerClassName="w-28 h-7 border-none bg-transparent hover:bg-blue-100/50 dark:hover:bg-pink-700/50 rounded-md transition-colors focus:ring-2 focus:ring-blue-500 dark:focus:ring-pink-500"
                            contentClassName="w-28"
                            alignOffset={-50}
                          />
                        </div>
                      </DropdownMenuItem>
                      {/* Status Selector */}
                      <DropdownMenuItem className="px-2 py-1.5 hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-blue-700/20 dark:hover:from-pink-500/20 dark:hover:to-pink-700/20 rounded-md transition-all duration-200">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center">
                            <StatusIndicator
                              status={userStatus}
                              size="select"
                            />
                            <span>Status</span>
                          </div>
                          <CustomSelect
                            value={userStatus}
                            onValueChange={(value) =>
                              setUserStatus(value as UserStatus)
                            }
                            placeholder="Set status"
                            options={statusOptions}
                            triggerClassName="w-28 h-7 border-none bg-transparent hover:bg-blue-100/50 dark:hover:bg-pink-700/50 rounded-md transition-colors focus:ring-2 focus:ring-blue-500 dark:focus:ring-pink-500"
                            contentClassName="w-28"
                            alignOffset={-50}
                          />
                        </div>
                      </DropdownMenuItem>

                      <DropdownMenuSeparator className="my-1 border-gray-200 dark:border-gray-700" />

                      {/* Sign Out Button */}
                      <DropdownMenuItem
                        className="px-2 py-1.5 bg-gradient-to-r from-indigo-950 to-blue-500 hover:from-blue-600 hover:to-indigo-600 
                                   dark:from-purple-700 dark:to-pink-500 dark:hover:from-pink-600 dark:hover:to-purple-600
                                     text-white rounded-md hover:shadow-lg hover:scale-105  
                                     transition-all duration-300 ease-out"
                      >
                        <LogOut
                          className="mr-2 h-4 w-4 flex-shrink-0"
                          aria-hidden="true"
                        />
                        <span className="font-semibold">Sign Out</span>
                      </DropdownMenuItem>
                    </div>
                  </div>
                </div>
              </motion.div>
            </DropdownMenuContent>
          )}
        </AnimatePresence>
      </DropdownMenu>
    </ShadcnSidebarFooter>
  );
};
