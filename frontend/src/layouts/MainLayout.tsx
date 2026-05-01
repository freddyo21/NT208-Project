import { Suspense } from "react";
import { Outlet } from "react-router-dom";

function Loading() {
    return (
        <div style={{
            width: "100vw", height: "100vh",
            background: "#060c06", display: "flex",
            alignItems: "center", justifyContent: "center",
            color: "#00ff41", fontFamily: "'Share Tech Mono', monospace",
            fontSize: "11px", letterSpacing: "3px"
        }}>
            LOADING...
        </div>
    );
}

export function MainLayout() {
    return (
        <Suspense fallback={<Loading />}>
            <Outlet />
        </Suspense>
    );
}
