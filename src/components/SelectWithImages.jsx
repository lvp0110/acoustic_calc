import { useMemo, useState } from "react";

export default function SelectWithImages({
  paramType,
  value,
  onChange,
  options,
  getImageUrl,
  SECTION_TITLES,
  capitalize,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [q, setQ] = useState("");
  const selectedOption = options.find((opt) => opt.id === value);
  const sectionAcc = SECTION_TITLES[paramType]?.acc || "опцию";

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return options;
    return options.filter((o) =>
      String(o?.name || "")
        .toLowerCase()
        .includes(s)
    );
  }, [options, q]);

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <button
        onClick={() => setIsOpen((v) => !v)}
        style={{
          width: "100%",
          padding: selectedOption ? "0" : "10px 12px",
          border: "1px solid #e0e0e0",
          borderRadius: 5,
          backgroundColor: "#fff",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          position: "relative",
          minHeight: 70,
          overflow: "hidden",
        }}
        aria-label={`Выберите ${sectionAcc}`}
      >
        {selectedOption ? (
          <>
            <div
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                zIndex: 1,
              }}
            />
            <img
              src={getImageUrl(selectedOption)}
              alt={selectedOption?.name}
              onError={(e) => (e.currentTarget.style.display = "none")}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                // objectFit: "cover",
              }}
            />
            <span
              style={{
                position: "relative",
                zIndex: 2,
                marginLeft: "auto",
                marginTop: "auto",
                padding: "3px 7px",
                borderRadius: 5,
                fontSize: 14,
                marginRight: 2,
                marginBottom: 2,
              }}
            >
              {selectedOption?.name}
            </span>
          </>
        ) : (
          <span style={{ padding: "10px 12px" }}>
            {`Выберите ${capitalize(sectionAcc)}`}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            width: "100%",
            maxWidth: "100%",
            backgroundColor: "#fff",
            border: "1px solid #e0e0e0",
            borderTop: "none",
            borderRadius: 5,
            maxHeight: 480,
            overflowY: "auto",
            overflowX: "hidden",
            zIndex: 10,
            boxSizing: "border-box",
            padding: 12,
          }}
        >
          {/* Поиск */}
          <input
            type="text"
            placeholder="Поиск"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{
              width: "100%",
              height: 40,
              padding: "0 12px",
              border: "1px solid #e0e0e0",
              borderRadius: 5,
              outline: "none",
              marginBottom: 12,
              boxSizing: "border-box",
              fontSize: 14,
              background: "#f7f7f9",
            }}
          />

          {/* Грид 2 колонки, карточки как на скрине */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 12,
            }}
          >
            {filtered.map((opt) => {
              const url = getImageUrl(opt);
              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    onChange(opt.id);
                    setIsOpen(false);
                  }}
                  style={{
                    // было: обычная карточка на 1 колонку
                    // width: "100%",

                    // стало: карточка растягивается на 2 колонки грида (вдвое больше родительской ячейки)
                    gridColumn: "span 2",

                    width: "100%",
                    padding: 8,
                    border: "1px solid #e6e6ea",
                    borderRadius: 5,
                    backgroundColor: value === opt.id ? "#e3f2fd" : "#fff",
                    cursor: "pointer",
                    textAlign: "left",
                    boxSizing: "border-box",
                    display: "flex",
                    flexDirection: "column",
                    transition: "box-shadow 0.2s",
                  }}
                >
                  <div
                    style={{
                      // увеличим превью, чтобы визуально карточка стала крупнее
                      width: "100%",
                      aspectRatio: "32 / 32", // было 16/9
                      borderRadius: 5,
                      overflow: "hidden",
                      background: "#f1f2f6",
                    }}
                  >
                    <img
                      src={url}
                      alt={opt.name}
                      onError={(e) => (e.currentTarget.style.display = "none")}
                      style={{
                        width: "100%",
                        height: "100%",
                        // objectFit: "cover",
                        display: "block",
                      }}
                    />
                  </div>
                  <span
                    style={{
                      marginTop: 8,
                      fontSize: 14,
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {opt.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
