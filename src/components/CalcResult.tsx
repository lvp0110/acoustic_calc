import {
  submitKpForm,
  type CalcResultData,
} from "../api";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import ReactMarkdown from "react-markdown";
import "./CalcResult.css";

interface CalcResultProps {
  data: CalcResultData;
  /** Выбранный артикул из URL (search.articuls). */
  selectedArticul?: string;
  onSelectChange?: (rowId: string, itemCode: string) => void;
  /** На узком экране — возврат к форме (отдельный «экран», как в calc). */
  onBackToCharacteristics?: () => void;
  excelUrl?: string;
  brandCode?: string;
}

export default function CalcResult({
  data,
  selectedArticul,
  onSelectChange,
  onBackToCharacteristics,
  excelUrl,
  brandCode = "",
}: CalcResultProps) {
  const columns = useMemo(
    () => data.columns.filter((col) => col.id !== "code"),
    [data.columns],
  );
  const [openRowId, setOpenRowId] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const kpDialogRef = useRef<HTMLDialogElement | null>(null);
  const instanceId = useId();
  const kpFormId = useId();
  const kpDialogTitleId = useId();
  const kpDialogSuccessTitleId = useId();
  const kpDialogErrorTitleId = useId();
  const [kpModalOpen, setKpModalOpen] = useState(false);
  const [kpName, setKpName] = useState("");
  const [kpCity, setKpCity] = useState("");
  const [kpPhone, setKpPhone] = useState("");
  const [kpEmail, setKpEmail] = useState("");
  const [kpConsent, setKpConsent] = useState(false);
  const [kpSubmitting, setKpSubmitting] = useState(false);
  const [kpSubmitError, setKpSubmitError] = useState<string | null>(null);
  const [kpSubmitOk, setKpSubmitOk] = useState(false);

  const kpCanSubmit =
    kpName.trim() !== "" &&
    kpCity.trim() !== "" &&
    kpPhone.trim() !== "" &&
    kpEmail.trim() !== "" &&
    kpConsent &&
    !kpSubmitting;

  useEffect(() => {
    if (kpModalOpen) return;
    setKpName("");
    setKpCity("");
    setKpPhone("");
    setKpEmail("");
    setKpConsent(false);
    setKpSubmitError(null);
    setKpSubmitOk(false);
  }, [kpModalOpen]);

  useEffect(() => {
    if (openRowId === null) return;

    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current) return;
      if (e.target instanceof Node && rootRef.current.contains(e.target))
        return;
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
  }, [openRowId]);

  useEffect(() => {
    const el = kpDialogRef.current;
    if (!el) return;
    if (kpModalOpen) {
      if (!el.open) el.showModal();
    } else if (el.open) {
      el.close();
    }
  }, [kpModalOpen]);

  useEffect(() => {
    const el = kpDialogRef.current;
    if (!el) return;
    function onDialogClose() {
      setKpModalOpen(false);
    }
    el.addEventListener("close", onDialogClose);
    return () => el.removeEventListener("close", onDialogClose);
  }, []);

  async function handleKpFormSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setKpSubmitError(null);
    setKpSubmitOk(false);
    setKpSubmitting(true);
    try {
      await submitKpForm({
        brandCode,
        name: kpName.trim(),
        city: kpCity.trim(),
        phone: kpPhone.trim(),
        email: kpEmail.trim(),
        note: "",
        pageUrl: window.location.href,
      });
      setKpSubmitOk(true);
      setKpName("");
      setKpCity("");
      setKpPhone("");
      setKpEmail("");
      setKpConsent(false);
    } catch {
      setKpSubmitError("Не удалось отправить заявку. Попробуйте позже.");
    } finally {
      setKpSubmitting(false);
    }
  }

  function renderResultRows(layout: "desktop" | "cards") {
    const withCardLabels = layout === "cards";

    return data.rows.map((row) => {
      if (row.items.length === 1) {
        const item = row.items[0];
        return (
          <tr key={item.code}>
            {columns.map((col) => (
              <td
                key={col.id}
                data-col={col.id}
                {...(withCardLabels ? { "data-label": col.name } : {})}
              >
                <span className="result-cell-value">
                  {item[col.id as keyof typeof item]}
                </span>
              </td>
            ))}
          </tr>
        );
      }

      const listboxId = `cell-select-${layout}-${instanceId}-${row.id}`;
      const selectedItem =
        row.items.find((it) => it.code === selectedArticul) ?? row.items[0];

      return (
        <tr key={row.id}>
          {columns.map((col) => (
            <td
              key={col.id}
              data-col={col.id}
              {...(withCardLabels ? { "data-label": col.name } : {})}
            >
              {col.id === "name" ? (
                <span
                  className="cell-select-wrap"
                  data-open={openRowId === row.id ? "true" : "false"}
                >
                  <span
                    role="button"
                    tabIndex={0}
                    className="cell-select-trigger"
                    aria-haspopup="listbox"
                    aria-expanded={openRowId === row.id}
                    aria-controls={listboxId}
                    onClick={() =>
                      setOpenRowId((prev) =>
                        prev === row.id ? null : row.id,
                      )
                    }
                    onKeyDown={(e: ReactKeyboardEvent<HTMLSpanElement>) => {
                      if (e.key !== "Enter" && e.key !== " ") return;
                      e.preventDefault();
                      setOpenRowId((prev) =>
                        prev === row.id ? null : row.id,
                      );
                    }}
                  >
                    {selectedItem.name}
                  </span>
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
                              item.code === selectedItem.code
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
                <span className="result-cell-value">
                  {selectedItem[col.id as keyof typeof selectedItem]}
                </span>
              )}
            </td>
          ))}
        </tr>
      );
    });
  }

  function renderResultDesktopHeaderRow() {
    return (
      <tr>
        {columns.map((col) => (
          <th key={col.id} scope="col" data-col={col.id}>
            {col.name}
          </th>
        ))}
      </tr>
    );
  }

  return (
    <div ref={rootRef} className="calc-result">
      {excelUrl ? (
        <div className="result-export-actions">
          <div className="result-export-excel-kp">
            <button
              type="button"
              className="result-export-btn result-export-btn--primary"
              aria-label="Запросить коммерческое предложение"
              onClick={() => setKpModalOpen(true)}
            >
              Запросить коммерческое предложение
            </button>
            <a
              className="result-export-btn result-export-btn--secondary"
              href={excelUrl}
              download
              aria-label="Выгрузить таблицу в Excel"
            >
              <span className="result-export-btn__label">
                Выгрузить таблицу
              </span>
              <img
                className="result-export-btn__icon"
                src="/Excel_icon.png"
                alt=""
                width={20}
                height={20}
              />
            </a>
          </div>
        </div>
      ) : null}

      {onBackToCharacteristics ? (
        <button
          type="button"
          className="calc-result-back-link"
          onClick={onBackToCharacteristics}
        >
          Вернуться к выбору характеристик
        </button>
      ) : null}

      <div className="result-table-wrap">
        <div className="result-layout result-layout--desktop">
          <table className="result-table result-table--desktop">
            <thead role="rowgroup">
              {renderResultDesktopHeaderRow()}
            </thead>
            <tbody role="rowgroup">{renderResultRows("desktop")}</tbody>
          </table>
        </div>
        <div className="result-layout result-layout--cards">
          <div className="result-cards-sheet">
            <div className="result-cards-column-headers">
              {columns.map((col) => (
                <div
                  key={col.id}
                  className="result-cards-column-head"
                  role="columnheader"
                  data-col={col.id}
                  data-label={col.name}
                >
                  {col.name}
                </div>
              ))}
            </div>
            <table className="result-table result-table--cards">
              <tbody role="rowgroup">{renderResultRows("cards")}</tbody>
            </table>
          </div>
        </div>
      </div>

      {data.title ? (
        <div className="result-table-title-footer">
          <ReactMarkdown>{data.title}</ReactMarkdown>
        </div>
      ) : null}

      <dialog
        ref={kpDialogRef}
        className="kp-dialog"
        aria-labelledby={
          kpSubmitOk
            ? kpDialogSuccessTitleId
            : kpSubmitError
              ? kpDialogErrorTitleId
              : kpDialogTitleId
        }
      >
        <div className="kp-dialog-inner">
          {kpSubmitOk ? (
            <div
              className="kp-dialog-success"
              role="status"
              aria-live="polite"
            >
              <button
                type="button"
                className="kp-dialog-close kp-dialog-close--success"
                onClick={() => setKpModalOpen(false)}
                aria-label="Закрыть"
              >
                ×
              </button>
              <div className="kp-dialog-success__body">
                <div className="kp-dialog-success__icon" aria-hidden>
                  <svg
                    className="kp-dialog-success__svg"
                    width="64"
                    height="64"
                    viewBox="0 0 64 64"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g clipPath="url(#clip0_5570_18552)">
                      <path
                        d="M54.6274 9.3725C48.5834 3.32863 40.5475 0 32 0C23.4524 0 15.4164 3.32863 9.3725 9.3725C3.3285 15.4165 0 23.4525 0 32C0 40.5475 3.3285 48.5834 9.3725 54.6274C15.4165 60.6714 23.4524 64 32 64C40.5475 64 48.5834 60.6714 54.6274 54.6274C60.6714 48.5834 64 40.5475 64 32C64 23.4525 60.6714 15.4166 54.6274 9.3725ZM32 60.25C16.4229 60.25 3.75 47.5771 3.75 32C3.75 16.4229 16.4229 3.75 32 3.75C47.5771 3.75 60.25 16.4229 60.25 32C60.25 47.5771 47.5771 60.25 32 60.25Z"
                        fill="#36A9E1"
                      />
                      <path
                        d="M47.2896 21.7326C46.5575 21.0006 45.3702 21.0006 44.6381 21.7327L28.0808 38.2901L19.3649 29.5742C18.6327 28.8421 17.4455 28.8421 16.7132 29.5742C15.981 30.3063 15.981 31.4936 16.7132 32.2258L26.7549 42.2675C27.121 42.6336 27.6009 42.8166 28.0806 42.8166C28.5604 42.8166 29.0404 42.6335 29.4064 42.2675L47.2896 24.3842C48.0219 23.6521 48.0219 22.4648 47.2896 21.7326Z"
                        fill="#36A9E1"
                      />
                    </g>
                    <defs>
                      <clipPath id="clip0_5570_18552">
                        <rect width="64" height="64" fill="white" />
                      </clipPath>
                    </defs>
                  </svg>
                </div>
                <h2
                  id={kpDialogSuccessTitleId}
                  className="kp-dialog-success__title"
                >
                  Ваш запрос отправлен!
                </h2>
                <p className="kp-dialog-success__text">
                  Наши менеджеры свяжутся с вами в ближайшее время
                </p>
                <button
                  type="button"
                  className="kp-dialog-success__btn"
                  onClick={() => setKpModalOpen(false)}
                >
                  Закрыть
                </button>
              </div>
            </div>
          ) : kpSubmitError ? (
            <div className="kp-dialog-error" role="alert" aria-live="assertive">
              <div className="kp-dialog-error__dash" aria-hidden />
              <button
                type="button"
                className="kp-dialog-close kp-dialog-close--success"
                onClick={() => setKpModalOpen(false)}
                aria-label="Закрыть"
              >
                ×
              </button>
              <div className="kp-dialog-error__body">
              <div className="kp-dialog-error__icon" aria-hidden>
                <svg
                  className="kp-dialog-error__svg"
                  width="64"
                  height="64"
                  viewBox="0 0 64 64"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g clipPath="url(#clip0_5570_22747)">
                    <path
                      d="M31.9971 37.0869C33.7635 37.0869 35.5122 37.4397 37.1406 38.124C38.7691 38.8083 40.2452 39.8106 41.4814 41.0723C42.2542 41.8612 42.2409 43.1274 41.4521 43.9004C40.6633 44.6733 39.3971 44.6608 38.624 43.8721C37.7602 42.9905 36.7287 42.2897 35.5908 41.8115C34.453 41.3334 33.2312 41.0869 31.9971 41.0869C30.7628 41.0869 29.5402 41.3334 28.4023 41.8115C27.2647 42.2896 26.2338 42.9906 25.3701 43.8721C24.5971 44.6608 23.3309 44.6733 22.542 43.9004C21.7531 43.1274 21.7398 41.8612 22.5127 41.0723C23.7489 39.8106 25.2251 38.8083 26.8535 38.124C28.482 37.4398 30.2307 37.0869 31.9971 37.0869Z"
                      fill="#36A9E1"
                    />
                    <path
                      d="M22.3643 23.0557C23.745 23.0557 24.8643 24.175 24.8643 25.5557C24.8642 26.9363 23.7449 28.0557 22.3643 28.0557H22.332C20.9514 28.0557 19.8321 26.9363 19.832 25.5557C19.832 24.175 20.9513 23.0557 22.332 23.0557H22.3643Z"
                      fill="#36A9E1"
                    />
                    <path
                      d="M41.7002 23.0557C43.0809 23.0557 44.2002 24.175 44.2002 25.5557C44.2001 26.9363 43.0809 28.0557 41.7002 28.0557H41.668C40.2873 28.0557 39.168 26.9363 39.168 25.5557C39.168 24.175 40.2873 23.0557 41.668 23.0557H41.7002Z"
                      fill="#36A9E1"
                    />
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M32 1C36.071 1 40.1022 1.80149 43.8633 3.35938C47.6244 4.91727 51.0413 7.20146 53.9199 10.0801C56.7985 12.9587 59.0827 16.3756 60.6406 20.1367C62.1985 23.8978 63 27.929 63 32C63 36.071 62.1985 40.1022 60.6406 43.8633C59.0827 47.6244 56.7985 51.0413 53.9199 53.9199C51.0413 56.7985 47.6244 59.0827 43.8633 60.6406C40.1022 62.1985 36.071 63 32 63C27.929 63 23.8978 62.1985 20.1367 60.6406C16.3756 59.0827 12.9587 56.7985 10.0801 53.9199C7.20146 51.0413 4.91727 47.6244 3.35938 43.8633C1.80149 40.1022 1 36.071 1 32C1 27.929 1.80149 23.8978 3.35938 20.1367C4.91727 16.3756 7.20146 12.9587 10.0801 10.0801C12.9587 7.20146 16.3756 4.91727 20.1367 3.35938C23.8978 1.80149 27.929 1 32 1ZM32 5C28.4544 5 24.9437 5.69885 21.668 7.05566C18.3922 8.41254 15.4154 10.401 12.9082 12.9082C10.401 15.4154 8.41254 18.3922 7.05566 21.668C5.69885 24.9437 5 28.4544 5 32C5 35.5456 5.69885 39.0563 7.05566 42.332C8.41254 45.6078 10.401 48.5846 12.9082 51.0918C15.4154 53.599 18.3922 55.5875 21.668 56.9443C24.9437 58.3012 28.4544 59 32 59C35.5456 59 39.0563 58.3012 42.332 56.9443C45.6078 55.5875 48.5846 53.599 51.0918 51.0918C53.599 48.5846 55.5875 45.6078 56.9443 42.332C58.3012 39.0563 59 35.5456 59 32C59 28.4544 58.3012 24.9437 56.9443 21.668C55.5875 18.3922 53.599 15.4154 51.0918 12.9082C48.5846 10.401 45.6078 8.41254 42.332 7.05566C39.0563 5.69885 35.5456 5 32 5Z"
                      fill="#36A9E1"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_5570_22747">
                      <rect width="64" height="64" fill="white" />
                    </clipPath>
                  </defs>
                </svg>
              </div>
                <h2
                  id={kpDialogErrorTitleId}
                  className="kp-dialog-error__title"
                >
                  Что-то пошло не так...
                </h2>
                <p className="kp-dialog-error__text">
                  Не удалось отправить запрос. Попробуйте снова или повторите
                  попытку позже.
                </p>
                <button
                  type="button"
                  className="kp-dialog-error__btn"
                  onClick={() => setKpSubmitError(null)}
                >
                  Отправить повторно
                </button>
              </div>
            </div>
          ) : (
            <>
              <header className="kp-dialog-header">
                <h2 id={kpDialogTitleId} className="kp-dialog-title">
                  Запрос коммерческого предложения
                </h2>
                <button
                  type="button"
                  className="kp-dialog-close"
                  onClick={() => setKpModalOpen(false)}
                  aria-label="Закрыть"
                >
                  ×
                </button>
              </header>
              <form className="kp-form" onSubmit={handleKpFormSubmit}>
                <input
                  id={`${kpFormId}-name`}
                  className="kp-form__input"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Как к вам обращаться?"
                  aria-label="Как к вам обращаться?"
                  value={kpName}
                  onChange={(e) => setKpName(e.target.value)}
                  required
                />
                <input
                  id={`${kpFormId}-city`}
                  className="kp-form__input"
                  name="city"
                  type="text"
                  autoComplete="address-level2"
                  placeholder="Ваш город"
                  aria-label="Ваш город"
                  value={kpCity}
                  onChange={(e) => setKpCity(e.target.value)}
                  required
                />
                <input
                  id={`${kpFormId}-phone`}
                  className="kp-form__input"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder="Ваш телефон"
                  aria-label="Ваш телефон"
                  value={kpPhone}
                  onChange={(e) => setKpPhone(e.target.value)}
                  required
                />
                <input
                  id={`${kpFormId}-email`}
                  className="kp-form__input"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Эл. почта"
                  aria-label="Эл. почта"
                  value={kpEmail}
                  onChange={(e) => setKpEmail(e.target.value)}
                  required
                />
                <div className="kp-form__consent">
                  <input
                    id={`${kpFormId}-consent`}
                    className="kp-form__checkbox"
                    name="consent"
                    type="checkbox"
                    checked={kpConsent}
                    onChange={(e) => setKpConsent(e.target.checked)}
                    required
                  />
                  <label
                    className="kp-form__consent-label"
                    htmlFor={`${kpFormId}-consent`}
                  >
                    Я соглашаюсь на обработку персональных данных на условиях
                    изложенных в{" "}
                    <a
                      className="kp-form__policy-link"
                      href="#"
                      onClick={(e) => e.preventDefault()}
                    >
                      Политике в отношении обработки персональных данных
                    </a>
                  </label>
                </div>
                <button
                  type="submit"
                  className="kp-form__submit"
                  disabled={!kpCanSubmit}
                >
                  {kpSubmitting ? "Отправка…" : "Отправить"}
                </button>
              </form>
            </>
          )}
        </div>
      </dialog>
    </div>
  );
}
