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
    { title: "Inicio", icon: "ri-home-smile-line", path: "/" },
    { title: "Demo", icon: "ri-mic-line", path: "/demo" },
  ];

  const isLoginActive = pathname === "/login";
  const isDashboardActive = pathname === "/dashboard" || pathname.startsWith("/dashboard/");

  return (
    <div className="menubar__navigation">
      <ul>
        {tabs.map((item) => {
          const isActive = pathname === item.path || (item.path !== "/" && pathname.startsWith(item.path + "/"));

          return (
            <li
              key={item.path}
              className={isActive ? "menubar__list active" : "menubar__list"}
            >
              <Link href={item.path} className="menubar__item">
                <span className="menubar__icon">
                  <i className={item.icon}></i>
                </span>
                <span className="menubar__text">{item.title}</span>
              </Link>
              <div className="back_indicator" />
            </li>
          );
        })}

        {isAuthenticated ? (
          <li className={isDashboardActive ? "menubar__list active" : "menubar__list"}>
            <Link href="/dashboard" className="menubar__item">
              <span className="menubar__avatar">
                <UserAvatar status="online" size="small" />
              </span>
            </Link>
            <div className="back_indicator" />
          </li>
        ) : (
          <li className={isLoginActive ? "menubar__list active" : "menubar__list"}>
            <button onClick={() => router.push("/login")} className="menubar__item">
              <span className="menubar__icon">
                <i className="ri-login-box-line"></i>
              </span>
              <span className="menubar__text">Login</span>
            </button>
            <div className="back_indicator" />
          </li>
        )}
      </ul>
    </div>
  );
}
