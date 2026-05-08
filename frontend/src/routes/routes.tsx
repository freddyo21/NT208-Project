import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";

import { AdminLayout } from "@/layouts/AdminLayout";
import { AuthLayout } from "@/layouts/AuthLayout";
import { UserLayout } from "@/layouts/UserLayout";
import { IndexRoutes } from "./IndexRoutes";
import { AuthRoutes } from "./AuthRoutes";
import { UserRoutes } from "./UserRoutes";
import LoginProvider from "@/providers/LoginProvider";
import { ERoleLevels } from "@/types/enumerations/ERoleLevels";
import { RoleCheckMiddleware } from "@/middlewares/RoleCheckMiddleware";

const AdminRoutes = lazy(() => import("./AdminRoutes"));

// Route configuration object (config-based)
const routesConfig = [
    {
        path: "main",
        element: (
            <IndexRoutes />
        )
    },  
    {
        path: "admin",
        element: (
            <RoleCheckMiddleware minRole={ERoleLevels.ADMIN}>
                <AdminLayout />
            </RoleCheckMiddleware>
        ),
        children: [
            { path: "*", element: <AdminRoutes /> },
        ],
    },
    {
        path: "auth",
        element: <AuthLayout />,
        children: [
            { path: "*", element: <AuthRoutes /> },
        ],
    },
    {
        path: "user",
        element: (
            <RoleCheckMiddleware minRole={ERoleLevels.OPERATOR}>
                <UserLayout />
            </RoleCheckMiddleware>
        ),
        children: [
            { path: "*", element: <UserRoutes /> },
        ],
    },
];

// Helper function to recursively render routes from config
function renderRoutes(routesArray: any) {
    return routesArray.map((route: any, idx: number) => {
        if (route.index) {
            return <Route key={`route-${idx}`} index element={route.element} />;
        }
        if (route.children) {
            return (
                <Route
                    key={`route-${idx}`}
                    path={route.path}
                    element={route.element}
                >
                    {renderRoutes(route.children)}
                </Route>
            );
        }
        return (
            <Route
                key={`route-${idx}`}
                path={route.path}
                element={route.element}
            />
        );
    });
}

export function RoutesConfig() {
    return (
        <LoginProvider>
            <Routes>
                {renderRoutes(routesConfig)}
            </Routes>
        </LoginProvider>
    );
}
