import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "./router";
import { metrikaHit } from "./utils/metrika";
import "./index.css";
import "./styles/data-table.css";

let isFirstRoute = true;
router.subscribe("onResolved", () => {
  // Первый просмотр уже считает ym(... 'init'); дальше — только SPA-переходы.
  if (isFirstRoute) {
    isFirstRoute = false;
    return;
  }
  metrikaHit(window.location.href);
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
