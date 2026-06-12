import { LoginContext } from "@/contexts/LoginContext";
import { userLogin, userLogout } from "@/services/auth.services";
import { setAccessToken } from "@/utilities/accessToken";
import { IUserResponse } from "@attack-visualization-system/shared";
import { ReactNode, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginProvider({ children }: { children: ReactNode }) {
    // Giả lập trạng thái đăng nhập và thông tin người dùng
    const [currentUser, setCurrentUser] = useState<IUserResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const navigate = useNavigate();

    const login = async (email: string, pass: string, rememberMe: boolean) => {
        setLoading(true);

        // Gọi API đăng nhập
        try {
            const result = await userLogin(email, pass, rememberMe);

            if (!result || !result.user) {
                throw new Error("Invalid email or password");
            }

            const {
                user,
                accessToken,
                //  expiresIn
            } = result;

            setAccessToken(accessToken);
            setCurrentUser(user);
            setIsAuthenticated(true);
            navigate("/", { replace: true });
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message || "An error occured.";
            console.error("Login failed:", errorMessage);

            setCurrentUser(null);
            setIsAuthenticated(false);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await userLogout();
        } catch (err) {
            console.error("Logout request failed:", err);
        } finally {
            // Always clear client state and navigate to login
            setAccessToken("");
            setCurrentUser(null);
            setIsAuthenticated(false);
            navigate("/auth/login", { replace: true });
        }
    };

    const value = {
        currentUser,
        loading,
        isAuthenticated,
        login,
        logout
    }

    return (
        <>
            <LoginContext.Provider value={value}>
                {children}
            </LoginContext.Provider>
        </>
    );
}