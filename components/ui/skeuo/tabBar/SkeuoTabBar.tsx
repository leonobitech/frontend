"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/app/context/SessionContext";
import items from "./menubar.json";
import { UserAvatar } from "@/components/Sidebar/_3/SidebarFooter/UserAvatar";
import "./TabBar.css";

export function SkeuoTabBar() {
  const { isAuthenticated } = useSession();
  const pathname = usePathname();

  return (
    <div className="menubar__navigation">
      <ul>
        {items.map((item, index) => {
          const itemIsActive = pathname === item.path || pathname.startsWith(item.path + "/");

          // Dashboard item: show avatar instead of icon
          if (item.title === "Dashboard" && isAuthenticated) {
            return (
              <li
                key="avatar"
                className={itemIsActive ? "menubar__list active" : "menubar__list"}
              >
                <Link href={item.path} className="menubar__item">
                  <UserAvatar status="online" size="small" />
                </Link>
                <div
                  className={`back_indicator ${
                    itemIsActive ? "active glow-indigo" : ""
                  }`}
                />
              </li>
            );
          }

          return (
            <li
              key={index}
              className={itemIsActive ? "menubar__list active" : "menubar__list"}
            >
              <Link href={item.path || "#"} className="menubar__item">
                <span
                  className={`menubar__icon ${
                    itemIsActive ? `glow-${item.glow}` : ""
                  }`}
                >
                  {item.icon && <i className={item.icon}></i>}
                </span>
                <span
                  className={itemIsActive ? "menubar__text active" : "menubar__text"}
                >
                  {item.title}
                </span>
              </Link>
              <div
                className={`back_indicator ${
                  itemIsActive ? `active glow-${item.glow}` : ""
                }`}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
