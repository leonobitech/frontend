// components/ui/skeuo/tabBar/SkeuoTabBar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import items from "./menubar.json";
import "./TabBar.css";

export function SkeuoTabBar() {
  const pathname = usePathname();

  return (
    <div className="menubar__navigation">
      <ul>
        {items &&
          items.map((item, index) => (
            <li
              key={index}
              className={
                pathname === item.path
                  ? "menubar__list active"
                  : "menubar__list"
              }
            >
              <Link href={item.path || "#"} className="menubar__item">
                <span
                  className={`menubar__icon ${
                    pathname === item.path ? `glow-${item.glow}` : ""
                  }`}
                >
                  {item.icon && <i className={item.icon}></i>}
                </span>
                <span
                  className={
                    pathname === item.path
                      ? "menubar__text active"
                      : "menubar__text"
                  }
                >
                  {item.title}
                </span>
              </Link>

              <div
                className={`back_indicator ${
                  pathname === item.path ? `active glow-${item.glow}` : ""
                }`}
              />
            </li>
          ))}
      </ul>
    </div>
  );
}
