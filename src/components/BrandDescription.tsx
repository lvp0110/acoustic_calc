// import ReactMarkdown from "react-markdown";
import styles from "./brand-description.module.css";

interface BrandDescriptionProps {
  brandName: string;
  modelName?: string;
  content?: string;
}

export default function BrandDescription({
  brandName,
  modelName,
  content: _content,
}: BrandDescriptionProps) {
  return (
    <div
      className={`${styles.description} brand-page-model-description`}
    >
      <h2 className={styles.title}>{brandName}</h2>
      <p className={modelName ? styles.modelName : styles.placeholder}>
        {modelName ?? "Для продолжения выберите модель. После настройки всех параметров станет возможным выполнение расчета конструкции по выбранным данным."}
      </p>
      {/* {content?.trim() && (
        <div className={styles.content}>
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      )} */}
    </div>
  );
}
