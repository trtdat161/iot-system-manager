import i18next from "i18next";
import { initReactI18next } from "react-i18next";

import vi_register_login from "./locales/vi/register_login.json";
import en_register_login from "./locales/en/register_login.json";
import vi_admin_manager_user from "./locales/vi/admin_manager_user.json";
import en_admin_manager_user from "./locales/en/admin_manager_user.json";
import vi_sidebar from "./locales/vi/sidebar.json";
import en_sidebar from "./locales/en/sidebar.json";
import vi_common from "./locales/vi/common.json";
import en_common from "./locales/en/common.json";
import vi_frame_layout from "./locales/vi/frame_layout.json";
import en_frame_layout from "./locales/en/frame_layout.json";
import vi_admin_dashboard from "./locales/vi/admin_dashboard.json";
import en_admin_dashboard from "./locales/en/admin_dashboard.json";
import vi_admin_profile from "./locales/vi/admin_profile.json";
import en_admin_profile from "./locales/en/admin_profile.json";
import vi_user_profile from "./locales/vi/user_profile.json";
import en_user_profile from "./locales/en/user_profile.json";
import vi_user_dashboard from "./locales/vi/user_dashboard.json";
import en_user_dashboard from "./locales/en/user_dashboard.json";
import vi_user_sidebar from "./locales/vi/user_sidebar.json";
import en_user_sidebar from "./locales/en/user_sidebar.json";
import vi_user_frame_layout from "./locales/vi/user_frame_layout.json";
import en_user_frame_layout from "./locales/en/user_frame_layout.json";

i18next.use(initReactI18next).init({
  // file này sẽ đc gọi ở main.jsx một lần khi app start
  resources: {
    // khai báo các file translation ở đây
    "vi-VN": {
      register_login: vi_register_login,
      admin_manager_user: vi_admin_manager_user,
      sidebar: vi_sidebar,
      common: vi_common,
      frame_layout: vi_frame_layout,
      admin_dashboard: vi_admin_dashboard,
      admin_profile: vi_admin_profile,
      user_profile: vi_user_profile,
      user_dashboard: vi_user_dashboard,
      user_sidebar: vi_user_sidebar,
      user_frame_layout: vi_user_frame_layout,
    },
    "en-US": {
      register_login: en_register_login,
      admin_manager_user: en_admin_manager_user,
      sidebar: en_sidebar,
      common: en_common,
      frame_layout: en_frame_layout,
      admin_dashboard: en_admin_dashboard,
      admin_profile: en_admin_profile,
      user_profile: en_user_profile,
      user_dashboard: en_user_dashboard,
      user_sidebar: en_user_sidebar,
      user_frame_layout: en_user_frame_layout,
    },
  },
  lng: localStorage.getItem("lang") || "en-US",
  fallbackLng: "en-US",
  interpolation: { escapeValue: false },
});

export default i18next;
