import ReactMarkdown from "react-markdown";
import styles from "./brand-description.module.css";

interface BrandDescriptionProps {
  brandName: string;
  modelName?: string;
  content?: string;
}

export default function BrandDescription({
  brandName,
  modelName,
  content,
}: BrandDescriptionProps) {
  return (
    <div
      className={`${styles.description} brand-page-model-description`}
    >
      <h2 className={styles.title}>{brandName}</h2>
      {modelName && <p className={styles.modelName}>{modelName}</p>}
      <div className={styles.content}>
        {content ? (
          <ReactMarkdown>{content}</ReactMarkdown>
        ) : (
          <p className={styles.placeholder}>Место для текста...</p>
        )}
      </div>
    </div>
  );
}
