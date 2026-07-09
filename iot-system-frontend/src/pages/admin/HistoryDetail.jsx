import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaBell, FaClock, FaUsers } from "react-icons/fa";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { HistoryDetailForAdmin } from "../../api/admin/notification";
import "../../css/admin/HistoryDetail.css";

export function HistoryDetail() {
  const [historyDetail, setHistoryDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { t } = useTranslation("admin_history_detail");

  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    const fetchHistoryDetail = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await HistoryDetailForAdmin(id);
        const foundHistoryDetail = response?.data;

        if (foundHistoryDetail) {
          setHistoryDetail(foundHistoryDetail);
        } else {
          setError(t("errors.not_found"));
        }
      } catch (err) {
        console.error("Error fetching history detail:", err);
        setError(t("errors.load_failed"));
      } finally {
        setLoading(false);
      }
    };

    fetchHistoryDetail();
  }, [id, t]);

  return (
    <main className="history-detail-page">
      <div className="history-detail-shell">
        <div className="history-detail-header">
          <div className="history-detail-title-group">
            <div className="history-detail-icon">
              <FaBell size={18} />
            </div>
            <div>
              <h2 className="history-detail-title">{t("title")}</h2>
              <p className="history-detail-subtitle">
                {t("subtitle")}
              </p>
            </div>
          </div>

          <button
            className="history-detail-back-btn"
            onClick={() => navigate(-1)}
          >
            <FaArrowLeft size={14} />
            {t("back")}
          </button>
        </div>

        {loading && (
          <div className="history-detail-loading">
            <div className="history-detail-loader" />
            <p>{t("loading")}</p>
          </div>
        )}

        {!loading && error && (
          <div className="history-detail-error">{error}</div>
        )}

        {!loading && historyDetail && (
          <section className="history-detail-card">
            <div className="history-detail-topbar">
              <span className="history-detail-badge">
                {historyDetail.type || t("notification")}
              </span>
              <span className="history-detail-time">
                <FaClock size={13} />
                {dayjs(historyDetail.createdAt).format("DD/MM/YYYY HH:mm:ss")}
              </span>
            </div>

            <p className="history-detail-message">{historyDetail.message}</p>

            <div className="history-detail-meta-grid">
              <div className="history-detail-meta-item">
                <span className="history-detail-meta-label">{t("status")}</span>
                <span
                  className={`history-detail-meta-value ${historyDetail.isRead ? "is-read" : "is-unread"}`}
                >
                  {historyDetail.isRead ? t("read") : t("unread")}
                </span>
              </div>
              <div className="history-detail-meta-item">
                <span className="history-detail-meta-label">
                  {t("recipients")}
                </span>
                <span className="history-detail-meta-value">
                  {historyDetail.users?.length || 0}
                </span>
              </div>
            </div>

            <div className="history-detail-users-block">
              <h3 className="history-detail-users-title">
                <FaUsers size={15} />
                {t("recipient_list")}
              </h3>

              {historyDetail.users?.length > 0 ? (
                <ul className="history-detail-users-list">
                  {historyDetail.users.map((user) => (
                    <li key={user.userId} className="history-detail-user-item">
                      <span className="history-detail-user-name">
                        {user.fullname}
                      </span>
                      <span
                        className={`history-detail-user-status ${user.isRead ? "read" : "unread"}`}
                      >
                        {user.isRead ? t("read") : t("unread")}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="history-detail-empty">
                  {t("empty_recipients")}
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
