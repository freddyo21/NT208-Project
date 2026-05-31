import type { TopBarProps, AttackType, Severity } from "../dashboard.types";
import { TYPE_COLORS, SEV_COLORS } from "../dashboard.constants";

export function TopBar({ time, query, onQuery, activeTypes, onToggleType, activeSevs, onToggleSev, onLogout }: TopBarProps) {
    const types: AttackType[] = ["DDoS", "SQLi", "Brute", "XSS", "Scan"];
    const sevs:  Severity[]   = ["LOW", "MED", "HIGH", "CRIT"];

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
                <span className="db-filter-label">SEARCH</span>
                <input
                    className="db-filter-input db-filter-input--wide"
                    placeholder="IP / TYPE / COUNTRY / SEV..."
                    value={query}
                    onChange={e => onQuery(e.target.value)}
                />
            </div>

            <div className="db-filter-group">
                <span className="db-filter-label">TYPE</span>
                {types.map(t => (
                    <button key={t} className="db-type-toggle"
                        style={{
                            borderColor: activeTypes.has(t) ? TYPE_COLORS[t] : "rgba(0,255,65,0.15)",
                            color:       activeTypes.has(t) ? TYPE_COLORS[t] : "rgba(0,255,65,0.28)",
                            background:  activeTypes.has(t) ? TYPE_COLORS[t] + "18" : "transparent",
                        }}
                        onClick={() => onToggleType(t)}
                    >{t}</button>
                ))}
            </div>

            <div className="db-filter-group">
                <span className="db-filter-label">SEV</span>
                {sevs.map(s => (
                    <button key={s} className="db-type-toggle"
                        style={{
                            borderColor: activeSevs.has(s) ? SEV_COLORS[s] : "rgba(0,255,65,0.15)",
                            color:       activeSevs.has(s) ? SEV_COLORS[s] : "rgba(0,255,65,0.28)",
                            background:  activeSevs.has(s) ? SEV_COLORS[s] + "18" : "transparent",
                        }}
                        onClick={() => onToggleSev(s)}
                    >{s}</button>
                ))}
            </div>

            <button className="db-logout-btn" onClick={onLogout}>LOGOUT</button>
        </header>
    );
}
