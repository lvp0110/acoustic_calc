import { useState, useEffect, useRef, useMemo, useCallback, memo } from "react";

// Мемоизированный селект вынесен за пределы компонента, чтобы не переопределяться на каждом рендере
const MemoizedSelectComponent = memo(
  function SelectComponent({
    paramType,
    value,
    onChange,
    options,
    brandParamsNames,
    getImageUrl,
    SECTION_TITLES,
    capitalize,
  }) {
    const hasImages = useMemo(
      () => options.some((opt) => getImageUrl(opt)),
      [options, getImageUrl]
    );
    const brandParamsName = brandParamsNames?.[paramType] || "";

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
          brandParamsName={brandParamsName}
        />
      );
    }

    return (
      <SelectText
        paramType={paramType}
        value={value}
        onChange={onChange}
        options={options}
        SECTION_TITLES={SECTION_TITLES}
        capitalize={capitalize}
        brandParamsName={brandParamsName}
      />
    );
  },
  (prev, next) =>
    prev.paramType === next.paramType &&
    prev.value === next.value &&
    prev.onChange === next.onChange &&
    prev.options === next.options &&
    prev.brandParamsNames === next.brandParamsNames &&
    prev.getImageUrl === next.getImageUrl &&
    prev.SECTION_TITLES === next.SECTION_TITLES &&
    prev.capitalize === next.capitalize
);
import { useSearchParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { useAcoustic } from "../context/AcousticContext.jsx";
import SelectWithImages from "../components/SelectWithImages.jsx";
import SelectText from "../components/SelectText.jsx";
import CalcControls from "./CalcControls.jsx";
import CalcTable from "../components/CalcTable.jsx";
import "./Acoustic.css";

export default function Acoustic() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tableState, setTableState] = useState({
    brand: null,
    model: null,
    calcData: null,
    calcRows: [],
  });
  const { brand: tableBrand, model: tableModel, calcData: tableCalcData, calcRows: tableCalcRows } = tableState;
  const [description, setDescription] = useState("");
  const [descriptionLoading, setDescriptionLoading] = useState(false);
  const [descriptionError, setDescriptionError] = useState("");
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [brandParamsNames, setBrandParamsNames] = useState({});
  const tableDataRemovedFromUrl = useRef(false); // Флаг, что tableData был удален из URL
  const prevBrandRef = useRef(null); // Для отслеживания смены бренда
  const prevModelRef = useRef(null); // Для отслеживания смены модели
  const [brandChangeInProgress, setBrandChangeInProgress] = useState(false); // Флаг для блокировки восстановления таблицы при смене бренда (используем состояние для правильного рендера)
  const tableContainerRef = useRef(null); // Ref для контейнера таблицы
  const {
    BASE_URL,
    buildApiUrl,
    isReady,
    brandsLoading,
    brandsError,
    brands,
    brand,
    setBrand,

    paramsLoading,
    paramsError,
    paramOptions,
    fullOptionData,
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

  const resetTableState = useCallback(() => {
    setTableState({
      brand: null,
      model: null,
      calcData: null,
      calcRows: [],
    });
  }, []);

  const updateTableState = useCallback((next) => {
    setTableState((prev) => {
      const merged = typeof next === "function" ? next(prev) : next;
      if (
        prev.brand === merged.brand &&
        prev.model === merged.model &&
        prev.calcData === merged.calcData &&
        prev.calcRows === merged.calcRows
      ) {
        return prev;
      }
      return merged;
    });
  }, []);

  // Сброс ссылки на бренд таблицы при смене бренда, чтобы скрыть таблицу
  useEffect(() => {
    let timeoutId = null;
    
    if (!isReady) {
      prevBrandRef.current = brand;
      prevModelRef.current = model;
      if (brand) {
        // При инициализации, если бренд есть, но tableBrand не совпадает - очищаем
        if (tableBrand !== null && tableBrand !== brand) {
          resetTableState();
          tableDataRemovedFromUrl.current = false;
        }
      }
      return () => {
        if (timeoutId) clearTimeout(timeoutId);
      };
    }

    // Если бренд изменился, сбрасываем ссылку на бренд таблицы и очищаем данные
    if (prevBrandRef.current !== null && prevBrandRef.current !== brand) {
      // Устанавливаем флаг смены бренда
      setBrandChangeInProgress(true);
      
      // НЕМЕДЛЕННО скрываем таблицу, устанавливая tableBrand в null
      resetTableState();
      // Сбрасываем флаг восстановления
      tableDataRemovedFromUrl.current = false;
      
      // Сбрасываем флаг через небольшую задержку
      timeoutId = setTimeout(() => {
        setBrandChangeInProgress(false);
      }, 100);
    }
    
    // Если модель изменилась, сбрасываем таблицу (нужен новый расчет для новой модели)
    if (prevModelRef.current !== null && prevModelRef.current !== model) {
      resetTableState();
      tableDataRemovedFromUrl.current = false;
    }
    
    // Дополнительная проверка: если tableBrand не совпадает с текущим брендом, очищаем
    // Это важно для случая, когда бренд изменился, но useEffect не сработал
    if (tableBrand !== null && tableBrand !== brand) {
      resetTableState();
      tableDataRemovedFromUrl.current = false;
    }
    
    // Дополнительная проверка: если tableModel не совпадает с текущей моделью, очищаем
    if (tableModel !== null && tableModel !== model) {
      resetTableState();
      tableDataRemovedFromUrl.current = false;
    }
    
    prevBrandRef.current = brand;
    prevModelRef.current = model;
    
    // Возвращаем функцию очистки для предотвращения утечки памяти
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [brand, model, isReady, tableBrand, tableModel, resetTableState]);


  // Функция для определения, есть ли изображения в опциях
  const hasImagesInOptions = (options) => {
    return options.some((opt) => getImageUrl(opt));
  };

  // Компонент-обертка для выбора правильного селекта
  const SelectComponent = useMemo(() => MemoizedSelectComponent, []);

  // Преобразование brands в формат для SelectWithImages: { id, name, ... }
  // Сохраняем все исходные поля из API, чтобы getImageUrl мог найти изображение
  const brandOptions = useMemo(
    () =>
      brands.map((b) => ({
        ...b, // Сохраняем все исходные поля (включая Img, Name, ShortName и т.д.)
        id: b.code, // Перезаписываем id на code для SelectWithImages
        name: b.name, // Перезаписываем name для единообразия
      })),
    [brands]
  );

  // Обертка для setBrand
  const handleBrandChange = (newBrand) => {
    // Если бренд действительно меняется (включая сброс на пустое значение)
    if (isReady && brand !== newBrand) {
      // Устанавливаем флаг, что идет смена бренда - это заблокирует восстановление таблицы
      setBrandChangeInProgress(true);
      
      // НЕМЕДЛЕННО скрываем таблицу и очищаем данные (до вызова setBrand)
      resetTableState(); // Используем состояние для немедленного обновления UI
      tableDataRemovedFromUrl.current = false;
      
      // Сбрасываем описание
      setDescription("");
      setDescriptionError("");
      setIsDescriptionExpanded(false);
      
      // Сбрасываем все выбранные пункты (модель и все параметры)
      setModel("");
      setColor("");
      setSize("");
      setPerf("");
      setEdge("");
      
      // Удаляем все параметры из URL, включая tableData
      // Делаем это ПЕРЕД изменением бренда, чтобы предотвратить восстановление
      const newParams = new URLSearchParams();
      if (newBrand) {
        newParams.set("brand", newBrand);
      }
      setSearchParams(newParams, { replace: true });
      
      // Меняем бренд ПОСЛЕ очистки всех данных
      setBrand(newBrand);
      
      // Сбрасываем флаг через небольшую задержку, чтобы дать время всем useEffect выполниться
      // Используем setTimeout в обработчике события - это безопасно, так как он не будет активен после размонтирования
      setTimeout(() => {
        setBrandChangeInProgress(false);
      }, 200);
    } else {
      // Если бренд не меняется, просто устанавливаем его
      setBrand(newBrand);
    }
  };

  const handleTableDataChange = useCallback(
    (calcData, calcRows) => {
      // Если данных нет, сразу скрываем таблицу
      if (!calcData && (!calcRows || calcRows.length === 0)) {
        resetTableState();
        return;
      }

      // Если данные есть, проверяем, что бренд и модель совпадают
      if (tableBrand !== null && tableBrand !== brand) {
        // Если бренд не совпадает, не сохраняем данные
        return;
      }

      if (tableModel !== null && tableModel !== model) {
        // Если модель не совпадает, не сохраняем данные
        return;
      }

      updateTableState((prev) => {
        if (
          prev.brand === brand &&
          prev.model === model &&
          prev.calcData === calcData &&
          prev.calcRows === calcRows
        ) {
          return prev;
        }
        return {
          brand,
          model,
          calcData: calcData || null,
          calcRows: calcRows || [],
        };
      });
    },
    [brand, model, tableBrand, tableModel, resetTableState, updateTableState]
  );

  // ВАЖНО: Таблица НЕ должна восстанавливаться из URL!
  // Таблица показывается ТОЛЬКО после нажатия кнопки "Расчёт"
  // Удаляем tableData из URL только один раз при первой загрузке
  useEffect(() => {
    if (!isReady) return;
    
    // Удаляем tableData из URL только один раз при загрузке, чтобы таблица не восстанавливалась автоматически
    if (searchParams.has("tableData") && !tableDataRemovedFromUrl.current) {
      setSearchParams(
        (prevParams) => {
          const params = new URLSearchParams(prevParams);
          params.delete("tableData");
          return params;
        },
        { replace: true }
      );
      tableDataRemovedFromUrl.current = true; // Помечаем, что уже удалили
    }
  }, [isReady, searchParams, setSearchParams]);


  // Загрузка description из данных модели или бренда
  useEffect(() => {
    // Сначала очищаем description
    setDescription("");
    setDescriptionError("");
    setDescriptionLoading(false);
    
    if (!brand) {
      return;
    }

    // ПРИОРИТЕТ 1: Если выбрана модель, пытаемся получить описание модели
    if (model && fullOptionData?.model?.[model]) {
      const selectedModel = fullOptionData.model[model];
      const modelDescription = selectedModel?.Description || selectedModel?.description || selectedModel?.desc || "";
      const modelDescriptionStr = String(modelDescription).trim();
      
      if (modelDescriptionStr !== "") {
        setDescription(modelDescriptionStr);
        setDescriptionError("");
        setDescriptionLoading(false);
        return; // Выходим, так как нашли описание модели
      }
    }

    // ПРИОРИТЕТ 2: Если модель не выбрана или у модели нет описания, показываем описание бренда
    // Ищем описание в загруженных данных брендов
    const selectedBrand = brands.find((b) => {
      const matches = String(b.code) === String(brand);
      return matches;
    });
    
    // Если нашли бренд и у него есть описание, используем его
    if (selectedBrand) {
      // Проверяем, что это действительно правильный бренд
      if (String(selectedBrand.code) !== String(brand)) {
        console.error('[Description] CODE MISMATCH! Expected:', brand, 'Got:', selectedBrand.code);
        setDescription("");
        return;
      }
      
      // Проверяем description из разных возможных полей
      const brandDescription = selectedBrand.Description || selectedBrand.description || "";
      const descriptionStr = String(brandDescription).trim();
      
      if (descriptionStr !== "") {
        // ВАЖНО: Дополнительная проверка - убеждаемся, что description действительно принадлежит этому бренду
        const descriptionLower = descriptionStr.toLowerCase();
        const brandNameLower = selectedBrand.name.toLowerCase();
        const brandCodeLower = String(brand).toLowerCase();
        
        const containsBrandName = descriptionLower.includes(brandNameLower);
        const containsBrandCode = descriptionLower.includes(brandCodeLower);
        
        if (!containsBrandName && !containsBrandCode) {
          setDescription("");
          setDescriptionError("");
          setDescriptionLoading(false);
          return;
        }
        
        setDescription(descriptionStr);
        setDescriptionError("");
        setDescriptionLoading(false);
        return;
      } else {
        return;
      }
    }
    
    // Если бренд не найден, оставляем description пустым

    // Если описание не найдено в данных брендов, пытаемся загрузить из brandParams
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
        } catch {
          // Игнорируем ошибки парсинга JSON
        }

        if (!res.ok) {
          // Если 404 - это нормально, description может отсутствовать
          if (res.status === 404) {
            setDescription("");
            return;
          }
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
  }, [brand, model, brands, fullOptionData, buildApiUrl]); // Добавлены model и fullOptionData в зависимости

  // Прокрутка к таблице после расчета
  useEffect(() => {
    // Прокручиваем к таблице только если:
    // 1. Таблица видна (бренд и модель совпадают)
    // 2. Есть данные таблицы
    // 3. Контейнер таблицы существует
    if (
      tableBrand === brand &&
      tableModel === model &&
      tableBrand !== null &&
      tableModel !== null &&
      (tableCalcData || (tableCalcRows && tableCalcRows.length > 0)) &&
      tableContainerRef.current
    ) {
      // Используем setTimeout для того, чтобы прокрутка произошла после рендера
      setTimeout(() => {
        if (tableContainerRef.current) {
          tableContainerRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }
      }, 100);
    }
  }, [tableCalcData, tableCalcRows, tableBrand, tableModel, brand, model]);

  // Загрузка name из api/v1/brandParams с model для каждого типа опции
  useEffect(() => {
    if (!brand || !model) {
      setBrandParamsNames({});
      return;
    }

    const controller = new AbortController();
    (async () => {
      try {
        const url = buildApiUrl(
          `api/v1/brandParams/${encodeURIComponent(brand)}?model=${encodeURIComponent(model)}`
        );
        const res = await fetch(url, { signal: controller.signal });
        const text = await res.text();
        let json;
        try {
          json = JSON.parse(text);
        } catch (e) {
          console.error("Ошибка парсинга JSON:", e);
        }

        if (!res.ok) {
          console.warn("Ошибка загрузки brandParams:", res.status, text);
          setBrandParamsNames({});
          return;
        }

        // Извлекаем name для каждого типа опции из массива data
        const names = {};
        const dataArr = Array.isArray(json?.data) ? json.data : [];
        
        dataArr.forEach((item) => {
          const code = item?.code?.toLowerCase();
          const name = item?.name || item?.Name || item?.title || "";
          if (code && name && (code === "size" || code === "color" || code === "perf" || code === "edge")) {
            names[code] = name;
          }
        });

        // Также проверяем прямые поля в json
        if (json?.size?.name) {
          names.size = json.size.name;
        }
        if (json?.color?.name) {
          names.color = json.color.name;
        }
        if (json?.perf?.name) {
          names.perf = json.perf.name;
        }
        if (json?.edge?.name) {
          names.edge = json.edge.name;
        }

        // Проверяем также в корне json
        if (json?.name && typeof json.name === "object") {
          Object.keys(json.name).forEach((key) => {
            const lowerKey = key.toLowerCase();
            if (lowerKey === "size" || lowerKey === "color" || lowerKey === "perf" || lowerKey === "edge") {
              names[lowerKey] = json.name[key];
            }
          });
        }

        setBrandParamsNames(names);
      } catch (e) {
        if (e.name !== "AbortError") {
          console.error("Ошибка загрузки brandParams:", e);
          setBrandParamsNames({});
        }
      }
    })();

    return () => controller.abort();
  }, [brand, model, buildApiUrl]);

  // Пока не готовы (не прочитан URL) — ничего не показываем
  if (!isReady) {
    return (
      <div className="brands-container">
        <div style={{ padding: 20 }}>Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="brands-container">
      <div className="acoustic-content">
        <div className="acoustic-left-column">
          {/* Блок 1: Бренды и Модели */}
          <div className="block-1">
            {brandsLoading && !brand && <div>Загрузка брендов…</div>}
            {brandsError && (
              <div style={{ color: "crimson" }}>Ошибка: {brandsError}</div>
            )}
            {(!brandsLoading || brand) && !brandsError && (hasBrands || brand) && (
              <div style={{ marginBottom: 8 }}>
                <SelectWithImages
                  paramType="brand"
                  value={brand}
                  onChange={handleBrandChange}
                  options={brandOptions}
                  getImageUrl={getImageUrl}
                  SECTION_TITLES={{
                    ...SECTION_TITLES,
                    brand: { acc: "бренд", gen: "бренда" },
                  }}
                  capitalize={capitalize}
                />
              </div>
            )}

            {brand && paramsLoading && !model && <div>Загрузка моделей…</div>}
            {brand && paramsError && (
              <div style={{ color: "crimson" }}>Ошибка: {paramsError}</div>
            )}
            {brand && (!paramsLoading || model) && !paramsError && (hasModels || model) && (
              <div>
                <SelectComponent
                  paramType="model"
                  value={model}
                  onChange={setModel}
                  options={paramOptions.model}
                  brandParamsNames={brandParamsNames}
                  getImageUrl={getImageUrl}
                  SECTION_TITLES={SECTION_TITLES}
                  capitalize={capitalize}
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
                    brandParamsNames={brandParamsNames}
                    getImageUrl={getImageUrl}
                    SECTION_TITLES={SECTION_TITLES}
                    capitalize={capitalize}
                  />
                )}
                {hasColor && (
                  <SelectComponent
                    paramType="color"
                    value={color}
                    onChange={setColor}
                    options={paramOptions.color}
                    brandParamsNames={brandParamsNames}
                    getImageUrl={getImageUrl}
                    SECTION_TITLES={SECTION_TITLES}
                    capitalize={capitalize}
                  />
                )}
                {hasPerf && (
                  <SelectComponent
                    paramType="perf"
                    value={perf}
                    onChange={setPerf}
                    options={paramOptions.perf}
                    brandParamsNames={brandParamsNames}
                    getImageUrl={getImageUrl}
                    SECTION_TITLES={SECTION_TITLES}
                    capitalize={capitalize}
                  />
                )}
                {hasEdge && (
                  <SelectComponent
                    paramType="edge"
                    value={edge}
                    onChange={setEdge}
                    options={paramOptions.edge}
                    brandParamsNames={brandParamsNames}
                    getImageUrl={getImageUrl}
                    SECTION_TITLES={SECTION_TITLES}
                    capitalize={capitalize}
                  />
                )}
              </div>
            </div>
          )}

          {/* Блок 3: Калькулятор */}
          {brand && model && !depLoading && !depError && hasAnyDependent && (
            <div className="block-3">
              <CalcControls
                onTableDataChange={handleTableDataChange}
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
              {!descriptionLoading && !descriptionError && description && (
                <div className="description-content">
                  <ReactMarkdown style={{ fontWeight: 100 }}>{description}</ReactMarkdown>
                </div>
              )}
              {!descriptionLoading && !descriptionError && !description && (
                <div className="description-content" style={{ opacity: 0.5, fontStyle: "italic" }}>
                  Описание отсутствует
                </div>
              )}
            </div>
          )}
        </div>

        {/* Блок 4: Таблица результатов */}
        {/* Таблица показывается ТОЛЬКО если бренд и модель совпадают с теми, для которых был выполнен расчет */}
        {!brandChangeInProgress &&
         tableBrand === brand && 
         tableModel === model &&
         tableBrand !== null &&
         tableModel !== null &&
         brand &&
         model &&
         (tableCalcData || (tableCalcRows && tableCalcRows.length > 0)) && (
          <div className="block-4" ref={tableContainerRef}>
            <CalcTable calcData={tableCalcData} calcRows={tableCalcRows} />
          </div>
        )}
      </div>
    </div>
  );
}
