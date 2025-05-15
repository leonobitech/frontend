// components/ui/skeuo/drawer/UserContentDrawer/UserContentDrawer.tsx

import { UserBanner } from "@/components/Sidebar/_3/SidebarFooter/UserBanner";
import "./UserContentDrawer.css";

export function UserContentDrawer() {
  return (
    <div className="drawer-profile-card">
      <UserBanner />
    </div>
  );
}
