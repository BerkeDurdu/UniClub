import { useEffect, type PropsWithChildren } from "react";

interface ModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
}

function Modal({ title, isOpen, onClose, children }: PropsWithChildren<ModalProps>) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/30 p-4 transition-opacity"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
        <h3 className="headline mb-4 text-2xl font-semibold text-ink">{title}</h3>
        {children}
      </div>
    </div>
  );
}

export default Modal;
