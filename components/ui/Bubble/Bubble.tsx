"use client";
import React from "react";
import "./Bubble.css";

interface BubbleProps {
  /** Tamaño base responsivo por clases */
  size?: "sm" | "md" | "lg";
  /** Estado visual que controla las animaciones */
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
        {/* capas internas para efectos */}
        <div className="bubble-inner" />
        <div className="bubble-sparkles" aria-hidden="true" />
        <div className="bubble-ring" aria-hidden="true" />
      </div>
    </div>
  );
}
