export type AttackType = "DDoS" | "SQLi" | "Brute" | "XSS" | "Scan";
export type Severity   = "LOW" | "MED" | "HIGH" | "CRIT";
export type TimeRange  = "1H" | "6H" | "24H" | "7D";

export interface Target {
    lat: number;
    lng: number;
    label: string;
    country: string;
    flag: string;
}

export interface AttackEvent {
    id: string;
    time: string;
    ip: string;
    type: AttackType;
    city: string;
    country: string;
    desc: string;
    severity: Severity;
    srcLat: number;
    srcLng: number;
    tgtIdx?: number;
}

export interface ModalItem {
    flag: string;
    name: string;
    count: number;
    pct: number;
    barColor: string;
}

export interface TopBarProps {
    time: string;
    query: string;
    onQuery: (v: string) => void;
    activeTypes: Set<AttackType>;
    onToggleType: (t: AttackType) => void;
    activeSevs: Set<Severity>;
    onToggleSev: (s: Severity) => void;
    onLogout: () => void;
    showAdminBtn?: boolean;
    onAdmin?: () => void;
    userName?: string;
    onProfile?: () => void;
}

export interface WorldMapProps {
    activeTypes: Set<AttackType>;
    activeSevs: Set<Severity>;
    onNewEvent?: (ev: AttackEvent) => void;
}

export interface LeftPanelProps {
    events: AttackEvent[];
    range: TimeRange;
    onRange: (r: TimeRange) => void;
}
