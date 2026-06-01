import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUsers } from "@/services/admin.services";
import type { IUserResponse } from "@attack-visualization-system/shared";
import { ERoles } from "@attack-visualization-system/shared";

export default function AdminDashboard() {
    const [users, setUsers]     = useState<IUserResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        getUsers()
            .then(setUsers)
            .catch(() => setUsers([]))
            .finally(() => setLoading(false));
    }, []);

    const total    = users.length;
    const active   = users.filter(u => u.status === "active").length;
    const banned   = users.filter(u => u.status === "banned").length;
    const admins   = users.filter(u => u.role === ERoles.ADMIN).length;
    const operators = users.filter(u => u.role === ERoles.OPERATOR).length;

    return (
        <>
            <div className="ad-page-title">DASHBOARD</div>
            <div className="ad-page-sub">SYSTEM OVERVIEW</div>

            {loading ? (
                <div className="ad-state-box">
                    <span className="ad-spinner" />LOADING...
                </div>
            ) : (
                <>
                    <div className="ad-stats-grid">
                        <div className="ad-stat-card">
                            <span className="ad-stat-num">{total}</span>
                            <span className="ad-stat-label">TOTAL USERS</span>
                        </div>
                        <div className="ad-stat-card">
                            <span className="ad-stat-num">{active}</span>
                            <span className="ad-stat-label">ACTIVE</span>
                        </div>
                        <div className="ad-stat-card">
                            <span className="ad-stat-num ad-stat-num--red">{banned}</span>
                            <span className="ad-stat-label">BANNED</span>
                        </div>
                        <div className="ad-stat-card">
                            <span className="ad-stat-num ad-stat-num--yellow">{admins}</span>
                            <span className="ad-stat-label">ADMINS</span>
                        </div>
                        <div className="ad-stat-card">
                            <span className="ad-stat-num ad-stat-num--blue">{operators}</span>
                            <span className="ad-stat-label">OPERATORS</span>
                        </div>
                    </div>

                    <div className="ad-section">
                        <div className="ad-section-header">QUICK ACTIONS</div>
                        <div className="ad-section-body">
                            <div className="ad-action-group">
                                <button
                                    className="ad-btn ad-btn--primary"
                                    onClick={() => navigate("/admin/users")}
                                >
                                    MANAGE USERS
                                </button>
                                <button
                                    className="ad-btn"
                                    onClick={() => navigate("/admin/users")}
                                >
                                    + CREATE USER
                                </button>
                            </div>
                        </div>
                    </div>

                    {users.length > 0 && (
                        <div className="ad-section">
                            <div className="ad-section-header">
                                <span>RECENT ACCOUNTS</span>
                                <span style={{ color: "#004d11" }}>LAST 5</span>
                            </div>
                            <div className="ad-section-body" style={{ padding: "0" }}>
                                <table className="ad-table">
                                    <thead>
                                        <tr>
                                            <th>NAME</th>
                                            <th>EMAIL</th>
                                            <th>ROLE</th>
                                            <th>STATUS</th>
                                            <th>CREATED</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[...users]
                                            .sort((a, b) =>
                                                new Date(b.createdAt).getTime() -
                                                new Date(a.createdAt).getTime()
                                            )
                                            .slice(0, 5)
                                            .map(u => (
                                                <tr key={u.id}>
                                                    <td>{u.name}</td>
                                                    <td style={{ color: "#006617" }}>{u.email}</td>
                                                    <td>
                                                        <span className={`ad-badge ad-badge--${u.role}`}>
                                                            {u.role.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className={`ad-badge ad-badge--${u.status}`}>
                                                            {u.status.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td style={{ color: "#004d11", fontSize: "11px" }}>
                                                        {new Date(u.createdAt).toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </>
    );
}
