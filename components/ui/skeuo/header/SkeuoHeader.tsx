// components/ui/skeuo/header/SkeuoHeader.tsx
"use client";

import { ReactNode } from "react";
import { useScrolled } from "@/hooks/useScrollHeader";
import "./SkeuoHeader.css";

type Props = {
  title?: string;
  rightSlot?: ReactNode;
  fixed?: boolean;
  scrollEffect?: boolean;
  className?: string;
};

export function SkeuoHeader({
  title = "",
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
      <span className="skeuo-header-title">{title}</span>
      {rightSlot && <div className="skeuo-header-slot">{rightSlot}</div>}
    </header>
  );
}
