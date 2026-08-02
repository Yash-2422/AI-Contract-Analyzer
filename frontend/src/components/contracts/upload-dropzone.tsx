import { useCallback, useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

interface UploadDropzoneProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

export function UploadDropzone({ onFileSelected, disabled }: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (!file) return;
      // Client-side check for immediate feedback - the backend
      // (DocumentService._validate, Phase 3) is the real source of truth
      // and re-checks extension, MIME type, and size regardless.
      if (!ACCEPTED_TYPES.includes(file.type)) return;
      onFileSelected(file);
    },
    [onFileSelected],
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
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
        "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors",
        isDragging ? "border-emerald-600 bg-emerald-50" : "border-ink-200 hover:border-ink-400",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <UploadCloud className="mb-3 h-8 w-8 text-ink-400" />
      <p className="text-sm font-medium text-ink-900">
        Drop a contract here, or click to browse
      </p>
      <p className="mt-1 text-xs text-ink-400">PDF or DOCX, up to 25MB</p>
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