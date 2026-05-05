import "./i18n.js"; // import main cho cả app sài đc

/*---------------------------------*/
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// import "./index.css";
import App from "./App.jsx";
import axios from "axios";

axios.defaults.withCredentials = true; // cấu hình này sẽ tự động gửi cookie cho tất cả các request, giúp duy trì phiên đăng nhập mà không cần phải set cookie thủ công trong từng request.
axios.defaults.baseURL = import.meta.env.VITE_BASE_URL; // cấu hình baseURL cho tất cả các request, giúp tránh phải viết lại URL gốc trong từng request.

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
