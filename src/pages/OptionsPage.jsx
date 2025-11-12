import { useAcoustic } from "../context/AcousticContext.jsx";
import SelectWithImages from "../components/SelectWithImages.jsx";
// import { Link, Navigate } from "react-router-dom";

export default function OptionsPage() {
  const {
    isReady,
    brand,
    model,
    depLoading,
    depError,
    hasAnyDependent,
    hasColor,
    hasSize,
    hasPerf,
    hasEdge,
    paramOptions,
    color,
    setColor,
    size,
    setSize,
    perf,
    setPerf,
    edge,
    setEdge,
    SECTION_TITLES,
    capitalize,
    getImageUrl,
  } = useAcoustic();

  // if (!isReady) return null;
  // if (!brand) return <Navigate to="/acoustic/brand" replace />;
  // if (!model) return <Navigate to="/acoustic/model" replace />;

  return (
    <div>
      {/* <h2>Выбор опций модели</h2> */}

      {/* {depLoading && <div>Загрузка опций…</div>}
      {depError && <div style={{ color: "crimson" }}>Ошибка: {depError}</div>} */}

      {!depLoading && !depError && hasAnyDependent && (
        <div style={{ display: "grid", gap: 12, maxWidth: 520 }}>
          {hasColor && (
            <SelectWithImages
              paramType="color"
              value={color}
              onChange={setColor}
              options={paramOptions.color}
              getImageUrl={getImageUrl}
              SECTION_TITLES={SECTION_TITLES}
              capitalize={capitalize}
            />
          )}
          {hasSize && (
            <SelectWithImages
              paramType="size"
              value={size}
              onChange={setSize}
              options={paramOptions.size}
              getImageUrl={getImageUrl}
              SECTION_TITLES={SECTION_TITLES}
              capitalize={capitalize}
            />
          )}
          {hasPerf && (
            <SelectWithImages
              paramType="perf"
              value={perf}
              onChange={setPerf}
              options={paramOptions.perf}
              getImageUrl={getImageUrl}
              SECTION_TITLES={SECTION_TITLES}
              capitalize={capitalize}
            />
          )}
          {hasEdge && (
            <SelectWithImages
              paramType="edge"
              value={edge}
              onChange={setEdge}
              options={paramOptions.edge}
              getImageUrl={getImageUrl}
              SECTION_TITLES={SECTION_TITLES}
              capitalize={capitalize}
            />
          )}
        </div>
      )}

      {/* <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
        <Link to="/acoustic/model">← Назад: модель</Link>
        <Link to="/acoustic">Сводная страница</Link>
      </div> */}
    </div>
  );
}
