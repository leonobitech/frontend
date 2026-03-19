"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ChatBubbleProps {
  message: string;
  isUser: boolean;
  isFinal: boolean;
}

export function ChatBubble({ message, isUser, isFinal }: ChatBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-[#3A3A3A] text-white"
            : "bg-gray-100 text-[#3A3A3A] dark:bg-white/10 dark:text-[#D1D5DB]",
          !isFinal && "opacity-60"
        )}
      >
        {message}
      </div>
    </motion.div>
  );
}
