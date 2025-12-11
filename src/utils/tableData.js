// Утилиты для кодирования/декодирования данных таблицы в base64

export const encodeTableData = (calcData, calcRows) => {
  try {
    const data = {
      calcData: calcData,
      calcRows: calcRows,
    };
    const json = JSON.stringify(data);
    // Правильное кодирование: сначала в UTF-8 через encodeURIComponent, потом в base64
    const utf8 = unescape(encodeURIComponent(json));
    const base64 = btoa(utf8);
    return base64;
  } catch (e) {
    console.error("Ошибка кодирования данных таблицы:", e, e.message);
    return null;
  }
};

export const decodeTableData = (encoded) => {
  try {
    if (!encoded) return { calcData: null, calcRows: [] };
    // Правильное декодирование: сначала из base64, потом из UTF-8
    const utf8 = atob(encoded);
    const json = decodeURIComponent(escape(utf8));
    const data = JSON.parse(json);
    return {
      calcData: data.calcData || null,
      calcRows: data.calcRows || [],
    };
  } catch (e) {
    console.error("Ошибка декодирования данных таблицы:", e, e.message);
    return { calcData: null, calcRows: [] };
  }
};










