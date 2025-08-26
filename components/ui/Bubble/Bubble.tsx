// components/ui/Bubble/Bubble.tsx
"use client";
import React from "react";
import "./Bubble.css";

interface BubbleProps {
  size?: "sm" | "md" | "lg";
  status?: "open" | "connecting" | "closed";
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}

export function Bubble({
  size = "md",
  status = "closed",
  onClick,
  disabled = false,
  className = "",
  ariaLabel,
}: BubbleProps) {
  const interactive = Boolean(onClick) && !disabled;
  const wrapper = `bubble-wrapper size-${size} ${className}`;
  const stateClass = `state-${status}`;

  if (interactive) {
    return (
      <button
        type="button"
        className={`${wrapper} bubble-button is-clickable`}
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel ?? (status === "open" ? "Disconnect" : "Connect")}
      >
        <div className={`bubble ${stateClass}`}>
          <div className="bubble-inner" />
          <div className="bubble-sparkles" aria-hidden="true" />
          <div className="bubble-ring" aria-hidden="true" />
        </div>
      </button>
    );
  }

  return (
    <div className={wrapper} aria-hidden="true">
      <div className={`bubble ${stateClass}`}>
        <div className="bubble-inner" />
        <div className="bubble-sparkles" aria-hidden="true" />
        <div className="bubble-ring" aria-hidden="true" />
      </div>
    </div>
  );
}
