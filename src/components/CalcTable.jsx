export default function CalcTable({ calcData, calcRows }) {
  const renderTable = () => {
    // Новый формат (columns/rows/items)
    if (calcData && Array.isArray(calcData.columns) && Array.isArray(calcData.rows)) {
      const cols = calcData.columns
        .map((c) => ({ id: String(c.id), name: String(c.name ?? c.id) }))
        .filter((c) => {
          const idLower = c.id.toLowerCase();
          const nameLower = c.name.toLowerCase();
          return idLower !== "артикул" && nameLower !== "артикул";
        });
      if (cols.length === 0) {
        return null;
      }
      return (
        <div style={{ marginTop: 12, overflowX: "auto" }}>
          {calcData.title ? (
            <div style={{ marginBottom: 6, fontWeight: 600 }}>{calcData.title}</div>
          ) : null}
          <table className="calc-table">
            <thead>
              <tr>
                {cols.map((c) => (
                  <th key={c.id} style={{ borderBottom: "1px solid #ddd", textAlign: "left", padding: "6px 8px" }}>{c.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {calcData.rows.map((row, rIdx) => {
                const items = Array.isArray(row?.items) ? row.items : [{}];
                return items.map((item, iIdx) => (
                  <tr key={`${rIdx}-${iIdx}`}>
                    {cols.map((c) => (
                      <td key={c.id} style={{ borderBottom: "1px solid #eee", padding: "6px 8px" }}>
                        {String(item?.[c.id] ?? row?.[c.id] ?? "")}
                      </td>
                    ))}
                  </tr>
                ));
              })}
            </tbody>
          </table>
        </div>
      );
    }

    // Старый универсальный формат (массив объектов)
    if (calcRows && calcRows.length > 0) {
      const first = calcRows[0];
      const cols = Object.keys(first).filter((c) => c.toLowerCase() !== "артикул");
      if (cols.length === 0) {
        return null;
      }
      return (
        <div style={{ marginTop: 12, overflowX: "auto" }}>
          <table className="calc-table">
            <thead>
              <tr>
                {cols.map((c) => (
                  <th key={c} style={{ borderBottom: "1px solid #ddd", textAlign: "left", padding: "6px 8px" }}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {calcRows.map((row, idx) => (
                <tr key={idx}>
                  {cols.map((c) => (
                    <td key={c} style={{ borderBottom: "1px solid #eee", padding: "6px 8px" }}>
                      {String(row?.[c] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    return null;
  };

  const table = renderTable();
  return table ? (
    <div className="calc-table-block">
      {table}
    </div>
  ) : null;
}

