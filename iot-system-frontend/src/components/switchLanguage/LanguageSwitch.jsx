import { useTranslation } from "react-i18next";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang); // load file JSON tương ứng giúp đổi ngôn ngữ ngay lập tức, re-render toàn app
    localStorage.setItem("lang", lang); // lưu lại để lần sau vào vẫn nhớ
  };

  return (
    <div>
      <button onClick={() => changeLanguage("vi")}>🇻🇳 VI</button>
      <button onClick={() => changeLanguage("en")}>🇬🇧 EN</button>
    </div>
  );
}
