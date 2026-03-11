import type { BrandParam } from "../api";
import ListSelect from "./ListSelect";

interface BrandFormProps {
  fields: BrandParam[];
  values: Record<string, string | undefined>;
  onFieldChange: (code: string, value: string) => void;
  dropdownAlignToRef?: React.RefObject<HTMLElement | null>;
}

const isModelField = (field: BrandParam) =>
  field.code === "model" || field.name.toLowerCase().includes("модел");

const isSizeField = (field: BrandParam) =>
  field.code === "size" || field.name.toLowerCase().includes("размер");

export default function BrandForm({
  fields,
  values,
  onFieldChange,
  dropdownAlignToRef,
}: BrandFormProps) {
  return (
    <div className="brand-form">
      {fields.map((field) => (
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
        />
      ))}
    </div>
  );
}
