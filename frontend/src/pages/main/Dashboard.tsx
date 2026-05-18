import { useState, useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./Dashboard.css";
import { getAccessToken } from "@/utilities/accessToken";
import { useLogin } from "@/hooks/useLogin";

// ─── Types ────────────────────────────────────────────────────────────────────

type AttackType = "DDoS" | "SQLi" | "Brute" | "XSS" | "Scan";
type Severity = "LOW" | "MED" | "HIGH" | "CRIT";
type TimeRange = "1H" | "6H" | "24H" | "7D";

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
    onNewEvent?: (ev: AttackEvent) => void;
}

function WorldMap({ activeTypes, onNewEvent }: WorldMapProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const layerRef = useRef<L.LayerGroup | null>(null);
    const activeTypesRef = useRef(activeTypes);
    const onNewEventRef = useRef(onNewEvent);

    useEffect(() => { activeTypesRef.current = activeTypes; }, [activeTypes]);
    useEffect(() => { onNewEventRef.current = onNewEvent; }, [onNewEvent]);

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        const map = L.map(containerRef.current, {
            center: [20, 10],
            zoom: 2,
            minZoom: 2,
            maxZoom: 6,
            zoomControl: false,
            attributionControl: false,
            renderer: L.svg(),
            dragging: false,
            scrollWheelZoom: true,
        });
        mapRef.current = map;

        // Enable dragging only when zoomed in past the default world view
        map.on("zoomend", () => {
            if (map.getZoom() > 2) {
                map.dragging.enable();
            } else {
                map.dragging.disable();
            }
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);

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

        // Initial burst — stagger 200 ms apart
        MOCK_EVENTS.forEach((ev, i) => {
            setTimeout(() => {
                if (activeTypesRef.current.has(ev.type)) fireAttack(ev);
            }, 300 + i * 200);
        });

        // Ongoing auto-fire every 1800 ms
        const interval = setInterval(() => {
            const base = MOCK_EVENTS[Math.floor(Math.random() * MOCK_EVENTS.length)];
            if (activeTypesRef.current.has(base.type)) {
                fireAttack({
                    ...base,
                    id: Date.now().toString(36),
                    time: new Date().toTimeString().slice(0, 8),
                });
            }
        }, 1800);

        return () => {
            clearInterval(interval);
            map.remove();
            mapRef.current = null;
        };
    }, []);

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
    ipFilter: string;
    onIpChange: (v: string) => void;
    range: TimeRange;
    onRange: (r: TimeRange) => void;
    activeTypes: Set<AttackType>;
    onToggleType: (t: AttackType) => void;
    onLogout: () => void;
}

function TopBar({ time, ipFilter, onIpChange, range, onRange, activeTypes, onToggleType, onLogout }: TopBarProps) {
    const types: AttackType[] = ["DDoS", "SQLi", "Brute", "XSS", "Scan"];
    const ranges: TimeRange[] = ["1H", "6H", "24H", "7D"];

    return (
        <header className="db-topbar">
            <span className="db-brand">SENTINEL</span>
            <span className="db-sep"> // </span>
            <span className="db-ver">ATK-VIG 3.1</span>
            <span className="db-sep"> // </span>
            <span className="db-live"><span className="db-led" /> LIVE FEED</span>
            <span className="db-sep"> // </span>
            <span className="db-clock">{time}</span>
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

            <button className="db-logout-btn" onClick={onLogout}>LOGOUT</button>
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
    const { logout } = useLogin();

    const [ipFilter, setIpFilter] = useState("");
    const [range, setRange] = useState<TimeRange>("1H");
    const [activeTypes, setActiveTypes] = useState<Set<AttackType>>(
        () => new Set(["DDoS", "SQLi", "Brute", "XSS", "Scan"] as AttackType[])
    );
    const [liveEvents, setLiveEvents] = useState<AttackEvent[]>(MOCK_EVENTS);

    useEffect(() => {
        const initSentinel = async () => {
            try {
                await getAccessToken();
            } catch (err) {
                
            }
        };
        initSentinel();
    }, []);

    const handleNewEvent = useCallback((ev: AttackEvent) => {
        setLiveEvents(prev => [ev, ...prev.slice(0, 49)]);
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
                ipFilter={ipFilter}
                onIpChange={setIpFilter}
                range={range}
                onRange={setRange}
                activeTypes={activeTypes}
                onToggleType={toggleType}
                onLogout={logout}
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
                        <WorldMap activeTypes={activeTypes} onNewEvent={handleNewEvent} />
                    </div>
                </section>

                <EventLog events={filteredEvents} />
            </div>
        </div>
    );
}
