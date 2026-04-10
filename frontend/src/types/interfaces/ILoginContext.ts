import { User } from "@attack-visualization-system/shared";

// Định nghĩa kiểu dữ liệu cho Context
export interface ILoginContext {
    currentUser: User | null;
    loading: boolean;
    isAuthenticated: boolean;
    login: (username: string, password: string, rememberMe: boolean) => Promise<void>;
    logout: () => Promise<void>;
}