import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
});
// ko cần set headers cho gọn vì axios tự set rồi
