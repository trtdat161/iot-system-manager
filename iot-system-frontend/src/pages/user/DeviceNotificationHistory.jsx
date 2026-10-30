import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { UserGetHistory, UserIsRead } from "../../api/user/notification";
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
import { useOutletContext } from "react-router-dom";

export function DeviceNotificationHistory() {
  const outletContext = useOutletContext() || {};
  const onNotificationRead = outletContext.onNotificationRead;
  const { t } = useTranslation("user_notification_history");
  const [pages, setPages] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 10;

  const [notifications, setNotifications] = useState([]);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [markReadFeedback, setMarkReadFeedback] = useState(null);
  const [markingNotificationId, setMarkingNotificationId] = useState(null);
  const [readIds, setReadIds] = useState(new Set());

  const fetchNotifications = async (currentPage) => {
    setLoading(true);
    setError(null);
    try {
      const response = await UserGetHistory(currentPage, PAGE_SIZE);
      const paged = response.data;
      const items = Array.isArray(paged.data) ? paged.data : [];
      setTotalNotifications(paged.totalItems ?? 0);
      setNotifications(items);
      setReadIds(
        new Set(
          items
            .filter(
              (notification) =>
                notification.isRead === true || notification.IsRead === true,
            )
            .map((notification) => notification.id ?? notification.Id)
            .filter((id) => id !== undefined && id !== null),
        ),
      );
      setTotalPages(paged.totalPages ?? 1);
    } catch (err) {
      console.error("Failed to load notification history:", err);
      setNotifications([]);
      setError(t("errors.load"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(pages);
  }, [pages]);

  useEffect(() => {
    if (!markReadFeedback) return;

    const timeoutId = window.setTimeout(() => {
      setMarkReadFeedback(null);
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [markReadFeedback]);

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
        return "#72f0ce";
    }
  };

  const markAsRead = async (notificationId) => {
    setMarkReadFeedback(null);
    setMarkingNotificationId(notificationId);
    try {
      await UserIsRead(notificationId);
      setMarkReadFeedback("success");
      setReadIds((prev) => new Set(prev).add(notificationId));
      onNotificationRead?.();
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
      setMarkReadFeedback("error");
    } finally {
      setMarkingNotificationId(null);
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

        {markReadFeedback && (
          <div
            className={`notification-action-feedback ${markReadFeedback}`}
            role={markReadFeedback === "error" ? "alert" : "status"}
            aria-live={markReadFeedback === "error" ? "assertive" : "polite"}
            aria-atomic="true"
          >
            {markReadFeedback === "error" ? (
              <FaTimesCircle aria-hidden="true" />
            ) : (
              <FaCheckCircle aria-hidden="true" />
            )}
            <span>
              {t(
                markReadFeedback === "error"
                  ? "mark_read_error"
                  : "mark_read_success",
              )}
            </span>
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
        {!loading && !error && notifications.length === 0 && (
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
              const notificationId = notification.id ?? notification.Id;
              const isRead =
                notification.isRead === true ||
                notification.IsRead === true ||
                readIds.has(notificationId);

              return (
                <div
                  key={notificationId}
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
                      <div className="notification-time d-flex flex-column align-items-end gap-2">
                        <div className="time-badge">
                          <FaClock size={11} style={{ marginRight: "4px" }} />
                          <span>
                            {sentAt
                              ? dayjs(sentAt).format("DD/MM/YYYY HH:mm:ss")
                              : "Pending"}
                          </span>
                        </div>
                        <span
                          className={`notification-read-status ${
                            isRead ? "read" : "unread"
                          }`}
                        >
                          {t(isRead ? "read" : "unread")}
                        </span>
                        <button
                          className={`btn btn-sm mt-2 ${
                            isRead
                              ? "btn-success"
                              : "btn-primary"
                          }`}
                          onClick={() => markAsRead(notificationId)}
                          disabled={
                            isRead || markingNotificationId !== null
                          }
                        >
                          {markingNotificationId === notificationId
                            ? t("marking_read")
                            : isRead
                              ? t("read")
                              : t("mark_read")}
                        </button>
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
