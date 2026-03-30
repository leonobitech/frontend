// components/ui/skeuo/drawer/SkeuoDrawerViewMain/ContentDrawer/ContentDrawer.tsx
"use client";

import { useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import sections from "./sections.json";
import { DrawerActionBlock } from "./DrawerActionBlock";
import { DrawerSettingsBlock } from "./DrawerSettingsBlock";

type ContentDrawerProps = {
  onClose?: () => void;
};

export function ContentDrawer({ onClose }: ContentDrawerProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "profile";

  const [openSection, setOpenSection] = useState<string | null>(null);
  // Secciones con ítems dinámicos
  const sectionDataMap: Record<
    string,
    { items: { id: string; title: string }[] }
  > = {
    notifications: { items: [] },
    settings: { items: [] },
  };

  // Links internos (tabs) de /settings, incluyendo Security como tab
  const settingsLinks = useMemo(
    () => [
      { id: "profile", title: "Perfil", href: "/settings?tab=profile" },
      { id: "sessions", title: "Sesiones", href: "/settings?tab=sessions" },
      { id: "passkeys", title: "Passkeys", href: "/settings?tab=passkeys" },
      { id: "security", title: "Seguridad", href: "/settings?tab=security" },
    ],
    []
  );

  return (
    <div className="content-drawer-clean px-2 py-4 text-sm">
      {/* Blog link */}
      <div className="mb-4">
        <div className="my-1 h-0.5 rounded bg-linear-to-r from-blue-500 to-blue-500 dark:from-pink-600 dark:to-purple-600" />
        <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide my-2 pl-4">
          Learn
        </h2>
        <Link
          href="/blog"
          onClick={onClose}
          className={`flex items-center w-full px-4 py-2 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 transition ${
            pathname.startsWith("/blog")
              ? "font-semibold text-black dark:text-[#D1D5DB]"
              : "text-gray-700 dark:text-gray-300"
          }`}
        >
          <BookOpen className="mr-2 h-4 w-4 text-gray-500" />
          Blog
        </Link>
      </div>

      {sections.map((group) => (
        <div key={group.group} className="mb-6">
          <div className="my-1 h-0.5 rounded bg-linear-to-r from-blue-500 to-blue-500 dark:from-pink-600 dark:to-purple-600" />
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide my-2 pl-4">
            {group.group}
          </h2>

          {group.sections.map((section) => {
            const isOpen = openSection === section.id;
            const data = sectionDataMap[section.id] || { items: [] };
            const isSettings = section.id === "settings";

            const shouldRenderList =
              isSettings || data.items.length > 0 || !!section.hrefPrefix;

            return (
              <div key={section.id} className="mb-1">
                <button
                  className="flex items-center w-full px-4 py-2 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
                  onClick={() =>
                    setOpenSection((prev) =>
                      prev === section.id ? null : section.id
                    )
                  }
                >
                  <i className={`ri-md ${section.icon} mr-2 text-gray-500`} />
                  {section.label}
                  <span className="ml-auto text-base text-gray-400">
                    {isOpen ? "▾" : "▸"}
                  </span>
                </button>

                {isOpen && (
                  <>
                    {shouldRenderList ? (
                      <ul className="pl-8 mt-1 space-y-1">
                        {isSettings
                          ? settingsLinks.map((lnk) => (
                              <li key={lnk.id}>
                                <Link
                                  href={lnk.href}
                                  onClick={onClose}
                                  className={`block px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 transition ${
                                    pathname.startsWith("/settings") &&
                                    currentTab === lnk.id
                                      ? "font-semibold text-black dark:text-white"
                                      : "text-gray-700 dark:text-gray-300"
                                  }`}
                                >
                                  {lnk.title}
                                </Link>
                              </li>
                            ))
                          : data.items.length > 0
                          ? data.items.map((item) => (
                              <li key={item.id}>
                                <Link
                                  href={`${section.hrefPrefix}${item.id}`}
                                  onClick={onClose}
                                  className={`block px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 transition ${
                                    pathname.includes(item.id)
                                      ? "font-semibold text-black dark:text-white"
                                      : "text-gray-700 dark:text-gray-300"
                                  }`}
                                >
                                  {item.title}
                                </Link>
                              </li>
                            ))
                          : section.hrefPrefix && (
                              <li>
                                <Link
                                  href={section.hrefPrefix}
                                  onClick={onClose}
                                  className={`block px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 transition ${
                                    pathname.startsWith(section.hrefPrefix)
                                      ? "font-semibold text-black dark:text-white"
                                      : "text-gray-700 dark:text-gray-300"
                                  }`}
                                >
                                  Abrir {section.label}
                                </Link>
                              </li>
                            )}
                      </ul>
                    ) : (
                      <div className="pl-8 mt-1 text-xs text-gray-400 italic px-4 py-2">
                        Aún no tienes contenido.
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      ))}

      {/* ✨ Otros Componentes */}
      <DrawerSettingsBlock />
      <DrawerActionBlock onClose={onClose} />
    </div>
  );
}
