import { Link, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  FaBell,
  FaChevronRight,
  FaHeadset,
  FaHome,
  FaMicrochip,
  FaUserCircle,
} from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "../switchLanguage/LanguageSwitch";
import { Sidebar } from "./Sidebar";
import { UserGetMe } from "../../api/user/accountApi";

export function FrameLayoutUser() {
  const [collapsed, setCollapsed] = useState(false);
  const [fullname, setFullname] = useState("");
  const location = useLocation();
  const { t } = useTranslation("user_frame_layout");

  const breadcrumbs = [
    {
      to: "/user-frame-layout/dashboard-user",
      label: t("home"),
      icon: <FaHome size={14} />,
    },
    { to: "/user-frame-layout/device-notifications", label: t("notification") },
    {
      to: "/user-frame-layout/help",
      label: t("help"),
      icon: <FaHeadset size={13} />,
    },
    {
      to: "/user-frame-layout/waiting-connection",
      label: t("waiting_connection"),
      icon: <FaMicrochip size={13} />,
    },
  ];

  const isActiveBreadcrumb = (crumb) => location.pathname === crumb.to;

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

  useEffect(() => {
    const syncSidebarWithViewport = () => {
      if (window.innerWidth <= 767) {
        setCollapsed(true);
      }
    };

    syncSidebarWithViewport();
    window.addEventListener("resize", syncSidebarWithViewport);

    return () => window.removeEventListener("resize", syncSidebarWithViewport);
  }, [setCollapsed]);

  const styleFrame = {
    marginLeft: collapsed ? "7px" : "162px",
    transition: "margin-left 0.32s cubic-bezier(0.22, 1, 0.36, 1)",
    padding: "20px",
  };

  return (
    <>
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      <div
        className={`user-frame ${collapsed ? "collapsed" : ""}`}
        style={styleFrame}
      >
        <div className="container-fluid mb-3">
          <div className="row">
            <div className="col-md-12">
              <header className="user-frame-header bg-dark text-white rounded p-2">
                <div className="d-flex justify-content-between align-items-center user-frame-header-inner">
                  <div className="d-flex align-items-center gap-3 user-frame-left">
                    <FaBell
                      className="user-frame-notice-icon"
                      aria-label={t("notification")}
                    />

                    <nav
                      className="user-frame-breadcrumb"
                      aria-label="Breadcrumb"
                    >
                      <span className="user-frame-home-icon">
                        <FaHome size={14} />
                      </span>
                      {breadcrumbs.map((crumb, index) => {
                        const isActive = isActiveBreadcrumb(crumb);

                        return (
                          <span className="user-frame-crumb" key={crumb.to}>
                            {index > 0 && (
                              <FaChevronRight
                                size={10}
                                className="user-frame-crumb-separator"
                              />
                            )}
                            <Link
                              to={crumb.to}
                              className={`user-frame-crumb-link ${
                                isActive ? "active" : ""
                              }`}
                              aria-current={isActive ? "page" : undefined}
                            >
                              {crumb.icon}
                              {crumb.label}
                            </Link>
                          </span>
                        );
                      })}
                    </nav>
                  </div>

                  <div className="d-flex align-items-center gap-3 user-frame-right">
                    <span>
                      {t("welcome_user")} {fullname}
                    </span>
                    <div
                      className="user-avatar"
                      aria-label={t("user_avatar_alt")}
                    >
                      <FaUserCircle />
                    </div>
                    <LanguageSwitcher />
                  </div>
                </div>
              </header>
            </div>
          </div>
        </div>

        <div className="container-fluid">
          <div className="row">
            <div className="col-md-12">
              <div className="user-frame-content">
                <Outlet />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
