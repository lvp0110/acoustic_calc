import { useState } from "react";
import type { SurfaceType } from "../api";

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
  /** Доп. стили обёртки переключателя поверхности (наследуются там, где уместно) */
  surfaceSelectTextStyle?: React.CSSProperties;
  /** Текст между блоками выбора поверхности и способа ввода площади (не показывается, если пусто) */
  betweenRadiogroupsText?: string;
}

export default function CalcForm({
  surfaces,
  values,
  onCalculate,
  surfaceSelectTextStyle,
  betweenRadiogroupsText,
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
        gridTemplateColumns: "1fr 1fr",
        gap: "8px 8px",
        alignItems: "start",
        marginTop: "16px",
      }}
    >
      <div
        style={{ gridColumn: "1 / -1", width: "100%", ...surfaceSelectTextStyle }}
      >
        <div
          id="surface"
          className="calc-form__mode-radiogroup"
          role="radiogroup"
          aria-label="Тип поверхности"
        >
          {surfaces.map((s) => (
            <label
              key={s.Code}
              className={`calc-form__mode-radio${surface === s.Code ? " calc-form__mode-radio--active" : ""}`}
            >
              <input
                type="radio"
                name="calc-surface"
                value={s.Code}
                className="calc-form__mode-radio-input"
                checked={surface === s.Code}
                onChange={() => setSurface(s.Code)}
              />
              {s.Name}
            </label>
          ))}
        </div>
      </div>

      {betweenRadiogroupsText?.trim() ? (
        <div
          className="calc-form__between-radiogroups"
          style={{ gridColumn: "1 / -1", width: "100%" }}
        >
          {betweenRadiogroupsText}
        </div>
      ) : null}

      <div style={{ gridColumn: "1 / -1", width: "100%" }}>
        <div
          className="calc-form__mode-radiogroup"
          role="radiogroup"
          aria-label="Способ ввода площади"
        >
          <label
            className={`calc-form__mode-radio${mode === "area" ? " calc-form__mode-radio--active" : ""}`}
          >
            <input
              type="radio"
              name="calc-input-mode"
              value="area"
              className="calc-form__mode-radio-input"
              checked={mode === "area"}
              onChange={() => setMode("area")}
            />
            Площадь
          </label>
          <label
            className={`calc-form__mode-radio${mode === "dimensions" ? " calc-form__mode-radio--active" : ""}`}
          >
            <input
              type="radio"
              name="calc-input-mode"
              value="dimensions"
              className="calc-form__mode-radio-input"
              checked={mode === "dimensions"}
              onChange={() => setMode("dimensions")}
            />
            Размеры
          </label>
        </div>
      </div>

      {mode === "area" ? (
        <div
          style={{
            gridColumn: "1 / -1",
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: "8px",
            alignItems: "start",
          }}
        >
          <input
            id="area"
            type="number"
            min="0"
            step="0.01"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="площадь, м2"
          />
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
      ) : (
        <>
          <div
            style={{
              gridColumn: "1 / -1",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
              alignItems: "start",
            }}
          >
            <input
              id="width"
              type="number"
              min="0"
              step="0.01"
              value={length}
              onChange={(e) => setLength(e.target.value)}
              placeholder="ширина, мм"
            />
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
          <div
            style={{
              gridColumn: "1 / -1",
              display: "grid",
              gridTemplateColumns: "2fr 1fr",
              gap: "8px",
              alignItems: "start",
            }}
          >
            <div style={{ minHeight: 0 }} aria-hidden />
            <button
              type="submit"
              disabled={!isFormFilled}
              style={{
                color: isFormFilled ? "white" : "var(--color-muted, #999)",
                background: isFormFilled
                  ? "var(--color-index)"
                  : "var(--color-muted-bg, #eee)",
                cursor: isFormFilled ? "pointer" : "not-allowed",
              }}
            >
              Расчёт
            </button>
          </div>
        </>
      )}
    </form>
  );
}
