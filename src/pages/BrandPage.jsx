import { useAcoustic } from "../context/AcousticContext.jsx";
// import { Link } from "react-router-dom";

export default function BrandPage() {
  const { brandsLoading, brandsError, brands, brand, setBrand, hasBrands } = useAcoustic();

  return (
    <div>
      {/* <h2>Выбор бренда</h2>

      {brandsLoading && <div>Загрузка брендов…</div>}
      {brandsError && <div style={{ color: "crimson" }}>Ошибка: {brandsError}</div>} */}

      {!brandsLoading && !brandsError && hasBrands && (
        <select
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          style={{ display: "block", marginBottom: 12, width: "100%", padding: "10px" }}
        >
          <option value="">Выберите бренд</option>
          {brands.map((b, idx) => (
            <option key={`${b.code}-${idx}`} value={b.code}>
              {b.name}
            </option>
          ))}
        </select>
      )}

      {/* <div style={{ marginTop: 12 }}>
        <Link to="/acoustic/model" aria-disabled={!brand} style={{ opacity: brand ? 1 : 0.5, pointerEvents: brand ? "auto" : "none" }}>
          Далее: модель →
        </Link>
      </div> */}
    </div>
  );
}
