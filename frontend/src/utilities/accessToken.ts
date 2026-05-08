import { HttpClient } from "@/services/HttpClient";
import { AxiosError } from "axios";
import { sleep } from "./functions/general-functions";

let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

export const getAccessToken = async (): Promise<string | null> => {
    if (accessToken) {
        console.log("Current Access Token:", accessToken); // Debug log to verify token retrieval
        return accessToken;
    }

    if (refreshPromise) return refreshPromise;

    refreshPromise = HttpClient.post("/auth/refresh")
        .then(result => {
            accessToken = result.data.accessToken;
            console.log("New Access Token:", accessToken); // Debug log to verify token retrieval
            refreshPromise = null; // Mở khóa sau khi xong
            return accessToken;
        }).catch(async (error: AxiosError) => {
            console.log("Error refreshing access token:", error.toJSON()); // Debug log để xem lỗi chi tiết

            const status = error.status;
            if ((status === 401 || status === 403) && !window.location.pathname.includes("/auth/login")) {
                console.warn("Sentinel: Refresh token đã bị hủy. Đang cưỡng chế đăng xuất...");
                await sleep(3000);
                accessToken = null;
                window.location.replace("/auth/login");
            }

            refreshPromise = null; // Lỗi cũng phải mở khóa để lần sau thử lại
            // throw error;
            return null; // Trả về null nếu refresh thất bại, để lần sau thử lại thay vì bị kẹt mãi
        }).finally(() => {
            refreshPromise = null; // Đảm bảo luôn mở khóa sau khi hoàn thành
        });

    return refreshPromise;
};

export const setAccessToken = (token: string) => {
    accessToken = token;
};