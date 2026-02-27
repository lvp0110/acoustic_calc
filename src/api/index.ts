import axios from "axios";
import { getBaseUrl } from "./get-base-url";

export const baseInstance = axios.create({
  baseURL: getBaseUrl(),
});

// --- Interfaces ---

export interface AcousticCategory {
  Name: string;
  ShortName: string;
  Description: string;
  Img: string;
  Models: string[] | null;
}

export interface AcousticCategoriesResponse {
  code: number;
  data: AcousticCategory[];
}

export interface BrandParamOption {
  code: string;
  name: string;
  description: string;
  img: string;
  section_img: string;
}

export interface BrandParam {
  code: string;
  name: string;
  type: "select" | "select_image";
  list: BrandParamOption[];
}

export interface BrandParamsResponse {
  code: number;
  data: BrandParam[];
}

export interface SurfaceType {
  Name: string;
  Code: string;
}

export interface CalcParamsResponse {
  code: number;
  data: {
    SurfacesTypes: SurfaceType[];
  };
}

// --- API functions ---

export const getAcousticCategories = () => {
  return baseInstance.get<AcousticCategoriesResponse>("/v1/AcousticCategories");
};

export const getCalcParams = (
  brandCode: string,
  params?: Record<string, string | undefined>,
) => {
  return baseInstance.get<CalcParamsResponse>(
    `/v2/constr/calc/params/${brandCode}`,
    { params },
  );
};

export const getBrandParams = (
  brandCode: string,
  params?: Record<string, string | undefined>,
) => {
  return baseInstance.get<BrandParamsResponse>(`/v1/brandParams/${brandCode}`, {
    params,
  });
};
