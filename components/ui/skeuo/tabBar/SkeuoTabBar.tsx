"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/app/context/SessionContext";
import { UserAvatar } from "@/components/Sidebar/_3/SidebarFooter/UserAvatar";
import "./TabBar.css";

export function SkeuoTabBar() {
  const { isAuthenticated } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const tabs = [
    { title: "Inicio", icon: "ri-home-smile-line", path: "/", glow: "indigo" },
    { title: "Demo", icon: "ri-mic-line", path: "/demo", glow: "pink" },
  ];

  return (
    <div className="menubar__navigation">
      <ul>
        {tabs.map((item) => {
          const isActive = pathname === item.path || (item.path !== "/" && pathname.startsWith(item.path + "/"));
          const glowClass = isActive ? `glow-${item.glow}` : "";

          return (
            <li
              key={item.path}
              className={isActive ? "menubar__list active" : "menubar__list"}
            >
              <Link href={item.path} className="menubar__item">
                <span className={`menubar__icon ${glowClass}`}>
                  <i className={item.icon}></i>
                </span>
                <span className={`menubar__text ${glowClass}`}>
                  {item.title}
                </span>
              </Link>
              <div className="back_indicator" />
            </li>
          );
        })}

        {/* Right tab: Avatar (authenticated) or Login (public) */}
        {isAuthenticated ? (() => {
          const isActive = pathname === "/dashboard" || pathname.startsWith("/dashboard/");
          return (
            <li className={isActive ? "menubar__list active" : "menubar__list"}>
              <Link href="/dashboard" className="menubar__item">
                <UserAvatar status="online" size="small" />
              </Link>
              <div className="back_indicator" />
            </li>
          );
        })() : (() => {
          const isActive = pathname === "/login";
          const glowClass = isActive ? "glow-indigo" : "";
          return (
            <li className={isActive ? "menubar__list active" : "menubar__list"}>
              <button onClick={() => router.push("/login")} className="menubar__item">
                <span className={`menubar__icon ${glowClass}`}>
                  <i className="ri-login-box-line"></i>
                </span>
                <span className={`menubar__text ${glowClass}`}>
                  Login
                </span>
              </button>
              <div className="back_indicator" />
            </li>
          );
        })()}
      </ul>
    </div>
  );
}
