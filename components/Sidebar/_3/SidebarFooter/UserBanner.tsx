import React from "react";
import Image from "next/image";
import { Edit2 } from "lucide-react";

export function UserBanner() {
  return (
    <div className="relative">
      <div className="relative h-24 w-full rounded-t-lg overflow-hidden bg-linear-to-r from-blue-400 to-blue-600 dark:from-pink-400 dark:to-pink-600">
        <Image
          src="/banner.png"
          alt="User banner"
          fill
          sizes="(max-width: 768px) 100vw, 100%"
          className="object-cover"
          priority
        />
        <button
          className="absolute top-1.5 right-1.5 p-1 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors"
          aria-label="Edit banner"
        >
          <Edit2 className="h-3.5 w-3.5" />
        </button>
      </div>
      {/* Add UserAvatar here */}
    </div>
  );
}
