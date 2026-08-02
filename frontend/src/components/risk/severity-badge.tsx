import { Badge } from "@/components/ui/badge";
import type { RiskSeverity } from "@/types/api";

const SEVERITY_VARIANT: Record<RiskSeverity, "neutral" | "gold" | "risk" | "riskSolid"> = {
  low: "neutral",
  medium: "gold",
  high: "risk",
  critical: "riskSolid",
};

export function SeverityBadge({ severity }: { severity: RiskSeverity }) {
  return <Badge variant={SEVERITY_VARIANT[severity]}>{severity}</Badge>;
}