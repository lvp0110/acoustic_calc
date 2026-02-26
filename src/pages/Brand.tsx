import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { getBrandParams } from "../api";
import BrandForm from "../components/BrandForm";

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
    </div>
  );
}
