import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { getBrandParams, getCalcParams, getCalcResult } from "../api";
import { brandIconMap } from "../utils/brandIcons";
import type { CalcFormResult } from "../components/CalcForm";
import BrandForm from "../components/BrandForm";
import CalcForm from "../components/CalcForm";
import CalcResult from "../components/CalcResult";

export default function Brand() {
  const { brandCode } = useParams({ from: "/$brandCode" });
  const search = useSearch({ from: "/$brandCode" });
  const navigate = useNavigate({ from: "/$brandCode" });

  const [calcRequest, setCalcRequest] = useState<CalcFormResult | null>(null);

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
    setCalcRequest(null);
    navigate({
      search:
        code === "model"
          ? { [code]: value || undefined }
          : { ...search, [code]: value || undefined },
      from: "/$brandCode",
      replace: true,
    });
  };

  const onCalculate = (result: CalcFormResult) => {
    setCalcRequest(result);
  };

  const iconFile = brandCode ? brandIconMap[brandCode] : null;

  return (
    <div>
      {iconFile ? (
        <img
          src={`/brand_icon/${iconFile}`}
          alt={brandCode ?? ""}
          style={{ height: "10em", verticalAlign: "middle" }}
        />
      ) : (
        <h1>{brandCode}</h1>
      )}
      {data && (
        <BrandForm
          fields={data}
          values={search}
          onFieldChange={onFieldChange}
        />
      )}
      {calcParams && (
        <CalcForm
          surfaces={calcParams.SurfacesTypes}
          onCalculate={onCalculate}
        />
      )}
      {calcResult && <CalcResult data={calcResult} />}
    </div>
  );
}
