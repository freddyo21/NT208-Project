import { useState } from "react";
import type { ICreateUserRequest } from "@attack-visualization-system/shared";

interface Props {
    onClose: () => void;
    onCreate: (data: ICreateUserRequest) => Promise<void>;
}

export function CreateUserModal({ onClose, onCreate }: Props) {
    const [name, setName]         = useState("");
    const [email, setEmail]       = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState<string | null>(null);

    const handleSubmit = async () => {
        setError(null);
        if (!name.trim() || !email.trim() || !password) {
            setError("ALL FIELDS ARE REQUIRED");
            return;
        }
        if (password.length < 8) {
            setError("PASSWORD MUST BE AT LEAST 8 CHARACTERS");
            return;
        }

        setLoading(true);
        try {
            await onCreate({ name: name.trim(), email: email.trim(), password });
            onClose();
        } catch (err: any) {
            setError(
                err?.response?.data?.message?.toUpperCase() ||
                err?.message?.toUpperCase() ||
                "FAILED TO CREATE USER"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose();
    };

    return (
        <div className="ad-modal-overlay" onClick={handleOverlayClick}>
            <div className="ad-modal">
                <div className="ad-modal-header">
                    CREATE NEW USER
                    <button className="ad-modal-close" onClick={onClose}>
                        [ X ]
                    </button>
                </div>

                <div className="ad-modal-body">
                    <div className="ad-form-group">
                        <label className="ad-form-label">NAME</label>
                        <input
                            className="ad-form-input"
                            placeholder="Full name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && handleSubmit()}
                            autoFocus
                        />
                    </div>

                    <div className="ad-form-group">
                        <label className="ad-form-label">EMAIL</label>
                        <input
                            className="ad-form-input"
                            type="email"
                            placeholder="user@example.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && handleSubmit()}
                        />
                    </div>

                    <div className="ad-form-group">
                        <label className="ad-form-label">PASSWORD</label>
                        <input
                            className="ad-form-input"
                            type="password"
                            placeholder="Min. 8 characters"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && handleSubmit()}
                        />
                        <div className="ad-form-hint">MIN. 8 CHARACTERS</div>
                    </div>

                    <div style={{ fontSize: "10px", color: "#004d11", letterSpacing: "1px", paddingTop: "4px" }}>
                        ▸ ACCOUNT WILL BE CREATED WITH OPERATOR ROLE
                    </div>

                    {error && <div className="ad-form-error">⚠ {error}</div>}
                </div>

                <div className="ad-modal-footer">
                    <button className="ad-btn" onClick={onClose} disabled={loading}>
                        CANCEL
                    </button>
                    <button className="ad-btn ad-btn--primary" onClick={handleSubmit} disabled={loading}>
                        {loading && <span className="ad-spinner" />}
                        CREATE
                    </button>
                </div>
            </div>
        </div>
    );
}
