import React from "react";
import { DropdownMenuContent as ShadcnDropdownMenuContent } from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import { UserBanner } from "./UserBanner";
import { UserProfile } from "./UserProfile";
import { MenuOptions } from "./MenuOptions";
import { UserAvatar } from "./UserAvatar";
import { UserSocialMedia } from "./UserSocialMedia";
import { useSidebarFooter } from "./SidebarFooterContext";
import { useDropdownAnimation } from "./hooks/useDropdownAnimation";
import { AvatarRefProps } from "./UserDropdown";

/**
 * DropdownMenuContentProps extends AvatarSmallRefProps to include the avatarSmallRef.
 *
 * AvatarSmallRefProps is imported from UserDropdown.tsx and contains:
 * {
 *   avatarSmallRef: RefObject<HTMLDivElement>;
 * }
 *
 * This approach allows us to maintain type consistency across components
 * and clearly shows that avatarSmallRef originates from the UserDropdown component.
 *
 * The 'state' prop is added here to handle the sidebar's expanded/collapsed state.
 */
interface DropdownMenuContentProps extends AvatarRefProps {
  state: "expanded" | "collapsed";
  onPointerEnterMenu?: () => void;
  onPointerLeaveMenu?: () => void;
}

export function DropdownMenuContent({
  state,
  avatarRef,
  onPointerEnterMenu,
  onPointerLeaveMenu,
}: DropdownMenuContentProps) {
  const { isOpen, userStatus } = useSidebarFooter();

  // Use the custom hook for animation calculations
  // This hook uses avatarSmallRef to calculate the position for the animation
  const { avatarPosition, windowWidth } = useDropdownAnimation(
    isOpen,
    avatarRef
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <ShadcnDropdownMenuContent
          forceMount
          asChild
          align="end"
          alignOffset={state === "collapsed" ? -255 : -30}
          sideOffset={16}
          onPointerEnter={onPointerEnterMenu}
          onPointerLeave={onPointerLeaveMenu}
        >
          {/* 
            Primary Animation: Whole Dropdown Container
            This animation controls the entry and exit of the entire dropdown menu.
            - On entry: The menu appears from the left side of the screen
            - On exit: The menu moves towards the position of the small avatar
          */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: -windowWidth }}
            animate={{
              opacity: 1,
              scale: 1,
              x: 0,
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 30,
              },
            }}
            exit={{
              opacity: 0,
              scale: 0,
              x: 0,
              y: avatarPosition.y - window.scrollY - 240,
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 30,
              },
            }}
            data-sidebar-dropdown="true"
            className="w-[300px] max-w-[calc(100vw-2rem)] bg-gradient-to-b from-white/90 to-white/90 dark:bg-gradient-to-b dark:from-blue-950/50 dark:to-black backdrop-blur-md rounded-lg shadow-lg border border-gray-200 dark:border-hidden overflow-hidden"
          >
            {/* 
              Secondary Animation: Internal Content
              This animation affects the internal content of the menu, including the banner and other elements.
              It creates a staggered effect where the content fades out before the main container closes.
            */}
            <motion.div
              className="relative"
              exit={{
                scale: 0.8,
                opacity: 0,
                transition: {
                  duration: 0.2,
                  ease: "easeInOut",
                },
              }}
              onMouseEnter={onPointerEnterMenu}
              onMouseLeave={onPointerLeaveMenu}
            >
              {/* Animate Blob Background Effect */}
              <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -left-5 top-14 w-1/2 h-1/4 bg-gradient-to-br from-blue-500/30 to-indigo-600/30 dark:from-blue-500/20 dark:to-indigo-600/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[30px] animate-blob animation-delay-500"></div>
                <div className="absolute right-0 top-1/2 w-1/2 h-1/4 bg-gradient-to-br from-yellow-500/30 to-red-600/30 dark:from-yellow-500/20 dark:to-red-600/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[40px] animate-blob animation-delay-1000"></div>
                <div className="absolute -left-5 -bottom-10 w-1/2 h-1/4 bg-gradient-to-br from-purple-500/30 to-pink-600/30 dark:from-purple-500/20 dark:to-pink-600/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[30px] animate-blob animation-delay-2000"></div>
              </div>

              <UserBanner />
              {/* 
                Tertiary Animation: User Avatar
                This animation specifically targets the large user avatar.
                It scales down and fades out faster than the rest of the content,
                creating a visual hierarchy in the closing animation.
              */}
              <motion.div
                className="absolute left-4 top-16"
                exit={{
                  scale: 0.5,
                  opacity: 0,
                  transition: {
                    duration: 0.15,
                    ease: "easeInOut",
                  },
                }}
              >
                <UserAvatar status={userStatus} size="large" />
              </motion.div>
              <UserSocialMedia className="absolute top-28 right-4" />
              <UserProfile />
              <MenuOptions />
            </motion.div>
          </motion.div>
        </ShadcnDropdownMenuContent>
      )}
    </AnimatePresence>
  );
}
