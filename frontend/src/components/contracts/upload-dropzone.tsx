import { useCallback, useRef, useState } from "react";
import { FileText, ScanSearch, ShieldAlert, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const FEATURES = [
  { icon: ScanSearch, label: "OCR extraction" },
  { icon: ShieldAlert, label: "Risk detection" },
  { icon: FileText, label: "Plain-language summary" },
];

interface UploadDropzoneProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

export function UploadDropzone({ onFileSelected, disabled }: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [rejected, setRejected] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // Counts nested dragenter/dragleave pairs. Without this, dragging over a
  // child element (the icon, the copy) fires dragleave on the parent and the
  // highlight flickers off mid-drag - only bare 0 means "actually left".
  const dragDepth = useRef(0);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (!file) return;
      // Client-side check for immediate feedback - the backend
      // (DocumentService._validate, Phase 3) is the real source of truth
      // and re-checks extension, MIME type, and size regardless.
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setRejected(true);
        setTimeout(() => setRejected(false), 1600);
        return;
      }
      onFileSelected(file);
    },
    [onFileSelected],
  );

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
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-12 text-center transition-colors",
        rejected
          ? "border-risk-600 bg-risk-50"
          : isDragging
            ? "border-emerald-600 bg-emerald-50"
            : "border-ink-200 hover:border-ink-400",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <div
        className={cn(
          "mb-3 flex h-12 w-12 items-center justify-center rounded-full transition-colors",
          isDragging ? "bg-emerald-100" : "bg-ink-50",
        )}
      >
        <UploadCloud className={cn("h-6 w-6", isDragging ? "text-emerald-600" : "text-ink-400")} />
      </div>

      <p className="font-display text-base text-ink-900">
        {rejected ? "PDF or DOCX only" : isDragging ? "Drop it here" : "Drop a contract here, or click to browse"}
      </p>
      <p className="mt-1 text-xs text-ink-400">PDF or DOCX, up to 25MB</p>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        {FEATURES.map(({ icon: Icon, label }) => (
          <span key={label} className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide text-ink-400">
            <Icon className="h-3.5 w-3.5" />
            {label}
          </span>
        ))}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx"
        className="hidden"
        disabled={disabled}
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}