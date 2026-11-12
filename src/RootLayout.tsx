import { QueryClientProvider } from "@tanstack/react-query";
import { Outlet, useRouterState } from "@tanstack/react-router";
import { queryClient } from "./queryClient";

export function RootLayout() {
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
