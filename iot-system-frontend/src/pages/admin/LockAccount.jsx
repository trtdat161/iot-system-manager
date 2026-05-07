import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AdminLockAccount, GetAccounts } from "../../api/accountApi";
import "../../css/admin/LockAccount.css";

export function LockAccount() {
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
        const response = await GetAccounts();
        const foundUser = response.data.find((acc) => acc.id === parseInt(id)); // get list ra rồi so sánh với id thay vì viết thêm find by id

        if (foundUser) {
          setUser(foundUser);
        } else {
          setError("User not found!");
        }
      } catch (err) {
        console.error("Error fetching user:", err);
        setError("Failed to load user information!");
      } finally {
        setIsLoadingUser(false);
      }
    };

    fetchUser();
  }, [id]);

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
      const response = await AdminLockAccount(id, reason);

      if (response.data) {
        setSuccess("Account locked successfully!");
        setTimeout(() => {
          navigate("/manager-user");
        }, 1500);
      } else {
        setError("Failed to lock account!");
      }
    } catch (err) {
      console.error("Lock error:", err);
      setError(err.response?.data?.message || "Failed to lock account!");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/manager-user");
  };

  if (isLoadingUser) {
    return (
      <div className="lock-page">
        <div className="lock-container">
          <div className="lock-card">
            <div style={{ textAlign: "center", padding: "2rem" }}>
              <div className="lock-loading"></div>
              <p style={{ marginTop: "1rem", color: "var(--lock-muted)" }}>
                Loading user information...
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
            <h1 className="lock-title">Lock Account</h1>
            <p className="lock-subtitle">
              This action will permanently lock the user account. They will not
              be able to login.
            </p>
          </div>

          {/* Error Message */}
          {error && <div className="lock-error">{error}</div>}

          {/* Success Message */}
          {success && <div className="lock-success">{success}</div>}

          {/* User Info Section */}
          {user && (
            <div className="user-info-section">
              <div className="user-info-item">
                <span className="user-info-label">Full Name</span>
                <span className="user-info-value">
                  {user.fullname || "N/A"}
                </span>
              </div>
              <div className="user-info-item">
                <span className="user-info-label">Email</span>
                <span className="user-info-value">{user.email || "N/A"}</span>
              </div>
              <div className="user-info-item">
                <span className="user-info-label">Account ID</span>
                <span className="user-info-value">{user.id}</span>
              </div>
            </div>
          )}

          {/* Form */}
          {!success && (
            <form onSubmit={handleSubmit} className="lock-form">
              <div className="lock-form-group">
                <label htmlFor="reason" className="lock-form-label">
                  Reason for Locking
                </label>
                <textarea
                  id="reason"
                  className="lock-form-textarea"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter the reason for locking this account (optional)"
                  disabled={loading}
                />
              </div>

              {/* Buttons */}
              <div className="lock-button-group">
                <button
                  type="submit"
                  className="lock-btn lock-btn-danger"
                  disabled={loading}
                >
                  {loading && <span className="lock-loading"></span>}
                  {!loading && "Lock Account"}
                </button>
                <button
                  type="button"
                  className="lock-btn lock-btn-cancel"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancel
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
            <h2 className="lock-modal-title">Confirm Lock Account</h2>
            <p className="lock-modal-message">
              Are you sure you want to lock this account? This action cannot be
              easily reversed.
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
                Yes, Lock It
              </button>
              <button
                className="lock-modal-btn lock-modal-btn-cancel"
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
