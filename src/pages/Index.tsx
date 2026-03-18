import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { getAcousticCategories } from "../api";
import type { AcousticCategory } from "../api";

type Theme = "light" | "dark";

export default function Home() {
  const [theme, setTheme] = useState<Theme>("light");

  const preferredTheme = useMemo<Theme>(() => {
    if (typeof window === "undefined") return "light";
    const stored = window.localStorage.getItem("theme");
    if (stored === "dark" || stored === "light") return stored;
    return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches
      ? "dark"
      : "light";
  }, []);

  useEffect(() => {
    setTheme(preferredTheme);
  }, [preferredTheme]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["acousticCategories"],
    queryFn: () => getAcousticCategories().then((res) => res.data.data),
  });

  if (isLoading) return <p>Загрузка...</p>;
  if (error) return <p>Ошибка: {(error as Error).message}</p>;

  return (
    <div>
      <div className="brands-header">
        <h1>Бренды</h1>
        <button
          type="button"
          className="theme-toggle"
          onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          aria-label="Переключить тему"
          title="Переключить тему"
        >
          {theme === "dark" ? "Светлая тема" : "Тёмная тема"}
        </button>
      </div>
      <ul>
        {data?.map((cat: AcousticCategory) => (
          <li key={cat.ShortName}>
            <Link to="/$brandCode" params={{ brandCode: cat.ShortName }}>
              <strong>{cat.Name}</strong> ({cat.ShortName})
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
