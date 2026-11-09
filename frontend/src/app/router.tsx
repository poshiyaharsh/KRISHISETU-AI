import React, { Suspense, lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import { MainLayout } from "@/layouts/MainLayout";
import { KrishiLoader } from "@/components/Loader/KrishiLoader";

// Route-level code splitting
const Home = lazy(() => import("@/pages/Home"));
const Recommend = lazy(() => import("@/pages/Recommend"));
const Weather = lazy(() => import("@/pages/Weather"));
const Schemes = lazy(() => import("@/pages/Schemes"));
const SchemeDetail = lazy(() => import("@/pages/SchemeDetail"));
const Nutrition = lazy(() => import("@/pages/Nutrition"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense
    fallback={
      <div className="min-h-[50vh] flex items-center justify-center py-16">
        <KrishiLoader />
      </div>
    }
  >
    {children}
  </Suspense>
);

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: (
          <SuspenseWrapper>
            <Home />
          </SuspenseWrapper>
        ),
      },
      {
        path: "recommend",
        element: (
          <SuspenseWrapper>
            <Recommend />
          </SuspenseWrapper>
        ),
      },
      {
        path: "weather",
        element: (
          <SuspenseWrapper>
            <Weather />
          </SuspenseWrapper>
        ),
      },
      {
        path: "schemes",
        element: (
          <SuspenseWrapper>
            <Schemes />
          </SuspenseWrapper>
        ),
      },
      {
        path: "schemes/:slug",
        element: (
          <SuspenseWrapper>
            <SchemeDetail />
          </SuspenseWrapper>
        ),
      },
      {
        path: "nutrition",
        element: (
          <SuspenseWrapper>
            <Nutrition />
          </SuspenseWrapper>
        ),
      },
      {
        path: "*",
        element: (
          <SuspenseWrapper>
            <NotFound />
          </SuspenseWrapper>
        ),
      },
    ],
  },
]);
