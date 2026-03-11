import { useEffect, useRef, useState } from "react";
import { getBaseUrl } from "../api/get-base-url";

export interface ListSelectOption {
  code: string;
  name: string;
  img?: string;
  section_img?: string;
}

export function getOptionImageUrl(option: { img?: string; section_img?: string }): string | null {
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
  /** При ширине экрана > 768px выпадающий список выравнивается по этому контейнеру (на всю ширину) и в 2 колонки */
  dropdownAlignToRef?: React.RefObject<HTMLElement | null>;
  /** Вариант "text" — выпадающий список только с текстом, без картинок и сетки (для размеров и т.п.) */
  variant?: "default" | "text";
}

const DROPDOWN_FULLWIDTH_BREAKPOINT = 768;
const VERY_NARROW_BREAKPOINT = 375;

export default function ListSelect({
  id,
  label,
  options,
  value,
  onChange,
  placeholder,
  style,
  selectStyle = { width: "100%" },
  dropdownAlignToRef,
  variant = "default",
}: ListSelectProps) {
  const [open, setOpen] = useState(false);
  const [wideViewport, setWideViewport] = useState(
    () => typeof window !== "undefined" && window.innerWidth > DROPDOWN_FULLWIDTH_BREAKPOINT
  );
  const [veryNarrowViewport, setVeryNarrowViewport] = useState(
    () => typeof window !== "undefined" && window.innerWidth <= VERY_NARROW_BREAKPOINT
  );
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${DROPDOWN_FULLWIDTH_BREAKPOINT + 1}px)`);
    const handler = () => setWideViewport(mql.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${VERY_NARROW_BREAKPOINT}px)`);
    const handler = () => setVeryNarrowViewport(mql.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

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

  // Лишний код (не используется): const selectedOption = options.find((o) => o.code === value);
  const hasImages = variant !== "text" && options.some((option) => getOptionImageUrl(option) !== null);
  const isTextVariant = variant === "text";

  return (
    <div
      ref={containerRef}
      className={isTextVariant ? "list-select list-select--text" : "list-select"}
      style={{
        position: "relative",
        ...style,
      }}
    >
      {/* Лишний код (не используется): label для select
      <label htmlFor={id} style={{...}}>{label}</label> */}
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
      {open && options.length > 0 && (() => {
        const useFullWidth =
          wideViewport &&
          dropdownAlignToRef?.current &&
          containerRef.current;
        const formRect = useFullWidth
          ? dropdownAlignToRef.current!.getBoundingClientRect()
          : null;
        const triggerRect = useFullWidth
          ? containerRef.current!.getBoundingClientRect()
          : null;
        const twoColumns = !isTextVariant && (wideViewport || hasImages);
        const gapValue = veryNarrowViewport ? 1 : (twoColumns ? 12 : 4);
        return (
          <div
            className={isTextVariant ? "list-select-dropdown list-select-dropdown--text" : "list-select-dropdown"}
            style={{
              position: useFullWidth ? "fixed" : "absolute",
              zIndex: 20,
              ...(useFullWidth && formRect && triggerRect
                ? {
                  left: formRect.left,
                  top: triggerRect.bottom + 4,
                  width: formRect.width,
                }
                : {
                  top: "100%",
                  left: 0,
                  right: 0,
                  marginTop: 4,
                }),
              paddingTop: isTextVariant ? 4 : 12,
              backgroundColor: "#fff",
              borderRadius: 8,
              display: twoColumns ? "grid" : "flex",
              gridTemplateColumns: twoColumns ? "1fr 1fr" : undefined,
              flexDirection: twoColumns ? undefined : "column",
              gap: gapValue,
              maxHeight: useFullWidth && triggerRect
                ? `min(70vh, ${window.innerHeight - triggerRect.bottom - 24}px)`
                : "min(70vh, 400px)",
              overflowY: "auto",
            }}
          >
            {options.map((option) => {
              const imgUrl = isTextVariant ? null : getOptionImageUrl(option);
              // Лишний код (не используется): const isSelected = selectedOption?.code === option.code;

              return (
                <button
                  key={option.code}
                  type="button"
                  className={isTextVariant ? "list-select-option list-select-option--text" : "list-select-option"}
                  onClick={() => {
                    onChange(option.code);
                    setOpen(false);
                  }}
                  style={isTextVariant ? undefined : {
                    borderRadius: 8,
                    paddingBottom: 8,
                    display: twoColumns ? "flex" : "block",
                    flexDirection: twoColumns ? "column" : undefined,
                    alignItems: twoColumns ? "center" : undefined,
                    gap: twoColumns ? 2 : undefined,
                    cursor: "pointer",
                    textAlign: twoColumns ? "center" : "left",
                    height: veryNarrowViewport ? "180px" : "110px"
                  }}
                >
                  {imgUrl && (
                    <img
                      src={imgUrl}
                      alt={option.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: 12,
                      }}
                    />
                  )}
                  <span className={isTextVariant ? "list-select-option-text list-select-option-text--plain" : undefined} style={!isTextVariant ? { fontSize: 12, lineHeight: 1.2 } : undefined}>
                    {option.name}
                  </span>
                </button>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
}
