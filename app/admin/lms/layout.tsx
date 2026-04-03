"use client";

import { useSession } from "@/app/context/SessionContext";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BookOpen, GraduationCap, Users, Plus, Trophy } from "lucide-react";

const navItems = [
  { href: "/admin/lms", label: "Dashboard", icon: BookOpen },
  { href: "/admin/lms/courses/new", label: "Nuevo Curso", icon: Plus },
  { href: "/admin/lms/students", label: "Estudiantes", icon: Users },
  { href: "/admin/lms/graduates", label: "Graduados", icon: Trophy },
];

export default function LmsAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, isAuthenticated } = useSession();
  const pathname = usePathname();

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl min-h-screen">
        <Skeleton className="h-10 w-48 mb-6" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <GraduationCap className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Acceso Denegado</h2>
        <p className="text-muted-foreground">
          Solo administradores pueden acceder al panel LMS.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl min-h-screen">
      <div className="flex items-center gap-3 mb-6">
        <GraduationCap className="h-8 w-8" />
        <h1 className="text-3xl font-bold tracking-tight">LMS Admin</h1>
      </div>

      <nav className="flex gap-1 mb-8 border-b border-border pb-2 overflow-x-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin/lms" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {children}
    </div>
  );
}
