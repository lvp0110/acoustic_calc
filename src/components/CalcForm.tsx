import { useEffect, useRef, useState } from "react";
import type { SurfaceType } from "../api";
import styles from "./list-select.module.css";

type InputMode = "area" | "dimensions";

export interface CalcFormResult {
  surface: string;
  mode: InputMode;
  area?: number;
  length?: number;
  height?: number;
}

interface CalcFormProps {
  surfaces: SurfaceType[];
  values: CalcFormResult | null;
  onCalculate: (result: CalcFormResult) => void;
  /** Стили только для текста в select выбора стена/потолок (например fontSize, color, fontFamily) */
  surfaceSelectTextStyle?: React.CSSProperties;
}

export default function CalcForm({
  surfaces,
  values,
  onCalculate,
  surfaceSelectTextStyle,
}: CalcFormProps) {
  const [surface, setSurface] = useState(
    values?.surface ?? surfaces[0]?.Code ?? "",
  );
  const [mode, setMode] = useState<InputMode>(values?.mode ?? "area");
  const [area, setArea] = useState(values?.area ? String(values.area) : "");
  const [length, setLength] = useState(
    values?.length ? String(values.length) : "",
  );
  const [height, setHeight] = useState(
    values?.height ? String(values.height) : "",
  );

  const [surfaceOpen, setSurfaceOpen] = useState(false);
  const surfaceContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!surfaceOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        surfaceContainerRef.current &&
        !surfaceContainerRef.current.contains(e.target as Node)
      ) {
        setSurfaceOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [surfaceOpen]);

  const isFormFilled =
    mode === "area"
      ? area.trim() !== "" && Number(area) > 0
      : length.trim() !== "" &&
      height.trim() !== "" &&
      Number(length) > 0 &&
      Number(height) > 0;

  const handleSubmit = () => {
    if (!isFormFilled) return;
    if (mode === "area") {
      onCalculate({ surface, mode, area: Number(area) });
    } else {
      onCalculate({
        surface,
        mode,
        length: Number(length),
        height: Number(height),
      });
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 0.46fr 0.5fr",
        gap: "8px 8px",
        alignItems: "start",
        marginTop: "16px",
      }}
    >
      <div
        ref={surfaceContainerRef}
        style={{ position: "relative", width: "100%" }}
      >
        <button
          id="surface"
          type="button"
          className={`${styles.trigger} ${surfaceOpen ? styles.triggerOpen : ""} calc-form__surface-select`}
          onClick={() => setSurfaceOpen((prev) => !prev)}
          style={{ width: "100%", ...surfaceSelectTextStyle }}
        >
          {surfaces.find((s) => s.Code === surface)?.Name ??
            surfaces[0]?.Name ??
            ""}
        </button>
        {surfaceOpen && surfaces.length > 0 && (
          <div className={`${styles.dropdown} ${styles.dropdownText}`}>
            {surfaces.map((s) => (
              <button
                key={s.Code}
                type="button"
                className={styles.optionText}
                onClick={() => {
                  setSurface(s.Code);
                  setSurfaceOpen(false);
                }}
              >
                <span className={styles.optionTextLabel}>{s.Name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <button
          type="button"
          onClick={() => setMode("area")}
          style={{
            color: mode === "area" ? "white" : "var(--color-index)",
            background: mode === "area" ? "var(--color-index)" : "white",
          }}
        >
          Площадь
        </button>
      </div>
      <div>
        <button
          type="button"
          onClick={() => setMode("dimensions")}
          style={{
            color: mode === "area" ? "var(--color-index)" : "white",
            background: mode === "area" ? "white" : "var(--color-index)"
          }}
        >
          Размеры
        </button>
      </div>

      {mode === "area" ? (
        <div style={{ gridColumn: "span 2" }}>
          <input
            id="area"
            type="number"
            min="0"
            step="0.01"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="площадь, м2"
          />
        </div>
      ) : (
        <>
          <div>
            <input
              id="width"
              type="number"
              min="0"
              step="0.01"
              value={length}
              onChange={(e) => setLength(e.target.value)}
              placeholder="ширина, мм"
            />
          </div>
          <div style={{ gridColumn: "span 2" }}>
            <input
              id="height"
              type="number"
              min="0"
              step="0.01"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="высота, мм"
            />
          </div>
        </>
      )}
      <div>
        <button
          type="submit"
          disabled={!isFormFilled}
          style={{
            color: isFormFilled ? "white" : "var(--color-muted, #999)",
            background: isFormFilled ? "var(--color-index)" : "var(--color-muted-bg, #eee)",
            cursor: isFormFilled ? "pointer" : "not-allowed",
          }}
        >
          Расчёт
        </button>
      </div>
    </form>
  );
}
