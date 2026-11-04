import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaMicrochip, FaPlug, FaSyncAlt } from "react-icons/fa";
import "../../css/user/WaitingConnection.css";
import {
  ClaimDevice,
  ConnectDevice, // MỚI
  DeviceDepending,
} from "../../api/user/connectDevice";

export function WaitingConnection() {
  const { t } = useTranslation("user_dashboard");
  const [errorConnect, setErrorConnect] = useState("");
  const [connectionSuccess, setConnectionSuccess] = useState("");
  const [errorFetch, setErrorFetch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Danh sách thiết bị ĐANG ONLINE do BE trả về (BE đã lọc, FE chỉ hiển thị)
  const [pendingDevices, setPendingDevices] = useState([]);

  const fetchDevices = async () => {
    setErrorFetch("");
    try {
      const response = await DeviceDepending();
      setPendingDevices(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Failed to load pending devices:", err);
      setPendingDevices([]);
      setErrorFetch(t("waiting_connection.errors.fetch"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchDevices();
    } finally {
      setIsRefreshing(false);
    }
  };

  // MỚI: nhận cả object device (không chỉ id) để biết máy đã claim hay chưa
  const handleConnect = async (device) => {
    setErrorConnect("");
    setConnectionSuccess("");
    try {
      if (device.isClaimed) {
        // Máy đã có chủ -> tham gia (chỉ đổi liên kết trong DB, không gửi lệnh cho ESP)
        await ConnectDevice(device.id);
      } else {
        // Máy chưa có chủ -> claim lần đầu (BE gửi lệnh "claimed" cho ESP)
        await ClaimDevice(device.id);
      }
      setConnectionSuccess(t("waiting_connection.connect_success"));
      await fetchDevices();
    } catch (err) {
      console.error("Failed to claim/connect the device:", err);

      // BE trả 404 khi claim thất bại (device offline hoặc đã bị claim)
      if (!device.isClaimed && err.response?.status === 404) {
        setErrorConnect(t("waiting_connection.errors.claim_failed"));
      } else {
        setErrorConnect(t("waiting_connection.errors.connect"));
      }

      // Làm mới danh sách để thiết bị offline biến mất ngay
      await fetchDevices();
    }
  };

  // Polling 5 giây: BE coi device offline sau 30 giây không có tin,
  // nên FE phải hỏi lại liên tục thì danh sách mới phản ánh đúng thực tế
  useEffect(() => {
    fetchDevices();
    const intervalId = setInterval(fetchDevices, 5000);

    // Cleanup bắt buộc: rời trang thì dừng polling, tránh gọi API vô hạn
    return () => clearInterval(intervalId);
  }, []);

  return (
    <main className="user-dashboard">
      <div className="user-dashboard-top user-glass-panel">
        <div>
          <span className="user-live-status">
            <span className="user-live-dot"></span>
            {t("waiting_connection.subtitle")}
          </span>
          <h1>{t("waiting_connection.title")}</h1>
        </div>
        <div className="waiting-header-actions">
          <button
            type="button"
            className="user-action-btn waiting-refresh-btn"
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
            aria-label={t("waiting_connection.refresh")}
          >
            <FaSyncAlt
              className={
                isRefreshing
                  ? "waiting-refresh-icon spinning"
                  : "waiting-refresh-icon"
              }
            />
            {isRefreshing
              ? t("waiting_connection.refreshing")
              : t("waiting_connection.refresh")}
          </button>
          <div className="waiting-device-count">{pendingDevices.length}</div>
        </div>
      </div>

      <section className="user-device-panel user-glass-panel">
        {connectionSuccess && (
          <p className="waiting-connection-alert success" role="status">
            {connectionSuccess}
          </p>
        )}
        {errorConnect && (
          <p className="waiting-connection-alert error" role="alert">
            {errorConnect}
          </p>
        )}
        {errorFetch ? (
          <p className="waiting-connection-alert error" role="alert">
            {errorFetch}
          </p>
        ) : isLoading ? (
          <p className="waiting-loading-message" role="status">
            {t("waiting_connection.loading")}
          </p>
        ) : pendingDevices.length === 0 ? (
          <div className="waiting-empty-state">
            <FaMicrochip size={48} className="waiting-empty-icon" />
            <p>{t("waiting_connection.no_devices")}</p>
          </div>
        ) : (
          <div className="waiting-devices-grid">
            {pendingDevices.map((device) => (
              <div
                key={device.id}
                className="user-glass-panel waiting-device-item"
              >
                <div className="waiting-device-info-left">
                  <div className="waiting-device-icon">
                    <FaMicrochip size={20} />
                  </div>
                  <div>
                    {/* BE hiện chưa trả name, có thì mới hiển thị */}
                    {device.name && (
                      <div className="waiting-device-name">{device.name}</div>
                    )}
                    <div className="waiting-device-meta-mac">
                      {t("waiting_connection.mac_address")}: {device.macAddress}
                    </div>
                  </div>
                </div>

                <div className="waiting-device-info-right">
                  <div className="waiting-device-status">
                    <div className="waiting-status-label">
                      {t("waiting_connection.status")}
                    </div>
                    <div className="waiting-signal-indicator">
                      <span className="waiting-signal-dot"></span>
                      <span className="waiting-signal-strength">
                        {t("waiting_connection.online", "Online")}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="user-action-btn connect waiting-connect-btn"
                    onClick={() => handleConnect(device)} // MỚI: truyền cả device
                  >
                    <FaPlug />
                    {/* MỚI: đã claim thì ghi "Tham gia", chưa claim thì giữ nút cũ */}
                    {device.isClaimed
                      ? t("waiting_connection.join_btn", "Tham gia")
                      : t("waiting_connection.connect_btn")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
