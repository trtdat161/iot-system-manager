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
import { useEffect, useMemo, useState } from "react";
import "../../css/user/Dashboard.css";
import { useDeviceSignalR } from "../../hooks/useDeviceSignalR";

export function DashboardUser({ mac }) {
  const { t } = useTranslation("user_dashboard");
  // const connection = useDeviceSignalR(mac);
  const testMac = "E098060E87C0"; // TẠM thời, thay bằng MAC thật của ESP em đang có trong DB
  const connection = useDeviceSignalR(testMac);

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

  const formatTime = (timestamp) => {
    if (!timestamp) return "--";
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return timestamp;
    return date.toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // const groupedAlerts = useMemo(() => {
  //   const groups = [];
  //   alerts.forEach((alert) => {
  //     const last = groups[groups.length - 1];
  //     const shouldGroup =
  //       alert.type === "gas_danger" || alert.type === "heartbeat";
  //     if (
  //       shouldGroup &&
  //       last &&
  //       last.type === alert.type &&
  //       last.message === alert.message
  //     ) {
  //       last.count += 1;
  //       last.createdAt = alert.createdAt;
  //     } else {
  //       groups.push({ ...alert, count: 1 });
  //     }
  //   });
  //   return groups;
  // }, [alerts]);

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
            <strong>{sensorData.temperature ?? "--"}°C</strong>
          </div>
        </div>
      </div>
      {/* test realtime */}
      {/* <div className="test-realtime user-glass-panel">
        <div className="sensor-grid">
          <div className="update-row">
            <span>Cập nhật lúc</span>
            <strong>{sensorData.timestamp ?? "--"}</strong>
          </div>
        </div>

        <div className="alerts-panel">
          <div className="alerts-header">
            <h3>Cảnh báo gần đây</h3>
            <span className="alerts-count">
              {alerts.length} mục · {groupedAlerts.length} nhóm
            </span>
          </div>
          <div className="alerts-list">
            {groupedAlerts.map((a, idx) => (
              <div key={idx} className="alert-item">
                <div className="alert-body">
                  <div className="alert-label">
                    <span className={`alert-type ${a.type}`}>[{a.type}]</span>
                    {a.count > 1 && (
                      <span className="alert-count-badge">x{a.count}</span>
                    )}
                  </div>
                  <div className="alert-message">{a.message}</div>
                </div>
                <span className="alert-time">{formatTime(a.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      </div> */}

      <section className="user-device-panel user-glass-panel">
        {/* xử lý connect */}
        <div className="user-connect-box">
          <FaCheckCircle />
          <span>{t("connection.status")}</span>
          <p>{t("connection.note")}</p>

          <div className="user-control-actions d-flex justify-content-center">
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
            <span>MQ-2</span>
            <strong>{t("sensors.gas_safe")}</strong>
            <small>{sensorData.gas ?? "--"}%</small>
          </div>
          <div className="user-sensor-item">
            <FaTint />
            <span>DHT11</span>
            <strong>{t("sensors.air_stable")}</strong>
            <small>{sensorData.humidity ?? "--"}%</small>
          </div>
        </div>

        <button type="button" className="user-read-btn">
          {t("alert.confirm")}
        </button>
      </section>
    </main>
  );
}
