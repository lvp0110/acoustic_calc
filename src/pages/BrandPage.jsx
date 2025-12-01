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
    
    // Отладочное логирование для первого бренда
    if (import.meta.env?.MODE === 'development' && brands.indexOf(b) === 0) {
      console.log('[BrandPage] Original brand:', b);
      console.log('[BrandPage] Brand Img before mapping:', b.Img);
      console.log('[BrandPage] Mapped option:', option);
      console.log('[BrandPage] Option Img after mapping:', option.Img);
      console.log('[BrandPage] All option fields:', Object.keys(option));
    }
    
    return option;
  });

  // Отладочное логирование в режиме разработки
  if (import.meta.env?.MODE === 'development' && brandOptions.length > 0) {
    console.log('[BrandPage] Total brands:', brandOptions.length);
    console.log('[BrandPage] Current brand value:', brand);
    const selectedBrand = brandOptions.find(b => b.id === brand);
    if (selectedBrand) {
      console.log('[BrandPage] Selected brand:', selectedBrand);
      console.log('[BrandPage] Brand Img field:', selectedBrand.Img);
      console.log('[BrandPage] All brand fields:', Object.keys(selectedBrand));
      const imageUrl = getImageUrl(selectedBrand);
      console.log('[BrandPage] Image URL from getImageUrl:', imageUrl);
    } else {
      console.log('[BrandPage] No brand selected yet');
      console.log('[BrandPage] First brand sample:', brandOptions[0]);
      console.log('[BrandPage] First brand Img:', brandOptions[0]?.Img);
    }
  }

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
