import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import "../../css/LanguageSwitcher.css";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("lang", lang);
  };

  return (
    <div className="lang-switcher">
      <button onClick={() => changeLanguage("vi-VN")}>
        <Globe size={18} />
        VI
      </button>
      <button onClick={() => changeLanguage("en-US")}>
        <Globe size={18} />
        EN
      </button>
    </div>
  );
}
