import { ReactNode, useEffect } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
};

export function SkeuoDrawerLayout({ open, onClose, children }: Props) {
  // Cierra al presionar Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (open) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  return (
    <>
      {/* 🔲 Overlay – Detecta clics fuera del drawer */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />
      <aside
        className={`fixed left-0 top-0 z-50 h-full w-[75%] max-w-sm bg-background transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* 🎨 Animated Blob Backgrounds */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute -left-5 top-14 w-1/2 h-1/4 bg-gradient-to-br from-blue-500/30 to-indigo-600/30 dark:from-blue-500/20 dark:to-indigo-600/20 rounded-full mix-blend-multiply dark:mix-blend-screen blur-[30px] animate-blob animation-delay-500" />
          <div className="absolute right-0 top-1/2 w-1/2 h-1/4 bg-gradient-to-br from-yellow-500/30 to-red-600/30 dark:from-yellow-500/20 dark:to-red-600/20 rounded-full mix-blend-multiply dark:mix-blend-screen blur-[40px] animate-blob animation-delay-1000" />
          <div className="absolute -left-5 -bottom-10 w-1/2 h-1/4 bg-gradient-to-br from-purple-500/30 to-pink-600/30 dark:from-purple-500/20 dark:to-pink-600/20 rounded-full mix-blend-multiply dark:mix-blend-screen blur-[30px] animate-blob animation-delay-2000" />
        </div>

        {/* 📦 Drawer content */}
        <div className="relative z-10 h-full flex flex-col">{children}</div>
      </aside>
    </>
  );
}
