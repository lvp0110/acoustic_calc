import { useMemo, useState, useRef, useEffect } from "react";

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
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ right: 0, bottom: 0 });
  const spanRef = useRef(null);
  const containerRef = useRef(null);
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

  useEffect(() => {
    if (showTooltip && spanRef.current && containerRef.current) {
      const spanRect = spanRef.current.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      setTooltipPosition({
        right: containerRect.right - spanRect.right,
        bottom: containerRect.bottom - spanRect.top + 8,
      });
    }
  }, [showTooltip]);

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      <button
        onClick={() => setIsOpen((v) => !v)}
        style={{
          width: "100%",
          padding: selectedOption ? "0" : "10px 12px",
          border: "none",
          borderRadius: 16,
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
              ref={spanRef}
              style={{
                position: "relative",
                zIndex: 2,
                marginLeft: "auto",
                marginTop: "auto",
                padding: "4px 5px",
                borderRadius: 16,
                fontSize: 14,
                marginRight: 4,
                marginBottom: 4,
                background: "#f5f5f7",
              }}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
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

      {showTooltip && selectedOption?.description && (
        <div
          style={{
            position: "absolute",
            bottom: tooltipPosition.bottom,
            right: tooltipPosition.right,
            padding: "8px 12px",
            backgroundColor: "#333",
            color: "#fff",
            borderRadius: 8,
            fontSize: 12,
            zIndex: 1000,
            width: "max-content",
            maxWidth: "300px",
            whiteSpace: "normal",
            wordWrap: "break-word",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
            pointerEvents: "none",
          }}
        >
          {selectedOption.description}
          <div
            style={{
              position: "absolute",
              top: "100%",
              right: 12,
              marginTop: -1,
              width: 0,
              height: 0,
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderTop: "6px solid #333",
            }}
          />
        </div>
      )}

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            width: "100%",
            maxWidth: "100%",
            backgroundColor: "#fff",
            border: "none",
            borderRadius: 16,
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
              border: "none",
              borderRadius: 16,
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
                    border: "none",
                    borderRadius: 16,
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
                      borderRadius: 16,
                      overflow: "hidden",
                      background: "#f1f2f6",
                    }}
                  >
                    <img
                      src={url}
                      alt={opt.name}
                      onError={(e) => (e.currentTarget.style.display = "none")}
                      style={{
                        width: "96%",
                        height: "96%",
                        padding: "4px",
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
