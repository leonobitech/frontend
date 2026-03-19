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
          const isActive = pathname === item.path || pathname.startsWith(item.path + "/");

          return (
            <li
              key={item.path}
              className={isActive ? "menubar__list active" : "menubar__list"}
            >
              <Link href={item.path} className="menubar__item">
                <span
                  className={`menubar__icon ${isActive ? `glow-${item.glow}` : ""}`}
                >
                  <i className={item.icon}></i>
                </span>
                <span className={isActive ? "menubar__text active" : "menubar__text"}>
                  {item.title}
                </span>
              </Link>
              <div
                className={`back_indicator ${isActive ? `active glow-${item.glow}` : ""}`}
              />
            </li>
          );
        })}

        {/* Right tab: Avatar (authenticated) or Login (public) */}
        {isAuthenticated ? (
          <li
            className={
              pathname === "/dashboard" || pathname.startsWith("/dashboard/")
                ? "menubar__list active"
                : "menubar__list"
            }
          >
            <Link href="/dashboard" className="menubar__item">
              <UserAvatar status="online" size="small" />
            </Link>
            <div
              className={`back_indicator ${
                pathname === "/dashboard" || pathname.startsWith("/dashboard/")
                  ? "active glow-indigo"
                  : ""
              }`}
            />
          </li>
        ) : (
          <li
            className={
              pathname === "/login" ? "menubar__list active" : "menubar__list"
            }
          >
            <button
              onClick={() => router.push("/login")}
              className="menubar__item"
            >
              <span
                className={`menubar__icon ${pathname === "/login" ? "glow-indigo" : ""}`}
              >
                <i className="ri-login-box-line"></i>
              </span>
              <span
                className={pathname === "/login" ? "menubar__text active" : "menubar__text"}
              >
                Login
              </span>
            </button>
            <div
              className={`back_indicator ${pathname === "/login" ? "active glow-indigo" : ""}`}
            />
          </li>
        )}
      </ul>
    </div>
  );
}
