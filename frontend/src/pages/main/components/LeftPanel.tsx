import { useState } from "react";
import type { LeftPanelProps, TimeRange } from "../dashboard.types";
import { COUNTRY_META, TARGETS } from "../dashboard.constants";
import { FullListModal } from "./FullListModal";

export function LeftPanel({ events, range, onRange }: LeftPanelProps) {
    const [modal, setModal] = useState<"attackers" | "attacked" | null>(null);

    const total  = events.length;
    const active = events.filter(e => e.severity === "CRIT" || e.severity === "HIGH").length;

    const attackerMap = events.reduce<Record<string, number>>((acc, e) => {
        acc[e.country] = (acc[e.country] || 0) + 1; return acc;
    }, {});
    const allAttackers = Object.entries(attackerMap).sort((a, b) => b[1] - a[1]);
    const topAttackers = allAttackers.slice(0, 5);
    const totalAtk     = allAttackers.reduce((s, [, c]) => s + c, 0) || 1;

    const attackedMap = events.reduce<Record<number, number>>((acc, e) => {
        const i = e.tgtIdx ?? 0; acc[i] = (acc[i] || 0) + 1; return acc;
    }, {});
    const allAttacked = Object.entries(attackedMap).sort((a, b) => b[1] - a[1])
        .map(([i, c]) => ({ target: TARGETS[Number(i)], count: c }))
        .filter(({ target }) => target !== undefined);
    const topAttacked = allAttacked.slice(0, 5);
    const totalDef    = allAttacked.reduce((s, t) => s + t.count, 0) || 1;

    const tc = events.reduce<Record<string, number>>((acc, e) => {
        acc[e.type] = (acc[e.type] || 0) + 1; return acc;
    }, {});
    const ddos = tc["DDoS"] || 0; const scan = tc["Scan"] || 0; const brute = tc["Brute"] || 0;
    const netVecs = [
        { label: "TCP Flood",    val: Math.round(ddos * 0.60), color: "#ff3333" },
        { label: "DNS Flood",    val: Math.round(ddos * 0.25), color: "#ff8800" },
        { label: "IP Flood",     val: scan,                    color: "#ffcc00" },
        { label: "UDP Flood",    val: Math.round(ddos * 0.15), color: "#3399ff" },
        { label: "Low and Slow", val: Math.round(brute * 0.5), color: "#00cc33" },
    ].filter(v => v.val > 0).sort((a, b) => b.val - a.val);
    const totalNet = netVecs.reduce((s, v) => s + v.val, 0) || 1;

    const sqli = tc["SQLi"] || 0; const xss = tc["XSS"] || 0;
    const appVios = [
        { label: "Access violations",    val: brute,                  color: "#ff3333" },
        { label: "Injections",           val: sqli,                   color: "#ff3333" },
        { label: "Exploits",             val: Math.round(ddos * 0.2), color: "#ff8800" },
        { label: "Data theft",           val: scan,                   color: "#ff8800" },
        { label: "Cross-site scripting", val: xss,                    color: "#ffcc00" },
    ].filter(v => v.val > 0).sort((a, b) => b.val - a.val);
    const totalApp = appVios.reduce((s, v) => s + v.val, 0) || 1;

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

            <div className="db-interval-wrap">
                <div className="db-section-title">STATISTICS INTERVAL</div>
                <select
                    className="db-interval-select"
                    value={range}
                    onChange={e => onRange(e.target.value as TimeRange)}
                >
                    <option value="1H">1 hour</option>
                    <option value="6H">6 hours</option>
                    <option value="24H">24 hours</option>
                    <option value="7D">7 days</option>
                </select>
            </div>

            <div className="db-section">
                <div className="db-section-title db-section-title--btn" onClick={() => setModal("attackers")}>
                    TOP ATTACKERS <span className="db-expand-icon">▸ ALL</span>
                </div>
                {topAttackers.map(([code, count]) => {
                    const meta = COUNTRY_META[code] ?? { name: code, flag: "🌐" };
                    const pct  = Math.round((count / totalAtk) * 100);
                    return (
                        <div key={code} className="db-rank-row">
                            <span className="db-rank-flag">{meta.flag}</span>
                            <span className="db-rank-name">{meta.name}</span>
                            <div className="db-rank-bar-bg">
                                <div className="db-rank-bar-fill" style={{ width: `${pct}%`, background: "#00cc33" }} />
                            </div>
                            <span className="db-rank-pct">{pct}%</span>
                        </div>
                    );
                })}
            </div>

            <div className="db-section">
                <div className="db-section-title db-section-title--btn" onClick={() => setModal("attacked")}>
                    TOP ATTACKED <span className="db-expand-icon">▸ ALL</span>
                </div>
                {topAttacked.map(({ target, count }) => {
                    const pct = Math.round((count / totalDef) * 100);
                    return (
                        <div key={target.label} className="db-rank-row">
                            <span className="db-rank-flag">{target.flag}</span>
                            <span className="db-rank-name">{target.country}</span>
                            <div className="db-rank-bar-bg">
                                <div className="db-rank-bar-fill" style={{ width: `${pct}%`, background: "#3399ff" }} />
                            </div>
                            <span className="db-rank-pct">{pct}%</span>
                        </div>
                    );
                })}
            </div>

            {modal === "attackers" && (
                <FullListModal
                    title="ALL ATTACKER COUNTRIES"
                    items={allAttackers.map(([code, count]) => {
                        const meta = COUNTRY_META[code] ?? { name: code, flag: "🌐" };
                        return { flag: meta.flag, name: meta.name, count, pct: Math.round((count / totalAtk) * 100), barColor: "#00cc33" };
                    })}
                    onClose={() => setModal(null)}
                />
            )}
            {modal === "attacked" && (
                <FullListModal
                    title="ALL ATTACKED NODES"
                    items={allAttacked.map(({ target, count }) => ({
                        flag: target.flag, name: target.country, count,
                        pct: Math.round((count / totalDef) * 100), barColor: "#3399ff",
                    }))}
                    onClose={() => setModal(null)}
                />
            )}

            <div className="db-section">
                <div className="db-section-title">TOP NETWORK ATTACK VECTORS</div>
                {netVecs.map(v => {
                    const pct = Math.round((v.val / totalNet) * 100);
                    return (
                        <div key={v.label} className="db-vec-row">
                            <div className="db-vec-header">
                                <span className="db-vec-name" style={{ color: v.color }}>{v.label}</span>
                                <span className="db-vec-pct" style={{ color: v.color }}>{pct}%</span>
                            </div>
                            <div className="db-vec-bar-bg">
                                <div className="db-vec-bar-fill" style={{ width: `${pct}%`, background: v.color }} />
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="db-section">
                <div className="db-section-title">TOP APPLICATION VIOLATIONS</div>
                {appVios.map(v => {
                    const pct = Math.round((v.val / totalApp) * 100);
                    return (
                        <div key={v.label} className="db-vec-row">
                            <div className="db-vec-header">
                                <span className="db-vec-name" style={{ color: v.color }}>{v.label}</span>
                                <span className="db-vec-pct" style={{ color: v.color }}>{pct}%</span>
                            </div>
                            <div className="db-vec-bar-bg">
                                <div className="db-vec-bar-fill" style={{ width: `${pct}%`, background: v.color }} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </aside>
    );
}
