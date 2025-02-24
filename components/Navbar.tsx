"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  Menu,
  Home,
  BookOpen,
  Mail,
  Headphones,
  PenTool,
  Code,
  ChevronRight,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { usePathname, useRouter } from "next/navigation";
import { useSidebar } from "./Sidebar";
import { useTheme } from "next-themes";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState(pathname);
  const { state: sidebarState } = useSidebar();
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Courses", href: "/courses", icon: BookOpen },
    { name: "Podcasts", href: "/podcasts", icon: Headphones },
    { name: "Projects", href: "/projects", icon: Code },
    { name: "Blog", href: "/blog", icon: PenTool },
    { name: "Contact", href: "/contact", icon: Mail },
  ];

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && isOpen) {
        setIsOpen(false);
      }
    };

    const handleScroll = () => {
      setHasScrolled(window.scrollY > 10);
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isOpen]);

  useEffect(() => {
    setActiveTab(pathname);
  }, [pathname]);

  const handleNavClick = (href: string) => {
    setActiveTab(href);
    router.push(href);
  };

  const logoSrc =
    mounted && (theme === "dark" || resolvedTheme === "dark")
      ? "/logo.png"
      : "/logo_navbar.png";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        hasScrolled
          ? "bg-white/40 dark:bg-gray-900/40 shadow-lg backdrop-blur-xl backdrop-saturate-150"
          : "bg-transparent"
      )}
    >
      <div className="container flex h-14 items-center justify-between px-2 relative">
        <div className="flex items-center">
          <Link
            href="/"
            className="flex items-center space-x-2 mr-6"
            onClick={() => handleNavClick("/")}
          >
            {sidebarState === "collapsed" && mounted && (
              <div className="flex relative w-60 h-12">
                {/* <Image
                  src="/icon.png"
                  alt="icon"
                  width={48}
                  height={48}
                  className="object-contain"
                  priority={true}
                /> */}
                <Image
                  src={logoSrc}
                  alt="Navbar logo"
                  width={240}
                  height={48}
                  className="object-contain"
                  priority={true}
                />
              </div>
            )}
          </Link>
          <nav className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavClick(item.href)}
                className={cn(
                  "px-3 py-2 text-sm font-medium transition-all duration-200 ease-in-out relative",
                  "text-gray-700 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white",
                  "hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-md",
                  activeTab === item.href ? "text-blue-700 dark:text-white" : ""
                )}
              >
                {item.name}
                <span
                  className={cn(
                    "absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 dark:from-blue-500 dark:to-pink-500 dark:custom-shadow transform origin-left transition-transform duration-300 ease-out",
                    activeTab === item.href ? "scale-x-100" : "scale-x-0"
                  )}
                />
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          <ThemeToggle />

          <div className="hidden sm:flex space-x-2">
            {/* <Button
              variant="outline"
              size="sm"
              className="bg-gradient-to-r from-blue-500/90 to-indigo-500/90 hover:from-blue-600 hover:to-indigo-600 text-white border-transparent transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md hover:shadow-lg"
            >
              Sign In
            </Button> */}
            <Button
              size="sm"
              className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-600 hover:to-purple-600 text-white transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md hover:shadow-lg"
            >
              Sign In
            </Button>
          </div>

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[300px] sm:w-[400px] bg-white/90 dark:bg-blue-950/10 backdrop-blur-xl backdrop-saturate-150"
            >
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-center mb-6">
                  <Link
                    href="/"
                    className="flex items-center space-x-2"
                    onClick={() => {
                      handleNavClick("/");
                      setIsOpen(false);
                    }}
                  >
                    <div className="flex relative w-64 h-12">
                      <Image
                        src="/icon.png"
                        alt="icon"
                        width={48}
                        height={48}
                        className="object-contain w-12 h-12"
                        priority={true}
                      />
                      <Image
                        src={logoSrc}
                        alt="Mobile menu logo"
                        width={192}
                        height={48}
                        className="object-contain w-48 h-12"
                        priority={true}
                      />
                    </div>
                  </Link>
                </div>
                <nav className="flex flex-col space-y-1">
                  {navItems.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => {
                        handleNavClick(item.href);
                        setIsOpen(false);
                      }}
                      className={cn(
                        "flex items-center space-x-2 px-4 py-3 rounded-lg transition-colors text-left",
                        "text-gray-700 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white",
                        "hover:bg-gray-100/70 dark:hover:bg-gray-800/70",
                        activeTab === item.href
                          ? "text-blue-700 dark:text-white"
                          : "",
                        "relative"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.name}</span>
                      {activeTab === item.href && (
                        <ChevronRight className="h-4 w-4 ml-auto" />
                      )}
                      <span
                        className={cn(
                          "absolute bottom-0 left-0 w-1/2 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 dark:from-blue-600 dark:to-pink-500 dark:custom-shadow transform origin-left transition-transform duration-300 ease-out",
                          activeTab === item.href ? "scale-x-100" : "scale-x-0"
                        )}
                      />
                    </button>
                  ))}
                </nav>
                <div className="mt-10 space-y-2">
                  <Button
                    variant="ghost"
                    className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-600/60 hover:to-purple-600/60 text-white transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md hover:shadow-lg"
                  >
                    SignIn
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
