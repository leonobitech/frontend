// components/ui/skeuo/drawer/SkeuoDrawerView1/SkeuoDrawerView1.tsx
import "./SkeuoDrawerView1.css";

type Props = {
  onNext: () => void;
  onClose: () => void;
};

export function SkeuoDrawerView1({ onNext, onClose }: Props) {
  return (
    <div className="skeuo-drawer-view">
      <h2 className="skeuo-drawer-title">Vista 1</h2>
      <p className="skeuo-drawer-text">Este contenido esta en desarrollo.</p>

      <div className="skeuo-drawer-actions">
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
