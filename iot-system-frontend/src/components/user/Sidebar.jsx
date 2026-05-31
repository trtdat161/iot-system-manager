import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FaBars,
  FaBell,
  FaHeadset,
  FaMicrochip,
  FaSignOutAlt,
  FaTimes,
  FaUser,
} from "react-icons/fa";
import { MdDashboard } from "react-icons/md";
import { useTranslation } from "react-i18next";
import { LogoutAccount } from "../../api/authApi";
import "../../css/user/Layout.css";

const MENU_ITEMS = [
  {
    key: "dashboard",
    icon: <MdDashboard size={18} />,
    path: "/user-frame-layout/dashboard-user",
  },
  {
    key: "device_notifications",
    icon: <FaBell size={16} />,
    path: "/user-frame-layout/device-notifications",
  },
  {
    key: "help",
    icon: <FaHeadset size={16} />,
    path: "/user-frame-layout/help",
  },
  {
    key: "profile",
    icon: <FaUser size={16} />,
    path: "/user-frame-layout/profile",
  },
];

export function Sidebar({ collapsed, setCollapsed }) {
  const [_error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation("user_sidebar");

  const isActive = (path) => location.pathname === path;

  const LogoutAction = async () => {
    try {
      const response = await LogoutAccount();
      response.data ? navigate("/") : setError(t("logout_error"));
    } catch (err) {
      console.log("error:", err?.message || err);
      setError(t("logout_error"));
    }
  };

  return (
    <aside className={`user-sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="user-sidebar-brand">
        {!collapsed && (
          <div className="user-sidebar-logo">
            <FaMicrochip size={20} />
            <span>DTECH</span>
          </div>
        )}
        <button
          type="button"
          className="user-sidebar-toggle"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? t("expand") : t("collapse")}
        >
          {collapsed ? <FaBars size={16} /> : <FaTimes size={16} />}
        </button>
      </div>

      {!collapsed && (
        <div className="user-sidebar-badge">
          <FaUser size={14} />
          <div>
            <p>{t("user")}</p>
            <span>{t("device_access")}</span>
          </div>
        </div>
      )}

      <nav className="user-sidebar-nav">
        {MENU_ITEMS.map((item) => (
          <button
            type="button"
            key={item.key}
            className={`user-sidebar-link ${
              isActive(item.path) ? "active" : ""
            }`}
            onClick={() => navigate(item.path)}
            title={collapsed ? t(item.key) : ""}
          >
            <span className="user-sidebar-icon">{item.icon}</span>
            {!collapsed && <span>{t(item.key)}</span>}
          </button>
        ))}
      </nav>

      <div className="user-sidebar-footer">
        <button
          type="button"
          className="user-sidebar-logout"
          onClick={() => LogoutAction()}
        >
          <FaSignOutAlt size={16} />
          {!collapsed && <span>{t("logout")}</span>}
        </button>
      </div>
    </aside>
  );
}
