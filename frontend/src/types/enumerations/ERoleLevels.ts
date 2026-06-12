import { ERoleLevels } from "@attack-visualization-system/shared";

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
    const entry = Object.entries(roleLevelLabels).find(
        ([_, v]) => v.toLowerCase() === label.toLowerCase()
    );
    return entry ? (parseInt(entry[0]) as ERoleLevels) : null;
}