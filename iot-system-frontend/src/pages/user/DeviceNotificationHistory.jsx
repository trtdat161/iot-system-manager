import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { UserGetHistory } from "../../api/user/notification";
import {
  FaBell,
  FaClock,
  FaExclamationTriangle,
  FaCheckCircle,
  FaInfoCircle,
  FaTimesCircle,
} from "react-icons/fa";
import "../../css/NotificationHistory.css";
import { Pagination } from "../../components/common/Pagination";
import dayjs from "dayjs";

export function DeviceNotificationHistory() {
  const { t } = useTranslation("user_notification_history");
  const [pages, setPages] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 10;

  const [notifications, setNotifications] = useState([]);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotifications = async (currentPage) => {
    setLoading(true);
    setError(null);
    try {
      const response = await UserGetHistory(currentPage, PAGE_SIZE);
      const paged = response.data;
      setTotalNotifications(paged.totalItems ?? 0);
      setNotifications(Array.isArray(paged.data) ? paged.data : []);
      setTotalPages(paged.totalPages ?? 1);
    } catch (err) {
      console.log("error:", err?.message || err);
      setNotifications([]);
      setError(err?.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(pages);
  }, [pages]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case "success":
        return <FaCheckCircle className="notification-icon success" />;
      case "warning":
        return <FaExclamationTriangle className="notification-icon warning" />;
      case "error":
        return <FaTimesCircle className="notification-icon danger" />;
      default:
        return <FaInfoCircle className="notification-icon info" />;
    }
  };

  const getAccentColor = (type) => {
    switch (type) {
      case "success":
        return "#22c55e";
      case "warning":
        return "#fbbf24";
      case "error":
        return "#fb7185";
      default:
        return "#38bdf8";
    }
  };

  return (
    <main className="user-notification-history">
      <div className="notification-glass-panel">
        {/* Header */}
        <div className="notification-history-header">
          <div>
            <h2>{t("title")}</h2>
          </div>
          <div className="notification-history-stats">
            <div className="stat-badge">
              <FaBell size={14} />
              <span>
                {t("total")}:{" "}
                <span className="stat-value">{totalNotifications}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              padding: "12px",
              marginBottom: "16px",
              background: "rgba(251, 113, 133, 0.15)",
              border: "1px solid rgba(251, 113, 133, 0.3)",
              borderRadius: "6px",
              color: "#fb7185",
              fontSize: "13px",
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="notification-loading">
            <div className="notification-loader"></div>
            <p className="notification-loading-text">{t("loading")}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && notifications.length === 0 && (
          <div className="notification-empty-state">
            <div className="notification-empty-icon">
              <FaBell size={48} />
            </div>
            <p className="notification-empty-text">{t("empty")}</p>
            <p className="notification-empty-subtext">{t("empty_desc")}</p>
          </div>
        )}

        {/* Notification List */}
        {!loading && notifications.length > 0 && (
          <div className="notification-list">
            {notifications.map((notification) => {
              const type = notification.type || "info";
              const sentAt = notification.timestamp || notification.createdAt;

              return (
                <div
                  key={notification.id}
                  className="notification-item"
                  style={{ borderLeft: `4px solid ${getAccentColor(type)}` }}
                >
                  <div className="notification-item-icon">
                    {getNotificationIcon(type)}
                  </div>
                  <div className="notification-item-content">
                    <div className="notification-item-header">
                      <div>
                        <p className="notification-item-title">
                          {notification.title || t("title")}
                        </p>
                        <p className="notification-item-subtitle">
                          {notification.deviceName || "System"}
                        </p>
                      </div>
                      <div className="notification-time">
                        <div className="time-badge">
                          <FaClock size={11} style={{ marginRight: "4px" }} />
                          <span>
                            {sentAt
                              ? dayjs(sentAt).format("DD/MM/YYYY HH:mm:ss")
                              : "Pending"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="notification-item-message">
                      {notification.message}
                    </p>
                    <div className="notification-metadata">
                      <span className="notification-type-chip">{type}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        <Pagination
          page={pages}
          totalPages={totalPages}
          onPageChange={setPages}
        />
      </div>
    </main>
  );
}
