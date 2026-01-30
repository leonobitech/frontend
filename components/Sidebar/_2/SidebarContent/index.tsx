import React, { useState } from "react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import {
  SidebarContent as ShadcnSidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  useSidebar,
} from "@/components/ui/sidebar";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  GalleryHorizontal,
  ChevronDown,
  MoreVertical,
  Trash,
  Headphones,
  FolderGit2,
  Cpu,
  AudioLines,
} from "lucide-react";
import { useFavoriteStore } from "@/lib/store";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { OdooMcpConnector } from "./OdooMcpConnector";

// ---------------------------------------------------------------------------
// SimpleLink — for items without dropdown (IoT, TTS)
// Clicking always navigates to the page. Active state by pathname.
// ---------------------------------------------------------------------------
interface SimpleLinkProps {
  title: string;
  href: string;
  icon: React.ReactNode;
}

const SimpleLink: React.FC<SimpleLinkProps> = ({ title, href, icon }) => {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        tooltip={title}
        className={cn(
          "w-full",
          "transition-all duration-300 ease-out",
          "rounded-md overflow-hidden",
          isActive
            ? "bg-linear-to-r from-blue-600 to-indigo-950 dark:from-pink-500 dark:to-purple-600"
            : "hover:bg-gray-300 dark:hover:bg-blue-950/40 hover:backdrop-blur-sm"
        )}
        isActive={isActive}
      >
        <Link href={href} prefetch={false} className="flex items-center gap-2">
          <div
            className={cn(
              "h-4 w-4 transition-transform duration-200 dark:text-white",
              isActive && "text-white"
            )}
          >
            {icon}
          </div>
          <span
            className={cn(
              "font-medium dark:text-white",
              isActive && "text-white"
            )}
          >
            {title}
          </span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};

// ---------------------------------------------------------------------------
// Section — for items with favorites dropdown (Gallery, Podcasts, Projects)
// Header always navigates to the page.
// When expanded, also toggles the favorites dropdown.
// ---------------------------------------------------------------------------
interface SectionProps {
  title: string;
  href: string;
  icon: React.ReactNode;
  favorites?: { id: string; title: string }[];
  removeFavorite?: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const Section: React.FC<SectionProps> = ({
  title,
  href,
  icon,
  favorites,
  removeFavorite,
  isOpen,
  onToggle,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const { state } = useSidebar();
  const isActive = pathname === href || pathname.startsWith(href + "/");
  const hasFavorites = favorites && favorites.length > 0;

  const handleHeaderClick = (e: React.MouseEvent) => {
    // Always navigate to the page
    router.push(href);
    // When expanded and has favorites, also toggle dropdown
    if (state === "expanded" && hasFavorites) {
      onToggle();
    }
  };

  return (
    <SidebarMenuItem>
      <Collapsible open={isOpen} onOpenChange={onToggle}>
        {/* Header — navigates to page, toggles favorites if expanded */}
        <SidebarMenuButton
          tooltip={title}
          className={cn(
            "w-full justify-between",
            "transition-all duration-300 ease-out",
            "rounded-md overflow-hidden",
            "group",
            isActive
              ? "bg-linear-to-r from-blue-600 to-indigo-950 dark:from-pink-500 dark:to-purple-600"
              : "hover:bg-gray-300 dark:hover:bg-blue-950/40 hover:backdrop-blur-sm"
          )}
          isActive={isActive}
          onClick={handleHeaderClick}
        >
          <div className="flex flex-row items-center gap-2">
            <div
              className={cn(
                "h-4 w-4 transition-transform duration-200 dark:text-white",
                isActive && "text-white"
              )}
            >
              {icon}
            </div>
            <span
              className={cn(
                state === "collapsed" && "hidden",
                isActive && "text-white"
              )}
            >
              <span className="font-medium dark:text-white">{title}</span>
            </span>
          </div>
          {hasFavorites && (
            <ChevronDown
              className={cn(
                "h-4 w-4 dark:text-white transition-transform duration-200 shrink-0",
                isOpen ? "rotate-180" : "rotate-0",
                state === "collapsed" && "hidden",
                isActive && "text-white"
              )}
            />
          )}
        </SidebarMenuButton>

        {/* Favorites dropdown */}
        {hasFavorites && (
          <CollapsibleContent>
            <div className="mt-1 pl-2 border-l-2 border-white/10">
              <SidebarMenuSub>
                {favorites.map((item, index) => (
                  <MenuItemWrapper key={item.id} index={index}>
                    <SidebarMenuItem>
                      <div className="flex items-center justify-between w-full">
                        <SidebarMenuButton
                          asChild
                          className={cn(
                            "w-full",
                            "hover:bg-gray-300 dark:hover:bg-blue-950/40 hover:backdrop-blur-sm transition-all duration-300 ease-out",
                            "rounded-md"
                          )}
                        >
                          <Link
                            href={`/${title.toLowerCase()}/${item.id}`}
                            prefetch={false}
                            className="flex items-center gap-2 pl-6 py-1.5 w-full"
                          >
                            <span
                              className={cn(
                                "truncate text-sm dark:text-white",
                                state === "collapsed" && "hidden"
                              )}
                            >
                              {item.title}
                            </span>
                          </Link>
                        </SidebarMenuButton>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className={cn(
                                "p-1 hover:bg-white/20 rounded-md transition-all duration-200 text-white",
                                state === "collapsed"
                                  ? "absolute right-0"
                                  : "relative"
                              )}
                              aria-label={`Options for ${item.title}`}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={() =>
                                removeFavorite && removeFavorite(item.id)
                              }
                              className="text-red-600 focus:text-red-600 focus:bg-red-100 dark:focus:bg-red-900"
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </SidebarMenuItem>
                  </MenuItemWrapper>
                ))}
              </SidebarMenuSub>
            </div>
          </CollapsibleContent>
        )}
      </Collapsible>
    </SidebarMenuItem>
  );
};

// ---------------------------------------------------------------------------
// Animation helpers
// ---------------------------------------------------------------------------
const easeMenu: [number, number, number, number] = [0.48, 0.15, 0.25, 0.96];
const menuItemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: easeMenu,
    },
  }),
};

const MenuItemWrapper: React.FC<{
  index: number;
  children: React.ReactNode;
}> = ({ index, children }) => (
  <motion.div
    variants={menuItemVariants}
    initial="hidden"
    animate="visible"
    custom={index}
  >
    {children}
  </motion.div>
);

// ---------------------------------------------------------------------------
// SidebarContent — main export
// ---------------------------------------------------------------------------
export const SidebarContent: React.FC = () => {
  const {
    favoriteGallery,
    favoriteProjects,
    favoritePodcasts,
    removeFavoriteGalleryEntry,
    removeFavoriteProject,
    removeFavoritePodcast,
  } = useFavoriteStore();

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    Gallery: false,
    Projects: false,
    Podcasts: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => {
      const wasOpen = prev[section];
      // Close all sections, only open the clicked one if it was closed
      const next: Record<string, boolean> = {};
      for (const key of Object.keys(prev)) {
        next[key] = key === section ? !wasOpen : false;
      }
      return next;
    });
  };

  return (
    <ShadcnSidebarContent className="p-4 relative bg-background overflow-hidden">
      <div className="relative z-10">
        <OdooMcpConnector />

        <div className="my-3 border-t border-gray-200 dark:border-gray-700" />

        <SidebarMenu>
          {/* Sections with favorites dropdown */}
          <Section
            title="Gallery"
            href="/gallery"
            icon={<GalleryHorizontal className="h-4 w-4" />}
            favorites={favoriteGallery}
            removeFavorite={removeFavoriteGalleryEntry}
            isOpen={openSections.Gallery}
            onToggle={() => toggleSection("Gallery")}
          />
          <Section
            title="Podcasts"
            href="/podcasts"
            icon={<Headphones className="h-4 w-4" />}
            favorites={favoritePodcasts}
            removeFavorite={removeFavoritePodcast}
            isOpen={openSections.Podcasts}
            onToggle={() => toggleSection("Podcasts")}
          />
          <Section
            title="Projects"
            href="/projects"
            icon={<FolderGit2 className="h-4 w-4" />}
            favorites={favoriteProjects}
            removeFavorite={removeFavoriteProject}
            isOpen={openSections.Projects}
            onToggle={() => toggleSection("Projects")}
          />

          {/* Simple links — no dropdown */}
          <SimpleLink
            title="IoT"
            href="/iot"
            icon={<Cpu className="h-4 w-4" />}
          />
          <SimpleLink
            title="TTS"
            href="/tts"
            icon={<AudioLines className="h-4 w-4" />}
          />
        </SidebarMenu>
      </div>
    </ShadcnSidebarContent>
  );
};
