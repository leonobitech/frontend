import "./SkeuoDrawerViewMain.css";
import "remixicon/fonts/remixicon.css";
import { HeaderDrawer } from "./HeaderDrawer/HeaderDrawer";
import { UserContentDrawer } from "./UserContentDrawer/UserContentDrawer";
import { useThemeWatcher } from "@/hooks/useThemeWatcher";
import { ContentDrawer } from "./ContentDrawer/ContentDrawer";

export function SkeuoDrawerViewMain({ user }: Props) {
  const { theme } = useThemeWatcher();
  return (
    <div className="drawer-page-wrapper">
      {/* Header fijo */}
      <HeaderDrawer theme={theme} />

      {/* Contenedor scrollable con User + Content */}
      <div className="flex-1 overflow-y-auto scrollbar-none">
        <UserContentDrawer />
        <ContentDrawer />
      </div>
    </div>
  );
}
