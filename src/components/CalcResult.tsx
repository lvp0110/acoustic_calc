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
  const [kpModalOpen, setKpModalOpen] = useState(false);
  const [kpName, setKpName] = useState("");
  const [kpPhone, setKpPhone] = useState("");
  const [kpEmail, setKpEmail] = useState("");
  const [kpNote, setKpNote] = useState("");
  const [kpSubmitting, setKpSubmitting] = useState(false);
  const [kpSubmitError, setKpSubmitError] = useState<string | null>(null);
  const [kpSubmitOk, setKpSubmitOk] = useState(false);

  const kpCanSubmit =
    kpName.trim() !== "" &&
    kpPhone.trim() !== "" &&
    kpEmail.trim() !== "" &&
    !kpSubmitting;

  useEffect(() => {
    if (kpModalOpen) return;
    setKpName("");
    setKpPhone("");
    setKpEmail("");
    setKpNote("");
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
        phone: kpPhone.trim(),
        email: kpEmail.trim(),
        note: kpNote.trim(),
      });
      setKpSubmitOk(true);
      setKpName("");
      setKpPhone("");
      setKpEmail("");
      setKpNote("");
    } catch {
      setKpSubmitError("Не удалось отправить заявку. Попробуйте позже.");
    } finally {
      setKpSubmitting(false);
    }
  }

  return (
    <div ref={rootRef}>
      <div className="result-table-wrap">
        {excelUrl && (
          <div className="result-export-actions">
            <div className="result-export-excel-kp">
              <a
                className="result-export-btn"
                href={excelUrl}
                download
                aria-label="Скачать расчёт в Excel"
              >
                <img
                  className="result-export-btn__icon"
                  src="/Excel_icon.png"
                  alt=""
                  width={28}
                  height={28}
                />
                <span className="result-export-btn__label">Скачать Excel</span>
              </a>
              <button
                type="button"
                className="result-export-btn"
                aria-label="Коммерческое предложение"
                onClick={() => setKpModalOpen(true)}
              >
                <img
                  className="result-export-btn__icon"
                  src="/logo_kp.png"
                  alt=""
                  width={28}
                  height={28}
                />
                <span className="result-export-btn__label">Запрос КП</span>
              </button>
            </div>
          </div>
        )}

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
        aria-labelledby="kp-dialog-title"
      >
        <div className="kp-dialog-inner">
          <header className="kp-dialog-header">
            <h2 id="kp-dialog-title" className="kp-dialog-title">
              Запрос на Коммерческое предложение
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
            <div className="kp-form__field">
              <label className="kp-form__label" htmlFor={`${kpFormId}-name`}>
                Имя
              </label>
              <input
                id={`${kpFormId}-name`}
                className="kp-form__input"
                name="name"
                type="text"
                autoComplete="name"
                value={kpName}
                onChange={(e) => setKpName(e.target.value)}
                required
              />
            </div>
            <div className="kp-form__field">
              <label className="kp-form__label" htmlFor={`${kpFormId}-phone`}>
                Телефон
              </label>
              <input
                id={`${kpFormId}-phone`}
                className="kp-form__input"
                name="phone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                value={kpPhone}
                onChange={(e) => setKpPhone(e.target.value)}
                required
              />
            </div>
            <div className="kp-form__field">
              <label className="kp-form__label" htmlFor={`${kpFormId}-email`}>
                Эл. почта
              </label>
              <input
                id={`${kpFormId}-email`}
                className="kp-form__input"
                name="email"
                type="email"
                autoComplete="email"
                value={kpEmail}
                onChange={(e) => setKpEmail(e.target.value)}
                required
              />
            </div>
            <div className="kp-form__field">
              <label className="kp-form__label" htmlFor={`${kpFormId}-note`}>
                Примечание
              </label>
              <textarea
                id={`${kpFormId}-note`}
                className="kp-form__textarea"
                name="note"
                rows={4}
                value={kpNote}
                onChange={(e) => setKpNote(e.target.value)}
              />
            </div>
            {kpSubmitError ? (
              <p className="kp-form__message kp-form__message--error" role="alert">
                {kpSubmitError}
              </p>
            ) : null}
            {kpSubmitOk ? (
              <p className="kp-form__message kp-form__message--success" role="status">
                Заявка отправлена. Мы свяжемся с вами.
              </p>
            ) : null}
            <button
              type="submit"
              className="kp-form__submit"
              disabled={!kpCanSubmit}
            >
              {kpSubmitting ? "Отправка…" : "Отправить"}
            </button>
          </form>
        </div>
      </dialog>
    </div>
  );
}
