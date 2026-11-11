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
        <h2>
          <svg
            className="brands-header__icon"
            viewBox="0 0 100 100"
            aria-hidden="true"
          >
            <g fill="currentColor">
              <rect x="7.13" y="15.88" width="3.54" height="66.26" rx="1.77" />
              <rect x="12.91" y="42.47" width="2.53" height="13.08" rx="1.26" />
              <rect x="18.3" y="35.77" width="2.53" height="26.48" rx="1.26" />
              <rect x="23.57" y="29.18" width="2.53" height="39.67" rx="1.26" />
              <rect x="28.96" y="37.09" width="2.42" height="23.85" rx="1.21" />
              <rect x="34.23" y="42.47" width="2.53" height="13.08" rx="1.26" />
              <rect x="39.51" y="45.11" width="2.64" height="7.8" rx="1.32" />
              <rect x="44.89" y="41.15" width="2.53" height="15.71" rx="1.26" />
              <rect x="50.27" y="34.45" width="2.42" height="29.12" rx="1.21" />
              <rect x="55.55" y="25.16" width="2.42" height="47.69" rx="1.21" />
              <rect x="60.82" y="15.88" width="2.53" height="66.26" rx="1.26" />
              <rect x="66.21" y="27.8" width="2.42" height="42.42" rx="1.21" />
              <rect x="71.48" y="37.09" width="2.53" height="23.85" rx="1.26" />
              <rect x="76.76" y="43.79" width="2.53" height="10.44" rx="1.26" />
              <rect x="82.14" y="39.78" width="2.42" height="18.46" rx="1.21" />
              <rect x="86.91" y="15.88" width="3.54" height="66.26" rx="1.77" />
            </g>
          </svg>
          Калькулятор акустики
        </h2>
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
