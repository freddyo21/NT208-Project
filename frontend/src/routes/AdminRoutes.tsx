import { lazy } from "react";
import { Route, Routes } from "react-router-dom";

const AdminDashboard = lazy(() => import("../pages/admin/AdminDashboard"));
const UserManagement = lazy(() => import("../pages/admin/users/UserManagement"));

const AdminRoutes = () => {
    return (
        <Routes>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users"     element={<UserManagement />} />
        </Routes>
    );
};

export default AdminRoutes;
