import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { adminGetHistory } from "../../api/admin/notification";
import {
  FaBell,
  FaClock,
  FaExclamationTriangle,
  FaCheckCircle,
  FaInfoCircle,
  FaTimesCircle,
  FaSpinner,
} from "react-icons/fa";
import "../../css/NotificationHistory.css";
import { Pagination } from "../../components/common/Pagination";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

export function AdminGetHistory() {
  const { t } = useTranslation("admin_notification_history");
  const [pages, setPages] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 10;

  const [notifications, setNotifications] = useState([]);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const fetchNotifications = async (currentPage) => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminGetHistory(currentPage, PAGE_SIZE);
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

  return (
    <main className="admin-notification-history">
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
          <>
            <div style={{ maxHeight: "600px", overflowY: "auto" }}>
              {notifications.map((notification, index) => (
                <div
                  key={index}
                  className={`notification-item`}
                  style={{
                    borderLeft: `3px solid ${
                      notification.type === "success"
                        ? "#22c55e"
                        : notification.type === "warning"
                          ? "#fbbf24"
                          : notification.type === "error"
                            ? "#fb7185"
                            : "#38bdf8"
                    }`,
                  }}
                >
                  <div className="notification-content">
                    <div className="notification-header">
                      {/* <div>
                        <h3 className="notification-title">
                          {notification.title}
                        </h3>
                        <p className="notification-device">
                          🔧 {notification.deviceName || "Unknown Device"}
                        </p>
                      </div> */}
                    </div>
                    <p className="notification-message">
                      {notification.message}
                    </p>
                    <div className="notification-metadata">
                      <span>📍 {notification.type || "N/A"}</span>
                      <span>•</span>
                      <span>{notification.IsRead ? "Yes" : "No"}</span>
                    </div>
                  </div>
                  <div className="notification-time">
                    <div className="time-badge">
                      <FaClock size={11} style={{ marginRight: "4px" }} />
                      <span>
                        {dayjs(notification.createdAt).format(
                          "DD/MM/YYYY HH:mm:ss",
                        ) || "Pending"}
                      </span>
                    </div>
                    <button
                      className="ms-2 btn btn-success"
                      onClick={() =>
                        navigate(
                          `/frame-layout/history-detail/${notification.id}`,
                        )
                      }
                    >
                      detail
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        {/* Pagination — dùng lại ở bất kỳ đâu chỉ cần 3 props */}
        <Pagination
          page={pages}
          totalPages={totalPages}
          onPageChange={setPages}
        />
      </div>
    </main>
  );
}
