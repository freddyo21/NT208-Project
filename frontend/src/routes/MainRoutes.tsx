import { Navigate, Route, Routes } from "react-router-dom";
import Dashboard from "../pages/main/Dashboard";

export default function MainRoutes() {
    return (
        <Routes>
            <Route index element={<Dashboard />} />
            <Route path="*" element={<Navigate to="/main" replace />} />
        </Routes>
    );
}
