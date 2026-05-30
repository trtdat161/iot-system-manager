import { useTranslation } from "react-i18next";

export function DashboardUser() {
  const { t } = useTranslation("user_dashboard");

  return (
    <>
      <h1>{t("title")}</h1>
    </>
  );
}
