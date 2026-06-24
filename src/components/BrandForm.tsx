import { useCallback, useMemo, useState, type RefObject } from "react";
import type { BrandParam } from "../api";
import ListSelect from "./ListSelect";

interface BrandFormProps {
  fields: BrandParam[];
  values: Record<string, string | undefined>;
  onFieldChange: (code: string, value: string) => void;
  dropdownAlignToRef?: RefObject<HTMLElement | null>;
}

const isModelField = (field: BrandParam) =>
  field.code === "model" || field.name.toLowerCase().includes("модел");

const isSizeField = (field: BrandParam) =>
  field.code === "size" || field.name.toLowerCase().includes("размер");

const isColorSelectImageField = (field: BrandParam) =>
  field.type === "select_image" &&
  (field.code === "color" || field.name.toLowerCase().includes("цвет"));

/** Кромки и перфорация: картинка только после выбора, под списком */
const isEdgeOrPerforationImageField = (field: BrandParam) => {
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

function groupFieldsForBrandForm(fields: BrandParam[]) {
  type Group =
    | { kind: "single"; field: BrandParam }
    | { kind: "edgePerfRow"; fields: BrandParam[] }
    | { kind: "sizeColorRow"; fields: BrandParam[] };
  const groups: Group[] = [];
  let i = 0;
  while (i < fields.length) {
    const field = fields[i];
    if (isEdgeOrPerforationImageField(field)) {
      const row: BrandParam[] = [];
      while (i < fields.length && isEdgeOrPerforationImageField(fields[i])) {
        row.push(fields[i]);
        i++;
      }
      groups.push({ kind: "edgePerfRow", fields: row });
    } else if (isSizeField(field) || isColorSelectImageField(field)) {
      const row: BrandParam[] = [];
      while (
        i < fields.length &&
        (isSizeField(fields[i]) || isColorSelectImageField(fields[i]))
      ) {
        row.push(fields[i]);
        i++;
      }
      if (row.length === 1) {
        groups.push({ kind: "single", field: row[0]! });
      } else {
        groups.push({ kind: "sizeColorRow", fields: row });
      }
    } else {
      groups.push({ kind: "single", field });
      i++;
    }
  }
  return groups;
}

function BrandFormEdgePerfRow({
  fields,
  values,
  onFieldChange,
  edgePreviewHeights,
  onEdgePreviewHeight,
  dropdownAlignToRef,
}: {
  fields: BrandParam[];
  values: Record<string, string | undefined>;
  onFieldChange: (code: string, value: string) => void;
  edgePreviewHeights: Record<string, number>;
  onEdgePreviewHeight: (fieldCode: string, height: number) => void;
  dropdownAlignToRef?: RefObject<HTMLElement | null>;
}) {
  const maxPreviewH = Math.max(0, ...fields.map((f) => edgePreviewHeights[f.code] ?? 0));

  return (
    <div className="brand-form__edge-perf-row">
      {fields.map((field) => (
        <ListSelect
          key={field.code}
          id={field.code}
          label={field.name}
          options={field.list}
          value={values[field.code] ?? ""}
          onChange={(value) => onFieldChange(field.code, value)}
          placeholder={field.name}
          dropdownAlignToRef={dropdownAlignToRef}
          selectedImageBelow
          selectedPreviewMinHeight={maxPreviewH > 0 ? maxPreviewH : undefined}
          onSelectedPreviewHeight={(h) => onEdgePreviewHeight(field.code, h)}
        />
      ))}
    </div>
  );
}

export default function BrandForm({
  fields,
  values,
  onFieldChange,
  dropdownAlignToRef,
}: BrandFormProps) {
  const [edgePreviewHeights, setEdgePreviewHeights] = useState<Record<string, number>>({});
  const setEdgeFieldPreviewHeight = useCallback((fieldCode: string, height: number) => {
    setEdgePreviewHeights((prev) => (prev[fieldCode] === height ? prev : { ...prev, [fieldCode]: height }));
  }, []);

  const renderListSelect = (field: BrandParam) => (
    <ListSelect
      key={field.code}
      id={field.code}
      label={field.name}
      options={field.list}
      value={values[field.code] ?? ""}
      onChange={(value) => onFieldChange(field.code, value)}
      placeholder={field.name}
      style={isModelField(field) ? { gridColumn: "1 / -1" } : undefined}
      dropdownAlignToRef={dropdownAlignToRef}
      variant={isSizeField(field) || isModelField(field) ? "text" : "default"}
      imageObjectFit={isColorSelectImageField(field) ? "cover" : "contain"}
    />
  );

  const groups = useMemo(() => groupFieldsForBrandForm(fields), [fields]);
  return (
    <div className="brand-form">
      {groups.map((group) => {
        if (group.kind === "single") {
          return renderListSelect(group.field);
        }
        if (group.kind === "edgePerfRow") {
          return (
            <BrandFormEdgePerfRow
              key={group.fields.map((f) => f.code).join("-")}
              fields={group.fields}
              values={values}
              onFieldChange={onFieldChange}
              edgePreviewHeights={edgePreviewHeights}
              onEdgePreviewHeight={setEdgeFieldPreviewHeight}
              dropdownAlignToRef={dropdownAlignToRef}
            />
          );
        }
        return (
          <div
            key={group.fields.map((f) => f.code).join("-")}
            className="brand-form__size-color-row"
          >
            {group.fields.map((field) => renderListSelect(field))}
          </div>
        );
      })}
    </div>
  );
}
