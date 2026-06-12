import { useState } from "react";
import type { IUserResponse } from "@attack-visualization-system/shared";

interface Props {
    user: IUserResponse | null;
    onClose: () => void;
    onChangePassword: (oldPass: string, newPass: string) => Promise<void>;
}

const ROLE_COLOR: Record<string, string> = {
    admin:    "#ffcc00",
    operator: "#3399ff",
};
const STATUS_COLOR: Record<string, string> = {
    active:   "#00ff41",
    banned:   "#ff3333",
    inactive: "#ff8800",
    pending:  "#ffcc00",
};

export function ProfileModal({ user, onClose, onChangePassword }: Props) {
    const [oldPass,     setOldPass]     = useState("");
    const [newPass,     setNewPass]     = useState("");
    const [confirmPass, setConfirmPass] = useState("");
    const [loading,     setLoading]     = useState(false);
    const [error,       setError]       = useState<string | null>(null);
    const [success,     setSuccess]     = useState(false);

    const handleSubmit = async () => {
        setError(null);
        setSuccess(false);
        if (!oldPass || !newPass || !confirmPass) {
            setError("ALL FIELDS ARE REQUIRED");
            return;
        }
        if (newPass !== confirmPass) {
            setError("PASSWORDS DO NOT MATCH");
            return;
        }
        if (newPass.length < 8) {
            setError("NEW PASSWORD MUST BE AT LEAST 8 CHARACTERS");
            return;
        }
        if (oldPass === newPass) {
            setError("NEW PASSWORD MUST BE DIFFERENT FROM CURRENT");
            return;
        }
        setLoading(true);
        try {
            await onChangePassword(oldPass, newPass);
            setSuccess(true);
            setOldPass(""); setNewPass(""); setConfirmPass("");
        } catch (err: any) {
            setError(
                err?.response?.data?.message?.toUpperCase() ||
                err?.message?.toUpperCase() ||
                "FAILED TO CHANGE PASSWORD"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="db-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="db-modal" style={{ width: 380 }}>
                <div className="db-modal-header">
                    USER PROFILE
                    <button className="db-modal-close" onClick={onClose}>[ X ]</button>
                </div>

                <div className="db-modal-body">
                    {/* ── Info ── */}
                    <div style={{
                        paddingBottom: 14,
                        marginBottom: 16,
                        borderBottom: "1px solid rgba(0,255,65,.08)"
                    }}>
                        <div style={{ fontSize: 17, color: "#00ff41", letterSpacing: 1, marginBottom: 5 }}>
                            {user?.name ?? "—"}
                        </div>
                        <div style={{ fontSize: 12, color: "#006617", marginBottom: 12 }}>
                            {user?.email ?? "—"}
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                            {user?.role && (
                                <span className="db-badge" style={{
                                    color: ROLE_COLOR[user.role] ?? "#00ff41",
                                    borderColor: (ROLE_COLOR[user.role] ?? "#00ff41") + "55",
                                    background: (ROLE_COLOR[user.role] ?? "#00ff41") + "11",
                                }}>
                                    {user.role.toUpperCase()}
                                </span>
                            )}
                            {user?.status && (
                                <span className="db-badge" style={{
                                    color: STATUS_COLOR[user.status] ?? "#00ff41",
                                    borderColor: (STATUS_COLOR[user.status] ?? "#00ff41") + "55",
                                    background: (STATUS_COLOR[user.status] ?? "#00ff41") + "11",
                                }}>
                                    {user.status.toUpperCase()}
                                </span>
                            )}
                        </div>
                        {user?.lastLogin && (
                            <div style={{ fontSize: 10, color: "#004d11", marginTop: 10, letterSpacing: 1 }}>
                                LAST LOGIN: {new Date(user.lastLogin).toLocaleString()}
                            </div>
                        )}
                    </div>

                    {/* ── Change password ── */}
                    <div style={{ fontSize: 10, color: "#004d11", letterSpacing: 2, marginBottom: 12 }}>
                        CHANGE PASSWORD
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                        <input
                            className="db-filter-input"
                            style={{ width: "100%", boxSizing: "border-box" }}
                            type="password"
                            placeholder="Current password"
                            value={oldPass}
                            onChange={e => setOldPass(e.target.value)}
                        />
                        <input
                            className="db-filter-input"
                            style={{ width: "100%", boxSizing: "border-box" }}
                            type="password"
                            placeholder="New password (min. 8 chars)"
                            value={newPass}
                            onChange={e => setNewPass(e.target.value)}
                        />
                        <input
                            className="db-filter-input"
                            style={{ width: "100%", boxSizing: "border-box" }}
                            type="password"
                            placeholder="Confirm new password"
                            value={confirmPass}
                            onChange={e => setConfirmPass(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && handleSubmit()}
                        />
                    </div>

                    {error && (
                        <div style={{
                            fontSize: 11, color: "#ff3333", letterSpacing: 1,
                            marginBottom: 10, padding: "5px 8px",
                            border: "1px solid rgba(255,51,51,.25)",
                            background: "rgba(255,51,51,.05)", borderRadius: 2
                        }}>
                            ⚠ {error}
                        </div>
                    )}
                    {success && (
                        <div style={{
                            fontSize: 11, color: "#00ff41", letterSpacing: 1,
                            marginBottom: 10, padding: "5px 8px",
                            border: "1px solid rgba(0,255,65,.25)",
                            background: "rgba(0,255,65,.05)", borderRadius: 2
                        }}>
                            ✓ PASSWORD CHANGED SUCCESSFULLY
                        </div>
                    )}

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                        <button className="db-filter-btn" onClick={onClose} disabled={loading}>
                            CLOSE
                        </button>
                        <button
                            className="db-filter-btn db-filter-btn--on"
                            onClick={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? "..." : "SAVE"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
