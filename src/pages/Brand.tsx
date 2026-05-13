import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams, useSearch } from "@tanstack/react-router";
import {
  getBrandParams,
  getCalcParams,
  getCalcResult,
  getAcousticCategories,
  getExcelDownloadUrl,
} from "../api";
import { brandIconMap } from "../utils/brandIcons";
import type { CalcFormResult } from "../components/CalcForm";
import BrandForm from "../components/BrandForm";
import CalcForm from "../components/CalcForm";
import CalcResult from "../components/CalcResult";
import { getOptionImageUrl } from "../api/get-base-url";
import BrandDescription from "../components/BrandDescription";

function normalizeCategoryImageUrl(url: string): string {
  // Backend sometimes returns 0.0.0.0 which is not always reachable from the browser.
  return url.replace(/:\/\/0\.0\.0\.0(?=:\d+|\/)/, "://localhost");
}

export default function Brand() {
  const formsColumnRef = useRef<HTMLDivElement | null>(null);
  const calcResultTopRef = useRef<HTMLDivElement | null>(null);
  const colorHeaderImgRef = useRef<HTMLImageElement | null>(null);
  const scrollToResultPendingRef = useRef(false);
  const [colorHeaderImageShown, setColorHeaderImageShown] = useState(false);
  const [resetNonce, setResetNonce] = useState(0);
  const { brandCode } = useParams({ from: "/$brandCode" });
  const search = useSearch({ from: "/$brandCode" });
  const navigate = useNavigate({ from: "/$brandCode" });

  const { data: acousticCategories } = useQuery({
    queryKey: ["acousticCategories"],
    queryFn: () => getAcousticCategories().then((res) => res.data.data),
  });

  const brandCategory = acousticCategories?.find(
    (cat) => cat.ShortName === brandCode,
  );

  const { data } = useQuery({
    queryKey: ["brandParams", brandCode, search],
    queryFn: () =>
      getBrandParams(brandCode, search).then((res) => res.data.data),
    enabled: !!brandCode,
    placeholderData: (prev) => prev,
  });

  const allFieldsFilled =
    !!data && data.length > 0 && data.every((field) => !!search[field.code]);

  const { data: calcParams } = useQuery({
    queryKey: ["calcParams", brandCode, search],
    queryFn: () =>
      getCalcParams(brandCode, search).then((res) => res.data.data),
    enabled: allFieldsFilled,
    // Иначе после сброса (search: {}) остаётся прошлое значение, и калькулятор продолжает отображаться.
    placeholderData: (prev) => (allFieldsFilled ? prev : undefined),
  });

  const calcRequest: CalcFormResult | null =
    search.type && (search.square || (search.length && search.height))
      ? {
          surface: search.type,
          mode: search.square ? "area" : "dimensions",
          ...(search.square
            ? { area: Number(search.square) }
            : {
                length: Number(search.length),
                height: Number(search.height),
              }),
        }
      : null;

  const calcQueryParams = calcRequest
    ? {
        ...search,
        type: calcRequest.surface,
        ...(calcRequest.mode === "area"
          ? { square: String(calcRequest.area) }
          : {
              length: String(calcRequest.length),
              height: String(calcRequest.height),
            }),
      }
    : null;

  const { data: calcResult } = useQuery({
    queryKey: ["calcResult", brandCode, calcQueryParams],
    queryFn: () =>
      getCalcResult(brandCode, calcQueryParams!).then((res) => res.data.data),
    enabled: !!calcQueryParams,
    /** Без этого после сброса калькулятора остаётся предыдущая таблица (placeholder от прошлого ключа). */
    placeholderData: (prev) => (calcQueryParams ? prev : undefined),
  });

  useEffect(() => {
    if (!scrollToResultPendingRef.current) return;
    if (!calcResult) return;

    scrollToResultPendingRef.current = false;
    requestAnimationFrame(() => {
      calcResultTopRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, [calcResult]);

  const onFieldChange = (code: string, value: string) => {
    navigate({
      search:
        code === "model"
          ? { [code]: value || undefined }
          : {
              ...search,
              [code]: value || undefined,
              type: undefined,
              square: undefined,
              length: undefined,
              height: undefined,
            },
      from: "/$brandCode",
      replace: true,
    });
  };

  const onCalculate = (result: CalcFormResult) => {
    scrollToResultPendingRef.current = true;
    navigate({
      search: {
        ...search,
        type: result.surface,
        ...(result.mode === "area"
          ? {
              square: String(result.area),
              length: undefined,
              height: undefined,
            }
          : {
              length: String(result.length),
              height: String(result.height),
              square: undefined,
            }),
      },
      from: "/$brandCode",
      replace: true,
    });
  };

  /** Сброс всех выборов в списках бренда, калькулятора и артикулов в результате */
  const onCalcFormReset = () => {
    navigate({
      search: {},
      from: "/$brandCode",
      replace: true,
    });
    // Гарантированно "сбрасываем" локальные состояния выпадающих списков (open/measure и т.п.)
    setResetNonce((n) => n + 1);
  };

  const onArticulChange = (_: string, itemCode: string) => {
    navigate({
      search: { ...search, articuls: itemCode },
      from: "/$brandCode",
      replace: true,
    });
  };

  const iconFile = brandCode ? brandIconMap[brandCode] : null;
  const categoryHeaderImageUrlRaw = brandCategory?.Img?.trim();
  const categoryHeaderImageUrl = categoryHeaderImageUrlRaw
    ? getOptionImageUrl({
        img: normalizeCategoryImageUrl(categoryHeaderImageUrlRaw),
      })
    : null;

  const { selectedColorOption, colorImageUrl } = useMemo(() => {
    const field = data?.find(
      (f) => f.code === "color" || f.name.toLowerCase().includes("цвет"),
    );
    const selectedCode = field ? search[field.code] : undefined;
    const option = field?.list.find((o) => o.code === selectedCode);
    const imageUrl = option ? getOptionImageUrl(option) : null;
    return { selectedColorOption: option, colorImageUrl: imageUrl };
  }, [data, search]);

  useLayoutEffect(() => {
    if (!colorImageUrl) {
      setColorHeaderImageShown(false);
      return;
    }
    setColorHeaderImageShown(false);
    const el = colorHeaderImgRef.current;
    if (el?.complete && el.naturalHeight !== 0) {
      setColorHeaderImageShown(true);
    }
  }, [colorImageUrl]);

  const { selectedModelOption, descriptionToShow } = useMemo(() => {
    const modelField = data?.find(
      (f) => f.code === "model" || f.name.toLowerCase().includes("модел"),
    );
    const selectedModelCode = modelField ? search[modelField.code] : undefined;
    const selectedModelOption = selectedModelCode
      ? modelField?.list.find((o) => o.code === selectedModelCode)
      : undefined;
    const descriptionToShow =
      selectedModelOption?.description?.trim() || brandCategory?.Description;
    return { selectedModelOption, descriptionToShow };
  }, [data, search, brandCategory?.Description]);

  return (
    <div className="main-unit">
      <div className="brand-page-layout">
        <div ref={formsColumnRef} className="brand-page-forms">
          <div className="brand-page-header-images">
            {colorImageUrl ? (
              <img
                ref={colorHeaderImgRef}
                src={colorImageUrl}
                alt={selectedColorOption?.name ?? "Цвет"}
                className={
                  "brand-page-header-image brand-page-header-image--cover" +
                  (colorHeaderImageShown
                    ? ""
                    : " brand-page-header-image--color-loading")
                }
                onLoad={() => setColorHeaderImageShown(true)}
                onError={() => setColorHeaderImageShown(true)}
              />
            ) : iconFile ? (
              <img
                src={`/brand_icon/${iconFile}`}
                alt={brandCode ?? ""}
                className="brand-page-header-image"
              />
            ) : categoryHeaderImageUrl ? (
              <img
                src={categoryHeaderImageUrl}
                alt={brandCategory?.Name ?? brandCode ?? ""}
                className="brand-page-header-image brand-page-header-image--cover"
              />
            ) : (
              <h1>{brandCode}</h1>
            )}
          </div>
          {data && (
            <BrandForm
              key={`brand-form-${resetNonce}`}
              fields={data}
              values={search}
              onFieldChange={onFieldChange}
              dropdownAlignToRef={formsColumnRef}
            />
          )}
          {calcParams && (
            <CalcForm
              key={`calc-form-${resetNonce}`}
              surfaces={calcParams.SurfacesTypes}
              values={calcRequest}
              onCalculate={onCalculate}
              onReset={onCalcFormReset}
              betweenRadiogroupsText="Для более точного расчёта укажите ширину и высоту в варианте «Размеры»"
              dropdownAlignToRef={formsColumnRef}
            />
          )}
        </div>
        {(descriptionToShow || calcResult) && (
          <div className="brand-page-result">
            <div ref={calcResultTopRef} />
            {descriptionToShow && (
              <BrandDescription content={descriptionToShow} />
            )}
            {calcResult && (
              <CalcResult
                brandCode={brandCode}
                data={calcResult}
                onSelectChange={onArticulChange}
                excelUrl={
                  calcQueryParams
                    ? getExcelDownloadUrl(brandCode, {
                        ...calcQueryParams,
                        articuls: calcResult.rows.flatMap((row) =>
                          row.items.map((item) => item.code),
                        ),
                      })
                    : undefined
                }
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
