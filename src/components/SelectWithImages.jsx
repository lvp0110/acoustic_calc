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
  const [tooltipPosition, setTooltipPosition] = useState({
    right: 0,
    bottom: 0,
  });
  const [dropdownStyle, setDropdownStyle] = useState({});
  const spanRef = useRef(null);
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);
  // Используем строгое сравнение для поиска правильного бренда
  const selectedOption = options.find((opt) => {
    const matches = String(opt.id) === String(value);
    return matches;
  });
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
    let block2 = containerRef.current.closest(".block-2");
    if (block2) {
      const block2Rect = block2.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();

      // Вычисляем offset слева (относительно block-2)
      const leftOffset = containerRect.left - block2Rect.left;

      // Ширина dropdown = ширина block-2 минус padding (10px с каждой стороны = 20px)
      const dropdownWidth = block2Rect.width;

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

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen, calculateDropdownStyle]);

  // Обработчик клика вне dropdown для его закрытия
  useEffect(() => {
    if (!isOpen) return;

    // Для мобильных устройств отслеживаем touch события для определения скролла
    let touchStartY = null;
    let touchStartX = null;
    let touchStartTime = null;
    let hasScrolled = false;

    const handleTouchStart = (event) => {
      if (event.touches.length > 0) {
        touchStartY = event.touches[0].clientY;
        touchStartX = event.touches[0].clientX;
        touchStartTime = Date.now();
        hasScrolled = false;
      }
    };

    const handleTouchMove = (event) => {
      if (touchStartY !== null && touchStartX !== null && event.touches.length > 0) {
        const deltaY = Math.abs(event.touches[0].clientY - touchStartY);
        const deltaX = Math.abs(event.touches[0].clientX - touchStartX);
        // Если движение больше 5px, считаем это скроллом
        if (deltaY > 5 || deltaX > 5) {
          hasScrolled = true;
        }
      }
    };

    const handleClickOutside = (event) => {
      // На мобильных устройствах проверяем, не был ли это скролл
      if (window.innerWidth < 1024) {
        // Если это touch событие и был скролл, не закрываем
        if (event.type === 'touchend' && hasScrolled) {
          touchStartY = null;
          touchStartX = null;
          touchStartTime = null;
          hasScrolled = false;
          return;
        }
        // Если между touchstart и touchend прошло больше 200ms и было движение, это скролл
        if (event.type === 'touchend' && touchStartTime && Date.now() - touchStartTime > 200 && hasScrolled) {
          touchStartY = null;
          touchStartX = null;
          touchStartTime = null;
          hasScrolled = false;
          return;
        }
      }

      // Проверяем, что клик был вне контейнера и dropdown
      const clickedInsideContainer = containerRef.current?.contains(
        event.target
      );
      const clickedInsideDropdown = dropdownRef.current?.contains(event.target);

      // Также проверяем, не был ли это клик на кнопку выбора опции или её дочерние элементы
      const isDropdownItemButton = event.target.closest(
        ".select-dropdown-item"
      );
      const isSizeOptionButton = event.target.closest(".size-option-button");
      const isDropdownItem = event.target.closest("[data-dropdown-item]");

      // Если клик внутри dropdown или на элементе dropdown, не закрываем
      if (
        clickedInsideDropdown ||
        isDropdownItem ||
        isDropdownItemButton ||
        isSizeOptionButton
      ) {
        touchStartY = null;
        touchStartX = null;
        touchStartTime = null;
        hasScrolled = false;
        return;
      }

      // Если клик вне контейнера, закрываем dropdown
      if (!clickedInsideContainer) {
        setIsOpen(false);
        setQ("");
      }
      
      touchStartY = null;
      touchStartX = null;
      touchStartTime = null;
      hasScrolled = false;
    };

    // Используем click вместо mousedown, чтобы он срабатывал после onClick на кнопке
    // Добавляем небольшую задержку, чтобы клик на кнопку открытия успел обработаться
    const timeoutId = setTimeout(() => {
      document.addEventListener("click", handleClickOutside, true);
      // Для мобильных устройств добавляем touch события
      if (window.innerWidth < 1024) {
        document.addEventListener("touchstart", handleTouchStart, { passive: true });
        document.addEventListener("touchmove", handleTouchMove, { passive: true });
        document.addEventListener("touchend", handleClickOutside, { passive: true });
      }
    }, 150);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("click", handleClickOutside, true);
      if (window.innerWidth < 1024) {
        document.removeEventListener("touchstart", handleTouchStart);
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleClickOutside);
      }
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => {
            const newValue = !prev;
            if (!newValue) {
              setQ("");
            }
            return newValue;
          });
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
            {paramType === "brand" ? (
              // Для брендов: изображение рядом с текстом
              // Важно: selectedOption должен соответствовать выбранному бренду (value === selectedOption.id === selectedOption.code)
              <>
                {(() => {
                  // Строгая проверка: убеждаемся, что selectedOption действительно соответствует value
                  if (!selectedOption) {
                    return null;
                  }
                  
                  // Проверяем соответствие по id и code
                  const idMatches = String(selectedOption.id) === String(value);
                  const codeMatches = !selectedOption.code || String(selectedOption.code) === String(value);
                  
                  if (!idMatches || !codeMatches) {
                    return null;
                  }
                  
                  // Получаем изображение ТОЛЬКО для этого конкретного бренда
                  // Убеждаемся, что Img поле принадлежит именно этому бренду
                  const brandImg = selectedOption.Img;
                  const brandCode = selectedOption.code || selectedOption.id;
                  const hasValidImg = brandImg && String(brandImg).trim() !== "";
                  
                  // Если у бренда нет изображения, не отображаем его
                  if (!hasValidImg) {
                    return null;
                  }
                  
                  // ВАЖНО: Проверяем, что имя файла изображения содержит код бренда
                  // Это гарантирует, что изображение действительно принадлежит этому бренду
                  const imgFileName = String(brandImg).toLowerCase();
                  const brandCodeLower = String(brandCode).toLowerCase();
                  // Проверяем, что имя файла содержит код бренда (например, "text_block_brand_dc.jpg" содержит "dc")
                  const imgMatchesBrand = imgFileName.includes(`_${brandCodeLower}`) || 
                                         imgFileName.includes(`brand_${brandCodeLower}`) ||
                                         imgFileName.startsWith(`${brandCodeLower}_`) ||
                                         imgFileName === `${brandCodeLower}.jpg` ||
                                         imgFileName === `brand_${brandCodeLower}.jpg`;
                  
                  // Если изображение не соответствует коду бренда, не отображаем его
                  // Это предотвращает отображение изображений других брендов
                  if (!imgMatchesBrand) {
                    return null;
                  }
                  
                  const imageUrl = getImageUrl(selectedOption);
                  
                  // Отображаем изображение ТОЛЬКО если оно есть у этого бренда
                  if (imageUrl) {
                    // Определяем, нужен ли crossOrigin (только для внешних доменов)
                    const isExternalUrl = imageUrl.startsWith('http://') || imageUrl.startsWith('https://');
                    const needsCrossOrigin = isExternalUrl && !imageUrl.includes(window.location.hostname);
                    
                    return (
                      <img
                        src={imageUrl}
                        alt={selectedOption?.name}
                        {...(needsCrossOrigin && { crossOrigin: "anonymous" })}
                        onError={(e) => {
                          console.error('[SelectWithImages] Failed to load image:', imageUrl);
                          console.error('[SelectWithImages] Error details:', e);
                          e.currentTarget.style.display = "none";
                        }}
                        onLoad={() => {
                          console.log('[SelectWithImages] Image loaded successfully:', imageUrl);
                        }}
                        style={{
                          width: "50px",
                          height: "50px",
                          objectFit: "contain",
                          marginRight: "12px",
                          flexShrink: 0,
                        }}
                      />
                    );
                  }
                  return null;
                })()}
                <span
                  ref={spanRef}
                  style={{
                    flex: 1,
                    fontSize: "medium",
                    textAlign: "left",
                    padding: "0 12px",
                  }}
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                >
                  {selectedOption?.name}
                </span>
              </>
            ) : (
              // Для остальных типов: изображение на фоне
              <>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    zIndex: 1,
                  }}
                />
                {(() => {
                  const imageUrl = getImageUrl(selectedOption);
                  if (!imageUrl) {
                    return null;
                  }
                  // Определяем, нужен ли crossOrigin (только для внешних доменов)
                  const isExternalUrl = imageUrl.startsWith('http://') || imageUrl.startsWith('https://');
                  const needsCrossOrigin = isExternalUrl && !imageUrl.includes(window.location.hostname);
                  
                  return (
                    <img
                      src={imageUrl}
                      alt={selectedOption?.name}
                      {...(needsCrossOrigin && { crossOrigin: "anonymous" })}
                      onError={(e) => {
                        console.error('[SelectWithImages] Failed to load background image:', imageUrl);
                        console.error('[SelectWithImages] Error details:', e);
                        e.currentTarget.style.display = "none";
                      }}
                      onLoad={() => {
                        console.log('[SelectWithImages] Background image loaded successfully:', imageUrl);
                      }}
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: paramType === "color" ? "cover" : "contain",
                        objectPosition: paramType === "color" ? "center" : "center",
                      }}
                    />
                  );
                })()}
                {paramType !== "color" && (
                  <>
                    <span
                      ref={spanRef}
                      style={{
                        position: "relative",
                        zIndex: 2,
                        marginTop: "auto",
                        padding: "4px 4px",
                        borderRadius: "0px 16px 0px 16px",
                        fontSize: "medium",
                        marginLeft: 0,
                        marginBottom: 0,
                        background: "#f5f5f7",
                      }}
                      onMouseEnter={() => setShowTooltip(true)}
                      onMouseLeave={() => setShowTooltip(false)}
                    >
                      {selectedOption?.name}
                    </span>
                  </>
                )}
              </>
            )}
            {paramType === "color" && (
              <span
                ref={spanRef}
                style={{
                  position: "relative",
                  zIndex: 2,
                  marginTop: "auto",
                  padding: "4px 4px",
                  borderRadius: "0px 14px 0px 14px",
                  fontSize: "medium",
                  marginLeft: 2,
                  marginBottom: 2,
                  background: "#f5f5f7",
                  // borderLeft: "solid 1px lightgray",
                  // borderBottom: "solid 1px lightgray",
                  
                }}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                {selectedOption?.name}
              </span>
            )}
            <span
              style={{
                position: paramType === "brand" ? "relative" : "absolute",
                right: paramType === "brand" ? "auto" : "12px",
                marginLeft: paramType === "brand" ? "auto" : 0,
                marginRight: paramType === "brand" ? "12px" : 0,
                top: paramType === "brand" ? "auto" : (paramType === "color" ? "12px" : "50%"),
                transform:
                  paramType === "brand"
                    ? isOpen
                      ? "rotate(180deg)"
                      : "rotate(0deg)"
                    : paramType === "color"
                    ? isOpen
                      ? "rotate(180deg)"
                      : "rotate(0deg)"
                    : `translateY(-50%) ${
                        isOpen ? "rotate(180deg)" : "rotate(0deg)"
                      }`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "transform 0.3s ease",
                zIndex: 3,
                pointerEvents: "none",
                backgroundColor:
                  paramType === "color"
                    ? "rgba(255, 255, 255, 0.9)"
                    : "rgba(245, 245, 247, 0.9)",
                borderRadius: "50%",
                width: "24px",
                height: "24px",
                flexShrink: 0,
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
            <span style={{ 
              padding: "0 12px", 
              paddingRight: paramType === "brand" ? "40px" : "40px",
              flex: paramType === "brand" ? 1 : "none"
            }}>
              {brandParamsName || `Выберите ${capitalize(sectionAcc)}`}
            </span>
            <span
              style={{
                position: paramType === "brand" ? "relative" : "absolute",
                right: paramType === "brand" ? "auto" : "12px",
                marginLeft: paramType === "brand" ? "auto" : 0,
                marginRight: paramType === "brand" ? "12px" : 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "transform 0.3s ease",
                transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                pointerEvents: "none",
                flexShrink: 0,
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
              // Для брендов: проверяем, что изображение соответствует этому бренду
              let url = null;
              if (paramType === "brand") {
                const brandImg = opt.Img;
                const brandCode = opt.code || opt.id;
                const hasValidImg = brandImg && String(brandImg).trim() !== "";
                
                if (hasValidImg) {
                  // Проверяем, что имя файла содержит код бренда
                  const imgFileName = String(brandImg).toLowerCase();
                  const brandCodeLower = String(brandCode).toLowerCase();
                  const imgMatchesBrand = imgFileName.includes(`_${brandCodeLower}`) || 
                                         imgFileName.includes(`brand_${brandCodeLower}`) ||
                                         imgFileName.startsWith(`${brandCodeLower}_`) ||
                                         imgFileName === `${brandCodeLower}.jpg` ||
                                         imgFileName === `brand_${brandCodeLower}.jpg`;
                  
                  if (imgMatchesBrand) {
                    url = getImageUrl(opt);
                  }
                }
              } else {
                // Для других типов используем стандартную логику
                url = getImageUrl(opt);
              }
              
              return (
                <button
                  key={opt.id}
                  className={`select-dropdown-item ${
                    paramType === "size" ? "size-option-button" : ""
                  }`}
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
                  {url ? (
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
                      {(() => {
                        // Определяем, нужен ли crossOrigin (только для внешних доменов)
                        const isExternalUrl = url.startsWith('http://') || url.startsWith('https://');
                        const needsCrossOrigin = isExternalUrl && !url.includes(window.location.hostname);
                        
                        return (
                          <img
                            src={url}
                            alt={opt.name}
                            {...(needsCrossOrigin && { crossOrigin: "anonymous" })}
                            onError={(e) => {
                              console.error('[SelectWithImages] Failed to load image in dropdown:', url);
                              console.error('[SelectWithImages] Error details:', e);
                              e.currentTarget.style.display = "none";
                            }}
                            onLoad={() => {
                              console.log('[SelectWithImages] Image loaded successfully in dropdown:', url);
                            }}
                            style={{
                              width: "96%",
                              height: "96%",
                              padding: "4px",
                              display: "block",
                              pointerEvents: "none",
                            }}
                          />
                        );
                      })()}
                    </div>
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        aspectRatio: "32 / 32",
                        borderRadius: 16,
                        overflow: "hidden",
                        background: "#f1f2f6",
                        pointerEvents: "none",
                      }}
                    />
                  )}
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
