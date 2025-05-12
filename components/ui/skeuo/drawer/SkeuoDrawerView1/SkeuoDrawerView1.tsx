import "./SkeuoDrawerView1.css";
import content from "./view1Content.json";
import "remixicon/fonts/remixicon.css";
import { HeaderDrawer } from "./HeaderDrawer/HeaderDrawer";
import { useThemeWatcher } from "@/hooks/useThemeWatcher";
import { ContentDrawerView1 } from "./ContentDrawerView1/ContentDrawerView1";

type Props = {
  onNext: () => void;
  onClose: () => void;
};

export function SkeuoDrawerView1({ onNext, onClose }: Props) {
  const { theme } = useThemeWatcher();
  const handleAction = (type: string) => {
    if (type === "next") onNext();
    if (type === "close") onClose();
  };

  return (
    <>
      <HeaderDrawer theme={theme} />
      <div className="skeuo-drawer-view p-4">
        <h2 className="skeuo-drawer-title">{content.title}</h2>
        <p className="skeuo-drawer-text">{content.text}</p>

        <div className="skeuo-drawer-actions ">
          {content.actions.map((action) => (
            <button
              key={action.action}
              className="skeuo-btn mt-2"
              onClick={() => handleAction(action.action)}
            >
              <i className={action.icon} /> {action.label}
            </button>
          ))}
        </div>
        {/* 👇 Nuevo contenido insertado aquí */}
        <ContentDrawerView1 />
      </div>
    </>
  );
}
