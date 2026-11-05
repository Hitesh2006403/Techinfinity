import { useEffect } from "react";
import { X } from "lucide-react";

export function Modal({ isOpen, onClose, title, subtitle, children, footer, maxWidth = "max-w-lg" }) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4 animate-fade-in">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`relative z-10 w-full ${maxWidth} bg-surface-container-lowest dark:bg-primary-container border border-outline-variant rounded-2xl shadow-xl flex flex-col overflow-hidden max-h-[90vh]`}
      >
        {/* Header */}
        {(title || subtitle) && (
          <div className="p-5 border-b border-outline-variant/60 flex items-start justify-between">
            <div>
              {title && (
                <h3 className="font-headline text-xl font-medium text-primary dark:text-inverse-primary leading-tight">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs text-on-surface-variant dark:text-outline mt-1">
                  {subtitle}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="p-4 bg-surface-container-low/40 dark:bg-primary/30 border-t border-outline-variant/60 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
