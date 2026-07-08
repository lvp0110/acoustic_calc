import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { getOptionImageUrl } from "../api/get-base-url";
import { useMatchMedia } from "../utils/useMatchMedia";
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
  style?: CSSProperties;
  /** Выпадающий список выравнивается по этому контейнеру на всю его ширину (ширина блока формы и т.п.) */
  dropdownAlignToRef?: RefObject<HTMLElement | null>;
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
const DROPDOWN_TWO_COLUMN_MIN_WIDTH = 700;
const MOBILE_SHEET_MQ = "(max-width: 899px)";

function readSelectedPreviewMaxPx(wrap: HTMLElement): number {
  const raw = getComputedStyle(wrap).getPropertyValue("--selected-preview-max").trim();
  const n = parseFloat(raw);
  return Number.isFinite(n) && n > 0 ? n : 220;
}

function readBoxVerticalPaddingPx(el: HTMLElement): number {
  const s = getComputedStyle(el);
  return (parseFloat(s.paddingTop) || 0) + (parseFloat(s.paddingBottom) || 0);
}

/** Единая формула высоты превью (useLayoutEffect + onLoad img). */
function measureSelectedPreviewHeight(
  wrap: HTMLElement | null,
  img: HTMLImageElement | null,
  report: ((height: number) => void) | undefined
): void {
  if (!report || !wrap || !img?.naturalWidth) return;
  const pw = wrap.clientWidth;
  if (!pw) {
    report(0);
    return;
  }
  const varCap = readSelectedPreviewMaxPx(wrap);
  const innerSlot = wrap.clientHeight - readBoxVerticalPaddingPx(wrap);
  const slotCap = innerSlot > 0 ? innerSlot : 0;
  const cap = slotCap > 0 ? Math.min(varCap, slotCap) : varCap;
  const rawH = (pw / img.naturalWidth) * img.naturalHeight;
  report(Math.min(rawH, cap));
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
  const [, bumpLayoutOnResize] = useState(0);
  const narrowViewport = useMatchMedia(MOBILE_SHEET_MQ);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerWrapRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const selectedPreviewWrapRef = useRef<HTMLDivElement | null>(null);
  const selectedPreviewImgRef = useRef<HTMLImageElement | null>(null);
  const onSelectedPreviewHeightRef = useRef(onSelectedPreviewHeight);
  onSelectedPreviewHeightRef.current = onSelectedPreviewHeight;

  const isTextVariant = variant === "text";
  const compactDropdown = isTextVariant;
  const hasImages = useMemo(
    () => !compactDropdown && options.some((o) => getOptionImageUrl(o) !== null),
    [compactDropdown, options]
  );

  useEffect(() => {
    // При сбросе/изменении значения извне (через URL/форму) закрываем дропдаун,
    // чтобы визуально "сбрасывался" триггер.
    setOpen(false);
  }, [value]);

  useEffect(() => {
    if (!open) return;

    const handleLayoutChange = () => bumpLayoutOnResize((n) => n + 1);
    window.addEventListener("resize", handleLayoutChange);
    window.addEventListener("scroll", handleLayoutChange, true);
    return () => {
      window.removeEventListener("resize", handleLayoutChange);
      window.removeEventListener("scroll", handleLayoutChange, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (containerRef.current?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;
      setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);
  const hasSelection = Boolean(value?.trim());
  const selectedOption = hasSelection
    ? options.find((o) => o.code === value)
    : undefined;
  const selectedPreviewUrl =
    selectedImageBelow && hasSelection && selectedOption
      ? getOptionImageUrl(selectedOption)
      : null;
  const selectedLabel = hasSelection
    ? selectedOption?.name ?? (placeholder ?? label)
    : (placeholder ?? label);

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

    const measure = () =>
      measureSelectedPreviewHeight(
        selectedPreviewWrapRef.current,
        selectedPreviewImgRef.current,
        onSelectedPreviewHeightRef.current
      );

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
    const mobileSheet = narrowViewport;
    const wideViewport = window.innerWidth >= DROPDOWN_TWO_COLUMN_MIN_WIDTH;
    const twoColumns = !compactDropdown && (wideViewport || hasImages);
    const alignEl = dropdownAlignToRef?.current;
    const triggerEl = triggerWrapRef.current;
    const usePortal =
      !mobileSheet && Boolean(dropdownAlignToRef && alignEl && triggerEl);

    const formRect = usePortal && alignEl ? alignEl.getBoundingClientRect() : null;
    const triggerRect = usePortal && triggerEl ? triggerEl.getBoundingClientRect() : null;

    const dropdownStyle: CSSProperties | undefined = usePortal
      ? formRect && triggerRect
        ? {
            position: "fixed",
            top: triggerRect.bottom + 4,
            left: formRect.left,
            width: formRect.width,
            maxHeight: "min(70vh, 600px)",
          }
        : undefined
      : undefined;

    const dropdownClass = [
      styles.dropdown,
      mobileSheet && styles.dropdownMobile,
      usePortal && styles.dropdownPortal,
      compactDropdown && styles.dropdownText,
      twoColumns && styles.dropdownGrid,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div ref={dropdownRef} className={dropdownClass} style={dropdownStyle}>
        {mobileSheet && (
          <button
            type="button"
            className={styles.mobileTitle}
            onClick={() => setOpen(false)}
            aria-label={`Закрыть выбор: ${label}`}
          >
            {label}
          </button>
        )}
        {options.map((option) => {
          const imgUrl = compactDropdown ? null : getOptionImageUrl(option);
          const optionImgClass =
            imageObjectFit === "cover"
              ? `${styles.optionImg} ${styles.optionImgCover}`
              : styles.optionImg;
          const useGridImageSlot = twoColumns;
          const optionClass = [
            compactDropdown ? styles.optionText : styles.option,
            twoColumns && styles.optionGrid,
          ]
            .filter(Boolean)
            .join(" ");

          const imgNode =
            imgUrl &&
            (useGridImageSlot ? (
              <span className={styles.optionImgSlot}>
                <img src={imgUrl} alt={option.name} className={optionImgClass} />
              </span>
            ) : (
              <img src={imgUrl} alt={option.name} className={optionImgClass} />
            ));

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
              {imgNode}
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
          className={`${styles.trigger} ${open ? styles.triggerOpen : ""} ${hasSelection ? styles.triggerSelected : ""}`}
          onClick={() => setOpen((prev) => !prev)}
        >
          {selectedLabel}
        </button>
        {open &&
          options.length > 0 &&
          (narrowViewport || !dropdownAlignToRef) &&
          renderDropdown()}
      </div>
      {open &&
        options.length > 0 &&
        dropdownAlignToRef &&
        !narrowViewport &&
        typeof document !== "undefined" &&
        createPortal(renderDropdown(), document.body)}
      {!narrowViewport && selectedPreviewUrl && selectedOption && (
        <div className={styles.selectedPreviewWrap}>
          <div
            ref={selectedPreviewWrapRef}
            className={styles.selectedPreviewCard}
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
              onLoad={() =>
                measureSelectedPreviewHeight(
                  selectedPreviewWrapRef.current,
                  selectedPreviewImgRef.current,
                  onSelectedPreviewHeightRef.current
                )
              }
            />
          </div>
          <div className={styles.selectedPreviewCaption}>
            {label}, {selectedOption.name}
          </div>
        </div>
      )}
    </div>
  );
}
