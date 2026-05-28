import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AdminUpdateDevice, GetDeviceById } from "../../api/admin/deviceApi";
import "../../css/admin/LockAccount.css";

export function EditDevice() {
  const [device, setDevice] = useState(null);
  const [name, setName] = useState("");
  const [status, setStatus] = useState(true);
  const [error, setError] = useState(""); // dùng chung cho cả validate và API error
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoadingDevice, setIsLoadingDevice] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);

  const navigate = useNavigate();
  const { id } = useParams();

  // Fetch device info
  useEffect(() => {
    const fetchDevice = async () => {
      try {
        setIsLoadingDevice(true);
        const response = await GetDeviceById(id);
        console.log("Device info:", response.data);
        if (response.data) {
          setDevice(response.data);
          setName(response.data.name);
          setStatus(response.data.status);
        } else {
          setError("Không tìm thấy thiết bị!");
        }
      } catch (err) {
        console.error("Error fetching device:", err);
        setError("Lỗi khi tải thông tin thiết bị!");
      } finally {
        setIsLoadingDevice(false);
      }
    };

    fetchDevice();
  }, [id]);

  // Validate
  const validate = () => {
    if (!name.trim()) {
      setError("Tên thiết bị không được để trống!");
      return false;
    }
    if (name.trim().length < 3) {
      setError("Tên thiết bị phải có ít nhất 3 ký tự!");
      return false;
    }
    return true;
  };

  // Submit -> hiện confirm modal
  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!validate()) return;

    setShowConfirm(true);
  };

  // Confirm update
  const handleConfirmUpdate = async () => {
    setShowConfirm(false);
    setLoading(true);
    setError("");

    try {
      const response = await AdminUpdateDevice(id, {
        name: name.trim(),
      });
      if (response.data) {
        setSuccess("Cập nhật thiết bị thành công!");
        setTimeout(() => {
          navigate("/frame-layout/manager-device");
        }, 1500);
      } else {
        setError("Cập nhật thất bại!");
      }
    } catch (err) {
      console.error("Update error:", err);
      setError(err?.response?.data?.message || "Cập nhật thất bại!");
    } finally {
      setLoading(false);
    }
  };

  // Loading
  if (isLoadingDevice) {
    return (
      <div className="lock-page">
        <div className="lock-container">
          <div className="lock-card">
            <div style={{ textAlign: "center", padding: "2rem" }}>
              <div className="lock-loading"></div>
              <p style={{ marginTop: "1rem", color: "var(--lock-muted)" }}>
                Đang tải thông tin thiết bị...
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
            <h1 className="lock-title">Chỉnh sửa thiết bị</h1>
            <p className="lock-subtitle">
              Cập nhật thông tin thiết bị IoT. Thay đổi sẽ được áp dụng ngay sau
              khi xác nhận.
            </p>
          </div>

          {error && <div className="lock-error">{error}</div>}
          {success && <div className="lock-success">{success}</div>}

          {/* Device info */}
          {device && (
            <div className="user-info-section">
              <div className="user-info-item">
                <span className="user-info-label">ID thiết bị</span>
                <span className="user-info-value">#{device.id}</span>
              </div>
              <div className="user-info-item">
                <span className="user-info-label">Trạng thái hiện tại</span>
                <span
                  className="user-info-value"
                  style={{
                    color: device.status ? "#16a34a" : "#dc2626",
                    fontWeight: 600,
                  }}
                >
                  {device.status ? "Hoạt động" : "Ngừng hoạt động"}
                </span>
              </div>
            </div>
          )}

          {/* Form */}
          {!success && (
            <form onSubmit={handleSubmit} className="lock-form">
              {/* Tên */}
              <div className="lock-form-group">
                <label htmlFor="deviceName" className="lock-form-label">
                  Tên thiết bị
                </label>
                <input
                  id="deviceName"
                  type="text"
                  className="lock-form-textarea"
                  style={{ height: "auto", padding: "0.8rem 1rem" }}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nhập tên thiết bị"
                  disabled={loading}
                />
              </div>

              {/* Trạng thái */}
              <div>
                <label className="lock-form-label">trạng thái:</label>

                <span
                  className={`ms-2 badge ${status ? "bg-success" : "bg-danger"}`}
                >
                  {status ? "còn hoạt động" : "không hoạt động"}
                </span>
              </div>

              {/* Buttons */}
              <div className="lock-button-group">
                <button
                  type="submit"
                  className="lock-btn lock-btn-danger"
                  disabled={loading}
                  style={{
                    background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                    boxShadow: "0 4px 14px rgba(59,130,246,0.35)",
                  }}
                >
                  {loading && <span className="lock-loading"></span>}
                  {!loading && "Lưu thay đổi"}
                </button>

                <button
                  type="button"
                  className="lock-btn lock-btn-cancel"
                  onClick={() => navigate("/frame-layout/manager-device")}
                  disabled={loading}
                >
                  Huỷ
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
            <div className="lock-modal-icon">✏️</div>
            <h2 className="lock-modal-title">Xác nhận cập nhật</h2>
            <p className="lock-modal-message">
              Bạn có chắc muốn lưu thay đổi cho thiết bị này không?
            </p>
            {device && <div className="lock-modal-username">{name}</div>}
            <div className="lock-modal-buttons">
              <button
                className="lock-modal-btn lock-modal-btn-confirm"
                onClick={handleConfirmUpdate}
              >
                Xác nhận
              </button>
              <button
                className="lock-modal-btn lock-modal-btn-cancel"
                onClick={() => setShowConfirm(false)}
              >
                Huỷ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
