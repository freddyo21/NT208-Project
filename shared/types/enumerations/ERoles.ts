export enum ERoles {
    ADMIN = "admin",
    OPERATOR = "operator",
}

export const roleLabels: Record<ERoles, string> = {
    [ERoles.OPERATOR]: "Operator",
    [ERoles.ADMIN]: "Admin",
};

export function getRoleLabel(role: ERoles): string {
    return roleLabels[role] || "Unknown";
}