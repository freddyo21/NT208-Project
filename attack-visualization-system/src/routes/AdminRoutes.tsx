import { lazy } from "react";
import { Route, Routes } from "react-router-dom";

const AdminDashboard = lazy(() => import("../pages/admin/AdminDashboard"));

const AdminRoutes = () => {
    return (
        <Routes>
            <Route path="dashboard" element={<AdminDashboard />} />
            {/* <Route path="profile" element={<AdminProfile />} /> */}
            {/* <Route path="logs" element={
                <RoleCheckMiddleware minRole={ERoleLevels.ADMIN}>
                    <AdminDashboard />
                </RoleCheckMiddleware>
            } />
            <Route path="settings" element={
                <RoleCheckMiddleware minRole={ERoleLevels.ADMIN}>
                    <AdminDashboard />
                </RoleCheckMiddleware>
            } /> */}
        </Routes>
    )
}

export default AdminRoutes;