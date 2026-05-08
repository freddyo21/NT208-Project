import { LoginResponseDTO } from "@attack-visualization-system/shared";
import { HttpClient } from "./HttpClient"

export const userLogin = async (
    email: string,
    password: string,
    rememberMe: boolean
): Promise<LoginResponseDTO> => {
    try {
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
        await HttpClient.post("/auth/logout");
    } catch (error) {
        throw error;
    }
}