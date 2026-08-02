import { Badge } from "@/components/ui/badge";
import type { ContractStatus } from "@/types/api";

const STATUS_VARIANT: Record<ContractStatus, "neutral" | "gold" | "emerald" | "risk"> = {
  uploaded: "neutral",
  processing: "gold",
  processed: "emerald",
  failed: "risk",
};

const STATUS_LABEL: Record<ContractStatus, string> = {
  uploaded: "Uploaded",
  processing: "Processing",
  processed: "Processed",
  failed: "Failed",
};

export function ContractStatusBadge({ status }: { status: ContractStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}