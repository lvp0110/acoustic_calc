import type { BrandParam } from "../api";
import ListSelect from "./ListSelect";

interface BrandFormProps {
  fields: BrandParam[];
  values: Record<string, string | undefined>;
  onFieldChange: (code: string, value: string) => void;
}

const isModelField = (field: BrandParam) =>
  field.code === "model" || field.name.toLowerCase().includes("модел");

export default function BrandForm({
  fields,
  values,
  onFieldChange,
}: BrandFormProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "4px 16px",
        alignItems: "start",
      }}
    >
      {fields.map((field) => (
        <ListSelect
          key={field.code}
          id={field.code}
          label={field.name}
          options={field.list}
          value={values[field.code] ?? ""}
          onChange={(value) => onFieldChange(field.code, value)}
          placeholder={field.name}
          style={{
            gridColumn: isModelField(field) ? "1 / -1" : undefined,
          }}
        />
      ))}
    </div>
  );
}
