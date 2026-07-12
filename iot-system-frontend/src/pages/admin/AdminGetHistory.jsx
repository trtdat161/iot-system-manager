import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  adminGetHistory,
  SearchAndFilterHistory,
} from "../../api/admin/notification";
import {
  FaBell,
  FaClock,
  FaExclamationTriangle,
  FaCheckCircle,
  FaInfoCircle,
  FaTimesCircle,
  FaSpinner,
  FaSearch,
  FaFilter,
  FaRedoAlt,
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

  // search - filter
  const [toDate, setToDate] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [read, setRead] = useState("");
  const [type, setType] = useState("");

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

  const handleSearch = async () => {
    try {
      const response = await SearchAndFilterHistory(
        pages, // page
        PAGE_SIZE, // pageSize
        fromDate,
        toDate,
        read,
        type,
      );
      const paged = response.data;
      setNotifications(Array.isArray(paged.data) ? paged.data : []);
      setTotalPages(paged.totalPages ?? 1);
      setTotalNotifications(paged.totalItems ?? 0);
    } catch (err) {
      console.log("error:", err?.message || err);
    }
  };

  const handleReload = () => {
    setFromDate("");
    setToDate("");
    setRead("");
    setType("");
    pages === 1 ? fetchNotifications(1) : setPages(1);
  };

  return (
    <main className="admin-notification-history">
      {/* search & filter */}
      <div className="notification-search-filter-container mb-4">
        <div className="notification-search-filter-left">
          <span className="filter-label-text">{t("filter_time")}</span>
          <div className="notification-date-group">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="notification-date-input"
              title={t("date_range")}
            />
            <span className="notification-date-separator">─</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="notification-date-input"
              title={t("date_range")}
            />
          </div>
        </div>

        <div className="notification-search-filter-right">
          <span className="filter-label-text">{t("filter_status")}</span>
          <select
            className="filter-select"
            value={read}
            onChange={(e) => setRead(e.target.value)}
            title={t("read_status")}
          >
            <option value="" className="text-center">
              {t("read_status")}
            </option>
            <option value="true" className="text-center">
              ✓ {t("read")}
            </option>
            <option value="false" className="text-center">
              ✗ {t("unread")}
            </option>
          </select>
          <select
            className="filter-select"
            value={type}
            onChange={(e) => setType(e.target.value)}
            title={t("notification_type")}
          >
            <option value="" className="text-center">
              {t("notification_type")}
            </option>
            <option value="gas" className="text-center">
              💨 {t("gas")}
            </option>
            <option value="heartbeat" className="text-center">
              💧 {t("humidity")}
            </option>
          </select>
          <button
            className="btn btn-search"
            onClick={() => handleSearch()}
            title={t("search")}
          >
            <FaSearch size={13} />
          </button>
          <button
            className="btn btn-reset"
            onClick={handleReload}
            title={t("reset")}
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
                      <span>{notification.IsRead ? t("yes") : t("no")}</span>
                    </div>
                  </div>
                  <div className="notification-time">
                    <div className="time-badge">
                      <FaClock size={11} style={{ marginRight: "4px" }} />
                      <span>
                        {dayjs(notification.createdAt).format(
                          "DD/MM/YYYY HH:mm:ss",
                        ) || t("pending")}
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
                      {t("detail")}
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
