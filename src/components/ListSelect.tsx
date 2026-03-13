import { useEffect, useRef, useState } from "react";
import { getOptionImageUrl } from "../api/get-base-url";
import styles from "./list-select.module.css";

export interface ListSelectOption {
  code: string;
  name: string;
  img?: string;
  section_img?: string;
}


interface ListSelectProps {
  id: string;
  label: string;
  options: ListSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  /** При ширине экрана > 768px выпадающий список выравнивается по этому контейнеру (на всю ширину) и в 2 колонки */
  dropdownAlignToRef?: React.RefObject<HTMLElement | null>;
  /** Вариант "text" — выпадающий список только с текстом, без картинок и сетки (для размеров и т.п.) */
  variant?: "default" | "text";
}

const DROPDOWN_FULLWIDTH_BREAKPOINT = 768;

export default function ListSelect({
  id,
  label,
  options,
  value,
  onChange,
  placeholder,
  style,
  dropdownAlignToRef,
  variant = "default",
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

  const isTextVariant = variant === "text";
  const hasImages = !isTextVariant && options.some((o) => getOptionImageUrl(o) !== null);
  const selectedLabel =
    options.find((o) => o.code === value)?.name ?? (placeholder ?? label);

  function renderDropdown() {
    const wideViewport = window.innerWidth > DROPDOWN_FULLWIDTH_BREAKPOINT;
    const twoColumns = !isTextVariant && (wideViewport || hasImages);
    const useFullWidth = wideViewport && dropdownAlignToRef?.current && containerRef.current;

    const formRect = useFullWidth ? dropdownAlignToRef.current!.getBoundingClientRect() : null;
    const triggerRect = useFullWidth ? containerRef.current!.getBoundingClientRect() : null;

    const dropdownStyle: React.CSSProperties =
      useFullWidth && formRect && triggerRect
        ? {
            position: "fixed",
            left: formRect.left,
            top: triggerRect.bottom + 4,
            width: formRect.width,
            maxHeight: `min(70vh, ${window.innerHeight - triggerRect.bottom - 24}px)`,
          }
        : {};

    const dropdownClass = [
      styles.dropdown,
      isTextVariant && styles.dropdownText,
      twoColumns && styles.dropdownGrid,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={dropdownClass} style={dropdownStyle}>
        {options.map((option) => {
          const imgUrl = isTextVariant ? null : getOptionImageUrl(option);
          const optionClass = [
            isTextVariant ? styles.optionText : styles.option,
            twoColumns && styles.optionGrid,
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <button
              key={option.code}
              type="button"
              className={optionClass}
              onClick={() => {
                onChange(option.code);
                setOpen(false);
              }}
            >
              {imgUrl && <img src={imgUrl} alt={option.name} className={styles.optionImg} />}
              <span className={isTextVariant ? styles.optionTextLabel : styles.optionLabel}>
                {option.name}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={styles.container} style={style}>
      <button
        id={id}
        type="button"
        className={`${styles.trigger} ${open ? styles.triggerOpen : ""}`}
        onClick={() => setOpen((prev) => !prev)}
      >
        {selectedLabel}
      </button>
      {open && options.length > 0 && renderDropdown()}
    </div>
  );
}
