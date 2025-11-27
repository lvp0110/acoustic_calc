import { useAcoustic } from "../context/AcousticContext.jsx";
import SelectWithImages from "../components/SelectWithImages.jsx";

export default function ModelPage() {
  const {
    isReady,
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

  if (!isReady) return null;

  return (
    <div>
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
    </div>
  );
}
