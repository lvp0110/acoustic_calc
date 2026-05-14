import ReactMarkdown from "react-markdown";
import styles from "./brand-description.module.css";

interface BrandDescriptionProps {
  content: string;
}

export default function BrandDescription({ content }: BrandDescriptionProps) {
  return (
    <div
      className={`${styles.description} brand-page-model-description`}
    >
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
