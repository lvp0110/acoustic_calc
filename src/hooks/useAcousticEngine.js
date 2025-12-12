import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

// Определение BASE_URL с учетом окружения
const getBaseUrl = () => {
  const mode = import.meta.env?.MODE || 'development';
  const envUrl = import.meta.env?.VITE_API_URL;
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  
  
  // 1. Используем переменную окружения, если она задана (приоритет)
  if (envUrl) {
    const url = String(envUrl).trim();
    // Если URL не пустой и не равен 'undefined' или 'null' (строки)
    if (url && url !== 'undefined' && url !== 'null' && url !== '') {
      // Проверяем, что URL не указывает на текущий сайт (GitHub Pages)
      if (currentOrigin && url.includes(currentOrigin)) {
        console.error('[BASE_URL] ERROR: VITE_API_URL points to the same domain as the site!');
        console.error('[BASE_URL] VITE_API_URL should point to your API server, not to GitHub Pages.');
        console.error('[BASE_URL] Current VITE_API_URL:', url);
        console.error('[BASE_URL] Current site origin:', currentOrigin);
        console.error('[BASE_URL] Please set VITE_API_URL to your actual API server URL (e.g., https://api.yourdomain.com)');
        // В production это критическая ошибка
        if (mode === 'production') {
          return ""; // Вернем пустую строку, чтобы запросы явно провалились
        }
      }
      return url;
    }
  }
  
  // 2. В production (на GitHub Pages)
  if (mode === 'production') {
    // Если API на том же домене - используем относительный путь (пустая строка)
    // Если API на другом домене - нужно задать VITE_API_URL через GitHub Secrets
    // В этом случае вернется пустая строка, что приведет к использованию относительных путей
    // Если нужен другой домен, обязательно задайте VITE_API_URL через GitHub Secrets
    console.error('[BASE_URL] VITE_API_URL is not set in production! API requests will fail.');
    console.error('[BASE_URL] Please set VITE_API_URL secret in GitHub repository settings:');
    console.error('[BASE_URL] Settings → Secrets and variables → Actions → New repository secret');
    console.error('[BASE_URL] The secret should contain your API server URL (e.g., https://api.yourdomain.com)');
    console.error('[BASE_URL] NOT the GitHub Pages URL!');
    return "";
  }
  
  // 3. По умолчанию для разработки - используем пустую строку для относительных путей
  // Это позволит использовать proxy из vite.config.js
  return "";
};

const BASE_URL = getBaseUrl();


if (import.meta.env?.MODE === 'production') {
  if (!BASE_URL) {
    console.error('[BASE_URL] ⚠️  API requests will fail because BASE_URL is empty!');
    console.error('[BASE_URL] Set VITE_API_URL secret to your API server URL.');
  }
}

const URL_PARAM_KEYS = ["brand", "model", "color", "size", "perf", "edge"];

const SECTION_TITLES = {
  model: { acc: "модель", gen: "модели" },
  color: { acc: "цвет", gen: "цвета" },
  size: { acc: "размер", gen: "размера" },
  perf: { acc: "перфорацию", gen: "перфорации" },
  edge: { acc: "кромку", gen: "кромки" },
};

const capitalize = (s) =>
  typeof s === "string" && s.length ? s[0].toUpperCase() + s.slice(1) : s;

// ——— helpers ———
const normalizeBrands = (raw) => {
  const arr = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
  return arr.map((item, idx) => {
    const code = String(
      item?.ShortName ?? item?.code ?? item?.slug ?? item?.id ?? `brand-${idx}`
    );
    const name = String(item?.Name ?? item?.name ?? item?.title ?? code);
    
    // ВАЖНО: Сохраняем Img и Description из исходного item ПЕРЕД spread,
    // чтобы они не перезаписывались другими полями
    // Используем ТОЛЬКО данные из этого конкретного item
    const originalImg = item?.Img || item?.img || null;
    const originalDescription = item?.Description || item?.description || item?.desc || null;
    
    // Нормализуем description - используем только из исходного item
    const description = originalDescription ? String(originalDescription).trim() : "";
    
    // Сохраняем все исходные поля из API, чтобы getImageUrl мог найти изображение
    // Это важно, так как API может возвращать изображения в различных полях
    // ВАЖНО: сначала распространяем item, затем перезаписываем нормализованными полями,
    // и в конце явно устанавливаем Img и Description из исходного item
    const normalized = { 
      ...item, // Сначала распространяем все исходные поля
      code,    // Затем перезаписываем нормализованные поля
      name, 
      description,
      // Явно сохраняем Img и Description из исходного item, чтобы они точно были из этого бренда
      // Это гарантирует, что каждый бренд получает только свои данные
      Img: originalImg,
      Description: originalDescription
    };
    
    return normalized;
  });
};

const toOptions = (list) => {
  const arr = Array.isArray(list) ? list : [];
  return arr.map((item, idx) => {
    if (typeof item === "string" || typeof item === "number") {
      const v = String(item);
      return { id: v, name: v };
    }
    const id = String(item?.id ?? item?.code ?? item?.value ?? `opt-${idx}`);
    const name = String(item?.name ?? item?.Name ?? item?.title ?? id);
    return { id, name, ...item };
  });
};

const pickArray = (obj, keys) => {
  for (const k of keys) {
    const v = obj?.[k];
    if (Array.isArray(v)) return v;
  }
  return undefined;
};

const extractByCodeFromArray = (dataArr, code) => {
  const p = (dataArr || []).find(
    (x) => typeof x?.code === "string" && x.code.toLowerCase() === code
  );
  if (!p) return undefined;
  return pickArray(p, ["list", "values", "options"]) || (Array.isArray(p) ? p : undefined);
};

// Helper для правильного формирования URL
const buildApiUrl = (path) => {
  // Убираем начальный слеш из path, если он есть
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  if (!BASE_URL || BASE_URL === '') {
    // Если BASE_URL пустой в production, это означает что API на другом домене
    // и нужно задать VITE_API_URL через GitHub Secrets
    // В production нельзя использовать относительные пути для внешнего API
    if (import.meta.env?.MODE === 'production') {
      const errorMsg = `[buildApiUrl] BASE_URL is empty! Cannot build URL for: ${cleanPath}`;
      console.error(errorMsg);
      console.error('[buildApiUrl] VITE_API_URL secret must be set in GitHub repository settings.');
      // Возвращаем пустую строку, чтобы запрос явно провалился
      // Это лучше, чем делать запрос на неправильный URL
      return '';
    }
    // В development используем относительный путь (будет проксироваться через vite)
    const relativeUrl = `/${cleanPath}`;
    return relativeUrl;
  }
  
  // Убираем завершающий слеш из BASE_URL, если он есть
  const cleanBase = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
  const finalUrl = `${cleanBase}/${cleanPath}`;
  
  return finalUrl;
};

const getImageUrl = (option) => {
  if (!option) {
    console.warn('[getImageUrl] Option is null or undefined');
    return null;
  }
  
  // Проверяем все возможные варианты полей с изображениями
  // Для брендов приоритет отдаем полю Img (с заглавной буквы), так как API возвращает именно его
  // Важно: проверяем, что значение не пустое (не null, не undefined, не пустая строка)
  const imageFile =
    (option?.Img && String(option.Img).trim() !== "") ? option.Img :  // Приоритет для брендов (API возвращает Img)
    (option?.img && String(option.img).trim() !== "") ? option.img :
    (option?.Image && String(option.Image).trim() !== "") ? option.Image :
    (option?.image && String(option.image).trim() !== "") ? option.image :
    (option?.ImageFile && String(option.ImageFile).trim() !== "") ? option.ImageFile :
    (option?.imageFile && String(option.imageFile).trim() !== "") ? option.imageFile :
    (option?.ImageUrl && String(option.ImageUrl).trim() !== "") ? option.ImageUrl :
    (option?.imageUrl && String(option.imageUrl).trim() !== "") ? option.imageUrl :
    (option?.Section_img && String(option.Section_img).trim() !== "") ? option.Section_img :
    (option?.section_img && String(option.section_img).trim() !== "") ? option.section_img :
    (option?.File && String(option.File).trim() !== "") ? option.File :
    (option?.file && String(option.file).trim() !== "") ? option.file :
    (option?.Filename && String(option.Filename).trim() !== "") ? option.Filename :
    (option?.filename && String(option.filename).trim() !== "") ? option.filename :
    (option?.Photo && String(option.Photo).trim() !== "") ? option.Photo :
    (option?.photo && String(option.photo).trim() !== "") ? option.photo :
    (option?.Picture && String(option.Picture).trim() !== "") ? option.Picture :
    (option?.picture && String(option.picture).trim() !== "") ? option.picture :
    (option?.Logo && String(option.Logo).trim() !== "") ? option.Logo :
    (option?.logo && String(option.logo).trim() !== "") ? option.logo :
    (option?.Icon && String(option.Icon).trim() !== "") ? option.Icon :
    (option?.icon && String(option.icon).trim() !== "") ? option.icon :
    null;

  if (!imageFile) {
    return null;
  }
  
  // Если уже полный URL (начинается с http), возвращаем как есть
  if (String(imageFile).startsWith("http")) {
    return imageFile;
  }
  
  // Формируем полный URL для изображений
  // Если BASE_URL установлен, используем его
  if (BASE_URL && BASE_URL.trim() !== "") {
    const cleanBase = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
    // Убираем начальный слеш из imageFile, если он есть
    const cleanImageFile = imageFile.startsWith('/') ? imageFile.slice(1) : imageFile;
    const fullUrl = `${cleanBase}/api/v1/constr/${cleanImageFile}`;
    return fullUrl;
  }
  
  // Если BASE_URL не установлен, определяем URL в зависимости от окружения
  const mode = import.meta.env?.MODE || 'development';
  let fullUrl;
  // Убираем начальный слеш из imageFile, если он есть
  const cleanImageFile = imageFile.startsWith('/') ? imageFile.slice(1) : imageFile;
  if (mode === 'production') {
    // В production используем полный URL к API серверу
    fullUrl = `https://constrtodo.ru:3005/api/v1/constr/${cleanImageFile}`;
  } else {
    // В development используем localhost (как в proxy)
    fullUrl = `http://localhost:3005/api/v1/constr/${cleanImageFile}`;
  }
  return fullUrl;
};

// ——— hook engine ———
export function useAcousticEngine() {
  // 1) Бренды
  const [brands, setBrands] = useState([]);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [brandsError, setBrandsError] = useState("");
  const [brand, setBrand] = useState("");

  // 2) Параметры бренда (модели)
  const [paramsLoading, setParamsLoading] = useState(false);
  const [paramsError, setParamsError] = useState("");

  // 3) Зависимые параметры модели
  const [depLoading, setDepLoading] = useState(false);
  const [depError, setDepError] = useState("");

  // Опции
  const [paramOptions, setParamOptions] = useState({
    model: [],
    color: [],
    size: [],
    perf: [],
    edge: [],
  });

  // Полные данные опций
  const [fullOptionData, setFullOptionData] = useState({
    model: {},
    color: {},
    size: {},
    perf: {},
    edge: {},
  });

  // Выборы
  const [model, setModel] = useState("");
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [perf, setPerf] = useState("");
  const [edge, setEdge] = useState("");

  // Инициализация/URL
  const [searchParams, setSearchParams] = useSearchParams();
  const [isReady, setIsReady] = useState(false); // стало готово после чтения URL
  const skipNextBrandReset = useRef(false); // пропустить сброс при первичной установке brand из URL
  const skipNextModelReset = useRef(false); // пропустить сброс при первичной установке model из URL
  const lastQS = useRef("");
  const urlValuesFromInit = useRef({ color: "", size: "", perf: "", edge: "" }); // сохраняем значения из URL при инициализации

  const brandsUrl = useMemo(() => buildApiUrl('api/v1/AcousticCategories'), []);
  const hasBrands = brands.length > 0;
  const hasModels = paramOptions.model.length > 0;
  const hasColor = paramOptions.color.length > 0;
  const hasSize = paramOptions.size.length > 0;
  const hasPerf = paramOptions.perf.length > 0;
  const hasEdge = paramOptions.edge.length > 0;
  const hasAnyDependent = hasColor || hasSize || hasPerf || hasEdge;

  const paramsUrl = useMemo(() => {
    if (!brand) return null;
    return buildApiUrl(`api/v1/brandParams/${encodeURIComponent(brand)}`);
  }, [brand]);

  const modelParamsUrl = useMemo(() => {
    if (!brand || !model) return null;
    return buildApiUrl(`api/v1/brandParams/${encodeURIComponent(brand)}?model=${encodeURIComponent(model)}`);
  }, [brand, model]);

  // ——— 1) Гидратация из URL при первом рендере ———
  useEffect(() => {
    const b = searchParams.get("brand") || "";
    const m = searchParams.get("model") || "";
    const c = searchParams.get("color") || "";
    const s = searchParams.get("size") || "";
    const p = searchParams.get("perf") || "";
    const e = searchParams.get("edge") || "";

    // Сохраняем значения из URL для последующего восстановления после загрузки опций
    urlValuesFromInit.current = { color: c, size: s, perf: p, edge: e };

    // Инициализируем lastQS из текущего URL, чтобы избежать ложных срабатываний синхронизации
    const initParams = new URLSearchParams(searchParams);
    for (const key of URL_PARAM_KEYS) {
      if (!initParams.get(key)) {
        initParams.delete(key);
      }
    }
    lastQS.current = initParams.toString();

    if (b) {
      setBrand(b);
      skipNextBrandReset.current = true;
    }
    if (m) {
      setModel(m);
      skipNextModelReset.current = true;
    }
    if (c) setColor(c);
    if (s) setSize(s);
    if (p) setPerf(p);
    if (e) setEdge(e);

    setIsReady(true); // разрешаем UI (редиректы/запись в URL) после чтения
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // только на маунт

  // ——— 2) Синхронизация состояния -> URL (после инициализации) ———
  useEffect(() => {
    if (!isReady) return;

    const cur = new URLSearchParams(searchParams);
    
    // Проверяем, нужно ли обновлять URL
    let needsUpdate = false;
    const kv = { brand, model, color, size, perf, edge };
    
    // Проверяем каждый параметр
    for (const [key, value] of Object.entries(kv)) {
      const urlValue = cur.get(key);
      if (value && urlValue !== value) {
        cur.set(key, value);
        needsUpdate = true;
      } else if (!value && urlValue) {
        // Удаляем только если значение действительно пустое
        cur.delete(key);
        needsUpdate = true;
      }
    }

    // Если изменений нет, не обновляем URL
    if (!needsUpdate) return;

    const nextQS = cur.toString();
    if (nextQS === lastQS.current) return;

    lastQS.current = nextQS;
    setSearchParams(cur, { replace: true });
  }, [brand, model, color, size, perf, edge, isReady, searchParams, setSearchParams]);

  // ——— 3) Загрузка брендов ———
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        setBrandsLoading(true);
        setBrandsError("");

        if (!brandsUrl || brandsUrl === '') {
          throw new Error('URL для загрузки брендов не сформирован. Проверьте конфигурацию BASE_URL.');
        }

        const res = await fetch(brandsUrl, { signal: controller.signal });
        const text = await res.text();
        let json;
        try {
          json = JSON.parse(text);
        } catch (parseError) {
          console.error('[useAcousticEngine] Ошибка парсинга JSON ответа:', parseError);
          console.error('[useAcousticEngine] Ответ сервера (текст):', text.substring(0, 500));
        }
        
        if (!res.ok) {
          console.error('[useAcousticEngine] Ошибка HTTP:', res.status, res.statusText);
          console.error('[useAcousticEngine] URL:', brandsUrl);
          console.error('[useAcousticEngine] Ответ сервера:', text.substring(0, 500));
          
          // Формируем понятное сообщение об ошибке
          let errorMessage = '';
          if (res.status === 500) {
            errorMessage = 'Ошибка сервера (500). Сервер не может обработать запрос. ';
            errorMessage += 'Проверьте, что сервер запущен и доступен. ';
            if (json?.message || json?.error || json?.Message || json?.Error) {
              errorMessage += `Детали: ${json?.message || json?.error || json?.Message || json?.Error}`;
            }
          } else {
            errorMessage = json?.message || json?.error || json?.Message || json?.Error || text || `HTTP ${res.status} ${res.statusText}`;
          }
          
          throw new Error(errorMessage);
        }
        
        // Проверяем, что получили данные
        if (!json) {
          throw new Error('Сервер вернул пустой ответ');
        }
        
        const normalized = normalizeBrands(json);
        
        if (!normalized || normalized.length === 0) {
          console.warn('[useAcousticEngine] Получен пустой список брендов');
        }
        
        setBrands(normalized);
      } catch (e) {
        if (e.name !== "AbortError") {
          console.error('[useAcousticEngine] Ошибка загрузки брендов:', e);
          setBrandsError(e.message || "Ошибка загрузки брендов");
        }
      } finally {
        setBrandsLoading(false);
      }
    })();
    return () => controller.abort();
  }, [brandsUrl]);

  // ——— 4) Сброс при смене бренда (после инициализации; пропустить 1 раз после чтения из URL) ———
  useEffect(() => {
    if (!isReady) return;

    if (skipNextBrandReset.current) {
      skipNextBrandReset.current = false;
      return; // не сбрасываем то, что пришло из URL
    }

    // Пользователь реально сменил бренд — чистим зависимые
    setModel("");
    setColor("");
    setSize("");
    setPerf("");
    setEdge("");
    setParamOptions({ model: [], color: [], size: [], perf: [], edge: [] });
    setFullOptionData({ model: {}, color: {}, size: {}, perf: {}, edge: {} });
    setParamsError("");
    setDepError("");
    setParamsLoading(false);
    setDepLoading(false);
  }, [brand, isReady]);

  // ——— 5) Загрузка параметров бренда (модели) ———
  useEffect(() => {
    if (!paramsUrl) return;
    const controller = new AbortController();
    (async () => {
      try {
        setParamsLoading(true);
        setParamsError("");

        const res = await fetch(paramsUrl, { signal: controller.signal });
        const text = await res.text();
        let json;
        try {
          json = JSON.parse(text);
        } catch {
          // Игнорируем ошибки парсинга JSON
        }
        if (!res.ok) {
          const msg = json?.message || json?.error || text || `HTTP ${res.status}`;
          throw new Error(msg);
        }

        const dataArr = Array.isArray(json?.data) ? json.data : [];
        const modelParam =
          dataArr.find(
            (p) => p?.type === "select" && String(p?.code).toLowerCase() === "model"
          ) || dataArr.find((p) => p?.type === "select") || null;

        const modelList = toOptions(modelParam?.list);
        setParamOptions((prev) => ({ ...prev, model: modelList }));

        const fullData = {};
        modelList.forEach((item) => (fullData[item.id] = item));
        setFullOptionData((prev) => ({ ...prev, model: fullData }));

      } catch (e) {
        if (e.name !== "AbortError")
          setParamsError(e.message || "Ошибка загрузки параметров");
      } finally {
        setParamsLoading(false);
      }
    })();
    return () => controller.abort();
  }, [paramsUrl]);

  // ——— 6) Загрузка зависимых опций после выбора модели ———
  useEffect(() => {
    if (!modelParamsUrl) {
      // Не сбрасываем значения, если они пришли из URL и еще не были проверены
      // Сбрасываем только если это не первая загрузка (isReady = true) и нет сохраненных значений из URL
      const hasUrlValues = urlValuesFromInit.current.color || urlValuesFromInit.current.size || 
                          urlValuesFromInit.current.perf || urlValuesFromInit.current.edge;
      
      if (isReady && !hasUrlValues) {
        // Только сбрасываем, если это не первая загрузка и нет значений из URL
        setColor("");
        setSize("");
        setPerf("");
        setEdge("");
      }
      
      setParamOptions((prev) => ({ ...prev, color: [], size: [], perf: [], edge: [] }));
      setFullOptionData((prev) => ({ ...prev, color: {}, size: {}, perf: {}, edge: {} }));
      setDepError("");
      setDepLoading(false);
      return;
    }
    const controller = new AbortController();
    (async () => {
      try {
        setDepLoading(true);
        setDepError("");

        const res = await fetch(modelParamsUrl, { signal: controller.signal });
        const text = await res.text();
        let json;
        try {
          json = JSON.parse(text);
        } catch {
          // Игнорируем ошибки парсинга JSON
        }
        if (!res.ok) {
          const msg = json?.message || json?.error || text || `HTTP ${res.status}`;
          throw new Error(msg);
        }

        const dataArr = Array.isArray(json?.data) ? json.data : [];
        const dataObj = Array.isArray(json?.data) ? {} : json?.data || json;

        const listColorA = extractByCodeFromArray(dataArr, "color");
        const listSizeA = extractByCodeFromArray(dataArr, "size");
        const listPerfA = extractByCodeFromArray(dataArr, "perf");
        const listEdgeA = extractByCodeFromArray(dataArr, "edge");

        const listColorB =
          pickArray(dataObj, ["colors", "color", "listColor", "listColors"]) ||
          pickArray(json, ["colors", "color"]);
        const listSizeB =
          pickArray(dataObj, ["sizes", "size", "listSize", "listSizes"]) ||
          pickArray(json, ["sizes", "size"]);
        const listPerfB =
          pickArray(dataObj, ["perfs", "perf", "perforation", "listPerf", "listPerfs"]) ||
          pickArray(json, ["perfs", "perf"]);
        const listEdgeB =
          pickArray(dataObj, ["edges", "edge", "listEdge", "listEdges"]) ||
          pickArray(json, ["edges", "edge"]);

        const next = {
          color: toOptions(listColorA || listColorB || []),
          size: toOptions(listSizeA || listSizeB || []),
          perf: toOptions(listPerfA || listPerfB || []),
          edge: toOptions(listEdgeA || listEdgeB || []),
        };

        setParamOptions((prev) => ({ ...prev, ...next }));

        const fullDataMap = { color: {}, size: {}, perf: {}, edge: {} };
        Object.keys(next).forEach((k) => next[k].forEach((item) => (fullDataMap[k][item.id] = item)));
        setFullOptionData((prev) => ({ ...prev, ...fullDataMap }));


        // Валидируем и восстанавливаем значения из URL после загрузки опций
        // Сначала проверяем значения из URL при инициализации, затем текущие значения
        // Это гарантирует, что значения из URL будут восстановлены даже если они были сброшены
        const restoreFromUrl = (paramName, options) => {
          const urlValue = urlValuesFromInit.current[paramName];
          if (urlValue && options.length > 0 && options.find((o) => o.id === urlValue)) {
            return urlValue;
          }
          return null;
        };
        
        setColor((currentValue) => {
          // Сначала пытаемся восстановить из URL
          const urlValue = restoreFromUrl("color", next.color);
          if (urlValue) return urlValue;
          // Если текущее значение валидно, оставляем его
          if (currentValue && next.color.find((o) => o.id === currentValue)) {
            return currentValue;
          }
          return "";
        });
        
        setSize((currentValue) => {
          const urlValue = restoreFromUrl("size", next.size);
          if (urlValue) return urlValue;
          if (currentValue && next.size.find((o) => o.id === currentValue)) {
            return currentValue;
          }
          return "";
        });
        
        setPerf((currentValue) => {
          const urlValue = restoreFromUrl("perf", next.perf);
          if (urlValue) return urlValue;
          if (currentValue && next.perf.find((o) => o.id === currentValue)) {
            return currentValue;
          }
          return "";
        });
        
        setEdge((currentValue) => {
          const urlValue = restoreFromUrl("edge", next.edge);
          if (urlValue) return urlValue;
          if (currentValue && next.edge.find((o) => o.id === currentValue)) {
            return currentValue;
          }
          return "";
        });
      } catch (e) {
        if (e.name !== "AbortError")
          setDepError(e.message || "Ошибка загрузки опций модели");
      } finally {
        setDepLoading(false);
      }
    })();
    return () => controller.abort();
  }, [modelParamsUrl, isReady]);

  // ——— 7) Сброс зависимых при смене модели ———
  useEffect(() => {
    if (!isReady) return;

    if (skipNextModelReset.current) {
      skipNextModelReset.current = false;
      return; // не сбрасываем то, что пришло из URL
    }

    // Пользователь реально сменил модель — чистим зависимые
    setColor("");
    setSize("");
    setPerf("");
    setEdge("");
  }, [model, isReady]);

  return {
    // базовое
    BASE_URL,
    buildApiUrl,
    SECTION_TITLES,
    capitalize,
    getImageUrl,

    // init
    isReady,

    // флаги и ошибки
    brandsLoading,
    brandsError,
    paramsLoading,
    paramsError,
    depLoading,
    depError,

    // опции и выборы
    brands,
    brand,
    setBrand,
    paramOptions,
    fullOptionData,
    model,
    setModel,
    color,
    setColor,
    size,
    setSize,
    perf,
    setPerf,
    edge,
    setEdge,

    // наличия
    hasBrands,
    hasModels,
    hasAnyDependent,
    hasColor,
    hasSize,
    hasPerf,
    hasEdge,
  };
}
