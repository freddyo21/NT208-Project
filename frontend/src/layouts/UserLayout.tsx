import { Suspense } from "react";
import { Outlet } from "react-router-dom";

export function UserLayout() {

    return (
        <>
            <div className="">
                {/* Main content */}
                <div
                    className={``}
                >
                    <div>
                        <Suspense>
                            <Outlet />
                        </Suspense>
                    </div>
                </div>
            </div>
        </>
    );
}