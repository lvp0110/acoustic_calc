import { useEffect, useRef, useState } from "react";
import { getBaseUrl } from "../api/get-base-url";

export interface ListSelectOption {
  code: string;
  name: string;
  img?: string;
  section_img?: string;
}

function getOptionImageUrl(option: ListSelectOption): string | null {
  const imageFile =
    (option.img && option.img.trim() !== "")
      ? option.img
      : (option.section_img && option.section_img.trim() !== "")
      ? option.section_img
      : null;

  if (!imageFile) return null;
  if (imageFile.startsWith("http")) return imageFile;

  const base = getBaseUrl();
  const cleanBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const cleanPath = imageFile.startsWith("/") ? imageFile.slice(1) : imageFile;

  return `${cleanBase}/v1/constr/${cleanPath}`;
}

interface ListSelectProps {
  id: string;
  label: string;
  options: ListSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  selectStyle?: React.CSSProperties;
}

export default function ListSelect({
  id,
  label,
  options,
  value,
  onChange,
  placeholder,
  style,
  selectStyle = { width: "100%" },
}: ListSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const selectedOption = options.find((o) => o.code === value);
  const hasImages = options.some((option) => getOptionImageUrl(option) !== null);

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        ...style,
      }}
    >
      <label
        htmlFor={id}
        style={{
          display: "block",
          position: "relative",
          marginBottom: -12,
          marginLeft: 14,
          color: "grey",
          opacity: value ? 1 : 0,
          transition: "opacity 0.5s ease",
          background: "#f5f5f7",
          width: "fit-content",
        }}
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onMouseDown={(e) => {
          e.preventDefault();
          setOpen((prev) => !prev);
        }}
        style={selectStyle}
      >
        <option value="">{placeholder ?? label}</option>
        {options.map((option) => (
          <option key={option.code} value={option.code}>
            {option.name}
          </option>
        ))}
      </select>
      {open && options.length > 0 && (
        <div
          style={{
            position: "absolute",
            zIndex: 20,
            top: "100%",
            left: 0,
            right: 0,
            marginTop: 4,
            padding: 12,
            backgroundColor: "#fff",
            borderRadius: 12,
            // boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
            display: hasImages ? "grid" : "flex",
            gridTemplateColumns: hasImages ? "1fr 1fr" : undefined,
            flexDirection: hasImages ? undefined : "column",
            gap: hasImages ? 12 : 4,
            maxHeight: "auto",
            overflowY: "auto",
          }}
        >
          {options.map((option) => {
            const imgUrl = getOptionImageUrl(option);
            const isSelected = selectedOption?.code === option.code;

            return (
              <button
                key={option.code}
                type="button"
                onClick={() => {
                  onChange(option.code);
                  setOpen(false);
                }}
                style={{
                  borderRadius: 12,
                  // border: isSelected
                  //   ? "2px solid var(--color-primary, #2563eb)"
                  //   : "2px solid #e5e7eb",
                  backgroundColor: isSelected
                    ? "var(--color-primary-bg, #eff6ff)"
                    : "#fff",
                  padding: 8,
                  display: hasImages ? "flex" : "block",
                  flexDirection: hasImages ? "column" : undefined,
                  alignItems: hasImages ? "center" : undefined,
                  gap: hasImages ? 6 : undefined,
                  cursor: "pointer",
                  textAlign: hasImages ? "center" : "left",
                }}
              >
                {imgUrl && (
                  <img
                    src={imgUrl}
                    alt={option.name}
                    style={{
                      width: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",
                    }}
                  />
                )}
                <span style={{ fontSize: 12, lineHeight: 1.2 }}>{option.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
