import {
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import Index from "./pages/Index";
import Brand from "./pages/Brand";
import { RootLayout } from "./RootLayout";

export { queryClient } from "./queryClient";

const rootRoute = createRootRoute({
  component: RootLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Index,
});

export type BrandSearch = Record<string, string | undefined>;

const brandRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/$brandCode",
  component: Brand,
  validateSearch: (search: Record<string, unknown>): BrandSearch => {
    const result: BrandSearch = {};
    for (const [key, value] of Object.entries(search)) {
      if (typeof value === "string" && value) {
        result[key] = value;
      }
    }
    return result;
  },
});

const routeTree = rootRoute.addChildren([indexRoute, brandRoute]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
