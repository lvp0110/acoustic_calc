import { useEffect, useMemo, useState, type CSSProperties, type RefObject } from "react";
import type { SurfaceType } from "../api";
import ListSelect from "./ListSelect";

type InputMode = "area" | "dimensions";

function InfoBannerIcon() {
  return (
    <svg
      className="calc-form__info-banner-icon-svg"
      viewBox="0 0 24 24"
      width="22"
      height="22"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10.5" fill="#36A9E1" />
      <path
        fill="#fff"
        d="M11 7.5h2v2h-2v-2zm0 4h2v5.5h-2V11.5z"
      />
    </svg>
  );
}

function IconTabArea() {
  return (
    <img
      className="calc-form__mode-radio-icon"
      src="/square-ic.svg"
      width={20}
      height={20}
      alt=""
      aria-hidden
    />
  );
}

function IconTabDimensions() {
  return (
    <img
      className="calc-form__mode-radio-icon"
      src="/size-ic.svg"
      width={20}
      height={20}
      alt=""
      aria-hidden
    />
  );
}

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
  /** Сброс выборов: на странице бренда очищаются все списки и параметры расчёта в URL */
  onReset?: () => void;
  /** Доп. стили обёртки переключателя поверхности (наследуются там, где уместно) */
  surfaceSelectTextStyle?: CSSProperties;
  /** Текст между блоками выбора поверхности и способа ввода площади (не показывается, если пусто) */
  betweenRadiogroupsText?: string;
  /** Выравнивание выпадающего списка по ширине колонки формы (как у списков бренда) */
  dropdownAlignToRef?: RefObject<HTMLElement | null>;
}

export default function CalcForm({
  surfaces,
  values,
  onCalculate,
  onReset,
  surfaceSelectTextStyle,
  betweenRadiogroupsText,
  dropdownAlignToRef,
}: CalcFormProps) {
  const [surface, setSurface] = useState(values?.surface ?? "");
  const [mode, setMode] = useState<InputMode>(values?.mode ?? "area");
  const [area, setArea] = useState(values?.area ? String(values.area) : "");
  const [length, setLength] = useState(
    values?.length ? String(values.length) : "",
  );
  const [height, setHeight] = useState(
    values?.height ? String(values.height) : "",
  );

  const valuesSignature = values
    ? `${values.surface}|${values.mode}|${values.area ?? ""}|${values.length ?? ""}|${values.height ?? ""}`
    : "__null__";

  useEffect(() => {
    if (!values) {
      setSurface("");
      setMode("area");
      setArea("");
      setLength("");
      setHeight("");
      return;
    }
    setSurface(values.surface);
    setMode(values.mode ?? "area");
    setArea(values.area !== undefined ? String(values.area) : "");
    setLength(values.length !== undefined ? String(values.length) : "");
    setHeight(values.height !== undefined ? String(values.height) : "");
  }, [valuesSignature]);

  const surfaceOptions = useMemo(
    () => surfaces.map((s) => ({ code: s.Code, name: s.Name })),
    [surfaces],
  );

  const isFormFilled = useMemo(() => {
    if (!surface) return false;
    if (mode === "area") {
      return area.trim() !== "" && Number(area) > 0;
    }
    return (
      length.trim() !== "" &&
      height.trim() !== "" &&
      Number(length) > 0 &&
      Number(height) > 0
    );
  }, [surface, mode, area, length, height]);

  const submitBtnStyle: CSSProperties = {
    color: isFormFilled ? "white" : "var(--color-muted, #999)",
    background: isFormFilled
      ? "var(--color-index)"
      : "var(--color-muted-bg, #eee)",
    cursor: isFormFilled ? "pointer" : "not-allowed",
  };

  const handleSubmit = () => {
    if (!surface || !isFormFilled) return;
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

  const handleReset = () => {
    setSurface("");
    setMode("area");
    setArea("");
    setLength("");
    setHeight("");
    onReset?.();
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
        <ListSelect
          id="surface"
          label="Тип поверхности"
          options={surfaceOptions}
          value={surface}
          onChange={setSurface}
          placeholder="Выберите поверхность"
          variant="text"
          dropdownAlignToRef={dropdownAlignToRef}
        />
      </div>

      {surface ? (
        <>
          {betweenRadiogroupsText?.trim() ? (
            <div
              className="calc-form__info-banner"
              style={{ gridColumn: "1 / -1", width: "100%" }}
            >
              <span className="calc-form__info-banner-icon" aria-hidden>
                <InfoBannerIcon />
              </span>
              <p className="calc-form__info-banner-text">{betweenRadiogroupsText}</p>
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
                <IconTabArea />
                <span className="calc-form__mode-radio-label">Площадь</span>
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
                <IconTabDimensions />
                <span className="calc-form__mode-radio-label">Размеры</span>
              </label>
            </div>
          </div>

          {mode === "area" ? (
            <div
              style={{
                gridColumn: "1 / -1",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                alignItems: "stretch",
                width: "100%",
              }}
            >
              <input
                id="area"
                type="number"
                min="0"
                step="0.01"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="Площадь, м²"
                style={{ width: "100%", boxSizing: "border-box" }}
              />
              <div className="calc-form__actions">
                <button
                  type="button"
                  className="calc-form__btn-reset"
                  onClick={handleReset}
                >
                  Сбросить
                </button>
                <button
                  type="submit"
                  className="calc-form__btn-submit"
                  disabled={!isFormFilled}
                  style={submitBtnStyle}
                >
                  Применить
                </button>
              </div>
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
                className="calc-form__actions"
                style={{ gridColumn: "1 / -1", width: "100%" }}
              >
                <button
                  type="button"
                  className="calc-form__btn-reset"
                  onClick={handleReset}
                >
                  Сбросить
                </button>
                <button
                  type="submit"
                  className="calc-form__btn-submit"
                  disabled={!isFormFilled}
                  style={submitBtnStyle}
                >
                  Применить
                </button>
              </div>
            </>
          )}
        </>
      ) : null}
    </form>
  );
}
