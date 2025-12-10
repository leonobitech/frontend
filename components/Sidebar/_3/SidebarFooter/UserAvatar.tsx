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
import { useSession } from "@/app/context/SessionContext";

export const UserAvatar = React.memo(function UserAvatar({
  status,
  size = defaultAvatarSize,
  className,
}: AvatarProps) {
  const { user } = useSession();

  // Validamos el size
  const validSize: AvatarSize = avatarStyles.hasOwnProperty(size)
    ? size
    : defaultAvatarSize;
  const styles = avatarStyles[validSize];

  // Usar avatar del usuario si existe, sino usar placeholder
  // Si es el default (termina en /avatar.png), usar path local para evitar problemas con Next Image
  const rawAvatar = user?.avatar || "/avatar.png";
  const avatarSrc = rawAvatar.endsWith("/avatar.png") ? "/avatar.png" : rawAvatar;

  return (
    <div className={cn("relative", styles.containerSize, className)}>
      {/* 1) Gradient animado de fondo */}
      <div className="absolute inset-0 rounded-full animate-rotate-gradient">
        <div className="absolute inset-0 rounded-full bg-linear-to-r from-pink-500 via-red-500 to-yellow-500" />
      </div>

      {/* 2) Contenedor blanco + padding para border “interior” */}
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center rounded-full",
          styles.innerPadding
        )}
      >
        {/* 3) Wrapper puro para la imagen, con posición y overflow */}
        <div className="relative w-full h-full rounded-full overflow-hidden">
          <Image
            src={avatarSrc}
            alt="User avatar"
            fill
            sizes={`${styles.imageSize}px`}
            className="object-cover"
            priority
          />
        </div>
      </div>

      {/* 4) Indicador de estado */}
      <StatusIndicator
        status={status}
        size={styles.statusIndicatorSize}
        className={cn(
          "absolute border-white dark:border-gray-800",
          styles.statusIndicatorPosition,
          styles.statusIndicatorBorder
        )}
      />
    </div>
  );
});

UserAvatar.displayName = "UserAvatar";
