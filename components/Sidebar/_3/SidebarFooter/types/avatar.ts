// File: avatar.ts

// Import the UserStatus type from a separate types file
import { UserStatus } from "./types";

// Define a union type for avatar sizes
export type AvatarSize = "small" | "large";

// Interface defining the props for the Avatar component
export interface AvatarProps {
  status: UserStatus; // The user's status (required)
  size?: AvatarSize; // The avatar size (optional, with a default value)
  className?: string; // Additional CSS classes (optional)
}

// Interface defining the style properties for different avatar sizes
export interface AvatarStyleProps {
  containerSize: string; // Tailwind classes for container dimensions
  innerPadding: string; // Tailwind classes for inner padding
  imageSize: number; // Size of the avatar image in pixels
  statusIndicatorSize: "small" | "large"; // Size of the status indicator
  statusIndicatorPosition: string; // Tailwind classes for indicator positioning
  statusIndicatorBorder: string; // Tailwind classes for indicator border
}

// Object containing style configurations for different avatar sizes
export const avatarStyles: Record<AvatarSize, AvatarStyleProps> = {
  small: {
    containerSize: "h-10 w-10",
    innerPadding: "inset-[2px]",
    imageSize: 32,
    statusIndicatorSize: "small",
    statusIndicatorPosition: "bottom-0.5 right-0.5",
    statusIndicatorBorder: "border-2",
  },
  large: {
    containerSize: "h-16 w-16",
    innerPadding: "inset-[4px]",
    imageSize: 48,
    statusIndicatorSize: "large",
    statusIndicatorPosition: "bottom-1 right-1",
    statusIndicatorBorder: "border-4",
  },
};

// Default avatar size
export const defaultAvatarSize: AvatarSize = "small";
