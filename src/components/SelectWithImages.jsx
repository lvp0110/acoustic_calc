import { useMemo, useState, useRef, useEffect, useCallback } from "react";

export default function SelectWithImages({
  paramType,
  value,
  onChange,
  options,
  getImageUrl,
  SECTION_TITLES,
  capitalize,
  brandParamsName = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [q, setQ] = useState("");
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ right: 0, bottom: 0 });
  const [dropdownStyle, setDropdownStyle] = useState({});
  const spanRef = useRef(null);
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);
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

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Вычисляем позицию и ширину выпадающего списка относительно block-2
  const calculateDropdownStyle = useCallback(() => {
    if (!isOpen || !containerRef.current) {
      setDropdownStyle({});
      return;
    }
    
    // Находим ближайший родительский элемент с классом block-2
    let block2 = containerRef.current.closest('.block-2');
    if (block2) {
      const block2Rect = block2.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      
      // Вычисляем offset слева (относительно block-2)
      const leftOffset = containerRect.left - block2Rect.left;
      
      // Ширина dropdown = ширина block-2 минус padding (10px с каждой стороны = 20px)
      const dropdownWidth = block2Rect.width ;
      
      setDropdownStyle({
        left: `-${leftOffset}px`,
        width: `${dropdownWidth}px`,
        maxWidth: `${dropdownWidth}px`,
      });
    } else {
      // Если block-2 не найден, используем стандартное поведение
      setDropdownStyle({});
    }
  }, [isOpen]);

  useEffect(() => {
    calculateDropdownStyle();
    
    // Пересчитываем при изменении размера окна
    const handleResize = () => {
      calculateDropdownStyle();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen, calculateDropdownStyle]);

  // Обработчик клика вне dropdown для его закрытия
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      // Проверяем, что клик был вне контейнера и dropdown
      const clickedInsideContainer = containerRef.current?.contains(event.target);
      const clickedInsideDropdown = dropdownRef.current?.contains(event.target);
      
      // Также проверяем, не был ли это клик на кнопку выбора опции или её дочерние элементы
      const isDropdownItemButton = event.target.closest('.select-dropdown-item');
      const isSizeOptionButton = event.target.closest('.size-option-button');
      const isDropdownItem = event.target.closest('[data-dropdown-item]');
      
      // Если клик внутри dropdown или на элементе dropdown, не закрываем
      if (clickedInsideDropdown || isDropdownItem || isDropdownItemButton || isSizeOptionButton) {
        return;
      }
      
      // Если клик вне контейнера, закрываем dropdown
      if (!clickedInsideContainer) {
        setIsOpen(false);
        setQ("");
      }
    };

    // Используем click вместо mousedown, чтобы он срабатывал после onClick на кнопке
    // Добавляем небольшую задержку, чтобы клик на кнопку открытия успел обработаться
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside, true);
    }, 150);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside, true);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      <button
        type="button"
        onClick={() => {
          setIsOpen((v) => !v);
          if (isOpen) {
            setQ("");
          }
        }}
        style={{
          width: "100%",
          padding: "0",
          border: "none",
          borderRadius: 16,
          backgroundColor: "#fff",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
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
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                maxWidth: "100%",
                maxHeight: "100%",
                width: "auto",
                height: "auto",
                objectFit: "contain",
              }}
            />
            <span
              ref={spanRef}
              style={{
                position: "relative",
                zIndex: 2,
                marginTop: "auto",
                padding: "4px 5px",
                borderRadius: 16,
                fontSize: "large",
                marginLeft: 4,
                marginBottom: 4,
                background: "#f5f5f7",
              }}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              {selectedOption?.name}
            </span>
            <span
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: `translateY(-50%) ${isOpen ? "rotate(180deg)" : "rotate(0deg)"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "transform 0.3s ease",
                zIndex: 3,
                pointerEvents: "none",
                backgroundColor: "rgba(245, 245, 247, 0.9)",
                borderRadius: "50%",
                width: "24px",
                height: "24px",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5 7.5L10 12.5L15 7.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </>
        ) : (
          <>
            <span style={{ padding: "0 12px", paddingRight: "40px" }}>
              {brandParamsName || `Выберите ${capitalize(sectionAcc)}`}
            </span>
            <span
              style={{
                position: "absolute",
                right: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "transform 0.3s ease",
                transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                pointerEvents: "none",
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5 7.5L10 12.5L15 7.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </>
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
            fontSize: "large",
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
          ref={dropdownRef}
          className="select-dropdown"
          onClick={(e) => {
            // Предотвращаем закрытие dropdown при клике внутри него
            e.stopPropagation();
          }}
          onMouseDown={(e) => {
            // Предотвращаем закрытие dropdown при mousedown внутри него
            e.stopPropagation();
          }}
          style={{
            position: "absolute",
            top: "100%",
            left: dropdownStyle.left || 0,
            width: dropdownStyle.width || "100%",
            maxWidth: dropdownStyle.maxWidth || "100%",
            backgroundColor: "#fff",
            border: "none",
            borderRadius: 16,
            maxHeight: 480,
            overflowY: "auto",
            overflowX: "hidden",
            zIndex: 1000,
            boxSizing: "border-box",
            padding: 12,
            marginTop: 8,
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          }}
        >
          {/* Поиск */}
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Поиск"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setIsOpen(false);
                setQ("");
              }
            }}
            style={{
              width: "100%",
              height: 40,
              padding: "0 12px",
              border: "none",
              borderRadius: 16,
              outline: "none",
              marginBottom: 12,
              boxSizing: "border-box",
              fontSize: "large",
              background: "#f7f7f9",
              color: "black",
            }}
          />

          {/* Грид 2 колонки, карточки как на скрине */}
          <div
            className="select-dropdown-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: paramType === "size" ? 0 : 12,
            }}
          >
            {filtered.map((opt) => {
              const url = getImageUrl(opt);
              return (
                <button
                  key={opt.id}
                  className={`select-dropdown-item ${paramType === "size" ? "size-option-button" : ""}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onChange(opt.id);
                    setIsOpen(false);
                    setQ("");
                  }}
                  onMouseDown={(e) => {
                    // Предотвращаем закрытие dropdown при mousedown на кнопке
                    e.stopPropagation();
                  }}
                  type="button"
                  style={{
                    gridColumn: "span 2",
                    width: "100%",
                    padding: paramType === "size" ? "10px 12px" : 8,
                    margin: paramType === "size" ? 0 : undefined,
                    border: "none",
                    outline: "none",
                    boxShadow: "none",
                    borderRadius: 0,
                    backgroundColor: value === opt.id ? "#e3f2fd" : "#fff",
                    cursor: "pointer",
                    textAlign: "left",
                    boxSizing: "border-box",
                    display: "flex",
                    flexDirection: "column",
                    transition: "background-color 0.2s",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      aspectRatio: "32 / 32", 
                      borderRadius: 16,
                      overflow: "hidden",
                      background: "#f1f2f6",
                      pointerEvents: "none",
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
                        pointerEvents: "none",
                      }}
                    />
                  </div>
                  <span
                    style={{
                      marginTop: 8,
                      fontSize: "large",
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      pointerEvents: "none",
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
