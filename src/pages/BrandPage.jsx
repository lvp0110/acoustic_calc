import { useAcoustic } from "../context/AcousticContext.jsx";

export default function BrandPage() {
  const { brandsLoading, brandsError, brands, brand, setBrand, hasBrands } = useAcoustic();

  return (
    <div>
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
    </div>
  );
}
