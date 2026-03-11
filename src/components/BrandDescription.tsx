import styles from "./brand-description.module.css";

interface BrandDescriptionProps {
  html: string;
}

export default function BrandDescription({ html }: BrandDescriptionProps) {
  return (
    <div
      className={styles.description}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
