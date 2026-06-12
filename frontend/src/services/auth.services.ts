import { LoginResponseDTO } from "@attack-visualization-system/shared";
import { HttpClient } from "./HttpClient"

export const userLogin = async (
    email: string,
    password: string,
    rememberMe: boolean
): Promise<LoginResponseDTO> => {
    try {
        console.log("Attempting login with:", { email, rememberMe });
        const result = await HttpClient.post("/auth/login", {
            email,
            password,
            rememberMe
        });

        return result.data;
    } catch (error) {
        throw error;
    }
}

export const userLogout = async () => {
    try {
        const result = await HttpClient.post("/auth/logout");

        if (result.status !== 200) {
            throw new Error("Logout failed");
        }

        return result.data;
    } catch (error) {
        throw error;
    }
}

export const refreshToken = async () => {
    try {
        const result = await HttpClient.post("/auth/refresh");
        if (result.status !== 200) {
            throw new Error("Refresh token failed");
        }
        return result.data;
    } catch (error) {
        throw error;
    }
}