import { useState } from "react";

export default function SelectText({
  paramType,
  value,
  onChange,
  options,
  SECTION_TITLES,
  capitalize,
  showClearButton = true,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((opt) => opt.id === value);

  const sectionAcc = SECTION_TITLES[paramType]?.acc || "опцию";
  const sectionGen = SECTION_TITLES[paramType]?.gen || "опции";

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "100%",
          padding: "10px 12px",
          border: "none",
          borderRadius: "16px",
          backgroundColor: selectedOption && paramType === "surface" ? "#006BCF" : "#fff",
          color: selectedOption && paramType === "surface" ? "#fff" : undefined,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          textAlign: "left",
          minHeight: "70px",
        }}
        aria-label={`Выберите ${sectionAcc}`}
      >
        <span>{selectedOption?.name || `Выберите ${capitalize(sectionAcc)}`}</span>
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            width: "100%",
            backgroundColor: "#fff",
            // border: "1px solid #ccc",
            borderRadius: "0 0 16px 16px",
            maxHeight: "300px",
            overflowY: "auto",
            zIndex: 10,
            display: "block",
            boxSizing: "border-box",
          }}
        >
          {/* Кнопка "Очистить выбор" */}
          {showClearButton && (
            <button
              onClick={() => {
                onChange("");
                setIsOpen(false);
              }}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "none",
                backgroundColor: "#f5f5f5",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              {`Очистить выбор ${sectionGen}`}
            </button>
          )}

          {/* Опции в виде обычного вертикального списка */}
          {options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => {
                onChange(opt.id);
                setIsOpen(false);
              }}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "none",
                backgroundColor: value === opt.id && paramType === "surface" ? "#006BCF" : value === opt.id ? "#e3f2fd" : "#fff",
                color: value === opt.id && paramType === "surface" ? "#fff" : undefined,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                textAlign: "left",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => {
                if (value !== opt.id) {
                  e.currentTarget.style.backgroundColor = "#f5f5f5";
                }
              }}
              onMouseLeave={(e) => {
                if (value !== opt.id) {
                  e.currentTarget.style.backgroundColor = "#fff";
                }
              }}
            >
              <span>{opt.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}