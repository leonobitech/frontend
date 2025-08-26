// components/Navbar.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LogoutButton } from "@/components/LogoutButton";
import { useSession } from "@/app/context/SessionContext";
import { cn } from "@/lib/utils";
import { Home, BookOpen, Mail, Headphones, PenTool, Code } from "lucide-react";

interface NavbarProps {
  showLogo?: boolean;
}

export default function Navbar({ showLogo = true }: NavbarProps) {
  const { isAuthenticated } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const { theme, resolvedTheme } = useTheme();

  const [isOpen, setIsOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState(pathname);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && isOpen) setIsOpen(false);
    };
    const handleScroll = () => setHasScrolled(window.scrollY > 10);

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isOpen]);

  useEffect(() => setActiveTab(pathname), [pathname]);

  const handleNavClick = (href: string) => {
    setActiveTab(href);
    router.push(href);
  };

  const logoSrc =
    mounted && (theme === "dark" || resolvedTheme === "dark")
      ? "/logo_mobile.png"
      : "/logo_navbar_mobile.png";

  const navItems = useMemo(() => {
    const items = [
      { name: "Home", href: "/", icon: Home },
      { name: "Courses", href: "/courses", icon: BookOpen },
      { name: "Podcasts", href: "/podcasts", icon: Headphones },
      { name: "Projects", href: "/projects", icon: Code },
      { name: "Blog", href: "/blog", icon: PenTool },
      { name: "Contact", href: "/contact", icon: Mail },
    ];
    if (isAuthenticated) {
      items.splice(1, 0, { name: "Dashboard", href: "/dashboard", icon: Code });
      items.splice(2, 0, { name: "Leonobit", href: "/leonobit", icon: Code });
    }
    return items;
  }, [isAuthenticated]);

  const isActive = (href: string) =>
    activeTab === href || activeTab.startsWith(href + "/");

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        hasScrolled
          ? "bg-white/40 dark:bg-gray-900/40 shadow-lg backdrop-blur-xl backdrop-saturate-150"
          : "bg-transparent"
      )}
    >
      {/* Wrapper centrado y con ancho máximo */}
      <div className="mx-auto max-w-7xl px-4">
        {/* GRID de 3 columnas: izq/logo, centro/nav, der/controles */}
        <div className="grid grid-cols-3 items-center h-14">
          {/* Columna IZQUIERDA: logo */}
          <div className="flex items-center">
            <Link
              href="/"
              className="flex items-center mr-3"
              onClick={() => handleNavClick("/")}
            >
              {showLogo && (
                <>
                  <div className="relative w-10 h-10 sm:w-12 sm:h-12">
                    <Image
                      src="/icon.png"
                      alt="icon"
                      fill
                      sizes="48px"
                      className="object-contain"
                      priority
                    />
                  </div>
                  <div className="relative w-40 h-10 sm:w-48 sm:h-12">
                    <Image
                      src={logoSrc}
                      alt="Leonobitech"
                      fill
                      sizes="192px"
                      className="object-contain"
                      priority
                    />
                  </div>
                </>
              )}
            </Link>
          </div>

          {/* Columna CENTRO: nav centrado */}
          <nav className="hidden md:flex justify-center items-center space-x-6">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavClick(item.href)}
                className={cn(
                  "px-3 py-2 text-sm font-medium transition-all duration-200 ease-in-out relative",
                  "text-gray-700 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white",
                  "hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-md",
                  isActive(item.href) ? "text-blue-700 dark:text-white" : ""
                )}
                aria-current={isActive(item.href) ? "page" : undefined}
              >
                {item.name}
                <span
                  className={cn(
                    "pointer-events-none absolute -bottom-0.5 left-0 w-full h-0.5",
                    "bg-gradient-to-r from-blue-500 to-purple-500 dark:from-blue-500 dark:to-pink-500",
                    "transform origin-left transition-transform duration-300 ease-out",
                    isActive(item.href) ? "scale-x-100" : "scale-x-0"
                  )}
                />
              </button>
            ))}
          </nav>

          {/* Columna DERECHA: controles alineados a la derecha */}
          <div className="flex items-center justify-end space-x-4">
            <ThemeToggle />
            <div className="hidden sm:flex space-x-2">
              {isAuthenticated ? (
                <LogoutButton />
              ) : (
                <Button
                  size="sm"
                  onClick={() => router.push("/login")}
                  className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-600 hover:to-purple-600 text-white transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md hover:shadow-lg"
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
