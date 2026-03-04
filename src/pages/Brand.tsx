import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { getBrandParams, getCalcParams, getCalcResult } from "../api";
import type { CalcFormResult } from "../components/CalcForm";
import BrandForm from "../components/BrandForm";
import CalcForm from "../components/CalcForm";
import CalcResult from "../components/CalcResult";

export default function Brand() {
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

  return (
    <div>
      <h1>{brandCode}</h1>
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
          values={calcRequest}
          onCalculate={onCalculate}
        />
      )}
      {calcResult && (
        <CalcResult data={calcResult} onSelectChange={onArticulChange} />
      )}
    </div>
  );
}
