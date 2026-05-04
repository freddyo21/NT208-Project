import { Route, Routes } from "react-router-dom";

import { AdminLayout } from "@/layouts/AdminLayout";

import { lazy } from "react";

const AdminRoutes = lazy(() => import("./AdminRoutes"));

import { IndexRoutes } from "./IndexRoutes";
import { AuthRoutes } from "./AuthRoutes";
import { AuthLayout } from "@/layouts/AuthLayout";
import { UserRoutes } from "./UserRoutes";
import LoginProvider from "@/providers/LoginProvider";
import { ERoleLevels } from "@/types/enumerations/ERoleLevels";
import { RoleCheckMiddleware } from "@/middlewares/RoleCheckMiddleware";
import { UserLayout } from "@/layouts/UserLayout";

// Route configuration object (config-based)
const routesConfig = [
    {
        path: "/*",
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
        // Handle index route (React Router v6+)
        if (route.index) {
            return <Route key={`route-${idx}`} index element={route.element} />;
        }
        // Route with children (nested)
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
        // Regular route
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