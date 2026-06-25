import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaCrown,
  FaUsers,
  FaMicrochip,
  FaChartBar,
  FaUserCircle,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaBell,
} from "react-icons/fa";
import { MdDashboard, MdDevices } from "react-icons/md";
import { useTranslation } from "react-i18next";
import { LogoutAccount } from "../../api/authApi";

// --- config menu items ---
const MENU_ITEMS = [
  {
    key: "dashboard",
    icon: <MdDashboard size={18} />,
    path: "/frame-layout/dashboard-admin",
  },
  {
    key: "users",
    icon: <FaUsers size={16} />,
    path: "/frame-layout/manager-user",
  },
  {
    key: "devices",
    icon: <MdDevices size={18} />,
    path: "/frame-layout/",
  },
  {
    key: "notifications", // lịch sử thiết bị gửi thông báo lên
    icon: <FaBell size={16} />,
    path: "/frame-layout/admin-history",
  },
  {
    key: "profile",
    icon: <FaUserCircle size={16} />,
    path: "/frame-layout/profile",
  },
];

export function Sidebar({ collapsed, setCollapsed }) {
  // nhận collapsed
  const [_error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation("sidebar");

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
    <>
      {/* ===== SIDEBAR ===== */}

      <div
        style={{
          width: collapsed ? "35px" : "190px",
          minHeight: "100vh",
          background: "#0f172a",
          display: "flex",
          flexDirection: "column",
          transition: "width 0.35s ease",
          flexShrink: 0,
          position: "fixed", // để là fixed để luôn đưng yên và không chiếm layout làm cho content thay đổi bị đẩy xuống
          top: 0,
          left: 0,
        }}
      >
        {/* --- Logo + Toggle --- */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "space-between",
            padding: collapsed ? "18px 0" : "18px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          {!collapsed && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <FaMicrochip size={20} color="#38bdf8" />
              <span
                style={{
                  color: "#f1f5f9",
                  fontWeight: 700,
                  fontSize: "1rem",
                  letterSpacing: "0.5px",
                }}
              >
                DTECH
              </span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              background: "none",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              padding: 4,
              display: "flex",
              alignItems: "center",
            }}
          >
            {collapsed ? <FaBars size={16} /> : <FaTimes size={16} />}
          </button>
        </div>

        {/* --- Admin badge --- */}
        {!collapsed && (
          <div
            style={{
              margin: "12px 12px 4px",
              padding: "10px 12px",
              background: "rgba(251,191,36,0.1)",
              borderRadius: 8,
              border: "1px solid rgba(251,191,36,0.2)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <FaCrown size={14} color="#fbbf24" />
            <div>
              <p
                style={{
                  margin: 0,
                  color: "#fbbf24",
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  letterSpacing: "0.5px",
                }}
              >
                {t("administrator")}
              </p>
              <p
                style={{
                  margin: 0,
                  color: "#94a3b8",
                  fontSize: "0.7rem",
                }}
              >
                {t("full_access")}
              </p>
            </div>
          </div>
        )}

        {/* --- Menu --- */}
        <nav style={{ flex: 1, padding: "8px 0" }}>
          {MENU_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => navigate(item.path)}
              title={collapsed ? t(item.key) : ""}
              style={{
                width: "100%",
                background: isActive(item.path)
                  ? "rgba(56,189,248,0.12)"
                  : "none",
                border: "none",
                borderLeft: isActive(item.path)
                  ? "3px solid #38bdf8"
                  : "3px solid transparent",
                color: isActive(item.path) ? "#38bdf8" : "#94a3b8",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: collapsed ? "11px 0" : "11px 16px",
                justifyContent: collapsed ? "center" : "flex-start",
                cursor: "pointer",
                fontSize: "0.85rem",
                fontWeight: isActive(item.path) ? 600 : 400,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!isActive(item.path)) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                  e.currentTarget.style.color = "#e2e8f0";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive(item.path)) {
                  e.currentTarget.style.background = "none";
                  e.currentTarget.style.color = "#94a3b8";
                }
              }}
            >
              <span style={{ flexShrink: 0 }}>{item.icon}</span>
              <span
                style={{
                  opacity: collapsed ? 0 : 1,
                  width: collapsed ? 0 : "auto",
                  overflow: "hidden",
                  transition: "all 0.25s ease",
                  whiteSpace: "nowrap",
                }}
              >
                {t(item.key)}
              </span>
            </button>
          ))}
        </nav>

        {/* --- Logout --- */}
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.07)",
            padding: 8,
          }}
        >
          <button
            onClick={() => LogoutAction()}
            style={{
              width: "100%",
              background: "none",
              border: "none",
              color: "#f87171",
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: collapsed ? "10px 0" : "10px 12px",
              justifyContent: collapsed ? "center" : "flex-start",
              cursor: "pointer",
              fontSize: "0.85rem",
              borderRadius: 6,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(248,113,113,0.1)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            <FaSignOutAlt size={16} />
            {!collapsed && <span>{t("logout")}</span>}
          </button>
        </div>
      </div>
    </>
  );
}
