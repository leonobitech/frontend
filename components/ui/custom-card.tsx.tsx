"use client";

import type React from "react";

import { forwardRef } from "react";
import { Card, type CardProps } from "@/components/ui/card";
import { motion } from "framer-motion";

interface CustomCardProps extends CardProps {
  children: React.ReactNode;
}

const CustomCard = forwardRef<HTMLDivElement, CustomCardProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <Card
        ref={ref}
        className={`relative rounded-2xl border-hidden ${className}`}
        {...props}
      >
        {/* Animated gradient border */}
        <div className="absolute -inset-0.5 dark:bg-gradient-to-r dark:from-purple-950/50 dark:to-black rounded-2xl opacity-75 group-hover:opacity-100 transition duration-300 blur-md animate-gradient-xy"></div>

        {/* Glow effect */}
        {/* <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-xl blur-2xl opacity-50 group-hover:opacity-75 transition duration-300"></div>
         */}

        {/* Content */}
        <div className="relative z-10 rounded-2xl bg-gradient-to-b from-blue-800 to-black dark:bg-gradient-to-b dark:from-blue-950/50 dark:to-black h-full">
          {children}
        </div>
      </Card>
    );
  }
);

CustomCard.displayName = "CustomCard";

export const MotionCustomCard = motion.create(CustomCard);

export default CustomCard;
