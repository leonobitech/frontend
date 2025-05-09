// components/ui/skeuo/drawer/SkeuoDrawer.tsx
"use client";

import { useEffect, useState } from "react";
import "./SkeuoDrawer.css";
import { SkeuoDrawerView1 } from "./SkeuoDrawerView1/SkeuoDrawerView1";
import { SkeuoDrawerView2 } from "./SkeuoDrawerView2/SkeuoDrawerView2";
import { SkeuoDrawerView3 } from "./SkeuoDrawerView3/SkeuoDrawerView3";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function SkeuoDrawer({ open, onClose }: Props) {
  const [currentView, setCurrentView] = useState(1);

  // Bloquear scroll del body cuando drawer está abierto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      setCurrentView(1); // reset a vista 1 al abrir
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleNext = () => setCurrentView((prev) => Math.min(prev + 1, 3));
  const handleBack = () => setCurrentView((prev) => Math.max(prev - 1, 1));

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer contenedor */}
      <aside
        className={`fixed left-0 top-0 z-50 h-full w-[75%] max-w-sm bg-background transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Renderiza la vista actual */}
        <div className="h-full overflow-y-auto p-4">
          {currentView === 1 && (
            <SkeuoDrawerView1 onNext={handleNext} onClose={onClose} />
          )}
          {currentView === 2 && (
            <SkeuoDrawerView2
              onNext={handleNext}
              onBack={handleBack}
              onClose={onClose}
            />
          )}
          {currentView === 3 && (
            <SkeuoDrawerView3 onBack={handleBack} onClose={onClose} />
          )}
        </div>
      </aside>
    </>
  );
}
