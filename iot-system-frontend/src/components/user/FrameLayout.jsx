import { Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { FaBell, FaHome, FaUserCircle } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "../switchLanguage/LanguageSwitch";
import { Sidebar } from "./Sidebar";
import { UserGetMe } from "../../api/user/accountApi";

export function FrameLayoutUser() {
  const [collapsed, setCollapsed] = useState(false);
  const [fullname, setFullname] = useState("");
  const navigate = useNavigate();
  const { t } = useTranslation("user_frame_layout");

  const infoProfile = async () => {
    try {
      const response = await UserGetMe();
      setFullname(response.data.fullname);
    } catch (err) {
      console.log("error:", err?.message || err);
    }
  };

  useEffect(() => {
    infoProfile();
  }, []);

  return (
    <>
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      <div className={`user-frame ${collapsed ? "collapsed" : ""}`}>
        <header className="user-frame-header">
          <div className="user-frame-left">
            <span className="user-frame-notice">
              <FaBell />
              {t("notification")}
            </span>
            <button
              type="button"
              className="user-home-btn"
              onClick={() => navigate("/user-frame-layout/dashboard-user")}
            >
              <FaHome />
              {t("home")}
            </button>
          </div>

          <div className="user-frame-right">
            <span>
              {t("welcome_user")} {fullname}
            </span>
            <div className="user-avatar" aria-label={t("user_avatar_alt")}>
              <FaUserCircle />
            </div>
            <LanguageSwitcher />
          </div>
        </header>

        <div className="user-frame-content">
          <Outlet />
        </div>
      </div>
    </>
  );
}
