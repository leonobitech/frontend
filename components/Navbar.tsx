// components/Navbar.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LogoutButton } from "@/components/LogoutButton";
import { useSession } from "@/app/context/SessionContext";
import { cn } from "@/lib/utils";
import {
  Home,
  Code,
  Mic,
} from "lucide-react";

interface NavbarProps {
  showLogo?: boolean;
}

export default function Navbar({ showLogo = true }: NavbarProps) {
  const { isAuthenticated } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState(pathname);

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

  const navItems = useMemo(() => {
    const items = [
      { name: "Home", href: "/", icon: Home },
      { name: "Demo", href: "/demo", icon: Mic },
    ];
    if (isAuthenticated) {
      items.splice(2, 0, { name: "Dashboard", href: "/dashboard", icon: Code });
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
          ? "bg-background/60 shadow-sm backdrop-blur-xl backdrop-saturate-150"
          : "bg-transparent"
      )}
    >
      {/* Wrapper centrado y con ancho máximo moderado */}
      <div className="relative w-full max-w-none px-4 sm:px-6 lg:px-8">
        {/* Grid: [auto | 1fr | auto] → centro elástico y realmente centrado */}
        <div className="flex items-center justify-between h-14 w-full">
          {/* IZQUIERDA: logo */}
          <div className="flex items-center justify-start">
            <Link
              href="/"
              className="flex items-center mr-3"
              onClick={() => handleNavClick("/")}
            >
              {showLogo && (
                <>
                  <div className="relative w-8 h-8 sm:w-9 sm:h-9">
                    <Image
                      src="/icon_512x512.png"
                      alt="Leonobitech"
                      fill
                      sizes="48px"
                      className="object-contain"
                      priority
                    />
                  </div>
                  <span className="ml-2 text-3xl font-extrabold tracking-tight text-[#3A3A3A] dark:text-[#D1D5DB]">
                    Leonobitech
                  </span>
                </>
              )}
            </Link>
          </div>

          {/* CENTRO: nav centrado (min-w-0 evita empujes por overflow) */}
          {/* CENTRO: nav centrado geométrico */}
          <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 space-x-6">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavClick(item.href)}
                className={cn(
                  "px-3 py-2 text-sm font-medium relative transition-colors duration-200",
                  isActive(item.href)
                    ? "text-[#3A3A3A] dark:text-[#D1D5DB] drop-shadow-[0_0_8px_rgba(0,0,0,0.15)] dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.15)]"
                    : "text-gray-400 dark:text-gray-500 hover:text-[#3A3A3A] dark:hover:text-[#D1D5DB] hover:drop-shadow-[0_0_8px_rgba(0,0,0,0.15)] dark:hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.15)]"
                )}
                aria-current={isActive(item.href) ? "page" : undefined}
              >
                {item.name}
              </button>
            ))}
          </nav>

          {/* DERECHA: controles a la derecha */}
          <div className="flex items-center justify-end space-x-4">
            <ThemeToggle />
            <div className="hidden sm:flex space-x-2">
              {isAuthenticated ? (
                <LogoutButton />
              ) : (
                <Button
                  size="sm"
                  onClick={() => router.push("/login")}
                  className="rounded-lg bg-[#3A3A3A] dark:bg-[#D1D5DB] text-white dark:text-[#3A3A3A] transition-all duration-300 ease-in-out shadow-md hover:shadow-lg hover:shadow-black/20 dark:hover:shadow-white/15"
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
