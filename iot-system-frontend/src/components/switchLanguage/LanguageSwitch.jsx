import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang); // load file JSON tương ứng giúp đổi ngôn ngữ ngay lập tức, re-render toàn app
    localStorage.setItem("lang", lang); // lưu lại để lần sau vào vẫn nhớ
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => changeLanguage("vi-VN")}
        className="flex items-center gap-2 px-3 py-1 rounded-md hover:bg-gray-100 transition-colors"
      >
        <Globe size={18} />
        VI
      </button>
      <button
        onClick={() => changeLanguage("en-US")}
        className="flex items-center gap-2 px-3 py-1 rounded-md hover:bg-gray-100 transition-colors"
      >
        <Globe size={18} />
        EN
      </button>
    </div>
  );
}
