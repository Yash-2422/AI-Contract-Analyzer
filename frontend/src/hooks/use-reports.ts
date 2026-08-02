import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

/**
 * Report endpoints require the Authorization header (Phase 7's ownership
 * check), so a plain <a href="..."> download link won't work - the
 * browser's navigation request wouldn't carry the bearer token. Instead we
 * fetch the PDF as a blob through the authenticated axios client, then
 * trigger the download via a throwaway object URL.
 */
function triggerDownload(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export function useDownloadReport() {
  return useMutation({
    mutationFn: async ({ path, filename }: { path: string; filename: string }) => {
      const response = await apiClient.get(path, { responseType: "blob" });
      triggerDownload(response.data as Blob, filename);
    },
  });
}