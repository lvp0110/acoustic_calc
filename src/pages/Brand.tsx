import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { getBrandParams, getCalcParams } from "../api";
import BrandForm from "../components/BrandForm";
import CalcForm from "../components/CalcForm";

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

  // Все поля заполнены — запрашиваем параметры калькулятора
  const allFieldsFilled =
    !!data &&
    data.length > 0 &&
    data.every((field) => !!search[field.code]);

  const { data: calcParams } = useQuery({
    queryKey: ["calcParams", brandCode, search],
    queryFn: () =>
      getCalcParams(brandCode, search).then((res) => res.data.data),
    enabled: allFieldsFilled,
  });

  const onFieldChange = (code: string, value: string) => {
    navigate({
      search:
        code === "model"
          ? { [code]: value || undefined }
          : { ...search, [code]: value || undefined },
      from: "/$brandCode",
      replace: true,
    });
  };

  const onCalculate = (result: unknown) => {
    console.log("calculate", result);
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
          onCalculate={onCalculate}
        />
      )}
    </div>
  );
}
