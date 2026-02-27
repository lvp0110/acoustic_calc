import { useState } from "react";
import type { SurfaceType } from "../api";

type InputMode = "area" | "dimensions";

export interface CalcFormResult {
  surface: string;
  mode: InputMode;
  area?: number;
  width?: number;
  height?: number;
}

interface CalcFormProps {
  surfaces: SurfaceType[];
  onCalculate: (result: CalcFormResult) => void;
}

export default function CalcForm({ surfaces, onCalculate }: CalcFormProps) {
  const [surface, setSurface] = useState(surfaces[0]?.Code ?? "");
  const [mode, setMode] = useState<InputMode>("area");
  const [area, setArea] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");

  const handleSubmit = () => {
    if (mode === "area") {
      onCalculate({ surface, mode, area: Number(area) });
    } else {
      onCalculate({ surface, mode, width: Number(width), height: Number(height) });
    }
  };

  return (
    <div>
      <div>
        <label htmlFor="surface">Поверхность</label>
        <br />
        <select
          id="surface"
          value={surface}
          onChange={(e) => setSurface(e.target.value)}
        >
          {surfaces.map((s) => (
            <option key={s.Code} value={s.Code}>
              {s.Name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <button
          type="button"
          onClick={() => setMode("area")}
          style={{ fontWeight: mode === "area" ? "bold" : "normal" }}
        >
          ПЛОЩАДЬ
        </button>
        <button
          type="button"
          onClick={() => setMode("dimensions")}
          style={{ fontWeight: mode === "dimensions" ? "bold" : "normal" }}
        >
          РАЗМЕРЫ
        </button>
      </div>

      {mode === "area" ? (
        <div>
          <label htmlFor="area">
            Площадь, м<sup>2</sup>
          </label>
          <br />
          <input
            id="area"
            type="number"
            min="0"
            step="0.01"
            value={area}
            onChange={(e) => setArea(e.target.value)}
          />
        </div>
      ) : (
        <div>
          <div>
            <label htmlFor="width">Ширина, м</label>
            <br />
            <input
              id="width"
              type="number"
              min="0"
              step="0.01"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="height">Высота, м</label>
            <br />
            <input
              id="height"
              type="number"
              min="0"
              step="0.01"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
            />
          </div>
        </div>
      )}

      <button type="button" onClick={handleSubmit}>
        Расчёт
      </button>
    </div>
  );
}
