import { useEffect, useRef, useState } from "react";
import type { CalcResultData } from "../api";
import styles from "./list-select.module.css";

interface CalcResultProps {
  data: CalcResultData;
  onSelectChange?: (rowId: string, itemCode: string) => void;
}

export default function CalcResult({ data, onSelectChange }: CalcResultProps) {
  const [openRowId, setOpenRowId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const columns = data.columns.filter((col) => col.id !== "code");

  useEffect(() => {
    if (!openRowId) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpenRowId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openRowId]);

  return (
    <div ref={containerRef}>
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
                        <div
                          className="cell-select-wrap"
                          style={{
                            position: "relative",
                            display: "inline-block",
                          }}
                        >
                          <button
                            type="button"
                            className={styles.optionText}
                            onClick={() =>
                              setOpenRowId((prev) =>
                                prev === row.id ? null : row.id,
                              )
                            }
                            style={{ height: "auto" }}
                          >
                            <span className={styles.optionTextLabel}>
                              {firstItem.name}
                            </span>
                          </button>
                          {openRowId === row.id && (
                            <div
                              className={`${styles.dropdown} ${styles.dropdownText}`}
                            >
                              {row.items.map((item) => (
                                <button
                                  key={item.code}
                                  type="button"
                                  className={styles.optionText}
                                  onClick={() => {
                                    onSelectChange?.(row.id, item.code);
                                    setOpenRowId(null);
                                  }}
                                >
                                  <span className={styles.optionTextLabel}>
                                    {item.name}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
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
