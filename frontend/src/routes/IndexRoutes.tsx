import { Index } from "@/pages/index/Index"
import { Navigate, Route, Routes } from "react-router-dom"

export const IndexRoutes = () => {

    return (
        <Routes>
            <Route index element={<Index />} />
            <Route path="*" element={<Navigate to="/main" replace />} />
        </Routes>
    )
}