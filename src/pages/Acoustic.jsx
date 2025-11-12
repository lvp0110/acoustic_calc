import { useState, useEffect } from "react";
import { useAcoustic } from "../context/AcousticContext.jsx";
import SelectWithImages from "../components/SelectWithImages.jsx";
import SelectText from "../components/SelectText.jsx";
import CalcControls from "./CalcControls.jsx";
import CalcTable from "../components/CalcTable.jsx";
import "./Acoustic.css";

export default function Acoustic() {
  const [tableCalcData, setTableCalcData] = useState(null);
  const [tableCalcRows, setTableCalcRows] = useState([]);
  const [description, setDescription] = useState("");
  const [descriptionLoading, setDescriptionLoading] = useState(false);
  const [descriptionError, setDescriptionError] = useState("");
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const {
    BASE_URL,
    brandsLoading,
    brandsError,
    brands,
    brand,
    setBrand,

    paramsLoading,
    paramsError,
    paramOptions,
    model,
    setModel,

    depLoading,
    depError,
    hasAnyDependent,
    hasColor,
    hasSize,
    hasPerf,
    hasEdge,
    color,
    setColor,
    size,
    setSize,
    perf,
    setPerf,
    edge,
    setEdge,

    SECTION_TITLES,
    capitalize,
    getImageUrl,
    hasBrands,
    hasModels,
  } = useAcoustic();

  // Функция для определения, есть ли изображения в опциях
  const hasImagesInOptions = (options) => {
    return options.some((opt) => getImageUrl(opt));
  };

  // Компонент-обертка для выбора правильного селекта
  const SelectComponent = ({ paramType, value, onChange, options }) => {
    const hasImages = hasImagesInOptions(options);

    if (hasImages) {
      return (
        <SelectWithImages
          paramType={paramType}
          value={value}
          onChange={onChange}
          options={options}
          getImageUrl={getImageUrl}
          SECTION_TITLES={SECTION_TITLES}
          capitalize={capitalize}
        />
      );
    } else {
      return (
        <SelectText
          paramType={paramType}
          value={value}
          onChange={onChange}
          options={options}
          SECTION_TITLES={SECTION_TITLES}
          capitalize={capitalize}
        />
      );
    }
  };

  // Преобразование brands из { code, name } в { id, name } для SelectText
  const brandOptions = brands.map((b) => ({ id: b.code, name: b.name }));

  // Helper для правильного формирования URL
  const buildApiUrl = (path) => {
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    if (!BASE_URL || BASE_URL === "") {
      return `/${cleanPath}`;
    }
    const cleanBase = BASE_URL.endsWith("/") ? BASE_URL.slice(0, -1) : BASE_URL;
    return `${cleanBase}/${cleanPath}`;
  };

  // Загрузка description из api/v1/brandParams
  useEffect(() => {
    if (!brand) {
      setDescription("");
      setDescriptionError("");
      return;
    }

    const controller = new AbortController();
    (async () => {
      try {
        setDescriptionLoading(true);
        setDescriptionError("");
        setDescription("");

        const url = buildApiUrl(
          `api/v1/brandParams/${encodeURIComponent(brand)}`
        );
        const res = await fetch(url, { signal: controller.signal });
        const text = await res.text();
        let json;
        try {
          json = JSON.parse(text);
        } catch {}

        if (!res.ok) {
          const msg =
            json?.message || json?.error || text || `HTTP ${res.status}`;
          throw new Error(msg);
        }

        // Пытаемся получить description из разных возможных мест в ответе
        const desc =
          json?.description ||
          json?.data?.description ||
          json?.Description ||
          "";
        setDescription(desc || "");
      } catch (e) {
        if (e.name !== "AbortError") {
          setDescriptionError(e.message || "Ошибка загрузки описания");
        }
      } finally {
        setDescriptionLoading(false);
      }
    })();

    return () => controller.abort();
  }, [brand, BASE_URL]);

  return (
    <div className="brands-container">
      <div className="acoustic-content">
        <div className="acoustic-left-column">
          {/* Блок 1: Бренды и Модели */}
          <div className="block-1">
            {brandsLoading && <div>Загрузка брендов…</div>}
            {brandsError && (
              <div style={{ color: "crimson" }}>Ошибка: {brandsError}</div>
            )}
            {!brandsLoading && !brandsError && hasBrands && (
              <div style={{ marginBottom: 8 }}>
                <SelectText
                  paramType="brand"
                  value={brand}
                  onChange={setBrand}
                  options={brandOptions}
                  SECTION_TITLES={{
                    ...SECTION_TITLES,
                    brand: { acc: "бренд", gen: "бренда" },
                  }}
                  capitalize={capitalize}
                />
              </div>
            )}

            {brand && paramsLoading && <div>Загрузка моделей…</div>}
            {brand && paramsError && (
              <div style={{ color: "crimson" }}>Ошибка: {paramsError}</div>
            )}
            {brand && !paramsLoading && !paramsError && hasModels && (
              <div>
                <SelectComponent
                  paramType="model"
                  value={model}
                  onChange={setModel}
                  options={paramOptions.model}
                />
              </div>
            )}
          </div>

          {/* Блок 2: Опции модели (размеры, цвета, кромки, перфорация) */}
          {brand && model && depLoading && <div>Загрузка опций модели…</div>}
          {brand && model && depError && (
            <div style={{ color: "crimson" }}>Ошибка: {depError}</div>
          )}
          {brand && model && !depLoading && !depError && hasAnyDependent && (
            <div className="block-2">
              <div className="options-grid">
                {hasSize && (
                  <SelectComponent
                    paramType="size"
                    value={size}
                    onChange={setSize}
                    options={paramOptions.size}
                  />
                )}
                {hasColor && (
                  <SelectComponent
                    paramType="color"
                    value={color}
                    onChange={setColor}
                    options={paramOptions.color}
                  />
                )}
                {hasPerf && (
                  <SelectComponent
                    paramType="perf"
                    value={perf}
                    onChange={setPerf}
                    options={paramOptions.perf}
                  />
                )}
                {hasEdge && (
                  <SelectComponent
                    paramType="edge"
                    value={edge}
                    onChange={setEdge}
                    options={paramOptions.edge}
                  />
                )}
              </div>
            </div>
          )}

          {/* Блок 3: Калькулятор */}
          {brand && model && !depLoading && !depError && hasAnyDependent && (
            <div className="block-3">
              <CalcControls
                onTableDataChange={(calcData, calcRows) => {
                  setTableCalcData(calcData);
                  setTableCalcRows(calcRows);
                }}
              />
            </div>
          )}

          {/* Блок с описанием (description) */}
          {brand && (
            <div
              className={`block-description ${
                isDescriptionExpanded ? "expanded" : ""
              }`}
              onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
            >
              {descriptionLoading && <div>Загрузка описания…</div>}
              {descriptionError && (
                <div style={{ color: "crimson" }}>
                  Ошибка: {descriptionError}
                </div>
              )}
              {/* Временный lorem текст для проверки */}
              <div className="description-content">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
                enim ad minim veniam, quis nostrud exercitation ullamco laboris
                nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor
                in reprehenderit in voluptate velit esse cillum dolore eu fugiat
                nulla pariatur. Excepteur sint occaecat cupidatat non proident,
                sunt in culpa qui officia deserunt mollit anim id est laborum.
                Sed ut perspiciatis unde omnis iste natus error sit voluptatem
                accusantium doloremque laudantium, totam rem aperiam, eaque ipsa
                quae ab illo inventore veritatis et quasi architecto beatae vitae
                dicta sunt explicabo.
              </div>
              {!descriptionLoading && !descriptionError && description && (
                <div className="description-content">{description}</div>
              )}
            </div>
          )}
        </div>

        {/* Блок 4: Таблица результатов */}
        {(tableCalcData || (tableCalcRows && tableCalcRows.length > 0)) && (
          <div className="block-4">
            <CalcTable calcData={tableCalcData} calcRows={tableCalcRows} />
          </div>
        )}
      </div>
    </div>
  );
}
