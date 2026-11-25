import { useCallback, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { FileText, ScanSearch, ShieldAlert, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const MAX_BYTES = 25 * 1024 * 1024;

const FEATURES = [
  { icon: ScanSearch, label: "OCR extraction" },
  { icon: ShieldAlert, label: "Risk detection" },
  { icon: FileText, label: "Plain-language summary" },
];

interface UploadDropzoneProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
  progress?: number | null;
  filename?: string;
}

export function UploadDropzone({
  onFileSelected,
  disabled,
  progress = null,
  filename,
}: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [rejected, setRejected] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const reduceMotion = useReducedMotion();
  // Counts nested dragenter/dragleave pairs. Without this, dragging over a
  // child element fires dragleave on the parent and the highlight flickers
  // off mid-drag - only bare 0 means "actually left".
  const dragDepth = useRef(0);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (!file) return;

      const extensionAccepted = /\.(pdf|docx)$/i.test(file.name);
      if (!ACCEPTED_TYPES.includes(file.type) && !extensionAccepted) {
        setRejected("That file type isn't supported. Choose a PDF or DOCX.");
        window.setTimeout(() => setRejected(null), 2600);
        return;
      }

      if (file.size > MAX_BYTES) {
        setRejected("That file is over 25MB. Choose a smaller document.");
        window.setTimeout(() => setRejected(null), 2600);
        return;
      }

      setRejected(null);
      onFileSelected(file);
    },
    [onFileSelected],
  );

  const uploading = progress !== null;
  const uploadProgress = progress ?? 0;

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={(e) => {
        e.preventDefault();
        dragDepth.current += 1;
        if (!disabled) setIsDragging(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        dragDepth.current -= 1;
        if (dragDepth.current <= 0) {
          dragDepth.current = 0;
          setIsDragging(false);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        dragDepth.current = 0;
        setIsDragging(false);
        if (!disabled) handleFiles(e.dataTransfer.files);
      }}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (!disabled) inputRef.current?.click();
        }
      }}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      aria-label="Upload a PDF or DOCX contract"
      className={cn(
        "group relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed px-5 py-10 text-center transition-[border-color,background-color,box-shadow] duration-300",
        rejected
          ? "border-risk-600/60 bg-risk-50"
          : isDragging
            ? "border-primary/60 bg-primary-soft/70 shadow-card"
            : "border-ink-200 bg-surface/55 hover:border-primary/35 hover:bg-primary-soft/25",
        disabled ? "cursor-wait" : "cursor-pointer",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx"
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {uploading ? (
        <div className="w-full max-w-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-primary/20 bg-primary-soft">
            <motion.span
              animate={reduceMotion ? undefined : { y: [0, -3, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              className="text-primary"
            >
              <UploadCloud className="h-5 w-5" />
            </motion.span>
          </div>
          <p className="mt-4 truncate font-display text-base text-ink-900">
            {filename ?? "Uploading your contract"}
          </p>
          <p className="mt-1 font-mono text-[0.6rem] uppercase tracking-[0.12em] text-ink-400">
            {progress !== null && progress < 100 ? "Sending securely" : "Finishing up"}
          </p>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-ink-100">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={reduceMotion ? false : { width: 0 }}
              animate={{ width: `${Math.max(4, uploadProgress)}%` }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between font-mono text-[0.6rem] text-ink-400">
            <span>{Math.round(uploadProgress)}%</span>
            <span>PDF · DOCX</span>
          </div>
        </div>
      ) : (
        <>
          <motion.div
            animate={
              isDragging && !reduceMotion ? { y: -3, scale: 1.04 } : { y: 0, scale: 1 }
            }
            transition={{ type: "spring", stiffness: 350, damping: 24 }}
            className={cn(
              "mb-4 flex h-12 w-12 items-center justify-center rounded-full border transition-colors duration-300",
              isDragging
                ? "border-primary/25 bg-primary-soft text-primary"
                : "border-ink-100 bg-ink-50 text-ink-400 group-hover:border-primary/20 group-hover:text-primary",
            )}
          >
            <UploadCloud className="h-5 w-5" strokeWidth={1.8} />
          </motion.div>

          <p className="font-display text-[1.05rem] text-ink-900">
            {rejected
              ? rejected
              : isDragging
                ? "Drop it here."
                : "Drop a contract here, or click to browse."}
          </p>
          <p className="mt-1.5 text-xs text-ink-400">
            PDF or DOCX · up to 25MB · scanned pages welcome
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            {FEATURES.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="flex items-center gap-1.5 font-mono text-[0.56rem] uppercase tracking-[0.1em] text-ink-400"
              >
                <Icon className="h-3 w-3" />
                {label}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
