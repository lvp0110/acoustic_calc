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

// --- API functions ---

export const getAcousticCategories = () => {
  return baseInstance.get<AcousticCategoriesResponse>("/v1/AcousticCategories");
};
