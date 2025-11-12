import { useState } from "react";
import { useAcoustic } from "../context/AcousticContext.jsx";
import SelectWithImages from "../components/SelectWithImages.jsx";
import SelectText from "../components/SelectText.jsx";
import CalcControls from "./CalcControls.jsx";
import CalcTable from "../components/CalcTable.jsx";
import "./Acoustic.css";

export default function Acoustic() {
  const [tableCalcData, setTableCalcData] = useState(null);
  const [tableCalcRows, setTableCalcRows] = useState([]);
  const {
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

  return (
    <div className="brands-container">
      <div style={{ width: "100%", maxWidth: 600 }}>
        {/* Блок 1: Бренды и Модели */}
        <div className="block-1">
          {brandsLoading && <div>Загрузка брендов…</div>}
          {brandsError && (
            <div style={{ color: "crimson" }}>Ошибка: {brandsError}</div>
          )}
          {!brandsLoading && !brandsError && hasBrands && (
            <div style={{ marginBottom: 12 }}>
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
            <div style={{ marginBottom: 12 }}>
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