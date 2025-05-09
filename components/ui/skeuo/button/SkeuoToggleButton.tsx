// components/ui/skeuo/button/SkeuoToggleButton.tsx
"use client";

import { ReactNode, KeyboardEvent } from "react";
import clsx from "clsx";
import "./SkeuoToggleButton.css";

type Props = {
  isOpen?: boolean;
  onToggle?: () => void;
  size?: "sm" | "md";
  className?: string;
  iconOpen?: ReactNode;
  iconClosed?: ReactNode;
  title?: string;
};

export function SkeuoToggleButton({
  isOpen = false,
  onToggle,
  size = "md",
  className = "",
  iconOpen = <span className="skeuo-toggle-icon">×</span>,
  iconClosed = <span className="skeuo-toggle-icon">|||</span>,
  title = "Abrir menú",
}: Props) {
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onToggle?.();
    }
  };

  return (
    <div
      onClick={onToggle}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={title}
      title={title}
      className={clsx(
        "skeuo-toggle-wrapper",
        isOpen && "open",
        size === "sm" ? "skeuo-sm" : "skeuo-md",
        className
      )}
    >
      <div className="skeuo-toggle-button">
        <div className="skeuo-toggle-thumb">
          {isOpen ? iconOpen : iconClosed}
        </div>
      </div>
    </div>
  );
}
