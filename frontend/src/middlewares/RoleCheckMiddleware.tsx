import { getAccessToken } from "@/utilities/accessToken";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { ERoleLevels, ITokenPayload } from "@attack-visualization-system/shared";

const roleLabelMap: Record<string, ERoleLevels> = {
    "Admin": ERoleLevels.ADMIN,
    "Operator": ERoleLevels.OPERATOR,
};

export function RoleCheckMiddleware({
    children,
    minRole
}: {
    children: React.ReactNode;
    minRole: number
}) {
    const [status, setStatus] = useState<'loading' | 'authorized' | 'unauthorized' | 'forbidden'>('loading');

    useEffect(() => {
        (async () => {
            const token = await getAccessToken();

            if (!token) {
                setStatus('unauthorized');
                return;
            }

            const decoded = jwtDecode(token) as ITokenPayload;
            if (!decoded) {
                setStatus('unauthorized');
                return;
            }

            const role = roleLabelMap[decoded.role] ?? null;

            if (!role) {
                setStatus('unauthorized');
                return;
            }

            if (role < minRole) {
                setStatus('forbidden');
                return;
            }

            setStatus('authorized');
        })();
    }, [minRole]);

    if (status === 'loading') return <div>Loading...</div>;
    if (status === 'unauthorized') {
        alert("Invalid token. Please log in again.");
        return <Navigate to="/login" replace />;
    }

    if (status === 'forbidden') {
        alert("Forbidden: You do not have permission to access this page.");
        return null; // Hoặc bạn có thể hiển thị một trang lỗi riêng biệt cho trường hợp này
    }

    // Nếu mọi thứ ok thì render nội dung ngay lập tức
    return <>{children}</>;
}