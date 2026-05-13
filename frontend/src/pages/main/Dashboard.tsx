import { useState, useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import { io, type Socket } from "socket.io-client";
import "leaflet/dist/leaflet.css";
import "./Dashboard.css";
import { getAccessToken } from "@/utilities/accessToken";

// ─── Types ────────────────────────────────────────────────────────────────────

type AttackType = "DDoS" | "SQLi" | "Brute" | "XSS" | "Scan";
type Severity = "LOW" | "MED" | "HIGH" | "CRIT";
type TimeRange = "1H" | "6H" | "24H" | "7D";
type SocketStatus = "off" | "connecting" | "connected" | "error";
type TriggerStatus = "idle" | "sending" | "error";

interface AttackEvent {
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
}

interface RawSocketAttackEvent {
    id?: string;
    time?: string;
    timestamp?: string;
    sourceIp?: string;
    ip?: string;
    type?: string;
    city?: string;
    country?: string;
    desc?: string;
    severity?: string;
    srcLat?: number;
    srcLng?: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<AttackType, string> = {
    DDoS: "#ff3333",
    SQLi: "#ffcc00",
    Brute: "#ff8800",
    XSS: "#00ff41",
    Scan: "#3399ff",
};

const SEV_COLORS: Record<Severity, string> = {
    LOW: "#00cc33",
    MED: "#ffcc00",
    HIGH: "#ff8800",
    CRIT: "#ff3333",
};

const TARGET_LAT = 10.8231;
const TARGET_LNG = 106.6297;
const TARGET_LABEL = "VN-HCM";

// API_BASE_URL dung cho REST API, vi du POST /auth/demo-token va POST /attacks.
const API_BASE_URL = import.meta.env.VITE_SERVER_API_URL ?? "http://localhost:3000/api/v1";

// SOCKET_URL dung rieng cho Socket.IO. Khong them /api/v1 vao socket URL.
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? "http://localhost:3000";

// Neu true thi Dashboard tu chay mock attack cu.
// Demo socket nen de false de attack chi xuat hien khi co event socket that.
const ENABLE_MOCK_ATTACKS = import.meta.env.VITE_ENABLE_MOCK_ATTACKS === "true";

// Neu true thi vao thang Dashboard, khong goi refresh token va khong bi day ve login.
const SKIP_DASHBOARD_AUTH = import.meta.env.VITE_SKIP_DASHBOARD_AUTH === "true";

// Neu true thi Dashboard lay demo JWT tu backend de connect socket khi chua login.
const USE_DEMO_SOCKET_TOKEN = import.meta.env.VITE_USE_DEMO_SOCKET_TOKEN === "true";

const MOCK_EVENTS: AttackEvent[] = [
    { id: "e1", time: "10:39:31", ip: "86.170.173.112", type: "XSS", city: "Sofia", country: "BG", desc: "Script injection via img src attr", severity: "MED", srcLat: 42.7, srcLng: 23.3 },
    { id: "e2", time: "10:39:11", ip: "115.119.103.201", type: "Brute", city: "Bucharest", country: "RO", desc: "SSH brute force: 1,400 tries/min", severity: "HIGH", srcLat: 44.4, srcLng: 26.1 },
    { id: "e3", time: "10:39:00", ip: "173.243.62.167", type: "SQLi", city: "Jakarta", country: "ID", desc: "Payload: ' OR 1=1 -- on /login", severity: "CRIT", srcLat: -6.2, srcLng: 106.8 },
    { id: "e4", time: "10:39:00", ip: "76.221.172.67", type: "Brute", city: "Moscow", country: "RU", desc: "Admin panel lockout triggered", severity: "MED", srcLat: 55.7, srcLng: 37.6 },
    { id: "e5", time: "10:39:00", ip: "81.231.84.150", type: "SQLi", city: "Karachi", country: "PK", desc: "Payload: ' OR 1=1 -- on /login", severity: "HIGH", srcLat: 24.9, srcLng: 67.0 },
    { id: "e6", time: "10:38:50", ip: "249.170.186.145", type: "DDoS", city: "Bogota", country: "CO", desc: "Layer 7 HTTP flood on /api/*", severity: "CRIT", srcLat: 4.7, srcLng: -74.1 },
    { id: "e7", time: "10:38:50", ip: "56.159.146.70", type: "SQLi", city: "Beijing", country: "CN", desc: "SLEEP(5) injection flagged", severity: "MED", srcLat: 39.9, srcLng: 116.4 },
    { id: "e8", time: "10:38:50", ip: "67.178.92.240", type: "SQLi", city: "Hanoi", country: "VN", desc: "UNION-based injection blocked", severity: "LOW", srcLat: 21.0, srcLng: 105.8 },
    { id: "e9", time: "10:38:50", ip: "148.28.72.72", type: "XSS", city: "Lagos", country: "NG", desc: "Script injection via img src attr", severity: "MED", srcLat: 6.5, srcLng: 3.4 },
    { id: "e10", time: "10:38:35", ip: "167.173.68.115", type: "SQLi", city: "Lagos", country: "NG", desc: "SLEEP(5) injection flagged", severity: "MED", srcLat: 6.5, srcLng: 3.4 },
    { id: "e11", time: "10:38:31", ip: "170.167.128.153", type: "Brute", city: "Kyiv", country: "UA", desc: "Admin panel lockout triggered", severity: "HIGH", srcLat: 50.4, srcLng: 30.5 },
    { id: "e12", time: "10:38:31", ip: "101.237.157.73", type: "DDoS", city: "Cairo", country: "EG", desc: "SYN flood — 62k req/s", severity: "CRIT", srcLat: 30.1, srcLng: 31.2 },
    { id: "e13", time: "10:38:31", ip: "149.8.234.74", type: "SQLi", city: "Hanoi", country: "VN", desc: "SLEEP(5) injection flagged", severity: "MED", srcLat: 21.0, srcLng: 105.8 },
    { id: "e14", time: "10:38:46", ip: "54.24.33.44", type: "DDoS", city: "Algiers", country: "DZ", desc: "SYN flood — 62k req/s", severity: "HIGH", srcLat: 36.7, srcLng: 3.0 },
    { id: "e15", time: "10:38:38", ip: "204.216.140.155", type: "Brute", city: "Tehran", country: "IR", desc: "ROP credential stuffing detected", severity: "CRIT", srcLat: 35.7, srcLng: 51.4 },
    { id: "e16", time: "10:38:31", ip: "245.55.243.237", type: "SQLi", city: "Brasilia", country: "BR", desc: "UNION-based injection blocked", severity: "MED", srcLat: -15.8, srcLng: -47.9 },
    { id: "e17", time: "10:38:31", ip: "132.20.117.139", type: "DDoS", city: "Karachi", country: "PK", desc: "SYN flood — 62k req/s", severity: "HIGH", srcLat: 24.9, srcLng: 67.0 },
    { id: "e18", time: "10:38:31", ip: "106.5.240.18", type: "Scan", city: "Beijing", country: "CN", desc: "Port scan 65,535 ports detected", severity: "LOW", srcLat: 39.9, srcLng: 116.4 },
];

const ATTACK_TYPE_STATS: { type: AttackType; pct: number }[] = [
    { type: "DDoS", pct: 19 },
    { type: "SQLi", pct: 23 },
    { type: "Brute", pct: 23 },
    { type: "XSS", pct: 13 },
    { type: "Scan", pct: 21 },
];

const DEMO_ATTACK_TYPES = ["DDOS", "SQL_INJECTION", "BRUTE_FORCE", "XSS", "PORT_SCANNING"];
const DEMO_SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

// Backend socket dung ten type theo enum backend.
// Dashboard cu lai dung label ngan hon, nen can map ve UI type.
const SOCKET_TYPE_TO_DASHBOARD_TYPE: Record<string, AttackType> = {
    DDOS: "DDoS",
    DOS: "DDoS",
    SYN_FLOOD: "DDoS",
    SQL_INJECTION: "SQLi",
    BRUTE_FORCE: "Brute",
    CREDENTIAL_STUFFING: "Brute",
    XSS: "XSS",
    PORT_SCANNING: "Scan"
};

// Backend dung MEDIUM/CRITICAL, Dashboard cu dung MED/CRIT.
// Map severity giup event socket hien dung mau tren UI.
const SOCKET_SEVERITY_TO_DASHBOARD_SEVERITY: Record<string, Severity> = {
    LOW: "LOW",
    MEDIUM: "MED",
    MED: "MED",
    HIGH: "HIGH",
    CRITICAL: "CRIT",
    CRIT: "CRIT"
};

const normalizeSocketAttackEvent = (event: RawSocketAttackEvent): AttackEvent => {
    // Chuyen event tu backend socket ve shape ma Dashboard/WorldMap dang dung.
    // Neu backend thieu field nao thi gan fallback de UI khong crash.
    const type = SOCKET_TYPE_TO_DASHBOARD_TYPE[event.type ?? ""] ?? "DDoS";
    const severity = SOCKET_SEVERITY_TO_DASHBOARD_SEVERITY[event.severity ?? ""] ?? "HIGH";
    const timestamp = event.timestamp ? new Date(event.timestamp) : null;

    return {
        id: event.id ?? Date.now().toString(36),
        time: event.time ?? (timestamp && !Number.isNaN(timestamp.valueOf())
            ? timestamp.toTimeString().slice(0, 8)
            : new Date().toTimeString().slice(0, 8)),
        ip: event.ip ?? event.sourceIp ?? "192.168.1.10",
        type,
        city: event.city ?? "Unknown",
        country: event.country ?? "--",
        desc: event.desc ?? `${type} activity detected`,
        severity,
        srcLat: typeof event.srcLat === "number" ? event.srcLat : 21,
        srcLng: typeof event.srcLng === "number" ? event.srcLng : 105.8
    };
};

const getDemoSocketToken = async (): Promise<string | null> => {
    // Khi bo qua login, browser van can JWT de pass socket middleware.
    // Endpoint /auth/demo-token tao JWT demo chi cho local demo.
    const response = await fetch(`${API_BASE_URL}/auth/demo-token`, {
        method: "POST",
        credentials: "include"
    });
    const body = await response.json().catch(() => ({})) as { accessToken?: unknown };

    if (!response.ok || typeof body.accessToken !== "string") {
        throw new Error(`Demo socket token failed with status ${response.status}`);
    }

    return body.accessToken;
};

// Dung de tao delay nho giua cac request trigger attack.
// Neu gui 6 attack cung luc thi animation bi chong qua nhanh, kho nhin.
const sleep = (ms: number) => new Promise(resolve => window.setTimeout(resolve, ms));

// ─── Clock hook ───────────────────────────────────────────────────────────────

function useClock() {
    const [time, setTime] = useState(() => new Date().toTimeString().slice(0, 8));
    useEffect(() => {
        const id = setInterval(() => setTime(new Date().toTimeString().slice(0, 8)), 1000);
        return () => clearInterval(id);
    }, []);
    return time;
}

// ─── WorldMap (Leaflet) ───────────────────────────────────────────────────────

interface WorldMapProps {
    activeTypes: Set<AttackType>;
    incomingEvent?: AttackEvent | null;
    enableMockAttacks: boolean;
    onNewEvent?: (ev: AttackEvent) => void;
}

function WorldMap({ activeTypes, incomingEvent, enableMockAttacks, onNewEvent }: WorldMapProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const layerRef = useRef<L.LayerGroup | null>(null);

    // fireAttackRef giu ham ve attack tren Leaflet map.
    // Ham nay chi co sau khi map khoi tao xong.
    const fireAttackRef = useRef<((ev: AttackEvent) => void) | null>(null);

    // Neu socket event den qua som, luc map chua san sang,
    // ta tam giu event o day va ve lai sau khi map khoi tao xong.
    const pendingEventsRef = useRef<AttackEvent[]>([]);

    // Ref nay giup interval/socket callback doc activeTypes moi nhat
    // ma khong can khoi tao lai Leaflet map moi lan filter thay doi.
    const activeTypesRef = useRef(activeTypes);
    const onNewEventRef = useRef(onNewEvent);

    useEffect(() => { activeTypesRef.current = activeTypes; }, [activeTypes]);
    useEffect(() => { onNewEventRef.current = onNewEvent; }, [onNewEvent]);

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        // Khoi tao Leaflet map mot lan duy nhat.
        // Dashboard cu dung OpenStreetMap tile nen giu nguyen map visual cu.
        const map = L.map(containerRef.current, {
            center: [20, 10],
            zoom: 2,
            minZoom: 2,
            maxZoom: 6,
            zoomControl: false,
            attributionControl: false,
            renderer: L.svg(),
        });
        mapRef.current = map;

        // Tile map cu cua project. Neu mang/OSM cham thi tile co the load tre.
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);

        // Layer rieng de add/remove arc, marker, particle cua attack.
        const layer = L.layerGroup().addTo(map);
        layerRef.current = layer;

        // Pulsing target marker
        const tgtIcon = L.divIcon({ className: "db-tgt-marker", iconSize: [20, 20], iconAnchor: [10, 10] });
        const tgtMarker = L.marker([TARGET_LAT, TARGET_LNG], { icon: tgtIcon, zIndexOffset: 500 }).addTo(map);
        tgtMarker.bindTooltip(
            `TARGET :: ${TARGET_LABEL}`,
            { permanent: true, direction: "right", className: "db-tgt-tooltip", offset: [14, 0] }
        ).openTooltip();

        const fireAttack = (ev: AttackEvent) => {
            // Ham nay la phan ve animation attack:
            // source -> target, co arc, marker source, particle, va impact ring.
            const src: [number, number] = [ev.srcLat, ev.srcLng];
            const tgt: [number, number] = [TARGET_LAT, TARGET_LNG];
            const color = TYPE_COLORS[ev.type];

            // Quadratic bezier — arc height proportional to distance
            const dist = Math.sqrt((tgt[0] - src[0]) ** 2 + (tgt[1] - src[1]) ** 2);
            const ctrlLat = (src[0] + tgt[0]) / 2 + Math.max(dist * 0.28, 14);
            const ctrlLng = (src[1] + tgt[1]) / 2;

            const pts: [number, number][] = [];
            for (let i = 0; i <= 40; i++) {
                const t = i / 40;
                pts.push([
                    (1 - t) ** 2 * src[0] + 2 * (1 - t) * t * ctrlLat + t ** 2 * tgt[0],
                    (1 - t) ** 2 * src[1] + 2 * (1 - t) * t * ctrlLng + t ** 2 * tgt[1],
                ]);
            }

            // Glow halo — thick, very transparent, no dash
            const halo = L.polyline(pts, {
                color, weight: 7, opacity: 0,
            }).addTo(layer);
            setTimeout(() => halo.setStyle({ opacity: 0.1 }), 60);

            // Main arc — draw-on via SVG stroke-dashoffset animation
            const arc = L.polyline(pts, {
                color, weight: 1.6, opacity: 0,
            }).addTo(layer);

            setTimeout(() => {
                const el = arc.getElement() as SVGPathElement | undefined;
                if (!el) { arc.setStyle({ opacity: 0.65, dashArray: "5 8" }); return; }
                const len = el.getTotalLength();
                el.style.strokeDasharray = String(len);
                el.style.strokeDashoffset = String(len);
                arc.setStyle({ opacity: 0.7 });
                void el.getBoundingClientRect();                      // force reflow
                el.style.transition = "stroke-dashoffset 1.4s ease-out";
                el.style.strokeDashoffset = "0";
            }, 80);

            // Source ping — CSS-animated expanding ring via divIcon
            const srcIcon = L.divIcon({
                className: "",
                html: `<div class="db-src-ping" style="--c:${color}"><div class="db-src-dot"></div><div class="db-src-ring"></div></div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12],
            });
            const srcMarker = L.marker(src, { icon: srcIcon, zIndexOffset: 200 }).addTo(layer);

            // Moving particle
            const particle = L.circleMarker(src, {
                radius: 4, color, fillColor: color, fillOpacity: 1, weight: 0,
                className: "db-particle",
            }).addTo(layer);

            let step = 0;
            const move = setInterval(() => {
                step++;
                if (step >= pts.length) {
                    clearInterval(move);
                    particle.remove();
                    srcMarker.remove();

                    // Expanding impact ring — animated via JS
                    const flash = L.circleMarker(tgt, {
                        radius: 5, color, fillColor: color, fillOpacity: 0.25, weight: 2, opacity: 1,
                    }).addTo(layer);
                    let fr = 5, fa = 1;
                    const expand = setInterval(() => {
                        fr += 1.8; fa -= 0.07;
                        if (fa <= 0) { clearInterval(expand); flash.remove(); return; }
                        flash.setRadius(fr);
                        flash.setStyle({ opacity: fa, fillOpacity: fa * 0.2 });
                    }, 25);

                    // Fade out arc + halo after linger
                    setTimeout(() => {
                        const el = arc.getElement() as SVGPathElement | undefined;
                        if (el) el.style.transition = "opacity 0.6s";
                        arc.setStyle({ opacity: 0 });
                        halo.setStyle({ opacity: 0 });
                        setTimeout(() => { arc.remove(); halo.remove(); }, 700);
                    }, 2800);
                    return;
                }
                particle.setLatLng(pts[step]);
            }, 46);

            onNewEventRef.current?.(ev);
        };
        fireAttackRef.current = fireAttack;

        // Ve cac event socket da den truoc khi map san sang.
        pendingEventsRef.current.splice(0).forEach((event) => {
            if (activeTypesRef.current.has(event.type)) {
                fireAttack(event);
            }
        });

        let interval: ReturnType<typeof setInterval> | undefined;

        if (enableMockAttacks) {
            // Che do mock cu, hien dang tat bang VITE_ENABLE_MOCK_ATTACKS=false.
            // Giu lai de sau nay can demo UI khong can backend thi bat len.
            // Initial burst — stagger 200 ms apart
            MOCK_EVENTS.forEach((ev, i) => {
                setTimeout(() => {
                    if (activeTypesRef.current.has(ev.type)) fireAttack(ev);
                }, 300 + i * 200);
            });

            // Ongoing auto-fire every 1800 ms
            interval = setInterval(() => {
                const base = MOCK_EVENTS[Math.floor(Math.random() * MOCK_EVENTS.length)];
                if (activeTypesRef.current.has(base.type)) {
                    fireAttack({
                        ...base,
                        id: Date.now().toString(36),
                        time: new Date().toTimeString().slice(0, 8),
                    });
                }
            }, 1800);
        }

        return () => {
            if (interval) clearInterval(interval);
            fireAttackRef.current = null;
            map.remove();
            mapRef.current = null;
        };
    }, []);

    useEffect(() => {
        // incomingEvent thay doi moi khi socket nhan attack:new.
        // Neu filter type dang tat thi khong ve event do.
        if (!incomingEvent || !activeTypesRef.current.has(incomingEvent.type)) return;

        // Neu Leaflet map chua khoi tao xong thi dua vao queue.
        if (!fireAttackRef.current) {
            pendingEventsRef.current.push(incomingEvent);
            return;
        }

        // Map da san sang thi ve attack ngay lap tuc.
        fireAttackRef.current(incomingEvent);
    }, [incomingEvent]);

    return (
        <>
            <div ref={containerRef} className="db-map-canvas" />
            <div className="db-map-zoom">
                <button className="db-zoom-btn" onClick={() => mapRef.current?.zoomIn()}>+</button>
                <button className="db-zoom-btn" onClick={() => mapRef.current?.zoomOut()}>−</button>
            </div>
        </>
    );
}

// ─── TopBar ───────────────────────────────────────────────────────────────────

interface TopBarProps {
    time: string;
    socketStatus: SocketStatus;
    triggerStatus: TriggerStatus;
    onTriggerAttack: () => void;
    showTriggerAttack: boolean;
    ipFilter: string;
    onIpChange: (v: string) => void;
    range: TimeRange;
    onRange: (r: TimeRange) => void;
    activeTypes: Set<AttackType>;
    onToggleType: (t: AttackType) => void;
}

function TopBar({
    time,
    socketStatus,
    triggerStatus,
    onTriggerAttack,
    showTriggerAttack,
    ipFilter,
    onIpChange,
    range,
    onRange,
    activeTypes,
    onToggleType
}: TopBarProps) {
    const types: AttackType[] = ["DDoS", "SQLi", "Brute", "XSS", "Scan"];
    const ranges: TimeRange[] = ["1H", "6H", "24H", "7D"];
    const socketLabel = socketStatus === "connected"
        ? "SOCKET CONNECTED"
        : socketStatus === "connecting"
            ? "SOCKET CONNECTING"
            : socketStatus === "error"
                ? "SOCKET ERROR"
                : "SOCKET OFF";

    return (
        <header className="db-topbar">
            <span className="db-brand">SENTINEL</span>
            <span className="db-sep"> // </span>
            <span className="db-ver">ATK-VIG 3.1</span>
            <span className="db-sep"> // </span>
            <span className="db-live"><span className="db-led" /> {socketLabel}</span>
            <span className="db-sep"> // </span>
            <span className="db-clock">{time}</span>
            {showTriggerAttack && (
                <>
                    <span className="db-sep"> // </span>
                    <button
                        className="db-filter-btn db-filter-btn--on"
                        disabled={triggerStatus === "sending" || socketStatus !== "connected"}
                        onClick={onTriggerAttack}
                    >
                        {triggerStatus === "sending" ? "SENDING..." : "TRIGGER ATTACK"}
                    </button>
                </>
            )}
            <span className="db-spacer" />

            <div className="db-filter-group">
                <span className="db-filter-label">IP:</span>
                <input
                    className="db-filter-input"
                    placeholder="e.g. 192.168..."
                    value={ipFilter}
                    onChange={e => onIpChange(e.target.value)}
                />
            </div>

            <div className="db-filter-group">
                <span className="db-filter-label">RANGE</span>
                {ranges.map(r => (
                    <button
                        key={r}
                        className={`db-filter-btn${range === r ? " db-filter-btn--on" : ""}`}
                        onClick={() => onRange(r)}
                    >
                        {r}
                    </button>
                ))}
            </div>

            <div className="db-filter-group">
                <span className="db-filter-label">TYPE</span>
                {types.map(t => (
                    <button
                        key={t}
                        className="db-type-toggle"
                        style={{
                            borderColor: activeTypes.has(t) ? TYPE_COLORS[t] : "rgba(0,255,65,0.15)",
                            color: activeTypes.has(t) ? TYPE_COLORS[t] : "rgba(0,255,65,0.28)",
                            background: activeTypes.has(t) ? TYPE_COLORS[t] + "18" : "transparent",
                        }}
                        onClick={() => onToggleType(t)}
                    >
                        {t}
                    </button>
                ))}
            </div>
        </header>
    );
}

// ─── LeftPanel ────────────────────────────────────────────────────────────────

function LeftPanel({ events }: { events: AttackEvent[] }) {
    const total = events.length;
    const active = events.filter(e => e.severity === "CRIT" || e.severity === "HIGH").length;
    const blocked = events.filter(e => e.severity !== "CRIT").length;
    const critical = events.filter(e => e.severity === "CRIT").length;
    const countries = new Set(events.map(e => e.country)).size;
    const uniqueIps = new Set(events.map(e => e.ip)).size;

    const ipCounts = events.reduce<Record<string, number>>((acc, e) => {
        acc[e.ip] = (acc[e.ip] || 0) + 1;
        return acc;
    }, {});
    const topIps = Object.entries(ipCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);

    return (
        <aside className="db-left">
            <div className="db-counters">
                <div className="db-counter">
                    <span className="db-counter-num">{total}</span>
                    <span className="db-counter-label">TOTAL</span>
                </div>
                <div className="db-counter">
                    <span className="db-counter-num db-counter-num--red">{active}</span>
                    <span className="db-counter-label">ACTIVE</span>
                </div>
            </div>

            <div className="db-section">
                <div className="db-section-title">THREAT STATS</div>
                {([
                    ["Blocked", blocked, undefined],
                    ["Critical", critical, "#ff3333"],
                    ["Countries", countries, undefined],
                    ["Unique IPs", uniqueIps, undefined],
                ] as [string, number, string | undefined][]).map(([label, val, color]) => (
                    <div key={label} className="db-stat-row">
                        <span className="db-stat-label">{label}</span>
                        <span className="db-stat-val" style={color ? { color } : undefined}>{val}</span>
                    </div>
                ))}
            </div>

            <div className="db-section">
                <div className="db-section-title">ATTACK TYPES</div>
                {ATTACK_TYPE_STATS.map(({ type, pct }) => (
                    <div key={type} className="db-type-row">
                        <span
                            className="db-type-badge"
                            style={{ borderColor: TYPE_COLORS[type], color: TYPE_COLORS[type] }}
                        >
                            {type}
                        </span>
                        <div className="db-type-bar-wrap">
                            <div
                                className="db-type-bar"
                                style={{ width: `${pct}%`, background: TYPE_COLORS[type] }}
                            />
                        </div>
                        <span className="db-type-pct" style={{ color: TYPE_COLORS[type] }}>{pct}%</span>
                    </div>
                ))}
            </div>

            <div className="db-section">
                <div className="db-section-title">TOP SOURCE IPs</div>
                {topIps.map(([ip, count]) => (
                    <div key={ip} className="db-ip-row">
                        <span className="db-ip-addr">{ip}</span>
                        <span className="db-ip-hits">{count} hits</span>
                    </div>
                ))}
            </div>
        </aside>
    );
}

// ─── EventLog ─────────────────────────────────────────────────────────────────

function EventLog({ events }: { events: AttackEvent[] }) {
    return (
        <aside className="db-right">
            <div className="db-panel-header">
                <span>EVENT LOG</span>
                <span className="db-live-badge"><span className="db-led" /> LIVE</span>
            </div>
            <div className="db-event-list">
                {events.map((ev, index) => (
                    <div key={index} className="db-event">
                        <div className="db-event-meta">
                            <span className="db-event-time">{ev.time}</span>
                            <span className="db-event-ip">{ev.ip}</span>
                            <span
                                className="db-badge"
                                style={{ borderColor: TYPE_COLORS[ev.type], color: TYPE_COLORS[ev.type] }}
                            >
                                {ev.type}
                            </span>
                        </div>
                        <div className="db-event-loc">{ev.city}, {ev.country}</div>
                        <div className="db-event-desc">{ev.desc}</div>
                        <div className="db-event-footer">
                            <span
                                className="db-badge"
                                style={{ borderColor: SEV_COLORS[ev.severity], color: SEV_COLORS[ev.severity] }}
                            >
                                {ev.severity}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </aside>
    );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
    const time = useClock();

    // Cac state UI co san cua Dashboard: filter IP, range, type.
    const [ipFilter, setIpFilter] = useState("");
    const [range, setRange] = useState<TimeRange>("1H");
    const [activeTypes, setActiveTypes] = useState<Set<AttackType>>(
        () => new Set(["DDoS", "SQLi", "Brute", "XSS", "Scan"] as AttackType[])
    );

    // liveEvents la danh sach event dang hien o left stats va right Event Log.
    // Khi mock tat, ban dau list rong; chi socket event moi them vao.
    const [liveEvents, setLiveEvents] = useState<AttackEvent[]>(
        ENABLE_MOCK_ATTACKS ? MOCK_EVENTS : []
    );

    // incomingEvent la event moi nhat nhan tu socket.
    // Truyen state nay vao WorldMap de WorldMap ve animation.
    const [incomingEvent, setIncomingEvent] = useState<AttackEvent | null>(null);

    // socketStatus hien tren topbar de biet browser da connect socket chua.
    const [socketStatus, setSocketStatus] = useState<SocketStatus>("off");

    // triggerStatus dung cho nut TRIGGER ATTACK de disable khi dang gui.
    const [triggerStatus, setTriggerStatus] = useState<TriggerStatus>("idle");

    // socketRef giu instance Socket.IO client de disconnect khi component unmount.
    const socketRef = useRef<Socket | null>(null);

    // socketTokenRef giu JWT hien tai, nut TRIGGER ATTACK can token nay de goi REST API.
    const socketTokenRef = useRef<string | null>(null);

    useEffect(() => {
        const initSentinel = async () => {
            try {
                setSocketStatus("connecting");

                // Co 2 cach lay token:
                // 1. Demo mode: lay demo token tu /auth/demo-token, khong can login.
                // 2. Real mode: goi getAccessToken() nhu auth flow that.
                const token = SKIP_DASHBOARD_AUTH
                    ? USE_DEMO_SOCKET_TOKEN ? await getDemoSocketToken() : null
                    : await getAccessToken();

                if (!token || socketRef.current) {
                    setSocketStatus("off");
                    return;
                }
                socketTokenRef.current = token;

                // Tao socket client va gui JWT trong handshake.auth.
                // Backend websocket.ts se doc token nay trong io.use().
                const socket = io(SOCKET_URL, {
                    auth: { token },
                    transports: ["websocket"]
                });
                socketRef.current = socket;

                socket.on("connect", () => {
                    // Neu topbar hien SOCKET CONNECTED thi browser da qua auth socket.
                    setSocketStatus("connected");
                    console.log("Sentinel socket connected:", socket.id);

                    // Subscribe attack stream. Payload rong nghia la nhan tat ca attack.
                    socket.emit("attack:subscribe", {}, (ack: { ok: boolean; error?: string }) => {
                        if (!ack?.ok) {
                            console.warn("Sentinel socket subscribe failed:", ack?.error);
                        }
                    });
                });

                socket.on("attack:new", (event: RawSocketAttackEvent) => {
                    // Day la event realtime chinh tu backend.
                    // Normalize xong setIncomingEvent de WorldMap ve animation.
                    const normalizedEvent = normalizeSocketAttackEvent(event);
                    console.log("Sentinel socket attack:new:", normalizedEvent);
                    setIncomingEvent(normalizedEvent);
                });

                socket.on("connect_error", (error) => {
                    // Loi hay gap: demo token endpoint tat, JWT sai, CORS/socket URL sai.
                    setSocketStatus("error");
                    console.warn("Sentinel socket connection failed:", error.message);
                });

                socket.on("disconnect", () => {
                    setSocketStatus("off");
                });
            } catch (err) {
                setSocketStatus("error");
                console.warn("Sentinel socket disabled:", err);
            }
        };

        initSentinel();

        return () => {
            // Cleanup khi thoat Dashboard de tranh giu connection cu.
            socketRef.current?.disconnect();
            socketRef.current = null;
            socketTokenRef.current = null;
        };
    }, []);

    const handleNewEvent = useCallback((ev: AttackEvent) => {
        // WorldMap goi callback nay moi khi no ve xong/nhan event moi.
        // Dua event len dau list de counters va Event Log cap nhat.
        setLiveEvents(prev => [ev, ...prev.slice(0, 49)]);
    }, []);

    const triggerDemoAttack = useCallback(async () => {
        // Nut nay chi dung cho demo:
        // Browser goi REST API /attacks, backend service broadcast lai qua socket.
        if (!socketTokenRef.current) return;

        setTriggerStatus("sending");

        try {
            // Gui nhieu attack lien tiep de demo nhin ro hon mot event don le.
            for (let index = 0; index < 6; index++) {
                const type = DEMO_ATTACK_TYPES[Math.floor(Math.random() * DEMO_ATTACK_TYPES.length)] ?? "DDOS";
                const severity = DEMO_SEVERITIES[Math.floor(Math.random() * DEMO_SEVERITIES.length)] ?? "HIGH";
                const sourceIp = `192.168.${Math.floor(Math.random() * 220) + 10}.${Math.floor(Math.random() * 220) + 10}`;

                // API /attacks van duoc bao ve bang authMiddleware,
                // nen phai gui Authorization Bearer demo JWT.
                const response = await fetch(`${API_BASE_URL}/attacks`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${socketTokenRef.current}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        type,
                        severity,
                        sourceIp,
                        assetId: "world-map-demo"
                    })
                });

                if (!response.ok) {
                    throw new Error(`Attack trigger failed with status ${response.status}`);
                }

                // Delay nho de cac arc khong xuat hien cung luc qua kho nhin.
                await sleep(180);
            }

            setTriggerStatus("idle");
        } catch (error) {
            console.warn("Sentinel attack trigger failed:", error);
            setTriggerStatus("error");
        }
    }, []);

    const filteredEvents = liveEvents.filter(e =>
        (!ipFilter || e.ip.startsWith(ipFilter)) && activeTypes.has(e.type)
    );

    const toggleType = (t: AttackType) => {
        setActiveTypes(prev => {
            const next = new Set(prev);
            next.has(t) ? next.delete(t) : next.add(t);
            return next;
        });
    };

    return (
        <div className="db-root">
            <div className="db-scanline" />

            <TopBar
                time={time}
                socketStatus={socketStatus}
                triggerStatus={triggerStatus}
                onTriggerAttack={triggerDemoAttack}
                showTriggerAttack={SKIP_DASHBOARD_AUTH && USE_DEMO_SOCKET_TOKEN}
                ipFilter={ipFilter}
                onIpChange={setIpFilter}
                range={range}
                onRange={setRange}
                activeTypes={activeTypes}
                onToggleType={toggleType}
            />

            <div className="db-body">
                <LeftPanel events={filteredEvents} />

                <section className="db-map">
                    <div className="db-panel-header">
                        <span>GLOBAL THREAT MAP // REAL-TIME</span>
                        <span className="db-coords">
                            LAT {TARGET_LAT.toFixed(2)} LON {TARGET_LNG.toFixed(2)}
                        </span>
                    </div>
                    <div className="db-map-body">
                        <WorldMap
                            activeTypes={activeTypes}
                            incomingEvent={incomingEvent}
                            enableMockAttacks={ENABLE_MOCK_ATTACKS}
                            onNewEvent={handleNewEvent}
                        />
                    </div>
                </section>

                <EventLog events={filteredEvents} />
            </div>
        </div>
    );
}
