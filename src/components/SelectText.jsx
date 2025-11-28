import { useState, useMemo, useRef, useEffect } from "react";

export default function SelectText({
  paramType,
  value,
  onChange,
  options,
  SECTION_TITLES,
  capitalize,
  showClearButton = true,
  showArrow = true,
  brandParamsName = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [q, setQ] = useState("");
  const searchInputRef = useRef(null);
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);
  const selectedOption = options.find((opt) => opt.id === value);

  useEffect(() => {
    if (isOpen && searchInputRef.current && paramType !== "surface") {
      searchInputRef.current.focus();
    }
  }, [isOpen, paramType]);

  // Обработчик клика вне dropdown для его закрытия
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      // Проверяем, что клик был вне контейнера и dropdown
      const clickedInsideContainer = containerRef.current?.contains(event.target);
      const clickedInsideDropdown = dropdownRef.current?.contains(event.target);
      
      // Также проверяем, не был ли это клик на кнопку выбора опции или её дочерние элементы
      const isDropdownItemButton = event.target.closest('button[data-dropdown-item]');
      const isDropdownItem = event.target.closest('[data-dropdown-item]');
      
      // Если клик внутри dropdown или на элементе dropdown, не закрываем
      if (clickedInsideDropdown || isDropdownItem || isDropdownItemButton) {
        return;
      }
      
      // Если клик вне контейнера, закрываем dropdown
      if (!clickedInsideContainer) {
        setIsOpen(false);
        if (paramType !== "surface") {
          setQ("");
        }
      }
    };

    // Обработчик touch-событий для мобильных устройств
    const handleTouchStart = (event) => {
      // Если touch происходит внутри dropdown или контейнера, не закрываем
      if (
        dropdownRef.current?.contains(event.target) ||
        containerRef.current?.contains(event.target)
      ) {
        return;
      }
      
      // На мобильных устройствах закрываем только при явном touch вне dropdown
      if (window.innerWidth < 550) {
        // Небольшая задержка, чтобы дать возможность обработать клик на кнопку
        setTimeout(() => {
          if (!containerRef.current?.contains(event.target) && 
              !dropdownRef.current?.contains(event.target)) {
            setIsOpen(false);
            if (paramType !== "surface") {
              setQ("");
            }
          }
        }, 100);
      }
    };

    // Используем click вместо mousedown, чтобы он срабатывал после onClick на кнопке
    // Добавляем небольшую задержку, чтобы клик на кнопку открытия успел обработаться
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside, true);
      // На мобильных устройствах также слушаем touchstart
      if (window.innerWidth < 550) {
        document.addEventListener("touchstart", handleTouchStart, { passive: true });
      }
    }, 150);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside, true);
      if (window.innerWidth < 550) {
        document.removeEventListener("touchstart", handleTouchStart);
      }
    };
  }, [isOpen, paramType]);

  const sectionAcc = SECTION_TITLES[paramType]?.acc || "опцию";
  const sectionGen = SECTION_TITLES[paramType]?.gen || "опции";

  const filtered = useMemo(() => {
    // Для surface не используем поиск
    if (paramType === "surface") return options;
    const s = q.trim().toLowerCase();
    if (!s) return options;
    return options.filter((o) =>
      String(o?.name || "")
        .toLowerCase()
        .includes(s)
    );
  }, [options, q, paramType]);

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (isOpen && paramType !== "surface") {
            setQ("");
          }
        }}
        style={{
          width: "100%",
          padding: "0",
          border: "none",
          borderRadius: "16px",
          backgroundColor: selectedOption && paramType === "surface" ? "#006BCF" : "#fff",
          color: selectedOption && paramType === "surface" ? "#fff" : "#000",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          textAlign: "left",
          minHeight: "70px",
          position: "relative",
          fontSize: "large",
        }}
        aria-label={`Выберите ${sectionAcc}`}
      >
        <span style={{ padding: "0 12px", paddingRight: showArrow ? "40px" : "12px" }}>
          {selectedOption?.name || brandParamsName || capitalize(SECTION_TITLES[paramType]?.gen || sectionGen)}
        </span>
        {showArrow && (
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
        )}
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
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
            left: 0,
            width: "100%",
            backgroundColor: "#fff",
            borderRadius: "16px",
            maxHeight: "300px",
            overflowY: "auto",
            zIndex: 1000,
            display: "block",
            boxSizing: "border-box",            
            marginTop: 8,
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            padding: "0px",
            WebkitOverflowScrolling: "touch", // Плавный скролл на iOS
          }}
          onScroll={(e) => {
            // Предотвращаем всплытие события скролла
            e.stopPropagation();
            e.nativeEvent.stopImmediatePropagation();
          }}
          onTouchStart={(e) => {
            // Предотвращаем закрытие при touch-событиях внутри dropdown
            e.stopPropagation();
          }}
          onTouchMove={(e) => {
            // Предотвращаем закрытие при touch-скролле на мобильных
            e.stopPropagation();
            e.nativeEvent.stopImmediatePropagation();
          }}
          onTouchEnd={(e) => {
            // Предотвращаем закрытие при touch-событиях внутри dropdown
            e.stopPropagation();
          }}
          >
          {/* Поле поиска - только если не surface */}
          {paramType !== "surface" && (
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Поиск"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{
                width: "100%",
                height: "40px",
                padding: "0 12px",
                border: "none",
                borderRadius: "16px",
                outline: "none",
                marginBottom: "12px",
                boxSizing: "border-box",
                fontSize: "large",
                background: "#f7f7f9",
                color: "black",
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setIsOpen(false);
                  setQ("");
                }
              }}
            />
          )}

          {/* Кнопка "Очистить выбор" */}
          {showClearButton && (
            <button
              type="button"
              data-dropdown-item
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChange("");
                setIsOpen(false);
                if (paramType !== "surface") {
                  setQ("");
                }
              }}
              onMouseDown={(e) => {
                // Предотвращаем закрытие dropdown при mousedown на кнопке
                e.stopPropagation();
              }}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "none",
                backgroundColor: "#f5f5f5",
                cursor: "pointer",
                textAlign: "left",
                borderRadius: "0",
              }}
            >
              {`Очистить выбор ${sectionGen}`}
            </button>
          )}

          {/* Опции в виде обычного вертикального списка */}
          {filtered.map((opt) => (
            <button
              key={opt.id}
              type="button"
              data-dropdown-item
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChange(opt.id);
                setIsOpen(false);
                if (paramType !== "surface") {
                  setQ("");
                }
              }}
              onMouseDown={(e) => {
                // Предотвращаем закрытие dropdown при mousedown на кнопке
                e.stopPropagation();
              }}
              style={{
                width: "100%",
                padding: "10px 12px",
                outline: "none",
                backgroundColor: value === opt.id && paramType === "surface" ? "#006BCF" : value === opt.id ? "#e3f2fd" : "#fff",
                color: value === opt.id && paramType === "surface" ? "#fff" : undefined,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                textAlign: "left",
                transition: "background-color 0.2s",
                border: "none",
                borderRadius: "0",
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