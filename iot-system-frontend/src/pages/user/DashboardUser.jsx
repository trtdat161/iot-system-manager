import { useTranslation } from "react-i18next";
import {
  FaBell,
  FaCheckCircle,
  FaFire,
  FaPlug,
  FaPowerOff,
  FaThermometerHalf,
  FaTint,
} from "react-icons/fa";
import { useEffect, useState } from "react";
import { UseDeviceSignalR } from "../../hooks/UseDeviceSignalR";
import "../../css/user/Dashboard.css";

export function DashboardUser({ mac }) {
  const { t } = useTranslation("user_dashboard");
  const connection = useDeviceSignalR(mac);

  // State riêng cho trạng thái hiện tại - luôn bị ghi đè bởi data mới nhất
  const [sensorData, setSensorData] = useState({
    gas: null,
    temperature: null,
    humidity: null,
    timestamp: null,
  });
  //State riêng cho danh sách cảnh báo - cộng dồn, không ghi đè
  const [alerts, setAlerts] = useState([]);
  useEffect(() => {
    if (!connection) return;

    connection.on("ReceiveSensorData", (data) => {
      setSensorData({
        gas: data.gas,
        temperature: data.temperature,
        humidity: data.humidity,
        timestamp: data.timestamp,
      });
    });

    connection.on("ReceiveAlert", (data) => {
      setAlerts((prev) => [data, ...prev].slice(0, 20)); // giữ tối đa 20 cảnh báo gần nhất, tránh phình state
    });

    // Cleanup bắt buộc, tránh đăng ký listener trùng khi effect chạy lại
    return () => {
      connection.off("ReceiveSensorData");
      connection.off("ReceiveAlert");
    };
  }, [connection]);

  const connectDevice = async () => {};

  return (
    <main className="user-dashboard">
      <div className="user-dashboard-top user-glass-panel">
        <div>
          <span className="user-live-status">
            {/* xử lý real-time */}
            <span className="user-live-dot"></span>
            {t("connection.status")}
          </span>
          <h1>{t("title")}</h1>
        </div>

        <div className="temperature">
          <FaThermometerHalf />
          <div>
            <span>{t("temperature.label")}</span>
            <strong>30.4C</strong>
          </div>
        </div>
      </div>
      {/* test realtime */}
      <div className="test-realtime">
        <h2>Trạng thái thiết bị {mac}</h2>

        <div className="sensor-grid">
          <div>🌡️ Nhiệt độ: {sensorData.temperature ?? "--"}°C</div>
          <div>💧 Độ ẩm: {sensorData.humidity ?? "--"}%</div>
          <div>💨 Gas (MQ2): {sensorData.gas ?? "--"}</div>
          <div>Cập nhật lúc: {sensorData.timestamp ?? "--"}</div>
        </div>

        <h3>Cảnh báo gần đây</h3>
        {alerts.map((a, idx) => (
          <div key={idx} style={{ color: "red" }}>
            [{a.type}] {a.message} — {a.createdAt}
          </div>
        ))}
      </div>

      <section className="user-device-panel user-glass-panel">
        {/* xử lý connect */}
        <div className="user-connect-box">
          <FaCheckCircle />
          <span>{t("connection.status")}</span>
          <p>{t("connection.note")}</p>

          <div className="user-control-actions">
            <button type="button" className="user-action-btn connect">
              <FaPlug />
              {t("connection.connect")}
            </button>
            <button type="button" className="user-action-btn disconnect">
              <FaPowerOff />
              {t("connection.disconnect")}
            </button>
          </div>
        </div>

        <div className="alert-sensor">
          <div className="user-sensor-item">
            <FaFire />
            <span>MQ-1</span>
            <strong>{t("sensors.gas_safe")}</strong>
            <small>42%</small>
          </div>
          <div className="user-sensor-item">
            <FaTint />
            <span>DHT11</span>
            <strong>{t("sensors.air_stable")}</strong>
            <small>58%</small>
          </div>
        </div>

        <button type="button" className="user-read-btn">
          {t("alert.confirm")}
        </button>
      </section>
    </main>
  );
}
