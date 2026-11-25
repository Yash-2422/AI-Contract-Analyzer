import { useEffect, useRef, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  pending = false,
  onConfirm,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  children?: ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const lastOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !pending) onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = lastOverflow;
      previousFocus?.focus();
    };
  }, [onClose, open, pending]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.18 }}
        >
          <button
            type="button"
            aria-label="Close dialog"
            className="absolute inset-0 cursor-default bg-ink-900/45 backdrop-blur-[2px]"
            onClick={() => !pending && onClose()}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            tabIndex={-1}
            initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-md rounded-xl border border-ink-100 bg-surface p-6 shadow-lift focus:outline-none"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="rule-label mb-2">Please confirm</p>
                <h2
                  id="confirm-dialog-title"
                  className="font-display text-2xl font-medium text-ink-900"
                >
                  {title}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={pending}
                aria-label="Close"
                className="rounded-full p-1.5 text-ink-400 transition-colors hover:bg-ink-50 hover:text-ink-900 disabled:opacity-40"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {description && (
              <p className="mt-3 text-sm leading-relaxed text-ink-400">{description}</p>
            )}
            {children && <div className="mt-3">{children}</div>}
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={onClose} disabled={pending}>
                {cancelLabel}
              </Button>
              <Button
                variant={destructive ? "destructive" : "default"}
                onClick={onConfirm}
                disabled={pending}
              >
                {pending ? "Working…" : confirmLabel}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
