"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Bot } from "lucide-react";

interface ChatBubbleProps {
  message: string;
  isUser: boolean;
  isFinal: boolean;
  timestamp?: number;
}

function formatTime(ts?: number): string {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function ChatBubble({ message, isUser, isFinal, timestamp }: ChatBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.15 }}
      className={cn("flex w-full gap-2", isUser ? "justify-end" : "justify-start")}
    >
      {/* Agent avatar */}
      {!isUser && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#3A3A3A] dark:bg-[#4A4A4A] mt-1">
          <Bot className="h-4 w-4 text-[#D1D5DB]" />
        </div>
      )}

      <div
        className={cn(
          "relative max-w-[78%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm",
          isUser
            ? "bg-[#3A3A3A] text-white rounded-br-sm"
            : "bg-white dark:bg-[#2f2f31] text-[#3A3A3A] dark:text-[#D1D5DB] rounded-bl-sm",
          !isFinal && "opacity-50"
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message}</p>
        {timestamp && (
          <span
            className={cn(
              "mt-1 block text-[0.6rem] text-right",
              isUser ? "text-white/50" : "text-gray-400 dark:text-gray-500"
            )}
          >
            {formatTime(timestamp)}
          </span>
        )}
      </div>
    </motion.div>
  );
}
