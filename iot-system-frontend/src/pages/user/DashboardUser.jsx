import { Link } from "react-router-dom";
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
import { UserGetHistory } from "../../api/user/notification";
import { getDeviceAlertDetails } from "../../utils/deviceAlert";

const NOTIFICATION_PAGE_SIZE = 100;
const ALERT_HISTORY_BATCH_SIZE = 5;

const isUnreadNotification = (notification) =>
  notification.isRead === false || notification.IsRead === false;

const getAlertField = (alert, lowerCaseKey, upperCaseKey) =>
  alert[lowerCaseKey] ?? alert[upperCaseKey];

const getAlertTimestamp = (alert) =>
  getAlertField(alert, "createdAt", "CreatedAt") ??
  getAlertField(alert, "timestamp", "Timestamp") ??
  "";

const getAlertCount = (alert) =>
  getAlertField(alert, "alertCount", "AlertCount") ?? 1;

const sameAlert = (left, right) => {
  const leftId = getAlertField(left, "id", "Id");
  const rightId = getAlertField(right, "id", "Id");

  if (leftId != null && rightId != null) {
    return leftId === rightId;
  }

  return (
    getAlertField(left, "type", "Type") ===
      getAlertField(right, "type", "Type") &&
    getAlertField(left, "message", "Message") ===
      getAlertField(right, "message", "Message") &&
    new Date(getAlertTimestamp(left)).getTime() ===
      new Date(getAlertTimestamp(right)).getTime()
  );
};

const mergeAlerts = (currentAlerts, incomingAlerts) => {
  const merged = [...currentAlerts];

  incomingAlerts.forEach((incomingAlert) => {
    const existingIndex = merged.findIndex((alert) =>
      sameAlert(alert, incomingAlert),
    );

    if (existingIndex === -1) {
      merged.push(incomingAlert);
    } else if (
      getAlertField(incomingAlert, "id", "Id") != null &&
      getAlertField(merged[existingIndex], "id", "Id") == null
    ) {
      merged[existingIndex] = incomingAlert;
    }
  });

  return merged;
};

export function DashboardUser() {
  const { t, i18n } = useTranslation("user_dashboard");
  const [isConnect, setIsConnect] = useState(false);
  const [isBusy, setIsBusy] = useState(false); // đang gọi API thì khóa cả 2 nút
  const [errorConnect, setErrorConnect] = useState("");
  const [errorDisconnect, setErrorDisconnect] = useState("");
  const [errorDevice, setErrorDevice] = useState("");
  const [isLoadingDevice, setIsLoadingDevice] = useState(true);
  const [device, setDevice] = useState(null); // thiết bị gần nhất của user (id, macAddress, isConnected)
  const [alertCounts, setAlertCounts] = useState({});

  // chỉ nghe realtime khi đang connected, disconnect thì hook tự dừng (nhờ "if (!mac) return;")
  useDeviceSignalR(isConnect ? device?.macAddress : null, {
    onSensorData: (data) => {
      setSensorData({
        gas: data.gas,
        temperature: data.temperature,
        humidity: data.humidity,
        timestamp: data.timestamp,
      });
      setAlertCounts(data.alertCounts ?? {});
    },

    onAlert: (data) => {
      setAlerts((prev) => mergeAlerts(prev, [data]));
    },
  });

  // State riêng cho trạng thái hiện tại - luôn bị ghi đè bởi data mới nhất
  const [sensorData, setSensorData] = useState({
    gas: null,
    temperature: null,
    humidity: null,
    timestamp: null,
  });
  // Keep unread alerts in sync with notification history across dashboard visits.
  const [alerts, setAlerts] = useState([]);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(true);
  const [errorAlerts, setErrorAlerts] = useState("");

  useEffect(() => {
    let isMounted = true;
    let isLoading = false;

    const loadUnreadAlerts = async () => {
      if (isLoading) return;
      isLoading = true;

      try {
        const firstResponse = await UserGetHistory(1, NOTIFICATION_PAGE_SIZE);
        const firstPage = firstResponse.data;
        const unreadAlerts = (
          Array.isArray(firstPage.data) ? firstPage.data : []
        ).filter(isUnreadNotification);
        const totalPages = firstPage.totalPages ?? 1;

        for (
          let firstPageNumber = 2;
          firstPageNumber <= totalPages;
          firstPageNumber += ALERT_HISTORY_BATCH_SIZE
        ) {
          const pageNumbers = Array.from(
            {
              length: Math.min(
                ALERT_HISTORY_BATCH_SIZE,
                totalPages - firstPageNumber + 1,
              ),
            },
            (_, index) => firstPageNumber + index,
          );
          const responses = await Promise.all(
            pageNumbers.map((pageNumber) =>
              UserGetHistory(pageNumber, NOTIFICATION_PAGE_SIZE),
            ),
          );

          responses.forEach((response) => {
            const items = Array.isArray(response.data.data)
              ? response.data.data
              : [];
            unreadAlerts.push(...items.filter(isUnreadNotification));
          });
        }

        if (isMounted) {
          setAlerts(unreadAlerts);
          setErrorAlerts("");
        }
      } catch (err) {
        console.error("Failed to load unread device alerts:", err);
        if (isMounted) {
          setErrorAlerts(t("alerts.load_error"));
        }
      } finally {
        isLoading = false;
        if (isMounted) {
          setIsLoadingAlerts(false);
        }
      }
    };

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        loadUnreadAlerts();
      }
    };

    loadUnreadAlerts();
    const intervalId = window.setInterval(loadUnreadAlerts, 30000);
    window.addEventListener("focus", loadUnreadAlerts);
    window.addEventListener("pageshow", loadUnreadAlerts);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", loadUnreadAlerts);
      window.removeEventListener("pageshow", loadUnreadAlerts);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [t]);

  const formatTime = (timestamp) => {
    if (!timestamp) return "--";
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return timestamp;
    return date.toLocaleString(i18n.language === "vi-VN" ? "vi-VN" : "en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const groupedAlerts = useMemo(() => {
    const groups = new Map();
    alerts.forEach((alert) => {
      const details = getDeviceAlertDetails(
        getAlertField(alert, "message", "Message"),
        getAlertField(alert, "type", "Type"),
      );
      const group = groups.get(details.kind);

      if (group) {
        group.count += getAlertCount(alert);
        if (
          new Date(getAlertTimestamp(alert)).getTime() >
          new Date(getAlertTimestamp(group.alert)).getTime()
        ) {
          group.alert = alert;
          group.details = details;
        }
      } else {
        groups.set(details.kind, {
          alert,
          details,
          count: getAlertCount(alert),
        });
      }
    });

    return Array.from(groups.values()).sort(
      (left, right) =>
        new Date(getAlertTimestamp(right.alert)).getTime() -
        new Date(getAlertTimestamp(left.alert)).getTime(),
    );
  }, [alerts]);

  const GetDeviceConnected = async () => {
    try {
      const response = await GetConnectedDevice();
      // BE trả thiết bị gần nhất của user kèm cờ isConnected; user chưa từng có thiết bị thì data rỗng (204)
      const lastDevice = response.data || null;
      setDevice(lastDevice);
      setIsConnect(lastDevice ? lastDevice.isConnected : false); // SỬA: dựa vào cờ isConnected, không dựa vào việc có device
      setErrorDevice("");
    } catch (err) {
      console.error("Failed to load the connected device:", err);
      setDevice(null);
      setIsConnect(false);
      setErrorDevice(t("connection.errors.loadDevice"));
    } finally {
      setIsLoadingDevice(false);
    }
  };

  const HandleConnectDevice = async (deviceId) => {
    setErrorConnect("");
    setErrorDisconnect("");
    setIsBusy(true);
    try {
      await ConnectDevice(deviceId);
      setIsConnect(true);
    } catch (err) {
      console.error("Failed to connect to the device:", err);
      setErrorConnect(t("connection.errors.connect"));
    } finally {
      setIsBusy(false);
    }
  };

  const HandleDisconnectDevice = async (deviceId) => {
    setErrorConnect("");
    setErrorDisconnect("");
    setIsBusy(true);
    try {
      await DisconnectDevice(deviceId);
      setIsConnect(false); // giữ nguyên device để nút Connect còn dùng được
      setAlertCounts({});
    } catch (err) {
      console.error("Failed to disconnect from the device:", err);
      setErrorDisconnect(t("connection.errors.disconnect"));
    } finally {
      setIsBusy(false);
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
            <div>
              <h3>{t("alerts.title")}</h3>
              <span className="alerts-count">
                {t("alerts.summary", {
                  count: alerts.length,
                  groups: groupedAlerts.length,
                })}
              </span>
            </div>
            {groupedAlerts.length > 0 && (
              <Link
                to="/user-frame-layout/device-notifications"
                className="alerts-history-button"
              >
                <FaBell aria-hidden="true" />
                {t("alerts.open_history")}
              </Link>
            )}
          </div>
          {errorAlerts && (
            <p className="alerts-error" role="alert">
              {errorAlerts}
            </p>
          )}
          <div className="alerts-list">
            {isLoadingAlerts && (
              <p className="alerts-empty" role="status">
                {t("alerts.loading")}
              </p>
            )}
            {!isLoadingAlerts && !errorAlerts && groupedAlerts.length === 0 && (
              <p className="alerts-empty">{t("alerts.empty")}</p>
            )}
            {groupedAlerts.map(({ alert, details, count }) => {
              const totalCount = Math.max(
                count,
                alertCounts[details.kind] ?? 0,
              );

              return (
                <div key={details.kind} className="alert-item">
                  <div className="alert-body">
                    <div className="alert-label">
                      <span className={`alert-type ${details.kind}`}>
                        {details.value === null
                          ? t(`alerts.labels.${details.kind}`)
                          : t(`alerts.messages.${details.kind}`, {
                              value: details.value,
                            })}
                      </span>
                      {totalCount > 1 && (
                        <span
                          className="alert-count-badge"
                          aria-label={t("alerts.repeated", {
                            count: totalCount,
                          })}
                        >
                          {totalCount}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="alert-time">
                    {formatTime(getAlertTimestamp(alert))}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <section className="user-device-panel user-glass-panel">
        {/* xử lý connect */}
        <div
          className={`user-connect-box ${isConnect ? "connected" : "disconnected"}`}
        >
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
              disabled={!device || isConnect || isBusy} // đã connected thì khóa
            >
              <FaPlug />
              {t("connection.connect")}
            </button>
            <button
              type="button"
              className="user-action-btn disconnect"
              onClick={() => HandleDisconnectDevice(device.id)}
              disabled={!device || !isConnect || isBusy} // chưa connected thì khóa
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
            <small>{sensorData.gas ?? "--"}</small>{" "}
            {/* bỏ dấu % vì đây là giá trị thô của cảm biến */}
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
