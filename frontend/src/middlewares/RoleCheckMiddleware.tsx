

export function RoleCheckMiddleware({
    children,
    minRole
}: {
    children: React.ReactNode;
    minRole: number
}) {

    // Nếu mọi thứ ok thì render nội dung ngay lập tức
    return <>{children}</>;
}