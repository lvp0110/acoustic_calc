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
  return baseInstance.get<CalcResultResponse>(`/v2/constr/calc/${brandCode}`, {
    params,
  });
};

export const getBrandParams = (
  brandCode: string,
  params?: Record<string, string | undefined>,
) => {
  return baseInstance.get<BrandParamsResponse>(`/v1/brandParams/${brandCode}`, {
    params,
  });
};

/** Тот же формат query, что у `getCalcResult` / axios (важно для массивов вроде `articuls`). */
export const getExcelDownloadUrl = (
  brandCode: string,
  params: Record<string, string | string[] | undefined>,
): string => {
  return baseInstance.getUri({
    url: `/v2/constr/calc/excel/${brandCode}`,
    params,
  });
};

export interface SubmitKpFormBody {
  brandCode: string;
  name: string;
  city: string;
  phone: string;
  email: string;
  note: string;
  pageUrl: string;
}

const KP_REQUEST_EMAIL = "123vik@mail.ru";

function messageFromUnknownJson(data: unknown): string | undefined {
  if (
    data &&
    typeof data === "object" &&
    "message" in data &&
    typeof (data as { message: unknown }).message === "string"
  ) {
    return (data as { message: string }).message;
  }
  return undefined;
}

/** Заявка на КП — отправка на почту через FormSubmit (без своего бэкенда). */
export const submitKpForm = async (body: SubmitKpFormBody) => {
  const url = `https://formsubmit.co/ajax/${encodeURIComponent(KP_REQUEST_EMAIL)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      _subject: `Заявка на КП${body.brandCode ? ` — ${body.brandCode}` : ""}`,
      _captcha: false,
      Имя: body.name,
      Город: body.city || "—",
      Телефон: body.phone,
      Email: body.email,
      Примечание: body.note || "—",
      "Код бренда": body.brandCode || "—",
      Ссылка: body.pageUrl || "—",
    }),
  });
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(
      messageFromUnknownJson(data) ?? `Ошибка отправки (${res.status})`,
    );
  }
  if (
    data &&
    typeof data === "object" &&
    "success" in data &&
    (data as { success: unknown }).success !== true &&
    String((data as { success: unknown }).success) !== "true"
  ) {
    throw new Error(messageFromUnknownJson(data) ?? "Заявка не принята");
  }
};
