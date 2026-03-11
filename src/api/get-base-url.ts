export const getBaseUrl = (): string => {
  const url = import.meta.env.VITE_BASE_URL;
  return url ? `${url}/api` : "/api";
};

export function getOptionImageUrl(option: { img?: string; section_img?: string }): string | null {
  const imageFile = option.img?.trim() || option.section_img?.trim() || null;
  if (!imageFile) return null;
  if (imageFile.startsWith("http")) return imageFile;

  const base = getBaseUrl().replace(/\/$/, "");
  const path = imageFile.replace(/^\//, "");
  return `${base}/v1/constr/${path}`;
}
