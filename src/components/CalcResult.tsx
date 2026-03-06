import type { CalcResultData } from "../api";

interface CalcResultProps {
  data: CalcResultData;
  onSelectChange?: (rowId: string, itemCode: string) => void;
}

export default function CalcResult({ data, onSelectChange }: CalcResultProps) {
  const columns = data.columns.filter((col) => col.id !== "code");

  return (
    <div>
      {data.title ? <h4>{data.title}</h4> : null}
      <div className="result-table-wrap">
        <table className="result-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.id}>{col.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => {
              if (row.items.length === 1) {
                const item = row.items[0];
                return (
                  <tr key={item.code}>
                    {columns.map((col) => (
                      <td key={col.id}>{item[col.id as keyof typeof item]}</td>
                    ))}
                  </tr>
                );
              }

              const firstItem = row.items[0];
              return (
                <tr key={row.id}>
                  {columns.map((col) => (
                    <td key={col.id}>
                      {col.id === "name" ? (
                        <select
                          className="cell-select"
                          value={firstItem.code}
                          onChange={(e) =>
                            onSelectChange?.(row.id, e.target.value)
                          }
                        >
                          {row.items.map((item) => (
                            <option key={item.code} value={item.code}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        firstItem[col.id as keyof typeof firstItem]
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
