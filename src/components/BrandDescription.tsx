import ReactMarkdown from "react-markdown";
import styles from "./brand-description.module.css";

interface BrandDescriptionProps {
  brandName: string;
  modelName?: string;
  content?: string;
  extraContent?: string;
  /** Описания выбранных кромки и перфорации из brandParams. */
  edgePerfDescriptions?: string[];
}

export default function BrandDescription({
  brandName,
  modelName,
  extraContent,
}: BrandDescriptionProps) {
  return (
    <div className={styles.blocks}>
      <div
        className={`${styles.description} brand-page-model-description`}
      >
        <h2 className={styles.title}>{brandName}</h2>
        <p className={modelName ? styles.modelName : styles.placeholder}>
          {modelName ??
            "Для продолжения выберите модель. После настройки всех параметров станет возможным выполнение расчета конструкции по выбранным данным."}
        </p>
      </div>
      {/* TEMP: brand-page-model-content — раскомментировать для восстановления
      {contentDescriptions.length > 0 && (
        <div className={`${styles.content} brand-page-model-content`}>
          {contentDescriptions.map((desc, index) => (
            <Fragment key={index}>
              {index > 0 ? <hr className={styles.divider} /> : null}
              <div className={styles.descItem}>
                <ReactMarkdown>{desc}</ReactMarkdown>
              </div>
            </Fragment>
          ))}
        </div>
      )}
      */}
      {extraContent?.trim() && (
        <div
          className={`${styles.description} brand-page-model-description`}
        >
          <ReactMarkdown>{extraContent}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}
