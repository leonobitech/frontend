"use client";
import React from "react";
import styles from "./Bubble.module.css";

interface BubbleProps {
  /** Tamaño base de la burbuja (en px, usamos clases para variantes) */
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Bubble({ size = "md", className = "" }: BubbleProps) {
  return (
    <div
      className={`${styles["bubble-wrapper"]} ${
        styles[`size-${size}`]
      } ${className}`}
    >
      <div className={styles.bubble}>
        <div className={styles["bubble-inner"]} />
      </div>
    </div>
  );
}
