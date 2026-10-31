import { useTranslation } from "react-i18next";
import {
  FaBell,
  FaCheckCircle,
  FaFire,
  FaPlug,
  FaPowerOff,
  FaThermometerHalf,
  FaTimesCircle,
  FaTint,
} from "react-icons/fa";
import { useEffect, useMemo, useState } from "react";
import "../../css/user/Dashboard.css";
import { useDeviceSignalR } from "../../hooks/useDeviceSignalR";
import {
  ConnectDevice,
  DisconnectDevice,
  GetConnectedDevice,
} from "../../api/user/connectDevice";

export function DashboardUser({ mac }) {
  const { t } = useTranslation("user_dashboard");
  const [isConnect, setIsConnect] = useState(false);
  const [errorConnect, setErrorConnect] = useState("");
  const [errorDisconnect, setErrorDisconnect] = useState("");
  const [errorDevice, setErrorDevice] = useState("");
  const [isLoadingDevice, setIsLoadingDevice] = useState(true);
  const [device, setDevice] = useState(null); // object do BE đag trả về first chỉ 1 device liên kết với user hiện tại
  // const connection = useDeviceSignalR(mac);
  const testMac = "E098060E87C0"; // TẠM thời, thay bằng MAC thật của ESP đang có trong DB
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

  const groupedAlerts = useMemo(() => {
    const groups = [];
    alerts.forEach((alert) => {
      const last = groups[groups.length - 1];
      const shouldGroup =
        alert.type === "gas_danger" || alert.type === "heartbeat";
      if (
        shouldGroup &&
        last &&
        last.type === alert.type &&
        last.message === alert.message
      ) {
        last.count += 1;
        last.createdAt = alert.createdAt;
      } else {
        groups.push({ ...alert, count: 1 });
      }
    });
    return groups;
  }, [alerts]);

  const GetDeviceConnected = async () => {
    try {
      const response = await GetConnectedDevice();
      setDevice(response.data);
      setErrorDevice("");
    } catch (err) {
      console.error("Failed to load the connected device:", err);
      setDevice(null);
      setErrorDevice(t("connection.errors.loadDevice"));
    } finally {
      setIsLoadingDevice(false);
    }
  };

  const HandleConnectDevice = async (deviceId) => {
    setErrorConnect("");
    setErrorDisconnect("");
    try {
      await ConnectDevice(deviceId);
      setIsConnect(true);
    } catch (err) {
      console.error("Failed to connect to the device:", err);
      setErrorConnect(t("connection.errors.connect"));
    }
  };

  const HandleDisconnectDevice = async (deviceId) => {
    setErrorConnect("");
    setErrorDisconnect("");
    try {
      await DisconnectDevice(deviceId);
      setIsConnect(false);
    } catch (err) {
      console.error("Failed to disconnect from the device:", err);
      setErrorDisconnect(t("connection.errors.disconnect"));
    }
  };

  useEffect(() => {
    GetDeviceConnected();
  }, []);

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
      <div className="test-realtime user-glass-panel">
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
      </div>

      <section className="user-device-panel user-glass-panel">
        {/* xử lý connect */}
        <div className="user-connect-box">
          {isConnect ? (
            <>
              <FaCheckCircle />
              <span className="mb-2">{t("connection.status")}</span>
              <p>{t("connection.note")}</p>
            </>
          ) : (
            <>
              <FaTimesCircle className="disconnected" />
              <span className="mb-2">{t("connection.disconnected")}</span>
            </>
          )}
          {/* button connect / disconnect */}
          <div className="user-control-actions d-flex justify-content-center">
            <button
              type="button"
              className="user-action-btn connect"
              onClick={() => HandleConnectDevice(device.id)}
              disabled={!device}
            >
              <FaPlug />
              {t("connection.connect")}
            </button>
            <button
              type="button"
              className="user-action-btn disconnect"
              onClick={() => HandleDisconnectDevice(device.id)}
              disabled={!device}
            >
              <FaPowerOff />
              {t("connection.disconnect")}
            </button>
          </div>
          {errorDevice && (
            <p className="user-connect-message error" role="alert">
              {errorDevice}
            </p>
          )}
          {errorConnect && (
            <p className="user-connect-message error" role="alert">
              {errorConnect}
            </p>
          )}
          {errorDisconnect && (
            <p className="user-connect-message error" role="alert">
              {errorDisconnect}
            </p>
          )}
          {!isLoadingDevice && !device && !errorDevice && (
            <p className="user-connect-message" role="status">
              {t("connection.noDevice")}
            </p>
          )}
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
      </section>
    </main>
  );
}
