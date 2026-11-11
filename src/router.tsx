import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  useRouterState,
} from "@tanstack/react-router";
import Index from "./pages/Index";
import Brand from "./pages/Brand";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

function RootLayout() {
  const isHome = useRouterState({
    select: (state) => state.location.pathname === "/",
  });

  return (
    <QueryClientProvider client={queryClient}>
      {isHome ? <div className="home-bg" aria-hidden="true" /> : null}
      <Outlet />
    </QueryClientProvider>
  );
}

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
