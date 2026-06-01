import { useEffect, useState } from "react";
import { getUsers, createUser, updateUserStatus, updateUserRole } from "@/services/admin.services";
import type { IUserResponse, ICreateUserRequest } from "@attack-visualization-system/shared";
import { ERoles } from "@attack-visualization-system/shared";
import { CreateUserModal } from "./CreateUserModal";

type StatusFilter = "ALL" | "active" | "inactive" | "banned" | "pending";

export default function UserManagement() {
    const [users, setUsers]           = useState<IUserResponse[]>([]);
    const [loading, setLoading]       = useState(true);
    const [error, setError]           = useState<string | null>(null);
    const [search, setSearch]         = useState("");
    const [statusFilter, setStatus]   = useState<StatusFilter>("ALL");
    const [showCreate, setShowCreate] = useState(false);

    const load = () => {
        setLoading(true);
        setError(null);
        getUsers()
            .then(setUsers)
            .catch(err => setError(
                err?.response?.data?.message?.toUpperCase() ||
                err?.message?.toUpperCase() ||
                "FAILED TO LOAD USERS"
            ))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const handleCreate = async (data: ICreateUserRequest) => {
        await createUser(data);
        load();
    };

    const handleToggleStatus = async (u: IUserResponse) => {
        const next = u.status === "banned" ? "active" : "banned";
        setUsers(prev => prev.map(x => x.id === u.id ? { ...x, status: next as any } : x));
        try {
            await updateUserStatus(u.id, next);
        } catch {
            setUsers(prev => prev.map(x => x.id === u.id ? { ...x, status: u.status } : x));
        }
    };

    const handleToggleRole = async (u: IUserResponse) => {
        const next = u.role === ERoles.ADMIN ? ERoles.OPERATOR : ERoles.ADMIN;
        setUsers(prev => prev.map(x => x.id === u.id ? { ...x, role: next } : x));
        try {
            await updateUserRole(u.id, next);
        } catch {
            setUsers(prev => prev.map(x => x.id === u.id ? { ...x, role: u.role } : x));
        }
    };

    const filtered = users.filter(u => {
        const matchSearch =
            u.name.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === "ALL" || u.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const STATUS_FILTERS: StatusFilter[] = ["ALL", "active", "inactive", "banned", "pending"];

    return (
        <>
            <div className="ad-page-title">USER MANAGEMENT</div>
            <div className="ad-page-sub">MANAGE SYSTEM ACCOUNTS</div>

            <div className="ad-section">
                <div className="ad-section-header">
                    <span>ACCOUNTS</span>
                    <span style={{ color: "#004d11" }}>{users.length} TOTAL</span>
                </div>

                <div className="ad-section-body">
                    <div className="ad-toolbar">
                        <input
                            className="ad-search-input"
                            placeholder="SEARCH NAME / EMAIL..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />

                        <div style={{ display: "flex", gap: "6px" }}>
                            {STATUS_FILTERS.map(f => (
                                <button
                                    key={f}
                                    className="ad-btn"
                                    style={statusFilter === f ? {
                                        borderColor: "#00ff41",
                                        color: "#00ff41",
                                        background: "rgba(0,255,65,.08)"
                                    } : {}}
                                    onClick={() => setStatus(f)}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>

                        <button
                            className="ad-btn ad-btn--primary"
                            style={{ marginLeft: "auto" }}
                            onClick={() => setShowCreate(true)}
                        >
                            + CREATE USER
                        </button>
                    </div>

                    {loading ? (
                        <div className="ad-state-box">
                            <span className="ad-spinner" />LOADING...
                        </div>
                    ) : error ? (
                        <div className="ad-state-box">
                            <div className="ad-state-box-title">ERROR</div>
                            {error}
                            <br />
                            <button className="ad-btn" style={{ marginTop: "14px" }} onClick={load}>
                                RETRY
                            </button>
                        </div>
                    ) : (
                        <table className="ad-table">
                            <thead>
                                <tr>
                                    <th>NAME</th>
                                    <th>EMAIL</th>
                                    <th>ROLE</th>
                                    <th>STATUS</th>
                                    <th>CREATED</th>
                                    <th>LAST LOGIN</th>
                                    <th>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td className="ad-table-empty" colSpan={7}>NO USERS FOUND</td>
                                    </tr>
                                ) : filtered.map(u => (
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
                                        <td style={{ color: "#004d11", fontSize: "11px" }}>
                                            {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : "—"}
                                        </td>
                                        <td>
                                            <div style={{ display: "flex", gap: "6px" }}>
                                                <button
                                                    className={`ad-btn ad-btn--sm ${u.status === "banned" ? "" : "ad-btn--danger"}`}
                                                    style={u.status === "banned" ? {
                                                        borderColor: "rgba(0,255,65,.35)",
                                                        color: "#00cc33"
                                                    } : {}}
                                                    onClick={() => handleToggleStatus(u)}
                                                >
                                                    {u.status === "banned" ? "UNBAN" : "BAN"}
                                                </button>
                                                <button
                                                    className="ad-btn ad-btn--sm"
                                                    style={{
                                                        borderColor: u.role === ERoles.ADMIN
                                                            ? "rgba(51,153,255,.4)"
                                                            : "rgba(255,204,0,.4)",
                                                        color: u.role === ERoles.ADMIN ? "#3399ff" : "#ffcc00",
                                                    }}
                                                    onClick={() => handleToggleRole(u)}
                                                >
                                                    → {u.role === ERoles.ADMIN ? "OPERATOR" : "ADMIN"}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {showCreate && (
                <CreateUserModal
                    onClose={() => setShowCreate(false)}
                    onCreate={handleCreate}
                />
            )}
        </>
    );
}
