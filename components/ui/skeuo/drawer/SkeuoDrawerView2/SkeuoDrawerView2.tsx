// components/ui/skeuo/drawer/SkeuoDrawerView2/SkeuoDrawerView2.tsx
import "./SkeuoDrawerView2.css";

type Props = {
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
};

export function SkeuoDrawerView2({ onNext, onBack, onClose }: Props) {
  return (
    <div className="skeuo-drawer-view">
      <h2 className="skeuo-drawer-title">Vista 2</h2>
      <p className="skeuo-drawer-text">
        Este es el contenido de la segunda vista.
      </p>

      <div className="skeuo-drawer-actions">
        <button className="skeuo-btn" onClick={onBack}>
          Atras
        </button>

        <button className="skeuo-btn" onClick={onNext}>
          Siguiente ➡️
        </button>

        <button className="skeuo-btn" onClick={onClose}>
          ✕ Cerrar
        </button>
      </div>
    </div>
  );
}
