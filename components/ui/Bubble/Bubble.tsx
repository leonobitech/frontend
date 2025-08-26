"use client";
import React from "react";
import "./Bubble.css";

interface BubbleProps {
  size?: "sm" | "md" | "lg";
  status?: "open" | "connecting" | "closed";
  className?: string;
}

export function Bubble({
  size = "md",
  status = "closed",
  className = "",
}: BubbleProps) {
  return (
    <div className={`bubble-wrapper size-${size} ${className}`}>
      <div className={`bubble state-${status}`}>
        <div className="bubble-inner" />
        <div className="bubble-sparkles" aria-hidden="true" />
        <div className="bubble-ring" aria-hidden="true" />
      </div>
    </div>
  );
}
