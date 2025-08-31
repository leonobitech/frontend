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
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  ChevronDown,
  MoreVertical,
  Trash,
  Headphones,
  FolderGit2,
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

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  items: { title: string; href: string }[];
  favorites?: { id: string; title: string }[];
  removeFavorite?: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const Section: React.FC<SectionProps> = ({
  title,
  icon,
  items,
  favorites,
  removeFavorite,
  isOpen,
  onToggle,
}) => {
  const pathname = usePathname();
  const { state } = useSidebar();

  return (
    <SidebarMenuItem>
      <Collapsible open={isOpen} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            className={cn(
              "w-full justify-between ",
              "transition-all duration-300 ease-out ",

              "rounded-md overflow-hidden",
              "group",
              isOpen
                ? "bg-gradient-to-r from-blue-600 to-blue-950 dark:from-pink-600 dark:to-purple-600 backdrop-blur-sm shadow-lg hover:text-white"
                : "hover:bg-gray-300 dark:hover:bg-blue-950/40 hover:backdrop-blur-sm",
              pathname.startsWith(`/${title.toLowerCase()}`) &&
                "bg-gradient-to-r from-blue-600 to-indigo-950 dark:from-pink-500 dark:to-purple-600"
            )}
            isActive={pathname.startsWith(`/${title.toLowerCase()}`)}
          >
            <div className="flex flex-row items-center gap-2">
              <div
                className={cn(
                  "h-4 w-4 transition-transform duration-200 dark:text-white",
                  pathname.startsWith(`/${title.toLowerCase()}`) &&
                    "text-white",
                  isOpen && "text-white"
                )}
              >
                {icon}
              </div>
              <span
                className={cn(
                  state === "collapsed" && "hidden",
                  pathname.startsWith(`/${title.toLowerCase()}`) &&
                    "text-white",
                  isOpen && "text-white"
                )}
              >
                <span className="font-medium dark:text-white ">{title}</span>
              </span>
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 dark:text-white transition-transform duration-200 flex-shrink-0",
                isOpen ? "rotate-180" : "rotate-0",
                state === "collapsed" && "hidden",
                pathname.startsWith(`/${title.toLowerCase()}`) && "text-white",
                isOpen && "text-white"
              )}
            />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        {/*  Content */}
        <CollapsibleContent>
          <div className="mt-1 pl-2 border-l-2 border-white/10">
            <SidebarMenuSub>
              {items.map((item, index) => (
                <MenuItemWrapper key={item.href} index={index}>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      className={cn(
                        "w-full",
                        "hover:bg-gray-300  dark:hover:bg-blue-950/40 hover:backdrop-blur-sm transition-all duration-300 ease-out",
                        "rounded-md overflow-hidden",
                        pathname === item.href &&
                          "bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-pink-600 dark:to-purple-600 "
                      )}
                      isActive={pathname === item.href}
                    >
                      <Link
                        href={item.href}
                        prefetch={false}
                        className="flex items-center gap-2 px-2 py-1.5 w-full "
                      >
                        <span
                          className={cn(
                            "text-sm ",
                            pathname === item.href && "text-white",
                            state === "collapsed" && "hidden"
                          )}
                        >
                          {item.title}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </MenuItemWrapper>
              ))}
              {favorites && favorites.length > 0 && (
                <>
                  <MenuItemWrapper index={items.length}>
                    <SidebarMenuItem>
                      {/* <SidebarMenuButton asChild>
                        <span className="flex items-center gap-2 font-semibold text-sm dark:text-white">
                          <Heart className="h-4 w-4 text-red-500" />
                          <span
                            className={cn(state === "collapsed" && "hidden")}
                          >
                            Favorites
                          </span>
                        </span>
                      </SidebarMenuButton> */}
                    </SidebarMenuItem>
                  </MenuItemWrapper>
                  {favorites.map((item, index) => (
                    <MenuItemWrapper
                      key={item.id}
                      index={items.length + 1 + index}
                    >
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
                </>
              )}
            </SidebarMenuSub>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
};

const easeMenu: [number, number, number, number] = [0.48, 0.15, 0.25, 0.96];
const menuItemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: easeMenu, // ✅ tuple tipada
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

export const SidebarContent: React.FC = () => {
  const {
    favoriteCourses,
    favoriteProjects,
    favoritePodcasts,
    removeFavoriteCourse,
    removeFavoriteProject,
    removeFavoritePodcast,
  } = useFavoriteStore();

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    Courses: false,
    Projects: false,
    Podcasts: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <ShadcnSidebarContent className="p-4 relative  bg-background overflow-hidden">
      {/* Background Animation */}
      <div className="relative z-10 ">
        <SidebarMenu>
          <Section
            title="Courses"
            icon={<BookOpen className="h-4 w-4" />}
            items={[
              { title: "All Courses", href: "/courses" },
              { title: "My Courses", href: "/courses/my-courses" },
            ]}
            favorites={favoriteCourses}
            removeFavorite={removeFavoriteCourse}
            isOpen={openSections.Courses}
            onToggle={() => toggleSection("Courses")}
          />
          <Section
            title="Podcasts"
            icon={<Headphones className="h-4 w-4" />}
            items={[
              { title: "All Podcasts", href: "/podcasts" },
              { title: "My Podcasts", href: "/podcasts/my-podcasts" },
            ]}
            favorites={favoritePodcasts}
            removeFavorite={removeFavoritePodcast}
            isOpen={openSections.Podcasts}
            onToggle={() => toggleSection("Podcasts")}
          />
          <Section
            title="Projects"
            icon={<FolderGit2 className="h-4 w-4" />}
            items={[
              { title: "All Projects", href: "/projects" },
              { title: "My Projects", href: "/projects/my-projects" },
            ]}
            favorites={favoriteProjects}
            removeFavorite={removeFavoriteProject}
            isOpen={openSections.Projects}
            onToggle={() => toggleSection("Projects")}
          />
        </SidebarMenu>
      </div>
    </ShadcnSidebarContent>
  );
};
