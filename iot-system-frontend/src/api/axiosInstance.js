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

// ----------- refresh token -----------
// Dùng chung 1 promise: nhiều request cùng 401 thì chỉ refresh 1 lần
// (BE dùng rotation, refresh token cũ chết ngay sau mỗi lần refresh)
let refreshPromise = null;

const refreshToken = () => {
  if (!refreshPromise) {
    refreshPromise = axiosInstance.post("auth/refresh-token").finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
};

/*
1. Interceptor = trạm kiểm soát mà mọi request/response của axios phải đi qua
2. use() nhận 2 hàm. Axios tự quyết định gọi hàm nào dựa vào status code. Bạn chỉ “đăng ký” hai hàm đó một lần ở đây.
*/
axiosInstance.interceptors.response.use(
  (res) => res, // chạy khi thảnh công khi status 200
  async (error) => {
    // chạy khi THẤT BẠI (4xx, 5xx, mất mạng)
    const original = error.config; // lưu lại vào biến, hiểu đây là bản mô tả request vừa thất bại
    const status = error.response?.status; // lấy mã lỗi

    // api auth ko đc tự refresh tránh vòng lặp vô hạn
    const isAuthUrl = [
      "auth/login",
      "auth/register",
      "auth/refresh-token",
    ].some((u) => original?.url?.includes(u));

    if (status !== 401 || !original || original._retry || isAuthUrl) {
      return Promise.reject(error);
    }

    original._retry = true;
    try {
      await refreshSession(); // xin token mới, cookie mới tự được set
      return axiosInstance(original); // gọi lại request vừa bị 401
    } catch (e) {
      if (window.location.pathname !== "/login") {
        window.location.href = "/login"; // refresh cũng hỏng -> đăng nhập lại
      }
      return Promise.reject(e);
    }
  },
);
