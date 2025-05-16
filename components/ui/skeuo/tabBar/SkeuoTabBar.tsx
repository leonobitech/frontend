"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/app/context/SessionContext";
import items from "./menubar.json";
import { UserAvatar } from "@/components/Sidebar/_3/SidebarFooter/UserAvatar";
import "./TabBar.css";

export function SkeuoTabBar() {
  // ⚠️ Temporal: reemplazar con useSession() cuando la lógica esté conectada
  //const isAuthenticated = true;
  const { isAuthenticated } = useSession();
  // 📍 Obtener ruta actual para determinar qué ítem está activo
  const pathname = usePathname();

  // 👤 Path específico del avatar (actúa como reemplazo de 'Contact')
  const avatarPath = "/dashboard";

  // ✅ Verificamos si el avatar está en la ruta activa
  const isActive = pathname === avatarPath;

  return (
    <div className="menubar__navigation">
      <ul>
        {items &&
          items.map((item, index) => {
            // 👤 Reemplazamos el ítem "Contact" por un avatar si el usuario está autenticado
            if (isAuthenticated && item.title === "Contact") {
              return (
                <li
                  key="avatar"
                  className={
                    isActive ? "menubar__list active" : "menubar__list"
                  }
                >
                  <Link href={avatarPath} className="menubar__item">
                    {/* Avatar con estado y tamaño personalizados */}
                    <UserAvatar status="online" size="small" />
                  </Link>
                  <div
                    className={`back_indicator ${
                      isActive ? "active glow-purple" : ""
                    }`}
                  />
                </li>
              );
            }

            // 🔁 Renderizado estándar para ítems de navegación normales
            const itemIsActive = pathname === item.path;

            return (
              <li
                key={index}
                className={
                  itemIsActive ? "menubar__list active" : "menubar__list"
                }
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
                    className={
                      itemIsActive ? "menubar__text active" : "menubar__text"
                    }
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
