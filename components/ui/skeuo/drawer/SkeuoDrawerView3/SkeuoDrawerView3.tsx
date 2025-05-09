// components/ui/skeuo/drawer/SkeuoDrawerView3/SkeuoDrawerView3.tsx
import "./SkeuoDrawerView3.css";

type Props = {
  onBack: () => void;
  onClose: () => void;
};

export function SkeuoDrawerView3({ onBack, onClose }: Props) {
  return (
    <div className="skeuo-drawer-view">
      <h2 className="skeuo-drawer-title">Vista 3</h2>
      <p className="skeuo-drawer-text">
        Este es el contenido de la tercera vista.
      </p>

      <div className="skeuo-drawer-actions">
        <button className="skeuo-btn" onClick={onBack}>
          Atras
        </button>

        <button className="skeuo-btn" onClick={onClose}>
          ✕ Cerrar
        </button>
      </div>
    </div>
  );
}
