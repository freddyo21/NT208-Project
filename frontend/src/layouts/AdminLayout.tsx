import { Outlet, NavLink } from "react-router-dom";
import { useContext } from "react";
import { LoginContext } from "@/contexts/LoginContext";
import { useClock } from "@/hooks/useClock";
import "../pages/admin/admin.css";

export function AdminLayout() {
    const ctx = useContext(LoginContext);
    const time = useClock();

    return (
        <div className="ad-root">
            <div className="ad-scanline" />

            <header className="ad-topbar">
                <span className="ad-brand">SENTINEL</span>
                <span className="ad-sep"> // </span>
                <span className="ad-ver">ADMIN CONSOLE</span>
                <span className="ad-spacer" />
                <span className="ad-user">{ctx?.currentUser?.email ?? "—"}</span>
                <span className="ad-clock">{time}</span>
                <button className="ad-logout-btn" onClick={ctx?.logout}>LOGOUT</button>
            </header>

            <div className="ad-body">
                <nav className="ad-sidebar">
                    <span className="ad-sidebar-label">NAVIGATION</span>
                    <NavLink
                        to="/admin/dashboard"
                        className={({ isActive }) =>
                            `ad-nav-item${isActive ? " ad-nav-item--active" : ""}`
                        }
                    >
                        ▸ DASHBOARD
                    </NavLink>
                    <NavLink
                        to="/admin/users"
                        className={({ isActive }) =>
                            `ad-nav-item${isActive ? " ad-nav-item--active" : ""}`
                        }
                    >
                        ▸ USERS
                    </NavLink>
                </nav>

                <main className="ad-main">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
