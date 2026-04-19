import axios from "axios";

// ko cần set headers cho gọn vì axios tự set rồi
export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
});

// đồng bộ ngôn ngữ với BE
axiosInstance.interceptors.request.use((config) => {
  config.headers["Accept-Language"] = localStorage.getItem("lang") || "vi-VN";
  return config;
});
