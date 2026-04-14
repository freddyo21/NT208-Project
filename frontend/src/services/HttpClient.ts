import axios from "axios";

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
    if (!axios.isAxiosError(err)) return Promise.reject(err);

    return Promise.reject(err);
  }
);

export { HttpClient };