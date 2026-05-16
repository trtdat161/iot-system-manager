import axios from "axios";

// ko cần set headers cho gọn vì axios tự set rồi
export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
  withCredentials: true, // cấu hình này sẽ tự động gửi cookie cho tất cả các request, giúp duy trì phiên đăng nhập mà không cần phải set cookie thủ công trong từng request.y
});

// cấu hình ngôn ngữ
axiosInstance.interceptors.request.use((config) => {
  config.headers["Accept-Language"] = localStorage.getItem("lang") || "en-US";
  return config;
});
