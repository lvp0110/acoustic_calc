import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { getAcousticCategories } from "../api";
import type { AcousticCategory } from "../api";

export default function Home() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["acousticCategories"],
    queryFn: () => getAcousticCategories().then((res) => res.data.data),
  });

  if (isLoading) return <p>Загрузка...</p>;
  if (error) return <p>Ошибка: {(error as Error).message}</p>;

  return (
    <div>
      <h1>Бренды</h1>
      <ul>
        {data?.map((cat: AcousticCategory) => (
          <li key={cat.ShortName}>
            <Link to="/$brandCode" params={{ brandCode: cat.ShortName }}>
              <strong>{cat.Name}</strong> ({cat.ShortName})
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
