"use client";

import * as React from "react";
import { forwardRef } from "react";
import { Card, type CardProps } from "@/components/ui/card";
import { motion } from "framer-motion";

interface CustomCardProps extends CardProps {
  children: React.ReactNode;
}

/**
 * Card base con:
 * - capas decorativas seguras (pointer-events-none, z-index ordenado)
 * - sin inline styles
 * - layout sólido para alturas consistentes (flex-col + h-full)
 * - preparado para Framer Motion (motion wrapper)
 */
const CustomCard = forwardRef<HTMLDivElement, CustomCardProps>(
  ({ children, className = "", ...props }, ref) => {
    return (
      <Card
        ref={ref}
        // group para hovers suaves, isolate crea un stacking context propio
        className={[
          "group relative isolate overflow-hidden rounded-2xl border-none",
          // layout consistente: que la tarjeta pueda estirarse en la grid
          "flex h-full flex-col",
          className,
        ].join(" ")}
        {...props}
      >
        {/* Borde/halo animado (no bloquea interacciones) */}
        <div
          className={[
            "pointer-events-none absolute inset-0 -z-10 rounded-[inherit]",
            "dark:bg-gradient-to-r dark:from-purple-950/50 dark:to-black",
            "opacity-70 group-hover:opacity-100 transition-opacity duration-300",
            "blur-md animate-gradient-xy",
          ].join(" ")}
        />

        {/* Fondo gradiente del card (capa segura bajo el contenido) */}
        <div
          className={[
            "pointer-events-none absolute inset-0 -z-10 rounded-[inherit]",
            "bg-gradient-to-b from-blue-900/50 to-black/70",
            "dark:from-blue-950/40 dark:to-black",
          ].join(" ")}
        />

        {/* Contenido */}
        <div className="relative z-10 flex h-full flex-col rounded-[inherit]">
          {children}
        </div>
      </Card>
    );
  }
);

CustomCard.displayName = "CustomCard";

export const MotionCustomCard = motion(CustomCard);

export default CustomCard;
