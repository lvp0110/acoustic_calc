import type { CalcResultData } from "../api";
import { useEffect, useId, useRef, useState } from "react";
import "./CalcResult.css";

interface CalcResultProps {
  data: CalcResultData;
  onSelectChange?: (rowId: string, itemCode: string) => void;
}

export default function CalcResult({ data, onSelectChange }: CalcResultProps) {
  const columns = data.columns.filter((col) => col.id !== "code");
  const [openRowId, setOpenRowId] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const instanceId = useId();

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current) return;
      if (e.target instanceof Node && rootRef.current.contains(e.target)) return;
      setOpenRowId(null);
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenRowId(null);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <div ref={rootRef}>
      {data.title ? <h4>{data.title}</h4> : null}
      <div className="result-table-wrap">
        
        <button style={{ width: "auto", border: "solid green 2px", color: "green" }}>
          Excel
        </button>
       
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
              const listboxId = `cell-select-${instanceId}-${row.id}`;
              const selectedItem =
                row.items.find((it) => it.code === firstItem.code) ?? firstItem;

              return (
                <tr key={row.id}>
                  {columns.map((col) => (
                    <td key={col.id}>
                      {col.id === "name" ? (
                        <span
                          className="cell-select-wrap"
                          data-open={openRowId === row.id ? "true" : "false"}
                        >
                          <button
                            type="button"
                            className="cell-select-trigger"
                            aria-haspopup="listbox"
                            aria-expanded={openRowId === row.id}
                            aria-controls={listboxId}
                            onClick={() =>
                              setOpenRowId((prev) => (prev === row.id ? null : row.id))
                            }
                          >
                            {selectedItem.name}
                          </button>
                          {openRowId === row.id ? (
                            <ul
                              id={listboxId}
                              className="cell-select-menu"
                              role="listbox"
                              aria-label="Выбор варианта"
                            >
                              {row.items.map((item) => (
                                <li key={item.code} role="option">
                                  <button
                                    type="button"
                                    className={
                                      item.code === firstItem.code
                                        ? "cell-select-option is-selected"
                                        : "cell-select-option"
                                    }
                                    onClick={() => {
                                      onSelectChange?.(row.id, item.code);
                                      setOpenRowId(null);
                                    }}
                                  >
                                    {item.name}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </span>
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
