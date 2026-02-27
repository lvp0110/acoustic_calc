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

export interface CalcColumn {
  id: string;
  name: string;
}

export interface CalcRowItem {
  code: string;
  category: string;
  name: string;
  amount: number;
  amount_horizontal: number | null;
  amount_vertical: number | null;
  units: string;
  comment: string;
}

export interface CalcRow {
  id: string;
  items: CalcRowItem[];
}

export interface CalcResultData {
  title: string;
  columns: CalcColumn[];
  rows: CalcRow[];
}

export interface CalcResultResponse {
  code: number;
  data: CalcResultData;
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

export const getCalcResult = (
  brandCode: string,
  params: Record<string, string | undefined>,
) => {
  return baseInstance.get<CalcResultResponse>(
    `/v2/constr/calc/${brandCode}`,
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
