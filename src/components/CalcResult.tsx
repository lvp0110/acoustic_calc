import type { CalcResultData } from "../api";

interface CalcResultProps {
  data: CalcResultData;
}

export default function CalcResult({ data }: CalcResultProps) {
  const columns = data.columns.filter((col) => col.id !== "code");

  return (
    <div>
      <h2>{data.title}</h2>
      <table>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.id}>{col.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.flatMap((row) =>
            row.items.map((item) => (
              <tr key={item.code}>
                {columns.map((col) => (
                  <td key={col.id}>
                    {item[col.id as keyof typeof item]}
                  </td>
                ))}
              </tr>
            )),
          )}
        </tbody>
      </table>
    </div>
  );
}
