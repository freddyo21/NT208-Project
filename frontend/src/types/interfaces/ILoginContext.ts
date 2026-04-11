import { IUser } from "@attack-visualization-system/shared";

// Định nghĩa kiểu dữ liệu cho Context
export interface ILoginContext {
    currentUser: IUser | null;
    loading: boolean;
    isAuthenticated: boolean;
    login: (username: string, password: string, rememberMe: boolean) => Promise<void>;
    logout: () => Promise<void>;
}