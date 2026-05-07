import i18next from "i18next";
import { initReactI18next } from "react-i18next";

import vi_register_login from "./locales/vi/register_login.json";
import en_register_login from "./locales/en/register_login.json";
import vi_admin_manager_user from "./locales/vi/admin_manager_user.json";
import en_admin_manager_user from "./locales/en/admin_manager_user.json";

i18next.use(initReactI18next).init({
  // file này sẽ đc gọi ở main.jsx một lần khi app start
  resources: {
    // khai báo các file translation ở đây
    "vi-VN": {
      register_login: vi_register_login,
      admin_manager_user: vi_admin_manager_user,
    },
    "en-US": {
      register_login: en_register_login,
      admin_manager_user: en_admin_manager_user,
    },
  },
  lng: localStorage.getItem("lang") || "en-US",
  fallbackLng: "en-US",
  interpolation: { escapeValue: false },
});

export default i18next;
