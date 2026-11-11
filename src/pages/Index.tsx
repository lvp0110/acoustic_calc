import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { getAcousticCategories } from "../api";
export default function Home() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["acousticCategories"],
    queryFn: () => getAcousticCategories().then((res) => res.data.data),
  });

  if (isLoading) return <p className="home-page">Загрузка...</p>;
  if (error)
    return (
      <p className="home-page">
        Ошибка:{" "}
        {error instanceof Error ? error.message : String(error)}
      </p>
    );

  return (
    <div className="home-page">
      <div className="brands-header">
        <h2>Калькулятор акустики</h2>
      </div>
      <ul className="brands-list">
        {data?.map((cat) => (
          <li key={cat.ShortName}>
            <Link to="/$brandCode" params={{ brandCode: cat.ShortName }}>
              <strong>{cat.Name}</strong>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
