import type { AttackEvent } from "../dashboard.types";
import { TYPE_COLORS, SEV_COLORS } from "../dashboard.constants";

interface EventLogProps {
    events: AttackEvent[];
}

export function EventLog({ events }: EventLogProps) {
    const exportCSV = () => {
        const header = "TIME,IP,TYPE,SEVERITY,CITY,COUNTRY,DESCRIPTION";
        const rows = events.map(e =>
            `${e.time},${e.ip},${e.type},${e.severity},${e.city},${e.country},"${e.desc}"`
        );
        const blob = new Blob([header + "\n" + rows.join("\n")], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `sentinel-log-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const exportJSON = () => {
        const blob = new Blob([JSON.stringify(events, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `sentinel-log-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <aside className="db-right">
            <div className="db-panel-header">
                <span>EVENT LOG <span className="db-log-count">({events.length})</span></span>
                <div className="db-export-group">
                    <button className="db-export-btn" onClick={exportCSV} title="Export CSV">CSV</button>
                    <button className="db-export-btn" onClick={exportJSON} title="Export JSON">JSON</button>
                    <span className="db-live-badge"><span className="db-led" /> LIVE</span>
                </div>
            </div>
            <div className="db-event-list">
                {events.map((ev, index) => (
                    <div key={index} className="db-event">
                        <div className="db-event-meta">
                            <span className="db-event-time">{ev.time}</span>
                            <span className="db-event-ip">{ev.ip}</span>
                            <span className="db-badge" style={{ borderColor: TYPE_COLORS[ev.type], color: TYPE_COLORS[ev.type] }}>
                                {ev.type}
                            </span>
                        </div>
                        <div className="db-event-loc">{ev.city}, {ev.country}</div>
                        <div className="db-event-desc">{ev.desc}</div>
                        <div className="db-event-footer">
                            <span className="db-badge" style={{ borderColor: SEV_COLORS[ev.severity], color: SEV_COLORS[ev.severity] }}>
                                {ev.severity}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </aside>
    );
}
