import { LoginContext } from "@/contexts/LoginContext";
import { userLogin, userLogout } from "@/services/auth.services";
import { IUser } from "@/types/interfaces/IUser";
import { ReactNode, useState } from "react";
import { useNavigate } from "react-router";

export default function LoginProvider({ children }: { children: ReactNode }) {
    // Giả lập trạng thái đăng nhập và thông tin người dùng
    const [currentUser, setCurrentUser] = useState<IUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const navigate = useNavigate();

    const login = async (username: string, pass: string, rememberMe: boolean) => {
        setLoading(true);

        // Gọi API đăng nhập
        try {
            const result = await userLogin(username, pass, rememberMe);

            if (!result || !result.user) {
                throw new Error("Invalid username or password");
            }

            if (!result.accessToken) {
                throw new Error("No access token received");
            }

            setCurrentUser(result.user as IUser);
            setIsAuthenticated(true);
            navigate("/", { replace: true });
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message || "Đã có lỗi xảy ra.";
            console.error("Login failed:", errorMessage);

            setCurrentUser(null);
            setIsAuthenticated(false);
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        await userLogout();
        setCurrentUser(null);
        setIsAuthenticated(false);

        navigate("/auth/login", { replace: true });
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