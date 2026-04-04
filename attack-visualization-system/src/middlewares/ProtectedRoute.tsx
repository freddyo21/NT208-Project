import { Navigate, useLocation } from "react-router-dom";

export const ProtectedRoute = ({
    children
}: {
    children: React.ReactNode
}) => {
    // const location = useLocation();

    // 1. Đang tải thông tin user -> Hiện màn hình chờ (để tránh đá nhầm)
    // if (loading) {
    //     return <SuspenseFullpage />;
    // }

    // 2. Tải xong mà không có user -> Đá về Login
    // if (!currentUser) {
    //     // state={{ from: location }} giúp nhớ trang cũ để login xong redirect về lại
    //     return <Navigate to="/login" state={{ from: location }} replace />;
    // }

    // 3. Có user -> Cho phép hiển thị trang con bên trong
    return children;
};