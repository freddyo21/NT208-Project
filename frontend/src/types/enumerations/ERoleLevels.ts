export enum ERoleLevels {
    // SUPER_ADMIN = 0,
    ADMIN = 1,
    OPERATOR = 10,
}

export type RoleLevel = ERoleLevels;

export const roleLevelLabels: Record<ERoleLevels, string> = {
    [ERoleLevels.OPERATOR]: "Operator",
    [ERoleLevels.ADMIN]: "Admin",
    // [ERoleLevels.SUPER_ADMIN]: "Super Admin",
};

export function getRoleLevelLabel(level: ERoleLevels): string {
    return roleLevelLabels[level] || "Unknown";
}

export function getRoleLevelValue(label: string): ERoleLevels | null {
    const entry = Object.entries(roleLevelLabels).find(([_, v]) => v === label);
    return entry ? (parseInt(entry[0]) as ERoleLevels) : null;
}