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






