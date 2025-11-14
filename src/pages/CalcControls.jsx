import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import "./CalcControls.css";
import { useAcoustic } from "../context/AcousticContext.jsx";
import SelectText from "../components/SelectText.jsx";

export default function CalcControls(props) {
  const { BASE_URL, brand, model, color, size, perf, edge, fullOptionData } =
    useAcoustic();
  const { onTableDataChange } = props;
  const [searchParams, setSearchParams] = useSearchParams();

  // Поддерживаем контролируемое и неконтролируемое использование
  const [internalMode, setInternalMode] = useState("sizes");
  const [internalSurface, setInternalSurface] = useState("ceiling");
  const [internalWidth, setInternalWidth] = useState("");
  const [internalHeight, setInternalHeight] = useState("");
  const [internalArea, setInternalArea] = useState("");

  const [calcLoading, setCalcLoading] = useState(false);
  const [calcError, setCalcError] = useState("");
  const [calcRows, setCalcRows] = useState([]);
  const [calcData, setCalcData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const debounceTimer = useRef(null);
  const isInitialized = useRef(false);
  const lastCalcParams = useRef("");
  const prevBrand = useRef(brand);

  const mode = props.mode ?? internalMode;
  const surface = props.surface ?? internalSurface;
  const width = props.width ?? internalWidth;
  const height = props.height ?? internalHeight;
  const area = props.area ?? internalArea;

  // Инициализация из URL при первом рендере
  useEffect(() => {
    if (isInitialized.current) return;

    const urlMode = searchParams.get("calcMode");
    const urlSurface = searchParams.get("calcSurface");
    const urlWidth = searchParams.get("calcWidth");
    const urlHeight = searchParams.get("calcHeight");
    const urlArea = searchParams.get("calcArea");

    if (urlMode) setInternalMode(urlMode);
    else if (!props.mode) setInternalMode("sizes");

    if (urlSurface) setInternalSurface(urlSurface);
    else if (!props.surface) setInternalSurface("ceiling");

    if (urlWidth) setInternalWidth(urlWidth);
    if (urlHeight) setInternalHeight(urlHeight);
    if (urlArea) setInternalArea(urlArea);

    // Восстанавливаем данные таблицы из URL
    const tableDataEncoded = searchParams.get("tableData");
    if (tableDataEncoded) {
      const { calcData: restoredCalcData, calcRows: restoredCalcRows } =
        decodeTableData(tableDataEncoded);
      if (restoredCalcData || (restoredCalcRows && restoredCalcRows.length > 0)) {
        setCalcData(restoredCalcData);
        setCalcRows(restoredCalcRows);
        // Передаем данные в родительский компонент
        if (onTableDataChange) {
          onTableDataChange(restoredCalcData, restoredCalcRows);
        }
      }
    }

    isInitialized.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // только на маунт

  // Синхронизация состояния с URL (после инициализации)
  useEffect(() => {
    if (!isInitialized.current) return;

    // Формируем строку только наших параметров для сравнения
    const calcParamsStr = [
      `calcMode=${mode || ""}`,
      `calcSurface=${surface || ""}`,
      `calcWidth=${width || ""}`,
      `calcHeight=${height || ""}`,
      `calcArea=${area || ""}`,
    ].join("&");

    if (calcParamsStr === lastCalcParams.current) return;
    lastCalcParams.current = calcParamsStr;

    // Используем функциональную форму setSearchParams для сохранения других параметров
    setSearchParams(
      (prevParams) => {
        const params = new URLSearchParams(prevParams);

        // Сохраняем все параметры калькулятора
        if (mode) {
          params.set("calcMode", mode);
        }

        if (surface) {
          params.set("calcSurface", surface);
        }

        if (width) {
          params.set("calcWidth", width);
        } else {
          params.delete("calcWidth");
        }

        if (height) {
          params.set("calcHeight", height);
        } else {
          params.delete("calcHeight");
        }

        if (area) {
          params.set("calcArea", area);
        } else {
          params.delete("calcArea");
        }

        return params;
      },
      { replace: true }
    );
  }, [mode, surface, width, height, area, setSearchParams]);

  const setMode = (v) => {
    if (props.setMode) props.setMode(v);
    else setInternalMode(v);
  };
  const setSurface = (v) => {
    if (props.setSurface) props.setSurface(v);
    else setInternalSurface(v);
  };
  const setWidth = (v) => {
    if (props.setWidth) props.setWidth(v);
    else setInternalWidth(v);
  };
  const setHeight = (v) => {
    if (props.setHeight) props.setHeight(v);
    else setInternalHeight(v);
  };
  const setArea = (v) => {
    if (props.setArea) props.setArea(v);
    else setInternalArea(v);
  };

  // Сброс данных калькулятора при смене бренда
  useEffect(() => {
    if (!isInitialized.current) {
      prevBrand.current = brand;
      return;
    }
    
    // Если бренд изменился, сбрасываем все данные калькулятора
    if (prevBrand.current !== brand) {
      setInternalWidth("");
      setInternalHeight("");
      setInternalArea("");
      setCalcLoading(false);
      setCalcError("");
      setCalcRows([]);
      setCalcData(null);
      setShowModal(false);
      
      // Очищаем параметры калькулятора из URL
      setSearchParams(
        (prevParams) => {
          const params = new URLSearchParams(prevParams);
          params.delete("calcMode");
          params.delete("calcSurface");
          params.delete("calcWidth");
          params.delete("calcHeight");
          params.delete("calcArea");
          params.delete("tableData");
          return params;
        },
        { replace: true }
      );
      
      // Уведомляем родительский компонент об очистке данных
      if (onTableDataChange) {
        onTableDataChange(null, []);
      }
    }
    
    prevBrand.current = brand;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brand, setSearchParams]);

  // Автоматический расчет площади при вводе размеров
  useEffect(() => {
    if (mode === "sizes") {
      if (width && height) {
        const w = numeric(width);
        const h = numeric(height);
        if (w > 0 && h > 0) {
          const calculatedArea = (w * h).toFixed(2);
          setArea(calculatedArea);
        } else {
          setArea("");
        }
      } else {
        // Если одно из полей пустое, очищаем площадь
        setArea("");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, mode]);

  const v2Urls = useMemo(() => {
    // Helper для правильного формирования URL
    const buildApiUrl = (path) => {
      const cleanPath = path.startsWith("/") ? path.slice(1) : path;
      if (!BASE_URL || BASE_URL === "") {
        return `/${cleanPath}`;
      }
      const cleanBase = BASE_URL.endsWith("/")
        ? BASE_URL.slice(0, -1)
        : BASE_URL;
      return `${cleanBase}/${cleanPath}`;
    };

    return {
      params: buildApiUrl("api/v2/constr/calc/params"),
      calcBase: buildApiUrl("api/v2/constr/calc"),
      excel: buildApiUrl("api/v2/constr/calc/excel"),
    };
  }, [BASE_URL]);

  const numeric = (val) => {
    const n = Number(String(val).replace(",", "."));
    return Number.isFinite(n) ? n : NaN;
  };

  // Функции для кодирования/декодирования данных таблицы в base64
  const encodeTableData = (calcData, calcRows) => {
    try {
      const data = {
        calcData: calcData,
        calcRows: calcRows,
      };
      const json = JSON.stringify(data);
      // Правильное кодирование: сначала в UTF-8 через encodeURIComponent, потом в base64
      const utf8 = unescape(encodeURIComponent(json));
      const base64 = btoa(utf8);
      return base64;
    } catch (e) {
      console.error("Ошибка кодирования данных таблицы:", e, e.message);
      return null;
    }
  };

  const decodeTableData = (encoded) => {
    try {
      if (!encoded) return { calcData: null, calcRows: [] };
      // Правильное декодирование: сначала из base64, потом из UTF-8
      const utf8 = atob(encoded);
      const json = decodeURIComponent(escape(utf8));
      const data = JSON.parse(json);
      return {
        calcData: data.calcData || null,
        calcRows: data.calcRows || [],
      };
    } catch (e) {
      console.error("Ошибка декодирования данных таблицы:", e, e.message);
      return { calcData: null, calcRows: [] };
    }
  };

  const hasValidInput = useMemo(() => {
    if (!brand || !model) return false;
    if (mode === "sizes") {
      const w = numeric(width);
      const h = numeric(height);
      return w > 0 && h > 0;
    }
    const a = numeric(area);
    return a > 0;
  }, [brand, model, mode, width, height, area]);

  // Параметры v2 не запрашиваем автоматически, чтобы избежать 404 в консоли на несуществующие пары brand/model.

  // 2) Явный расчет по кнопке
  const onCalculate = async () => {
    if (!hasValidInput) return;
    try {
      setCalcData(null);
      setCalcRows([]);
      setCalcLoading(true);
      setCalcError("");
      const selected = {
        model: fullOptionData?.model?.[model] || null,
        color: fullOptionData?.color?.[color] || null,
        size: fullOptionData?.size?.[size] || null,
        perf: fullOptionData?.perf?.[perf] || null,
        edge: fullOptionData?.edge?.[edge] || null,
      };
      const params = new URLSearchParams();
      if (model) params.set("model", model);
      if (color) params.set("color", color);
      if (size) params.set("size", size);
      if (perf) params.set("perf", perf);
      if (edge) params.set("edge", edge);
      if (surface) params.set("type", surface);
      // API ожидает: length, height, square
      if (mode === "sizes") {
        params.set("length", String(numeric(width)));
        params.set("height", String(numeric(height)));
      } else if (mode === "area") {
        params.set("square", String(numeric(area)));
      }

      // Эндпоинт: /api/v2/constr/calc/{brand}
      const url = `${v2Urls.calcBase}/${encodeURIComponent(
        brand
      )}?${params.toString()}`;
      const res = await fetch(url, {
        method: "GET",
        headers: { accept: "application/json" },
      });
      const text = await res.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch {}
      if (!res.ok) {
        if (res.status === 404) {
          setShowModal(true);
          setCalcLoading(false);
          return;
        }
        const msg =
          json?.message || json?.error || text || `HTTP ${res.status}`;
        throw new Error(msg);
      }

      // Поддерживаем формат: { code, data: { title, columns[], rows[] }, error }
      const data = json?.data;
      let newCalcData = null;
      let newCalcRows = [];

      if (data && Array.isArray(data.columns) && Array.isArray(data.rows)) {
        newCalcData = {
          title: typeof data.title === "string" ? data.title : "",
          columns: data.columns,
          rows: data.rows,
        };
        setCalcData(newCalcData);
        setCalcRows([]);
      } else {
        newCalcRows = Array.isArray(json?.data)
          ? json.data
          : Array.isArray(json)
          ? json
          : [];
        setCalcRows(newCalcRows);
        setCalcData(null);
      }

      // Передаем данные таблицы в родительский компонент
      if (onTableDataChange) {
        onTableDataChange(newCalcData, newCalcRows);
      }

      // Сохраняем данные таблицы в URL
      const tableDataEncoded = encodeTableData(newCalcData, newCalcRows);
      if (tableDataEncoded) {
        console.log("Сохранение данных таблицы в URL, длина:", tableDataEncoded.length);
        setSearchParams(
          (prevParams) => {
            const params = new URLSearchParams(prevParams);
            params.set("tableData", tableDataEncoded);
            console.log("Параметры URL обновлены, tableData добавлен");
            return params;
          },
          { replace: true }
        );
      } else {
        console.error("Не удалось закодировать данные таблицы");
      }
    } catch (e) {
      setCalcError(e.message || "Ошибка расчёта");
      // Очищаем данные таблицы при ошибке
      setCalcData(null);
      setCalcRows([]);
      if (onTableDataChange) {
        onTableDataChange(null, []);
      }
    } finally {
      setCalcLoading(false);
      // Очищаем поля после расчета
      setWidth("");
      setHeight("");
      setArea("");
    }
  };

  const onDownloadExcel = async () => {
    try {
      const selected = {
        model: fullOptionData?.model?.[model] || null,
        color: fullOptionData?.color?.[color] || null,
        size: fullOptionData?.size?.[size] || null,
        perf: fullOptionData?.perf?.[perf] || null,
        edge: fullOptionData?.edge?.[edge] || null,
      };
      const payload = {
        brand,
        model,
        color: color || undefined,
        size: size || undefined,
        perf: perf || undefined,
        edge: edge || undefined,
        selected,
        surface,
        mode,
        width: mode === "sizes" ? numeric(width) : undefined,
        height: mode === "sizes" ? numeric(height) : undefined,
        area: mode === "area" ? numeric(area) : undefined,
      };
      const res = await fetch(v2Urls.excel, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(
          res.status === 404 ? "Файл Excel не найден" : `HTTP ${res.status}`
        );
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "calc.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(e.message || "Не удалось скачать Excel");
    }
  };

  const onShare = async () => {
    try {
      // Проверяем, есть ли данные таблицы
      if (!calcData && (!calcRows || calcRows.length === 0)) {
        alert("Нет данных таблицы для сохранения в ссылке");
        return;
      }

      // Формируем URL с актуальными параметрами из searchParams
      const currentParams = new URLSearchParams(searchParams);
      
      // Если данных таблицы нет в URL, добавляем их
      if (!currentParams.has("tableData")) {
        const tableDataEncoded = encodeTableData(calcData, calcRows);
        if (tableDataEncoded) {
          currentParams.set("tableData", tableDataEncoded);
          // Сохраняем в URL для будущего использования
          setSearchParams(currentParams, { replace: true });
        }
      }
      
      const baseUrl = window.location.origin + window.location.pathname;
      const url = `${baseUrl}?${currentParams.toString()}`;
      
      // Проверяем длину URL (браузеры имеют ограничение ~2000 символов)
      if (url.length > 2000) {
        console.warn("URL слишком длинный:", url.length, "символов");
        alert("Внимание: ссылка очень длинная и может не работать в некоторых браузерах");
      }
      
      console.log("Копирование URL, длина:", url.length);
      console.log("Параметры URL:", Array.from(currentParams.keys()));
      await navigator.clipboard.writeText(url);
      // Показываем уведомление о копировании и открываем в новой вкладке
      alert("Ссылка скопирована в буфер обмена!");
      window.open(url, "_blank");
    } catch (e) {
      console.error("Ошибка при копировании URL:", e);
      // Fallback для старых браузеров
      const currentParams = new URLSearchParams(searchParams);
      
      // Если данных таблицы нет в URL, добавляем их
      if (!currentParams.has("tableData")) {
        const tableDataEncoded = encodeTableData(calcData, calcRows);
        if (tableDataEncoded) {
          currentParams.set("tableData", tableDataEncoded);
        }
      }
      
      const baseUrl = window.location.origin + window.location.pathname;
      const url = `${baseUrl}?${currentParams.toString()}`;
      
      const textArea = document.createElement("textarea");
      textArea.value = url;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        alert("Ссылка скопирована в буфер обмена!");
        window.open(url, "_blank");
      } catch (err) {
        alert("Не удалось скопировать ссылку");
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <div>
      <div className="calc-components">
        <button
          type="button"
          onClick={() => setMode("sizes")}
          style={{
            backgroundColor: mode === "sizes" ? "#006BCF" : undefined,
            color: mode === "sizes" ? "#fff" : undefined,
          }}
        >
          размеры
        </button>
        <button
          type="button"
          onClick={() => setMode("area")}
          style={{
            backgroundColor: mode === "area" ? "#006BCF" : undefined,
            color: mode === "area" ? "#fff" : undefined,
          }}
        >
          площадь
        </button>

        <SelectText
          paramType="surface"
          value={surface}
          onChange={setSurface}
          options={[
            { id: "ceiling", name: "потолок" },
            { id: "wall", name: "стена" },
          ]}
          SECTION_TITLES={{
            surface: { acc: "тип поверхности", gen: "типа поверхности" },
          }}
          capitalize={(s) => s}
          showClearButton={false}
        />
      </div>

      <div className="calc-sizes">
        {mode === "sizes" ? (
          <>
            <input
              type="text"
              placeholder="ширина"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
            />
            <input
              type="text"
              placeholder="высота"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
            />
          </>
        ) : (
          <>
            <input
              type="text"
              placeholder="площадь (м²)"
              value={area}
              onChange={(e) => setArea(e.target.value)}
            />
            <input
              type="text"
              placeholder="высота"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              style={{ display: "none" }}
            />
          </>
        )}
      </div>
      <div className="table-components">
        <button
          type="button"
          onClick={onCalculate}
          disabled={!hasValidInput || calcLoading}
          style={{
            backgroundColor: hasValidInput ? "#006BCF" : undefined,
            color: hasValidInput ? "#fff" : undefined,
          }}
        >
          Расчёт
        </button>
        {(calcRows.length > 0 ||
          (calcData && Array.isArray(calcData.rows))) && (
          <button type="button" onClick={onDownloadExcel}>
            <img
              src="https://constrtodo.ru:3005/api/v1/constr/Excel_icon.png"
              alt="Скачать Excel"
              style={{ width: 40, height: 40 }}
            />
          </button>
        )}
         <button type="button" onClick={onShare}>
            <img
              src="https://constrtodo.ru:3005/api/v1/constr/share_icon_grey.svg"
              alt="Поделиться"
              style={{ width: 40, height: 40 }}
            />
          </button>
      </div>

      {calcLoading && <div style={{ marginTop: 8 }}>Расчёт…</div>}
      {calcError && (
        <div style={{ marginTop: 8, color: "crimson" }}>{calcError}</div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Выберите все данные для расчета</h3>
              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>Выберите все данные для расчета</p>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowModal(false)}>Закрыть</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
