import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { useAcoustic } from "../context/AcousticContext.jsx";
import SelectWithImages from "../components/SelectWithImages.jsx";
import SelectText from "../components/SelectText.jsx";
import CalcControls from "./CalcControls.jsx";
import CalcTable from "../components/CalcTable.jsx";
import { decodeTableData } from "../utils/tableData.js";
import "./Acoustic.css";

export default function Acoustic() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tableCalcData, setTableCalcData] = useState(null);
  const [tableCalcRows, setTableCalcRows] = useState([]);
  const [description, setDescription] = useState("");
  const [descriptionLoading, setDescriptionLoading] = useState(false);
  const [descriptionError, setDescriptionError] = useState("");
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [brandParamsNames, setBrandParamsNames] = useState({});
  const tableDataRemovedFromUrl = useRef(false); // Флаг, что tableData был удален из URL
  const [tableBrand, setTableBrand] = useState(null); // Храним бренд, для которого была создана таблица (используем состояние для немедленного обновления)
  const [tableModel, setTableModel] = useState(null); // Храним модель, для которой была создана таблица
  const prevBrandRef = useRef(null); // Для отслеживания смены бренда
  const prevModelRef = useRef(null); // Для отслеживания смены модели
  const brandChangeInProgressRef = useRef(false); // Флаг для блокировки восстановления таблицы при смене бренда
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

  // Сброс ссылки на бренд таблицы при смене бренда, чтобы скрыть таблицу
  useEffect(() => {
    if (!isReady) {
      prevBrandRef.current = brand;
      prevModelRef.current = model;
      if (brand) {
        // При инициализации, если бренд есть, но tableBrand не совпадает - очищаем
        if (tableBrand !== null && tableBrand !== brand) {
          setTableBrand(null);
          setTableModel(null);
          setTableCalcData(null);
          setTableCalcRows([]);
          tableDataRemovedFromUrl.current = false;
        }
      }
      return;
    }

    // Если бренд изменился, сбрасываем ссылку на бренд таблицы и очищаем данные
    if (prevBrandRef.current !== null && prevBrandRef.current !== brand) {
      // Устанавливаем флаг смены бренда
      brandChangeInProgressRef.current = true;
      
      // НЕМЕДЛЕННО скрываем таблицу, устанавливая tableBrand в null
      setTableBrand(null);
      setTableModel(null);
      // Затем очищаем данные таблицы
      setTableCalcData(null);
      setTableCalcRows([]);
      // Сбрасываем флаг восстановления
      tableDataRemovedFromUrl.current = false;
      
      // Сбрасываем флаг через небольшую задержку
      setTimeout(() => {
        brandChangeInProgressRef.current = false;
      }, 100);
    }
    
    // Если модель изменилась, сбрасываем таблицу (нужен новый расчет для новой модели)
    if (prevModelRef.current !== null && prevModelRef.current !== model) {
      setTableBrand(null);
      setTableModel(null);
      setTableCalcData(null);
      setTableCalcRows([]);
      tableDataRemovedFromUrl.current = false;
    }
    
    // Дополнительная проверка: если tableBrand не совпадает с текущим брендом, очищаем
    // Это важно для случая, когда бренд изменился, но useEffect не сработал
    if (tableBrand !== null && tableBrand !== brand) {
      setTableBrand(null);
      setTableModel(null);
      setTableCalcData(null);
      setTableCalcRows([]);
      tableDataRemovedFromUrl.current = false;
    }
    
    // Дополнительная проверка: если tableModel не совпадает с текущей моделью, очищаем
    if (tableModel !== null && tableModel !== model) {
      setTableBrand(null);
      setTableModel(null);
      setTableCalcData(null);
      setTableCalcRows([]);
      tableDataRemovedFromUrl.current = false;
    }
    
    prevBrandRef.current = brand;
    prevModelRef.current = model;
  }, [brand, model, isReady, tableBrand, tableModel]);


  // Функция для определения, есть ли изображения в опциях
  const hasImagesInOptions = (options) => {
    return options.some((opt) => getImageUrl(opt));
  };

  // Компонент-обертка для выбора правильного селекта
  const SelectComponent = ({ paramType, value, onChange, options }) => {
    const hasImages = hasImagesInOptions(options);
    const brandParamsName = brandParamsNames[paramType] || "";

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
    } else {
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
    }
  };

  // Преобразование brands в формат для SelectWithImages: { id, name, ... }
  // Сохраняем все исходные поля из API, чтобы getImageUrl мог найти изображение
  const brandOptions = brands.map((b) => ({
    ...b, // Сохраняем все исходные поля (включая Img, Name, ShortName и т.д.)
    id: b.code, // Перезаписываем id на code для SelectWithImages
    name: b.name, // Перезаписываем name для единообразия
  }));

  // Обертка для setBrand
  const handleBrandChange = (newBrand) => {
    // Если бренд действительно меняется (включая сброс на пустое значение)
    if (isReady && brand !== newBrand) {
      // Устанавливаем флаг, что идет смена бренда - это заблокирует восстановление таблицы
      brandChangeInProgressRef.current = true;
      
      // НЕМЕДЛЕННО скрываем таблицу и очищаем данные (до вызова setBrand)
      setTableBrand(null); // Используем состояние для немедленного обновления UI
      setTableModel(null); // Также сбрасываем модель таблицы
      setTableCalcData(null);
      setTableCalcRows([]);
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
      setTimeout(() => {
        brandChangeInProgressRef.current = false;
      }, 200);
    } else {
      // Если бренд не меняется, просто устанавливаем его
      setBrand(newBrand);
    }
  };

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


  // Загрузка description из данных бренда (AcousticCategories)
  useEffect(() => {
    // Сначала очищаем description при смене бренда
    // Это важно, чтобы старые данные не оставались
    setDescription("");
    setDescriptionError("");
    setDescriptionLoading(false);
    
    if (!brand) {
      if (import.meta.env?.MODE === 'development') {
        console.log('[Description] No brand selected, description cleared');
      }
      return;
    }

    // Ищем описание в загруженных данных брендов
    // Важно: ищем по code, который соответствует выбранному brand
    // Используем строгое сравнение, чтобы убедиться, что находим правильный бренд
    const selectedBrand = brands.find((b) => {
      const matches = String(b.code) === String(brand);
      if (import.meta.env?.MODE === 'development' && matches) {
        console.log('[Description] Found matching brand:', {
          searchCode: brand,
          foundCode: b.code,
          foundName: b.name,
          hasDescription: !!(b.Description || b.description),
          hasDescriptionCapital: !!b.Description,
          hasDescriptionLower: !!b.description,
          hasImg: !!(b.Img && String(b.Img).trim() !== "")
        });
      }
      return matches;
    });
    
    if (import.meta.env?.MODE === 'development') {
      console.log('[Description] Looking for brand code:', brand);
      console.log('[Description] Available brand codes:', brands.map(b => ({ code: b.code, name: b.name })));
      console.log('[Description] Selected brand result:', selectedBrand ? { 
        code: selectedBrand.code, 
        name: selectedBrand.name, 
        hasDescription: !!selectedBrand.description,
        descriptionLength: selectedBrand.description ? selectedBrand.description.length : 0,
        hasImg: !!(selectedBrand.Img && String(selectedBrand.Img).trim() !== ""),
        Img: selectedBrand.Img
      } : 'NOT FOUND');
    }
    
    // Если нашли бренд и у него есть описание, используем его
    if (selectedBrand) {
      // Проверяем, что это действительно правильный бренд
      if (String(selectedBrand.code) !== String(brand)) {
        console.error('[Description] CODE MISMATCH! Expected:', brand, 'Got:', selectedBrand.code);
        setDescription("");
        return;
      }
      
      // Проверяем description из разных возможных полей
      // ВАЖНО: используем Description (с заглавной буквы) из исходного item, 
      // так как это поле сохраняется явно в normalizeBrands
      const brandDescription = selectedBrand.Description || selectedBrand.description || "";
      const descriptionStr = String(brandDescription).trim();
      
      if (import.meta.env?.MODE === 'development') {
        console.log('[Description] Checking description for brand', brand, '(', selectedBrand.name, '):', {
          hasDescription: !!selectedBrand.description,
          hasDescriptionCapital: !!selectedBrand.Description,
          descriptionValue: selectedBrand.Description ? selectedBrand.Description.substring(0, 50) + '...' : null,
          descriptionLength: descriptionStr.length,
          descriptionPreview: descriptionStr ? descriptionStr.substring(0, 100) + '...' : null
        });
      }
      
      if (descriptionStr !== "") {
        // ВАЖНО: Дополнительная проверка - убеждаемся, что description действительно принадлежит этому бренду
        // Проверяем, что description содержит название или код этого бренда
        const descriptionLower = descriptionStr.toLowerCase();
        const brandNameLower = selectedBrand.name.toLowerCase();
        const brandCodeLower = String(brand).toLowerCase();
        
        // Проверяем, содержит ли description название или код этого бренда
        const containsBrandName = descriptionLower.includes(brandNameLower);
        const containsBrandCode = descriptionLower.includes(brandCodeLower);
        
        if (import.meta.env?.MODE === 'development') {
          console.log('[Description] Validation for brand', brand, '(', selectedBrand.name, '):', {
            containsBrandName,
            containsBrandCode,
            brandName: selectedBrand.name,
            brandCode: brand
          });
        }
        
        // Если description не содержит название или код бренда, это может быть описание другого бренда
        // В этом случае не используем его
        if (!containsBrandName && !containsBrandCode) {
          if (import.meta.env?.MODE === 'development') {
            console.warn('[Description] ⚠️ Description does not contain brand name or code. Not using it for brand', brand);
            console.warn('[Description] Description preview:', descriptionStr.substring(0, 100));
          }
          setDescription("");
          setDescriptionError("");
          setDescriptionLoading(false);
          return;
        }
        
        if (import.meta.env?.MODE === 'development') {
          console.log('[Description] ✓ Setting description for brand', brand, '(', selectedBrand.name, ')');
          console.log('[Description] Description length:', descriptionStr.length);
          console.log('[Description] Description source:', selectedBrand.Description ? 'Description (capital)' : 'description (lowercase)');
        }
        setDescription(descriptionStr);
        setDescriptionError("");
        setDescriptionLoading(false);
        return;
      } else {
        // Если описание пустое, оставляем его пустым (уже очищено выше)
        if (import.meta.env?.MODE === 'development') {
          console.log('[Description] Brand', brand, 'has no description, leaving empty');
        }
        return;
      }
    }
    
    // Если бренд не найден, оставляем description пустым
    if (import.meta.env?.MODE === 'development') {
      console.warn('[Description] ✗ Brand', brand, 'not found in brands list');
    }
    
    console.log('[Description] Not found in brands data, trying API...', {
      brand,
      brandsCount: brands.length,
      selectedBrand: selectedBrand ? { code: selectedBrand.code, name: selectedBrand.name } : null
    });

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
        } catch {}

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
        console.log('[Description] Loaded from API:', desc || '(empty)', {
          hasJson: !!json,
          jsonKeys: json ? Object.keys(json) : [],
          hasData: !!json?.data,
          dataKeys: json?.data ? Object.keys(json.data) : []
        });
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
  }, [brand, brands, buildApiUrl]); // Зависимости: brand и brands - при изменении бренда description обновится

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
  }, [brand, model, BASE_URL]);

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
                  // Если данных нет, сразу скрываем таблицу
                  if (!calcData && (!calcRows || calcRows.length === 0)) {
                    setTableBrand(null);
                    setTableModel(null);
                    setTableCalcData(null);
                    setTableCalcRows([]);
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
                  
                  // Сохраняем данные только если бренд и модель совпадают
                  setTableCalcData(calcData);
                  setTableCalcRows(calcRows);
                  setTableBrand(brand);
                  setTableModel(model);
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
        {!brandChangeInProgressRef.current &&
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
