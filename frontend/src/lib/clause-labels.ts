const CATEGORY_LABELS: Record<string, string> = {
  payment_terms: "Payment Terms",
  termination: "Termination",
  notice_period: "Notice Period",
  auto_renewal: "Auto-Renewal",
  confidentiality: "Confidentiality",
  non_compete: "Non-Compete",
  indemnification: "Indemnification",
  liability: "Liability",
  arbitration: "Arbitration",
  warranty: "Warranty",
  intellectual_property: "Intellectual Property",
  obligations: "Obligations",
  other: "Other",
};

export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}