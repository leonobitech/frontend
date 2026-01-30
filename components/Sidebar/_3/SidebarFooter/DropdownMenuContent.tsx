import { DropdownMenuContent as ShadcnDropdownMenuContent } from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import { UserBanner } from "./UserBanner";
import { UserProfile } from "./UserProfile";
import { MenuOptions } from "./MenuOptions";
import { UserAvatar } from "./UserAvatar";
import { UserSocialMedia } from "./UserSocialMedia";
import { useSidebarFooter } from "./SidebarFooterContext";

interface DropdownMenuContentProps {
  state: "expanded" | "collapsed";
}

const dropdownVariants = {
  hidden: { opacity: 0, y: 8, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.18, ease: [0.25, 0.1, 0.25, 1] as const },
  },
  exit: {
    opacity: 0,
    y: 4,
    scale: 0.97,
    transition: { duration: 0.12, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

export function DropdownMenuContent({ state }: DropdownMenuContentProps) {
  const { isOpen, userStatus } = useSidebarFooter();

  return (
    <AnimatePresence>
      {isOpen && (
        <ShadcnDropdownMenuContent
          forceMount
          asChild
          align="end"
          alignOffset={state === "collapsed" ? -280 : -24}
          sideOffset={24}
        >
          <motion.div
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            data-sidebar-dropdown="true"
            className="w-75 max-w-[calc(100vw-2rem)] bg-linear-to-b from-white/90 to-white/90 dark:bg-linear-to-b dark:from-blue-950/50 dark:to-black backdrop-blur-md rounded-lg shadow-lg border border-gray-200 dark:border-hidden overflow-hidden"
          >
            <div className="relative">
              <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -left-5 top-14 w-1/2 h-1/4 bg-linear-to-br from-blue-500/30 to-indigo-600/30 dark:from-blue-500/20 dark:to-indigo-600/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[30px] animate-blob animation-delay-500" />
                <div className="absolute right-0 top-1/2 w-1/2 h-1/4 bg-linear-to-br from-yellow-500/30 to-red-600/30 dark:from-yellow-500/20 dark:to-red-600/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-2xl animate-blob animation-delay-1000" />
                <div className="absolute -left-5 -bottom-10 w-1/2 h-1/4 bg-linear-to-br from-purple-500/30 to-pink-600/30 dark:from-purple-500/20 dark:to-pink-600/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[30px] animate-blob animation-delay-2000" />
              </div>

              <UserBanner />
              <div className="absolute left-4 top-16">
                <UserAvatar status={userStatus} size="large" />
              </div>
              <UserSocialMedia className="absolute top-28 right-4" />
              <UserProfile />
              <MenuOptions />
            </div>
          </motion.div>
        </ShadcnDropdownMenuContent>
      )}
    </AnimatePresence>
  );
}
