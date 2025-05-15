// components/ui/skeuo/header/SkeuoHeader.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ReactNode } from "react";
import { useScrolled } from "@/hooks/useScrollHeader";
import "./SkeuoHeader.css";

type Props = {
  rightSlot?: ReactNode;
  fixed?: boolean;
  scrollEffect?: boolean;
  className?: string;
};

export function SkeuoHeader({
  rightSlot,
  fixed = true,
  scrollEffect = true,
  className = "",
}: Props) {
  const isScrolled = useScrolled(8);

  return (
    <header
      className={`skeuo-header ${
        scrollEffect && isScrolled ? "glass" : "solid"
      } ${fixed ? "fixed" : ""} ${className}`.trim()}
    >
      {/* Brand: Logo + Nombre */}
      <Link href="/" className="flex items-center gap-3 group">
        <div className="relative w-10 h-10 transition-transform group-hover:scale-105">
          <Image
            src="/icon.png"
            alt="icon"
            fill
            sizes="40px"
            className="object-contain"
            priority
          />
        </div>
        <span className="font-extrabold text-3xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-pink-600 dark:from-pink-600 dark:to-purple-600 transition-all duration-300">
          Leonobitech
        </span>
      </Link>

      {/* Botón derecho (ThemeToggle u otro) */}
      <div className="flex items-center space-x-4">
        <ThemeToggle />
        {rightSlot}
      </div>
    </header>
  );
}
