import type { BrandParam } from "../api";

interface BrandFormProps {
  fields: BrandParam[];
  values: Record<string, string | undefined>;
  onFieldChange: (code: string, value: string) => void;
}

export default function BrandForm({
  fields,
  values,
  onFieldChange,
}: BrandFormProps) {
  return (
    <div>
      {fields.map((field) => (
        <div key={field.code}>
          <label htmlFor={field.code}>{field.name}</label>
          <br />
          <select
            id={field.code}
            value={values[field.code] ?? ""}
            onChange={(e) => onFieldChange(field.code, e.target.value)}
          >
            <option value="">-- выберите --</option>
            {field.list.map((option) => (
              <option key={option.code} value={option.code}>
                {option.name}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
