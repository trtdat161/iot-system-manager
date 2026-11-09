import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { UserGetHistory, UserIsRead } from "../../api/user/notification";
import {
  FaBell,
  FaClock,
  FaExclamationTriangle,
  FaInfoCircle,
  FaSearch,
  FaFilter,
  FaRedoAlt,
} from "react-icons/fa";
import "../../css/NotificationHistory.css";
import { Pagination } from "../../components/common/Pagination";
import dayjs from "dayjs";
import { useOutletContext } from "react-router-dom";
import { getDeviceAlertDetails } from "../../utils/deviceAlert";
import { SearchAndFilterHistory } from "../../api/common/searchHistory";
import { DateRangePicker } from "../../components/common/DateRangePicker";

export function DeviceNotificationHistory() {
  const outletContext = useOutletContext() || {};
  const onNotificationRead = outletContext.onNotificationRead;
  const { t, i18n } = useTranslation("user_notification_history");
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

  // data cho việc filter
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isRead, setIsRead] = useState("");
  const [type, setType] = useState("");
  const [activeFilters, setActiveFilters] = useState({
    fromDate: "",
    toDate: "",
    isRead: "",
    type: "",
  });

  const latestNotificationId =
    pages === 1
      ? notifications.reduce((latest, notification) => {
          const currentTime = new Date(
            notification.createdAt ??
              notification.CreatedAt ??
              notification.timestamp ??
              notification.Timestamp ??
              "",
          ).getTime();
          const latestTime = latest
            ? new Date(
                latest.createdAt ??
                  latest.CreatedAt ??
                  latest.timestamp ??
                  latest.Timestamp ??
                  "",
              ).getTime()
            : Number.NEGATIVE_INFINITY;

          return Number.isNaN(currentTime) || currentTime <= latestTime
            ? latest
            : notification;
        }, null)
      : null;
  const latestNotificationIdValue =
    latestNotificationId?.id ?? latestNotificationId?.Id;

  const fetchNotifications = useCallback(
    async (currentPage, filters) => {
      setLoading(true);
      setError(null);
      try {
        const hasFilters = Object.values(filters).some(Boolean);
        const response = hasFilters
          ? await SearchAndFilterHistory(
              currentPage,
              PAGE_SIZE,
              filters.fromDate,
              filters.toDate,
              filters.isRead,
              filters.type,
            )
          : await UserGetHistory(currentPage, PAGE_SIZE);
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
    },
    [t],
  );

  useEffect(() => {
    fetchNotifications(pages, activeFilters);
  }, [pages, activeFilters, fetchNotifications]);

  useEffect(() => {
    if (!markReadFeedback) return;

    const timeoutId = window.setTimeout(() => {
      setMarkReadFeedback(null);
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [markReadFeedback]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case "gas":
      case "gas_danger":
      case "temp_high":
      case "humid_low":
      case "humid_high":
      case "unknown":
        return <FaExclamationTriangle className="notification-icon warning" />;
      case "success":
        return <FaInfoCircle className="notification-icon info" />;
      case "warning":
        return <FaExclamationTriangle className="notification-icon warning" />;
      case "error":
        return <FaExclamationTriangle className="notification-icon warning" />;
      default:
        return <FaInfoCircle className="notification-icon info" />;
    }
  };

  const getAccentColor = (type) => {
    switch (type) {
      case "gas":
      case "gas_danger":
      case "temp_high":
      case "humid_low":
      case "humid_high":
      case "unknown":
        return "#fbbf24";
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

  const handleSearch = () => {
    setActiveFilters({ fromDate, toDate, isRead, type });
    setPages(1);
  };

  const handleReset = () => {
    setFromDate("");
    setToDate("");
    setIsRead("");
    setType("");
    setActiveFilters({ fromDate: "", toDate: "", isRead: "", type: "" });
    setPages(1);
  };

  return (
    <main className="user-notification-history">
      <div className="notification-search-filter-container mb-4">
        <div className="notification-search-filter-left">
          <FaFilter size={14} aria-hidden="true" />
          <span className="filter-label-text">{t("filter_time")}</span>
          <DateRangePicker
            fromDate={fromDate}
            toDate={toDate}
            onFromDateChange={setFromDate}
            onToDateChange={setToDate}
            locale={i18n.resolvedLanguage ?? i18n.language}
            t={t}
          />
        </div>

        <div className="notification-search-filter-right">
          <label className="filter-label-text" htmlFor="notification-read-filter">
            {t("filter_status")}
          </label>
          <select
            id="notification-read-filter"
            className="filter-select"
            value={isRead}
            onChange={(e) => setIsRead(e.target.value)}
            title={t("read_status")}
          >
            <option value="">{t("read_status")}</option>
            <option value="true">{t("read")}</option>
            <option value="false">{t("unread")}</option>
          </select>
          <label className="filter-label-text" htmlFor="notification-type-filter">
            {t("filter_type")}
          </label>
          <select
            id="notification-type-filter"
            className="filter-select"
            value={type}
            onChange={(e) => setType(e.target.value)}
            title={t("notification_type")}
          >
            <option value="">{t("notification_type")}</option>
            <option value="gas">{t("alerts.labels.gas")}</option>
            <option value="gas_danger">{t("alerts.labels.gas_danger")}</option>
            <option value="temp_high">{t("alerts.labels.temp_high")}</option>
            <option value="humid_low">{t("alerts.labels.humid_low")}</option>
            <option value="humid_high">{t("alerts.labels.humid_high")}</option>
          </select>
          <button
            type="button"
            className="btn btn-search"
            onClick={handleSearch}
            disabled={loading}
            title={t("search")}
            aria-label={t("search")}
          >
            <FaSearch size={13} />
          </button>
          <button
            type="button"
            className="btn btn-reset"
            onClick={handleReset}
            disabled={loading}
            title={t("reset")}
            aria-label={t("reset")}
          >
            <FaRedoAlt size={13} />
          </button>
        </div>
      </div>

      <div className="notification-glass-panel">
        {/* Header */}
        <div className="notification-history-header">
          <div>
            <h2>{t("title")}</h2>
          </div>
        </div>
        <div className="notification-history-stats mb-3">
          <div className="stat-badge">
            <FaBell size={14} />
            <span>
              {t("total")}:{" "}
              <span className="stat-value">{totalNotifications}</span>
            </span>
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
              <FaExclamationTriangle aria-hidden="true" />
            ) : (
              <FaInfoCircle aria-hidden="true" />
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
              const sentAt =
                notification.createdAt ??
                notification.CreatedAt ??
                notification.timestamp ??
                notification.Timestamp;
              const notificationId = notification.id ?? notification.Id;
              const alertDetails = getDeviceAlertDetails(
                notification.message ?? notification.Message,
                notification.type ?? notification.Type,
              );
              const alertCount =
                notification.alertCount ?? notification.AlertCount ?? 1;
              const type = alertDetails.kind;
              const isRead =
                notification.isRead === true ||
                notification.IsRead === true ||
                readIds.has(notificationId);
              const isLatest = notificationId === latestNotificationIdValue;
              const isToday =
                sentAt &&
                dayjs(sentAt).isValid() &&
                dayjs(sentAt).isSame(dayjs(), "day");

              return (
                <div
                  key={notificationId}
                  className={`notification-item notification-user-item ${
                    isToday ? "latest-notification" : ""
                  }`}
                  style={{
                    borderLeft: `4px solid ${
                      isToday ? "#fbbf24" : getAccentColor(type)
                    }`,
                  }}
                >
                  <div className="notification-item-icon">
                    {getNotificationIcon(type)}
                  </div>
                  <div className="notification-item-content">
                    <div className="notification-user-heading">
                      <p className="notification-item-title">
                        {t(`alerts.labels.${alertDetails.kind}`)}
                      </p>
                      {isLatest && (
                        <span className="notification-latest-badge">
                          {t("latest")}
                        </span>
                      )}
                    </div>
                    <span
                      className="notification-repeat-badge"
                      aria-label={t("alerts.repeated", { count: alertCount })}
                    >
                      <strong>{alertCount}</strong>
                      <span>{t("alerts.repeated", { count: alertCount })}</span>
                    </span>
                    <p className="notification-item-subtitle">
                      {notification.deviceName || "System"}
                    </p>
                    <p className="notification-item-message">
                      {alertDetails.value === null
                        ? t(`alerts.messages.${alertDetails.kind}`)
                        : t(`alerts.messages.${alertDetails.kind}`, {
                            value: alertDetails.value,
                          })}
                    </p>
                  </div>
                  <div className="notification-item-trailing">
                    <span className="notification-time-badge">
                      <FaClock aria-hidden="true" />
                      {sentAt && dayjs(sentAt).isValid()
                        ? dayjs(sentAt).format("DD/MM/YYYY HH:mm")
                        : t("pending")}
                    </span>
                    {isRead ? (
                      <span className="notification-read-status read">
                        {t("read")}
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="notification-mark-read-button"
                        onClick={() => markAsRead(notificationId)}
                        disabled={markingNotificationId !== null}
                      >
                        {markingNotificationId === notificationId
                          ? t("marking_read")
                          : t("mark_read")}
                      </button>
                    )}
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
