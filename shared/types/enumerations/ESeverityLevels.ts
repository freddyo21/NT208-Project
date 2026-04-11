export enum ESeverityLevels {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
}

export const severityLevelLabels: Record<ESeverityLevels, string> = {
    [ESeverityLevels.LOW]: "Low",
    [ESeverityLevels.MEDIUM]: "Medium",
    [ESeverityLevels.HIGH]: "High",
    [ESeverityLevels.CRITICAL]: "Critical"
};

export function getSeverityLevelLabel(level: ESeverityLevels): string {
    return severityLevelLabels[level] || "Unknown";
}