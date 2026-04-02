import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
  /** Выпадающий список выравнивается по этому контейнеру на всю его ширину (ширина блока формы и т.п.) */
  dropdownAlignToRef?: React.RefObject<HTMLElement | null>;
  /** Вариант "text" — выпадающий список только с текстом, без картинок и сетки (для размеров и т.п.) */
  variant?: "default" | "text";
  /** Как вписывать изображения в карточки опций (по умолчанию contain) */
  imageObjectFit?: "contain" | "cover";
  /** Дополнительно показать крупное превью выбранного варианта под полем (кромки, перфорация и т.п.). */
  selectedImageBelow?: boolean;
  /** Общая min-height блока превью в строке кромка+перфорация (по наибольшему изображению). */
  selectedPreviewMinHeight?: number;
  /** Сообщить измеренную высоту превью (при загрузке и resize) для синхронизации с соседним полем. */
  onSelectedPreviewHeight?: (height: number) => void;
}

/** На узком экране сетка опций с картинками — одна колонка, если нет изображений в списке */
const DROPDOWN_TWO_COLUMN_MIN_WIDTH = 768;

function readSelectedPreviewMaxPx(wrap: HTMLElement): number {
  const raw = getComputedStyle(wrap).getPropertyValue("--selected-preview-max").trim();
  const n = parseFloat(raw);
  return Number.isFinite(n) && n > 0 ? n : 220;
}

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
  imageObjectFit = "contain",
  selectedImageBelow = false,
  selectedPreviewMinHeight,
  onSelectedPreviewHeight,
}: ListSelectProps) {
  const [open, setOpen] = useState(false);
  const [, forceUpdate] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerWrapRef = useRef<HTMLDivElement | null>(null);
  const selectedPreviewWrapRef = useRef<HTMLDivElement | null>(null);
  const selectedPreviewImgRef = useRef<HTMLImageElement | null>(null);
  const onSelectedPreviewHeightRef = useRef(onSelectedPreviewHeight);
  onSelectedPreviewHeightRef.current = onSelectedPreviewHeight;

  useEffect(() => {
    if (!open) return;

    const handleResize = () => forceUpdate((n) => n + 1);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [open]);

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
  const compactDropdown = isTextVariant;
  const hasImages =
    !compactDropdown && options.some((o) => getOptionImageUrl(o) !== null);
  const selectedOption = options.find((o) => o.code === value);
  const selectedPreviewUrl =
    selectedImageBelow && value && selectedOption
      ? getOptionImageUrl(selectedOption)
      : null;
  const selectedLabel =
    options.find((o) => o.code === value)?.name ?? (placeholder ?? label);

  useEffect(() => {
    if (!selectedImageBelow) return;
    if (!selectedPreviewUrl) {
      onSelectedPreviewHeightRef.current?.(0);
    }
  }, [selectedPreviewUrl, selectedImageBelow]);

  const syncSelectedPreviewHeight = Boolean(onSelectedPreviewHeight);

  useLayoutEffect(() => {
    if (!syncSelectedPreviewHeight || !selectedImageBelow || !selectedPreviewUrl) {
      return;
    }
    const wrap = selectedPreviewWrapRef.current;
    if (!wrap) return;

    const measure = () => {
      const w = selectedPreviewWrapRef.current;
      const img = selectedPreviewImgRef.current;
      const report = onSelectedPreviewHeightRef.current;
      if (!report || !w || !img || !img.naturalWidth) return;
      const pw = w.clientWidth;
      if (!pw) return;
      const cap = readSelectedPreviewMaxPx(w);
      const rawH = (pw / img.naturalWidth) * img.naturalHeight;
      report(Math.min(rawH, cap));
    };

    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(wrap);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [selectedPreviewUrl, selectedImageBelow, syncSelectedPreviewHeight]);

  function renderDropdown() {
    const wideViewport = window.innerWidth > DROPDOWN_TWO_COLUMN_MIN_WIDTH;
    const twoColumns = !compactDropdown && (wideViewport || hasImages);
    const alignEl = dropdownAlignToRef?.current;
    const triggerEl = triggerWrapRef.current;
    const useFullWidth = Boolean(alignEl && triggerEl);

    const formRect = useFullWidth && alignEl ? alignEl.getBoundingClientRect() : null;
    const triggerRect = useFullWidth && triggerEl ? triggerEl.getBoundingClientRect() : null;

    const dropdownStyle: React.CSSProperties | undefined =
      useFullWidth && formRect && triggerRect
        ? ({
            "--list-select-left": `${formRect.left - triggerRect.left}px`,
            "--list-select-width": `${formRect.width}px`,
            "--list-select-max-height": "min(70vh, 600px)",
          } as React.CSSProperties)
        : undefined;

    const dropdownClass = [
      styles.dropdown,
      useFullWidth && styles.dropdownFullWidth,
      compactDropdown && styles.dropdownText,
      twoColumns && styles.dropdownGrid,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={dropdownClass} style={dropdownStyle}>
        {options.map((option) => {
          const imgUrl = compactDropdown ? null : getOptionImageUrl(option);
          const optionImgClass =
            imageObjectFit === "cover"
              ? `${styles.optionImg} ${styles.optionImgCover}`
              : styles.optionImg;
          const optionClass = [
            compactDropdown ? styles.optionText : styles.option,
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
              {imgUrl && <img src={imgUrl} alt={option.name} className={optionImgClass} />}
              <span className={compactDropdown ? styles.optionTextLabel : styles.optionLabel}>
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
      <div ref={triggerWrapRef} className={styles.triggerWrap}>
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
      {selectedPreviewUrl && selectedOption && (
        <div
          ref={selectedPreviewWrapRef}
          className={styles.selectedPreviewWrap}
          style={
            selectedPreviewMinHeight != null && selectedPreviewMinHeight > 0
              ? { minHeight: selectedPreviewMinHeight }
              : undefined
          }
        >
          <img
            ref={selectedPreviewImgRef}
            src={selectedPreviewUrl}
            alt={selectedOption.name}
            className={styles.selectedPreview}
            loading="lazy"
            onLoad={() => {
              const report = onSelectedPreviewHeightRef.current;
              if (!report) return;
              const w = selectedPreviewWrapRef.current;
              const img = selectedPreviewImgRef.current;
              if (!w || !img?.naturalWidth) return;
              const pw = w.clientWidth;
              if (!pw) return;
              const cap = readSelectedPreviewMaxPx(w);
              const rawH = (pw / img.naturalWidth) * img.naturalHeight;
              report(Math.min(rawH, cap));
            }}
          />
        </div>
      )}
    </div>
  );
}
