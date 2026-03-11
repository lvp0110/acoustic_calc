import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { getBrandParams, getCalcParams, getCalcResult } from "../api";
import { brandIconMap } from "../utils/brandIcons";
import type { CalcFormResult } from "../components/CalcForm";
import BrandForm from "../components/BrandForm";
import CalcForm from "../components/CalcForm";
import CalcResult from "../components/CalcResult";
import { getOptionImageUrl } from "../api/get-base-url";

export default function Brand() {
  const formsColumnRef = useRef<HTMLDivElement | null>(null);
  const { brandCode } = useParams({ from: "/$brandCode" });
  const search = useSearch({ from: "/$brandCode" });
  const navigate = useNavigate({ from: "/$brandCode" });

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
  });

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

  const onArticulChange = (_: string, itemCode: string) => {
    navigate({
      search: { ...search, articuls: itemCode },
      from: "/$brandCode",
      replace: true,
    });
  };

  const iconFile = brandCode ? brandIconMap[brandCode] : null;

  const findSelectedOption = (
    code: string,
    nameSubstr: string
  ) => {
    const field = data?.find(
      (f) => f.code === code || f.name.toLowerCase().includes(nameSubstr)
    );
    const selectedCode = field ? search[field.code] : undefined;
    const option = field?.list.find((o) => o.code === selectedCode);
    const imageUrl = option ? getOptionImageUrl(option) : null;
    return { option, imageUrl };
  };

  const { option: selectedColorOption, imageUrl: colorImageUrl } =
    findSelectedOption("color", "цвет");
  const { option: selectedPerfOption, imageUrl: perfImageUrl } =
    findSelectedOption("perf", "перфор");
  const { option: selectedEdgeOption, imageUrl: edgeImageUrl } =
    findSelectedOption("edge", "кромк");

  return (
    <div className="main-unit">
      <div className="brand-page-layout">
        <div ref={formsColumnRef} className="brand-page-forms">
          <div className="brand-page-header-images">
            {iconFile ? (
              <img
                src={`/brand_icon/${iconFile}`}
                alt={brandCode ?? ""}
                className="brand-page-header-image"
              />
            ) : (
              <h1>{brandCode}</h1>
            )}
            {colorImageUrl && (
              <img
                src={colorImageUrl}
                alt={selectedColorOption?.name ?? "Цвет"}
                className="brand-page-header-image"
              />
            )}
            {perfImageUrl && (
              <img
                src={perfImageUrl}
                alt={selectedPerfOption?.name ?? "Перфорация"}
                className="brand-page-header-image"
              />
            )}
            {edgeImageUrl && (
              <img
                src={edgeImageUrl}
                alt={selectedEdgeOption?.name ?? "Кромка"}
                className="brand-page-header-image"
              />
            )}
          </div>
          {data && (
            <BrandForm
              fields={data}
              values={search}
              onFieldChange={onFieldChange}
              dropdownAlignToRef={formsColumnRef}
            />
          )}
          {calcParams && (
            <CalcForm
              surfaces={calcParams.SurfacesTypes}
              values={calcRequest}
              onCalculate={onCalculate}
            />
          )}
        </div>
        {calcResult && (
          <div className="brand-page-result">
            <CalcResult data={calcResult} onSelectChange={onArticulChange} />
          </div>
        )}
      </div>
    </div>
  );
}
