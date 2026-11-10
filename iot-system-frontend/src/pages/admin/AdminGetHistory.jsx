import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  adminGetHistory,
  SearchAndFilterHistory,
} from "../../api/admin/notification";
import {
  FaBell,
  FaClock,
  FaExclamationTriangle,
  FaSearch,
  FaRedoAlt,
} from "react-icons/fa";
import "../../css/NotificationHistory.css";
import { Pagination } from "../../components/common/Pagination";
import dayjs from "dayjs";
import { useNavigate, useOutletContext } from "react-router-dom";
import { getDeviceAlertDetails } from "../../utils/deviceAlert";
import { DateRangePicker } from "../../components/common/DateRangePicker";

export function AdminGetHistory() {
  const { t, i18n } = useTranslation("admin_notification_history");
  const { t: tAlert } = useTranslation("user_notification_history");
  const outletContext = useOutletContext() || {};
  const connection = outletContext.connection;
  const [pages, setPages] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 10;

  const [notifications, setNotifications] = useState([]);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // search - filter
  const [toDate, setToDate] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [type, setType] = useState("");
  const [activeFilters, setActiveFilters] = useState({
    fromDate: "",
    toDate: "",
    type: "",
  });

  const navigate = useNavigate();

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
              "",
              filters.type,
            )
          : await adminGetHistory(currentPage, PAGE_SIZE);
        const paged = response.data;
        setTotalNotifications(paged.totalItems ?? 0);
        setNotifications(Array.isArray(paged.data) ? paged.data : []);
        setTotalPages(paged.totalPages ?? 1);
      } catch (err) {
        console.error("Failed to load admin notification history:", err);
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
    if (!connection) return;

    const handleAdminAlert = (alert) => {
      const newNotifications = Number(alert?.newNotificationCount) || 0;
      if (newNotifications > 0) {
        fetchNotifications(pages, activeFilters);
        return;
      }

      const deviceId = alert?.deviceId ?? alert?.DeviceId;
      const alertType = alert?.type ?? alert?.Type;
      const alertCount = Number(alert?.alertCount ?? alert?.AlertCount) || 1;
      if (deviceId == null || !alertType) return;

      setNotifications((current) => {
        const matching = current.filter(
          (notification) =>
            (notification.deviceId ?? notification.DeviceId) === deviceId &&
            (notification.type ?? notification.Type) === alertType,
        );
        if (matching.length === 0) return current;

        const newestTime = Math.max(
          ...matching.map((notification) =>
            new Date(
              notification.createdAt ?? notification.CreatedAt ?? "",
            ).getTime(),
          ),
        );
        const newestIncident = matching.find(
          (notification) =>
            new Date(
              notification.createdAt ?? notification.CreatedAt ?? "",
            ).getTime() === newestTime,
        );
        const incidentTime =
          newestIncident?.createdAt ?? newestIncident?.CreatedAt;

        return current.map((notification) => {
          if (
            (notification.deviceId ?? notification.DeviceId) !== deviceId ||
            (notification.type ?? notification.Type) !== alertType ||
            (notification.createdAt ?? notification.CreatedAt) !== incidentTime
          ) {
            return notification;
          }

          return {
            ...notification,
            alertCount: Math.max(
              notification.alertCount ?? notification.AlertCount ?? 1,
              alertCount,
            ),
          };
        });
      });
    };

    connection.on("ReceiveAdminAlert", handleAdminAlert);
    return () => connection.off("ReceiveAdminAlert", handleAdminAlert);
  }, [connection, fetchNotifications, pages, activeFilters]);

  const handleSearch = () => {
    setActiveFilters({ fromDate, toDate, type });
    setPages(1);
  };

  const handleReload = () => {
    setFromDate("");
    setToDate("");
    setType("");
    setActiveFilters({ fromDate: "", toDate: "", type: "" });
    setPages(1);
  };

  return (
    <main className="admin-notification-history">
      {/* search & filter */}
      <div className="notification-search-filter-container mb-4">
        <div className="notification-search-filter-left">
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
          <select
            className="filter-select"
            value={type}
            onChange={(e) => setType(e.target.value)}
            title={t("notification_type")}
          >
            <option value="" className="text-center">
              {t("notification_type")}
            </option>
            <option value="gas">
              {tAlert("alerts.labels.gas")}
            </option>
            <option value="gas_danger">
              {tAlert("alerts.labels.gas_danger")}
            </option>
            <option value="temp_high">
              {tAlert("alerts.labels.temp_high")}
            </option>
            <option value="humid_low">
              {tAlert("alerts.labels.humid_low")}
            </option>
            <option value="humid_high">
              {tAlert("alerts.labels.humid_high")}
            </option>
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
            onClick={handleReload}
            disabled={loading}
            title={t("reset")}
            aria-label={t("reset")}
          >
            <FaRedoAlt size={13} />
          </button>
        </div>
      </div>

      <div className="notification-glass-panel">
        {/* Stats */}
        <div className="notification-history-header">
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
              const notificationId = notification.id ?? notification.Id;
              const type = notification.type ?? notification.Type;
              const alertDetails = getDeviceAlertDetails(
                notification.message ?? notification.Message,
                type,
              );
              const alertCount =
                notification.alertCount ?? notification.AlertCount ?? 1;
              const sentAt =
                notification.createdAt ?? notification.CreatedAt;
              const deviceId = notification.deviceId ?? notification.DeviceId;

              return (
                <div
                  key={notificationId}
                  className="notification-item notification-admin-item"
                  style={{
                    borderLeft: `4px solid ${
                      alertDetails.kind === "unknown" ? "#72f0ce" : "#fbbf24"
                    }`,
                  }}
                >
                  <div className="notification-item-icon">
                    <FaExclamationTriangle className="notification-icon warning" />
                  </div>
                  <div className="notification-item-content">
                    <p className="notification-item-title">
                      {tAlert(`alerts.labels.${alertDetails.kind}`)}
                    </p>
                    <span
                      className="notification-repeat-badge"
                      aria-label={tAlert("alerts.repeated", {
                        count: alertCount,
                      })}
                    >
                      <strong>{alertCount}</strong>
                      <span>{tAlert("alerts.repeated", { count: alertCount })}</span>
                    </span>
                    {deviceId != null && (
                      <p className="notification-item-subtitle">
                        {t("device_id", { id: deviceId })}
                      </p>
                    )}
                  </div>
                  <div className="notification-item-trailing">
                    <span className="notification-time-badge">
                      <FaClock aria-hidden="true" />
                      {sentAt && dayjs(sentAt).isValid()
                        ? dayjs(sentAt).format("DD/MM/YYYY HH:mm")
                        : t("pending")}
                    </span>
                    <button
                      type="button"
                      className="notification-detail-button"
                      onClick={() =>
                        navigate(
                          `/admin-frame-layout/history-detail/${notificationId}`,
                        )
                      }
                    >
                      {t("detail")}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
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
