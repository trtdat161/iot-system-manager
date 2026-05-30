import { Outlet, useNavigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { useState } from "react";
import { LanguageSwitcher } from "../switchLanguage/LanguageSwitch";
import { useTranslation } from "react-i18next";

// import icon
import { FaHome } from "react-icons/fa";

export function FrameLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation("frame_layout");

  // style content
  const styleFrame = {
    marginLeft: collapsed ? "7px" : "162px",
    transition: "margin-left 0.35s ease",
    padding: "20px",
  };

  return (
    <>
      {/* sidebar */}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* content */}
      <div style={styleFrame}>
        {/* header */}
        <div className="container-fluid mb-3">
          <div className="row">
            <div className="col-md-12">
              <div className="bg-dark text-white rounded p-2">
                <div className="d-flex justify-content-between align-items-center">
                  {/* left */}
                  <div className="d-flex align-items-center gap-3">
                    <span>{t("notification")}</span>

                    {/* home button */}
                    <button
                      className="btn btn-sm btn-light d-flex align-items-center gap-2"
                      onClick={() => navigate("/frame-layout/dashboard-admin")}
                    >
                      <FaHome />
                      {t("home")}
                    </button>
                  </div>
                  {/* right */}
                  <div className="d-flex align-items-center gap-3">
                    {/* sau gắn thêm tấm hình */}
                    <span>{t("welcome_admin")}</span>
                    <img
                      src="path/to/admin-avatar.jpg"
                      alt={t("admin_avatar_alt")}
                      className="rounded-circle"
                      style={{ width: "40px", height: "40px" }}
                    />

                    <LanguageSwitcher />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* outlet */}
        <div className="container-fluid">
          <div className="row">
            <div className="col-md-12">{<Outlet />}</div>
          </div>
        </div>
      </div>
    </>
  );
}
