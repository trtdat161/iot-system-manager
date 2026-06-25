import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaMicrochip, FaPlug } from "react-icons/fa";
import "../../css/user/WaitingConnection.css";
import { ConnectDevice, DeviceDepending } from "../../api/user/connectDevice";

export function WaitingConnection() {
  const { t } = useTranslation("user_dashboard");
  const [errorConnect, setErrorConnect] = useState("");

  // Mock data - tạm thời hashcode = html
  const [pendingDevices, setPendingDevices] = useState([]);

  const fetchDevices = async () => {
    try {
      const response = await DeviceDepending();
      setPendingDevices(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.log("error: " + err?.message ?? err);
      setPendingDevices([]);
    }
  };

  // connect device
  const handleConnect = async (deviceId, deviceName) => {
    try {
      const response = await ConnectDevice(deviceId);
      if (response.data) {
        console.log(`Connecting to device: ${response.data})`);
      } else {
        console.log(`lỗi khi in thông tin response`);
      }
      fetchDevices();
    } catch (err) {
      console.log("error: " + err?.message ?? err);
      setErrorConnect("lỗi khi kết nối với thiết bị");
    }
  };

  const signalStrength = (rssi) => {
    if (rssi > -50) return "Excellent";
    if (rssi > -60) return "Good";
    if (rssi > -70) return "Fair";
    return "Weak";
  };

  useEffect(() => {
    fetchDevices();
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
        <div className="waiting-device-count">{pendingDevices.length}</div>
      </div>

      <section className="user-device-panel user-glass-panel">
        {pendingDevices.length === 0 ? (
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
                    <div className="waiting-device-name">{device.name}</div>
                    <div className="waiting-device-meta">
                      {t("waiting_connection.model")}: {device.model}
                    </div>
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
                        {signalStrength(device.rssi)}
                      </span>
                    </div>
                    <div className="waiting-rssi">RSSI: {device.rssi} dBm</div>
                  </div>

                  <button
                    type="button"
                    className="user-action-btn connect waiting-connect-btn"
                    onClick={() => handleConnect(device.id, device.name)}
                  >
                    <FaPlug />
                    {t("waiting_connection.connect_btn")}
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
