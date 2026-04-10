import { lazy } from "react";
import { Route, Routes } from "react-router-dom";

const UserProfile = lazy(() => import("../pages/user/UserProfile/UserProfile"));

export const UserRoutes = () => {
    return (
        <Routes>
            <Route path="profile" element={<UserProfile />} />
        </Routes>
    );
}
