import { useEffect, useState } from "react";
import { X } from "lucide-react";

export type ToastProps = {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "destructive";
};

export function Toast({
  title,
  description,
  variant = "default",
  id,
  onClose,
}: ToastProps & { onClose: (id: string) => void }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(id), 300); // Wait for fade out animation
    }, 3000);

    return () => clearTimeout(timer);
  }, [id, onClose]);

  return (
    <div
      className={`fixed bottom-4 right-4 p-4 rounded-md shadow-md transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      } ${
        variant === "destructive"
          ? "bg-red-600 text-white"
          : "bg-white text-gray-900"
      }`}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold">{title}</h3>
          {description && <p className="mt-1 text-sm">{description}</p>}
        </div>
        <button
          onClick={() => onClose(id)}
          className="text-gray-500 hover:text-gray-700"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}

export function ToastContainer({
  toasts,
  onClose,
}: {
  toasts: ToastProps[];
  onClose: (id: string) => void;
}) {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>
  );
}
