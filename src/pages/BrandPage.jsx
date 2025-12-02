import { useAcoustic } from "../context/AcousticContext.jsx";
import SelectWithImages from "../components/SelectWithImages.jsx";

export default function BrandPage() {
  const {
    brandsLoading,
    brandsError,
    brands,
    brand,
    setBrand,
    hasBrands,
    SECTION_TITLES,
    capitalize,
    getImageUrl,
  } = useAcoustic();

  // Преобразуем бренды в формат для SelectWithImages: { id, name, ... }
  // Сохраняем все исходные поля из API, чтобы getImageUrl мог найти изображение
  // Важно: spread-оператор идет первым, чтобы id и name не перезаписывались
  const brandOptions = brands.map((b) => {
    const option = {
      ...b, // Сохраняем все исходные поля (включая Img, Name, ShortName и т.д.)
      id: b.code, // Перезаписываем id на code для SelectWithImages
      name: b.name, // Перезаписываем name для единообразия
    };
    
    return option;
  });

  return (
    <div>
      {!brandsLoading && !brandsError && hasBrands && (
        <SelectWithImages
          paramType="brand"
          value={brand}
          onChange={setBrand}
          options={brandOptions}
          getImageUrl={getImageUrl}
          SECTION_TITLES={{
            ...SECTION_TITLES,
            brand: { acc: "бренд", gen: "бренда" },
          }}
          capitalize={capitalize}
        />
      )}
    </div>
  );
}
