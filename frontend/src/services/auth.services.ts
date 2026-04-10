import { HttpClient } from "./HttpClient"

export const userLogin = async (username: string, password: string, rememberMe: boolean) => {
    try {
        const result = await HttpClient.post("/auth/login", {
            username,
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