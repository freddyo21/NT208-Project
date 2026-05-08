
import Dashboard from "@/pages/main/Dashboard"
import { Navigate, Route, Routes } from "react-router-dom"

export const IndexRoutes = () => {

    return (
        <Routes>
            <Route index element={<Dashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    )
}