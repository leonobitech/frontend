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
            className="w-75 max-w-[calc(100vw-2rem)] !bg-[#333333]/95 !text-[#D1D5DB] !border-white/10 backdrop-blur-md rounded-lg shadow-lg overflow-hidden"
          >
            <div className="relative">

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
