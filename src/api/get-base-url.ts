export const getBaseUrl = (): string => {
  const url = import.meta.env.VITE_BASE_URL;
  return url ? `${url}/api` : "/api";
};
