import { useState, useEffect, useCallback } from "react";
import "./Dashboard.css";
import { getAccessToken } from "@/utilities/accessToken";
import { useLogin } from "@/hooks/useLogin";
import { useClock } from "@/hooks/useClock";
import { useNavigate } from "react-router-dom";
import { ERoles } from "@attack-visualization-system/shared";
import { ProfileModal } from "./components/ProfileModal";
import type { AttackType, Severity, TimeRange, AttackEvent } from "./dashboard.types";
import { MOCK_EVENTS, TARGETS } from "./dashboard.constants";
import { TopBar }    from "./components/TopBar";
import { LeftPanel } from "./components/LeftPanel";
import { WorldMap }  from "./components/WorldMap";
import { EventLog }  from "./components/EventLog";

export default function Dashboard() {
    const time = useClock();
    const navigate = useNavigate();
    const { logout, currentUser } = useLogin();
    const isAdmin = currentUser?.role === ERoles.ADMIN;
    const [showProfile, setShowProfile] = useState(false);

    const [query,       setQuery]       = useState("");
    const [range,       setRange]       = useState<TimeRange>("1H");
    const [activeTypes, setActiveTypes] = useState<Set<AttackType>>(
        () => new Set(["DDoS", "SQLi", "Brute", "XSS", "Scan"] as AttackType[])
    );
    const [activeSevs, setActiveSevs] = useState<Set<Severity>>(
        () => new Set(["LOW", "MED", "HIGH", "CRIT"] as Severity[])
    );
    const [liveEvents, setLiveEvents] = useState<AttackEvent[]>(MOCK_EVENTS);

    useEffect(() => {
        const initSentinel = async () => {
            try {
                await getAccessToken();
            } catch (err) {
                setSocketStatus("error");
                console.warn("Sentinel socket disabled:", err);
//                 const accessToken = await getAccessToken();
//             } catch (err) {
//                 console.error("Failed to initialize Sentinel:", err);
//                 alert("Session expired or authentication failed. Please log in again.");
//                 logout();
            }
        };

        initSentinel();
        setInterval(initSentinel, 15 * 60 * 1000);
    }, []);

    const handleNewEvent = useCallback((ev: AttackEvent) => {
        // WorldMap goi callback nay moi khi no ve xong/nhan event moi.
        // Dua event len dau list de counters va Event Log cap nhat.
        setLiveEvents(prev => [ev, ...prev.slice(0, 49)]);
    }, []);

    const filteredEvents = liveEvents.filter(e => {
        if (!activeTypes.has(e.type) || !activeSevs.has(e.severity)) return false;
        if (!query) return true;
        const q = query.toUpperCase();
        return (
            e.ip.includes(query) ||
            e.country.toUpperCase().includes(q) ||
            e.type.toUpperCase().includes(q) ||
            e.city.toUpperCase().includes(q) ||
            e.severity.toUpperCase().includes(q) ||
            e.desc.toUpperCase().includes(q)
        );
    });

    const toggleType = (t: AttackType) => {
        setActiveTypes(prev => { const n = new Set(prev); n.has(t) ? n.delete(t) : n.add(t); return n; });
    };
    const toggleSev = (s: Severity) => {
        setActiveSevs(prev => { const n = new Set(prev); n.has(s) ? n.delete(s) : n.add(s); return n; });
    };

    return (
        <div className="db-root">
            <div className="db-scanline" />
            <TopBar
                time={time}
                query={query} onQuery={setQuery}
                activeTypes={activeTypes} onToggleType={toggleType}
                activeSevs={activeSevs}   onToggleSev={toggleSev}
                onLogout={logout}
                showAdminBtn={isAdmin}
                onAdmin={() => navigate("/admin/dashboard")}
                userName={currentUser?.name}
                onProfile={() => setShowProfile(true)}
            />
            <div className="db-body">
                <LeftPanel events={filteredEvents} range={range} onRange={setRange} />

                <section className="db-map">
                    <div className="db-panel-header">
                        <span>GLOBAL THREAT MAP // REAL-TIME</span>
                        <span className="db-coords">TARGETS // {TARGETS.length} NODES</span>
                    </div>
                    <div className="db-map-body">
                        <WorldMap activeTypes={activeTypes} activeSevs={activeSevs} onNewEvent={handleNewEvent} />
                    </div>
                </section>

                <EventLog events={filteredEvents} />
            </div>

            {showProfile && (
                <ProfileModal
                    user={currentUser}
                    onClose={() => setShowProfile(false)}
                    onChangePassword={async (_old, _new) => {
                        // TODO: call change password API
                    }}
                />
            )}
        </div>
    );
}
