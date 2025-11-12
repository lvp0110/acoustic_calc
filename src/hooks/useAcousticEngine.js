import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

// Определение BASE_URL с учетом окружения
const getBaseUrl = () => {
  const mode = import.meta.env?.MODE || 'development';
  const envUrl = import.meta.env?.VITE_API_URL;
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  
  // Логирование для отладки
  console.log('[BASE_URL Debug]', {
    mode,
    hasVITE_API_URL: !!envUrl,
    VITE_API_URL_value: envUrl ? `${String(envUrl).substring(0, 50)}...` : 'not set',
    currentOrigin
  });
  
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
  
  // 3. По умолчанию для разработки
  return "http://localhost:3005";
};

const BASE_URL = getBaseUrl();

// Логируем финальный BASE_URL для отладки
if (import.meta.env?.MODE === 'production') {
  console.log('[BASE_URL] Final value:', BASE_URL || '(empty - will use relative paths)');
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
    return { code, name };
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
    return `/${cleanPath}`;
  }
  
  // Убираем завершающий слеш из BASE_URL, если он есть
  const cleanBase = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
  const finalUrl = `${cleanBase}/${cleanPath}`;
  
  // Логируем в development для отладки
  if (import.meta.env?.MODE === 'development') {
    console.log(`[buildApiUrl] ${cleanPath} → ${finalUrl}`);
  }
  
  return finalUrl;
};

const getImageUrl = (option) => {
  if (!option) return null;
  const imageFile =
    option?.img ||
    option?.image ||
    option?.imageFile ||
    option?.imageUrl ||
    option?.section_img ||
    option?.file ||
    option?.filename;

  if (!imageFile || String(imageFile).trim() === "") return null;
  if (!String(imageFile).startsWith("http")) return buildApiUrl(`api/v1/constr/${imageFile}`);
  return imageFile;
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
    // Сохраняем посторонние параметры, но обновим наши
    for (const key of URL_PARAM_KEYS) cur.delete(key);

    const kv = { brand, model, color, size, perf, edge };
    Object.entries(kv).forEach(([k, v]) => {
      if (v) cur.set(k, v);
    });

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

        const res = await fetch(brandsUrl, { signal: controller.signal });
        const text = await res.text();
        let json;
        try {
          json = JSON.parse(text);
        } catch {}
        if (!res.ok) {
          const msg = json?.message || json?.error || text || `HTTP ${res.status}`;
          throw new Error(msg);
        }
        setBrands(normalizeBrands(json));
      } catch (e) {
        if (e.name !== "AbortError")
          setBrandsError(e.message || "Ошибка загрузки брендов");
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
        } catch {}
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

        console.log("Model options structure:", modelList[0]);
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
        } catch {}
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

        if (next.color.length > 0) console.log("Color option structure:", next.color[0]);
        if (next.size.length > 0) console.log("Size option structure:", next.size[0]);
        if (next.perf.length > 0) console.log("Perf option structure:", next.perf[0]);
        if (next.edge.length > 0) console.log("Edge option structure:", next.edge[0]);

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
  }, [modelParamsUrl]);

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
