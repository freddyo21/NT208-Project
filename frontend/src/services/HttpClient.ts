import { getAccessToken } from "@/utilities/accessToken";
import { sleep } from "@/utilities/functions/general-functions";
import axios, { AxiosRequestConfig } from "axios";

const serverApiUrl = import.meta.env.VITE_SERVER_API_URL;

const HttpClient = axios.create({
  baseURL: serverApiUrl,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Phải xóa nếu không dùng cookie
});

HttpClient.interceptors.request.use(
  async (config) => {
    // Avoid calling getAccessToken for auth endpoints to prevent circular
    // refresh -> interceptor -> getAccessToken -> refreshPromise deadlock.
    const requestUrl = (config.url || "").toString();
    if (requestUrl.includes("/auth/refresh") || requestUrl.includes("/auth/login") || requestUrl.includes("/auth/logout")) {
      return config;
    }

    const token = await getAccessToken();

    if (token) {
      if (!config.headers) config.headers = {} as any;
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

HttpClient.interceptors.response.use(
  (response) => response,
  async (err) => {
    // 1. Kiểm tra xem có phải lỗi của Axios không
    if (!axios.isAxiosError(err)) {
      return Promise.reject(err);
    }

    const status = err.response?.status;

    if (!status) {
      console.error("Sentinel: Network error or no response received:", err);
      return Promise.reject(new Error("Network error or no response received"));
    }

    // 2. Nếu lỗi là 401 hoặc 403, và không phải đang ở trang login, thì mới thử refresh token
    if ((status === 401 || status === 403) && !window.location.pathname.includes("/auth/login")) {
      console.warn("Sentinel: Access token có thể đã hết hạn. Đang thử refresh...");

      try {
        // Avoid attempting refresh if the failed request was itself an auth endpoint
        const failedUrl = err.config?.url?.toString() || "";
        if (failedUrl.includes("/auth/refresh") || failedUrl.includes("/auth/login") || failedUrl.includes("/auth/logout")) {
          console.warn("Sentinel: Auth endpoint failed; not attempting refresh to avoid loop.");

          await sleep(5000); // Delay để debug
          window.location.replace("/auth/login");
          return Promise.reject(err);
        }

        // Prevent retry loops for the same request
        if ((err.config as any)?._retry) {
          console.warn("Sentinel: Request already retried once, aborting.");

          await sleep(5000); // Delay để debug
          window.location.replace("/auth/login");
          return Promise.reject(err);
        }

        (err.config as any)._retry = true;

        const newToken = await getAccessToken();
        console.log("Sentinel: Refresh token result:", newToken ? "Success" : "Failed");

        if (newToken) {
          console.log("Sentinel: Refresh token thành công, đang thử lại request gốc...");
          // Cập nhật header Authorization với token mới
          if (err.config && err.config.headers) {
            err.config.headers.Authorization = `Bearer ${newToken}`;
          }
          // Thử lại request gốc
          return HttpClient.request(err.config as AxiosRequestConfig);
        }
        console.warn("Sentinel: Refresh token thất bại, đang cưỡng chế đăng xuất...");
        window.location.replace("/auth/login");
      } catch (refreshError) {
        console.error("Sentinel: Lỗi khi refresh token:", refreshError);
        window.location.replace("/auth/login");
      }
    }

    return Promise.reject(err);
  }
);

export { HttpClient };