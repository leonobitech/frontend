import React from "react";
import {
  SidebarContent as ShadcnSidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { OdooMcpConnector } from "./OdooMcpConnector";
import { BookOpen, GraduationCap, PlayCircle } from "lucide-react";
import { useSession } from "@/app/context/SessionContext";

// ---------------------------------------------------------------------------
// SimpleLink — for items without dropdown
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
            ? "bg-white/15 text-white"
            : "hover:bg-white/10"
        )}
        isActive={isActive}
      >
        <Link href={href} prefetch={false} className="flex items-center gap-2">
          <div
            className={cn(
              "h-4 w-4 transition-transform duration-200 text-gray-400",
              isActive && "text-white"
            )}
          >
            {icon}
          </div>
          <span
            className={cn(
              "font-medium text-gray-300",
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
// SidebarContent — main export
// ---------------------------------------------------------------------------
export const SidebarContent: React.FC = () => {
  const { user } = useSession();
  const isAdmin = user?.role === "admin";

  return (
    <ShadcnSidebarContent className="p-4 relative bg-[#2B2B2B] overflow-hidden">
      <div className="relative z-10">
        <OdooMcpConnector />

        <div className="my-3 border-t border-white/10" />

        <SidebarMenu>
          <SimpleLink
            title="Blog"
            href="/blog"
            icon={<BookOpen className="h-4 w-4" />}
          />
          <SimpleLink
            title="Cursos"
            href="/courses"
            icon={<GraduationCap className="h-4 w-4" />}
          />
          <SimpleLink
            title="Mis Cursos"
            href="/learn"
            icon={<PlayCircle className="h-4 w-4" />}
          />
          {isAdmin && (
            <SimpleLink
              title="LMS Admin"
              href="/admin/lms"
              icon={<GraduationCap className="h-4 w-4" />}
            />
          )}
        </SidebarMenu>
      </div>
    </ShadcnSidebarContent>
  );
};
