import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";

export const getBaseUrl = () => {
  const url = import.meta.env.VITE_BASE_URL;
  return url || "/api";
};

console.log("BASE_URL:", getBaseUrl());

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <div />
    </BrowserRouter>
  </React.StrictMode>,
);
