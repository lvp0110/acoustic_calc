export const METRIKA_ID = 109995577;

declare global {
  interface Window {
    ym?: (
      id: number,
      method: string,
      ...args: unknown[]
    ) => void;
  }
}

/** Виртуальный просмотр страницы (нужен для SPA без полной перезагрузки). */
export function metrikaHit(url?: string) {
  if (typeof window === "undefined" || typeof window.ym !== "function") return;
  window.ym(METRIKA_ID, "hit", url ?? window.location.href);
}

/** Цель в Метрике (имя должно совпадать с настройкой цели в кабинете). */
export function metrikaReachGoal(goalName: string) {
  if (typeof window === "undefined" || typeof window.ym !== "function") return;
  window.ym(METRIKA_ID, "reachGoal", goalName);
}
