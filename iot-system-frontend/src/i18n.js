import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import vi from "./locales/vi/register_login.json";
import en from "./locales/en/register_login.json";

i18next.use(initReactI18next).init({
  resources: {
    "vi-VN": { register_login: vi },
    "en-US": { register_login: en },
  },
  lng: localStorage.getItem("lang") || "vi-VN",
  fallbackLng: "vi-VN",
  interpolation: { escapeValue: false },
});

export default i18next;
