import type { BrandParam } from "../api";

/** Кромки и перфорация (поля select_image с соответствующими code/name). */
export const isEdgeOrPerforationField = (field: BrandParam) => {
  if (field.type !== "select_image") return false;
  const code = field.code.toLowerCase();
  const name = field.name.toLowerCase();
  return (
    name.includes("кромк") ||
    name.includes("перфорац") ||
    code.includes("edge") ||
    code.includes("perfor")
  );
};

export function getSelectedEdgePerfDescriptions(
  fields: BrandParam[] | undefined,
  values: Record<string, string | undefined>,
): string[] {
  if (!fields) return [];
  const descriptions: string[] = [];
  for (const field of fields) {
    if (!isEdgeOrPerforationField(field)) continue;
    const selectedCode = values[field.code];
    if (!selectedCode) continue;
    const desc = field.list
      .find((o) => o.code === selectedCode)
      ?.description?.trim();
    if (desc) descriptions.push(desc);
  }
  return descriptions;
}
