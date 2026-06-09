import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AdminLockAccount,
  AdminUnlockAccount,
  GetAccountById,
} from "../../api/admin/accountApi";
import "../../css/admin/LockAccount.css";
import { useTranslation } from "react-i18next";

export function LockAccount() {
  const { t } = useTranslation("admin_manager_user");

  const [user, setUser] = useState(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  const navigate = useNavigate();
  const { id } = useParams();

  // Fetch user info khi component mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoadingUser(true);
        const response = await GetAccountById(id);
        const foundUser = response.data;

        if (foundUser) {
          setUser(foundUser);
        } else {
          setError(t("user_not_found"));
        }
      } catch (err) {
        console.error("Error fetching user:", err);
        setError(t("load_user_failed"));
      } finally {
        setIsLoadingUser(false);
      }
    };

    fetchUser();
  }, [id, t]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  const handleConfirmLock = async () => {
    // khoá thật
    setShowConfirm(false);
    setLoading(true);
    setError("");

    try {
      const statusAccount = user.status; // biến check status để gọi api tương ứng

      if (statusAccount) {
        // nếu true thì gọi api khoá
        const response = await AdminLockAccount(id, reason);
        if (response.data) {
          setSuccess(t("lock_account_success"));
          setTimeout(() => {
            navigate("/frame-layout/manager-user");
          }, 1500);
        } else {
          setError(t("lock_account_failed"));
        }
      } else {
        // néu false thì gọi api mở
        const response = await AdminUnlockAccount(id);
        if (response.data) {
          setSuccess(t("unlock_account_success"));
          navigate("/frame-layout/manager-user");
        } else {
          setError(t("unlock_account_failed"));
        }
      }
    } catch (err) {
      console.error("Lock error:", err);
      setError(err.response?.data?.message || t("lock_account_failed"));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/frame-layout/manager-user");
  };

  if (isLoadingUser) {
    return (
      <div className="lock-page">
        <div className="lock-container">
          <div className="lock-card">
            <div style={{ textAlign: "center", padding: "2rem" }}>
              <div className="lock-loading"></div>
              <p style={{ marginTop: "1rem", color: "var(--lock-muted)" }}>
                {t("loading_user_information")}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lock-page">
      <div className="lock-container">
        <div className="lock-card">
          {/* Header */}
          <div className="lock-header">
            <h1 className="lock-title">
              {user?.status === true
                ? t("lock_account_title")
                : t("unlock_account_title")}
            </h1>
            <p className="lock-subtitle">
              {user?.status === true
                ? t("lock_account_subtitle")
                : t("unlock_account_subtitle")}
            </p>
          </div>

          {/* Error Message */}
          {error && <div className="lock-error mb-3">{error}</div>}

          {/* Success Message */}
          {success && <div className="lock-success mb-3">{success}</div>}

          {/* User Info Section */}
          {user && (
            <div className="user-info-section">
              <div className="user-info-item">
                <span className="user-info-label">{t("full_name")}</span>
                <span className="user-info-value">
                  {user.fullname || t("not_available")}
                </span>
              </div>
              <div className="user-info-item">
                <span className="user-info-label">{t("email")}</span>
                <span className="user-info-value">
                  {user.email || t("not_available")}
                </span>
              </div>
              <div className="user-info-item">
                <span className="user-info-label">{t("account_id")}</span>
                <span className="user-info-value">{user.id}</span>
              </div>
            </div>
          )}

          {/* Form */}
          {!success && (
            <form onSubmit={handleSubmit} className="lock-form">
              <div className="lock-form-group">
                <label htmlFor="reason" className="lock-form-label">
                  {t("reason_lock")}
                </label>
                <textarea
                  id="reason"
                  className="lock-form-textarea"
                  value={reason || user.note}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={
                    user.status === true
                      ? t("reason_lock_placeholder")
                      : t("reason_unlock_placeholder")
                  }
                  disabled={loading}
                />
              </div>
              {/* Buttons lock và unlock */}

              <div className="lock-button-group">
                {user.status === true ? (
                  <button
                    type="submit"
                    className="lock-btn lock-btn-danger"
                    disabled={loading}
                  >
                    {loading && <span className="lock-loading"></span>}
                    {!loading && t("lock")}
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="lock-btn lock-btn-success"
                    disabled={loading}
                  >
                    {loading && <span className="lock-loading"></span>}
                    {!loading && t("unlock")}
                  </button>
                )}

                <button
                  type="button"
                  className="lock-btn lock-btn-cancel"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  {t("cancel")}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="lock-modal-overlay">
          <div className="lock-modal-content">
            <div className="lock-modal-icon">🔒</div>
            <h2 className="lock-modal-title">
              {user.status === true
                ? t("confirm_lock_account")
                : t("confirm_unlock_account")}
            </h2>
            <p className="lock-modal-message">
              {user.status === true
                ? t("confirm_lock_message")
                : t("confirm_unlock_message")}
            </p>
            {user && (
              <div className="lock-modal-username">
                {user.username || user.email}
              </div>
            )}
            <div className="lock-modal-buttons">
              <button
                className="lock-modal-btn lock-modal-btn-confirm"
                onClick={handleConfirmLock}
              >
                {user.status === true ? t("yes_lock") : t("yes_unlock")}
              </button>
              <button
                className="lock-modal-btn lock-modal-btn-cancel"
                onClick={() => setShowConfirm(false)}
              >
                {t("cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
