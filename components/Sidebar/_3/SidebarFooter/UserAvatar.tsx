import React from "react";
import Image from "next/image";
import { StatusIndicator } from "./StatusIndicator";
import {
  AvatarProps,
  avatarStyles,
  AvatarSize,
  defaultAvatarSize,
} from "./types/avatar";
import { cn } from "@/lib/utils";

// UserAvatar component definition using React.memo for performance optimization
export const UserAvatar = React.memo(function UserAvatar({
  status,
  size = defaultAvatarSize,
  className,
}: AvatarProps) {
  // Ensure the provided size is valid, fallback to default if not
  const validSize: AvatarSize = avatarStyles.hasOwnProperty(size)
    ? size
    : defaultAvatarSize;
  const styles = avatarStyles[validSize];

  return (
    <div className={cn("relative", styles.containerSize, className)}>
      {/* Animated gradient background */}
      <div className="absolute inset-0 rounded-full animate-rotate-gradient">
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500" />
      </div>
      {/* Avatar image container */}
      <div
        className={cn(
          "absolute bg-white dark:bg-gray-800 rounded-full flex items-center justify-center",
          styles.innerPadding,
          className
        )}
      >
        {/* Avatar image */}
        <Image
          src="/avatar.png"
          alt="User avatar"
          width={styles.imageSize}
          height={styles.imageSize}
          className="rounded-full object-cover"
        />
      </div>
      {/* Status indicator */}
      <StatusIndicator
        status={status}
        size={styles.statusIndicatorSize}
        className={cn(
          "absolute border-white dark:border-gray-800",
          styles.statusIndicatorPosition,
          styles.statusIndicatorBorder,
          className
        )}
      />
    </div>
  );
});

// Set display name for debugging purposes
UserAvatar.displayName = "UserAvatar";
