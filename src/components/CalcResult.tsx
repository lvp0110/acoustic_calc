import { submitKpForm, type CalcResultData } from "../api";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import ReactMarkdown from "react-markdown";
import "./CalcResult.css";

interface CalcResultProps {
  data: CalcResultData;
  onSelectChange?: (rowId: string, itemCode: string) => void;
  excelUrl?: string;
  brandCode?: string;
}

export default function CalcResult({
  data,
  onSelectChange,
  excelUrl,
  brandCode = "",
}: CalcResultProps) {
  const columns = data.columns.filter((col) => col.id !== "code");
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
  }, []);

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
                      <td key={col.id} data-label={col.name}>
                        <span className="result-cell-value">
                          {item[col.id as keyof typeof item]}
                        </span>
                      </td>
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
                    <td key={col.id} data-label={col.name}>
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
                              setOpenRowId((prev) =>
                                prev === row.id ? null : row.id,
                              )
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
                        <span className="result-cell-value">
                          {firstItem[col.id as keyof typeof firstItem]}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
        {data.title ? (
          <div
            className="result-table-title-footer"
            style={{ color: "#ff6400" }}
          >
            <ReactMarkdown>{data.title}</ReactMarkdown>
          </div>
        ) : null}
      </div>

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
                    viewBox="0 0 80 80"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      cx="40"
                      cy="40"
                      r="30"
                      stroke="#3498db"
                      strokeWidth="1.75"
                    />
                    <path
                      d="M26 41.5 L35.5 51 L54 29.5"
                      stroke="#3498db"
                      strokeWidth="2.25"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
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
                    viewBox="0 0 80 80"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      cx="40"
                      cy="40"
                      r="30"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      fill="none"
                    />
                    <circle cx="30" cy="33" r="3.25" fill="currentColor" />
                    <circle cx="50" cy="33" r="3.25" fill="currentColor" />
                    <path
                      d="M28 52 Q40 62 52 52"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      fill="none"
                    />
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
