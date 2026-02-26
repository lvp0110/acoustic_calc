import { useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { getAcousticCategories } from "../api";

export default function Brand() {
  const { brandCode } = useParams({ strict: false });

  const {
    data: categories,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["acousticCategories"],
    queryFn: () => getAcousticCategories().then((res) => res.data.data),
  });

  if (isLoading) return <p>Загрузка...</p>;
  if (error) return <p>Ошибка: {(error as Error).message}</p>;

  const brand = categories?.find((cat) => cat.ShortName === brandCode);

  if (!brand) return <p>Бренд «{brandCode}» не найден</p>;

  return (
    <div>
      <h1>{brand.Name}</h1>
      <p>Код: {brand.ShortName}</p>
      {brand.Img && <p>Изображение: {brand.Img}</p>}
      {brand.Description && (
        <div dangerouslySetInnerHTML={{ __html: brand.Description }} />
      )}
      {brand.Models && (
        <>
          <h2>Модели</h2>
          <ul>
            {brand.Models.map((model) => (
              <li key={model}>{model}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
