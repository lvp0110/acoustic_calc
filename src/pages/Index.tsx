import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { getAcousticCategories } from "../api";
import type { AcousticCategory } from "../api";

export default function Home() {
  const { data, isLoading, error } = useQuery<AcousticCategory[]>({
    queryKey: ["acousticCategories"],
    queryFn: () => getAcousticCategories().then((res) => res.data.data),
  });

  if (isLoading) return <p>Загрузка...</p>;
  if (error)
    return (
      <p>
        Ошибка:{" "}
        {error instanceof Error ? error.message : String(error)}
      </p>
    );

  return (
    <div>
      <div className="brands-header">
        <h1>Бренды</h1>
      </div>
      <ul>
        {data?.map((cat) => (
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
