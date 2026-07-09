import { Link, Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { useEffect, useState } from "react";
import { LanguageSwitcher } from "../switchLanguage/LanguageSwitch";
import { useTranslation } from "react-i18next";

// import icon
import { FaHome, FaBell, FaChevronRight } from "react-icons/fa";
import { AdminGetMe } from "../../api/admin/accountApi";

export function FrameLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [fullname, setFullname] = useState("");
  const location = useLocation();
  const { t } = useTranslation("frame_layout");

  // break cum
  const breadcrumbs = [
    { to: "/frame-layout/dashboard-admin", label: t("home") },
    { to: "/frame-layout/manager-user", label: t("user") },
    { to: "/frame-layout/manager-devices", label: t("devices") },
    { to: "/frame-layout/admin-history", label: t("notification") },
  ];

  const isActiveBreadcrumb = (crumb) => {
    if (crumb.to === "/frame-layout/manager-user") {
      return (
        location.pathname.startsWith(crumb.to) ||
        location.pathname.startsWith("/frame-layout/lock-account")
      );
    }

    return location.pathname === crumb.to;
  };

  const infoProfile = async () => {
    try {
      const response = await AdminGetMe();
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
                <div className="d-flex justify-content-between align-items-center gap-3 flex-wrap">
                  {/* left */}
                  <div className="d-flex align-items-center gap-3 flex-wrap">
                    <FaBell
                      style={{ color: "#f87171", width: 20, height: 20 }}
                      aria-label={t("notification")}
                    />
                    {/* break cum */}
                    <nav
                      aria-label="Breadcrumb"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 8,
                          background: "rgba(56,189,248,0.12)",
                          color: "#38bdf8",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "1px solid rgba(56,189,248,0.22)",
                        }}
                      >
                        <FaHome size={14} />
                      </span>
                      {breadcrumbs.map((crumb, index) => {
                        const isActive = isActiveBreadcrumb(crumb);

                        return (
                          <span
                            key={index}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            {index > 0 && (
                              <FaChevronRight
                                size={10}
                                style={{ color: "rgba(226,232,240,0.45)" }}
                              />
                            )}
                            <Link
                              to={crumb.to}
                              aria-current={isActive ? "page" : undefined}
                              style={{
                                color: isActive ? "#f8fafc" : "#94a3b8",
                                background: isActive
                                  ? "linear-gradient(135deg, rgba(56,189,248,0.28), rgba(14,165,233,0.16))"
                                  : "rgba(255,255,255,0.04)",
                                border: isActive
                                  ? "1px solid rgba(125,211,252,0.48)"
                                  : "1px solid rgba(148,163,184,0.16)",
                                borderRadius: 8,
                                padding: "6px 10px",
                                textDecoration: "none",
                                fontSize: "0.84rem",
                                fontWeight: isActive ? 700 : 500,
                                lineHeight: 1,
                                boxShadow: isActive
                                  ? "0 8px 18px rgba(14,165,233,0.16), inset 0 1px 0 rgba(255,255,255,0.16)"
                                  : "none",
                                transition:
                                  "background 0.18s ease, border-color 0.18s ease, color 0.18s ease",
                              }}
                            >
                              {crumb.label}
                            </Link>
                          </span>
                        );
                      })}
                    </nav>
                    {/* break cum */}
                  </div>
                  {/* right */}
                  <div className="d-flex align-items-center gap-3 flex-wrap">
                    <span>
                      {t("welcome_admin")} {fullname}
                    </span>
                    <img
                      src="/img/admin/admin.jpg"
                      alt={t("admin_avatar_alt")}
                      className="rounded-circle"
                      style={{
                        width: "40px",
                        height: "40px",
                        border: "2px solid #fff",
                      }}
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
