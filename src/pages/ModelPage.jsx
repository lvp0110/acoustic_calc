import { useAcoustic } from "../context/AcousticContext.jsx";
import SelectWithImages from "../components/SelectWithImages.jsx";
import { Link, Navigate } from "react-router-dom";

export default function ModelPage() {
  const {
    isReady,
    brand,
    paramsLoading,
    paramsError,
    paramOptions,
    model,
    setModel,
    hasModels,
    SECTION_TITLES,
    capitalize,
    getImageUrl,
  } = useAcoustic();

  // Важно: пока не готовы (не прочитан URL) — ничего не решаем
  if (!isReady) return null;

  // if (!brand) return <Navigate to="/acoustic/brand" replace />;

  return (
    <div>
      {/* <h2>Выбор модели</h2> */}

      {/* {paramsLoading && <div>Загрузка моделей…</div>}
      {paramsError && <div style={{ color: "crimson" }}>Ошибка: {paramsError}</div>} */}

      {!paramsLoading && !paramsError && hasModels && (
        <div style={{ maxWidth: 520, marginBottom: 12 }}>
          <SelectWithImages
            paramType="model"
            value={model}
            onChange={setModel}
            options={paramOptions.model}
            getImageUrl={getImageUrl}
            SECTION_TITLES={SECTION_TITLES}
            capitalize={capitalize}
          />
        </div>
      )}

      {/* <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
        <Link to="/acoustic/brand">← Назад: бренд</Link>
        <Link
          to="/acoustic/options"
          aria-disabled={!model}
          style={{ opacity: model ? 1 : 0.5, pointerEvents: model ? "auto" : "none" }}
        >
          Далее: опции →
        </Link>
      </div> */}
    </div>
  );
}
