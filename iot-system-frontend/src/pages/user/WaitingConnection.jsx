import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaMicrochip, FaPlug } from "react-icons/fa";
import "../../css/user/Dashboard.css";

export function WaitingConnection() {
  const { t } = useTranslation("user_dashboard");

  // Mock data - tạm thời hashcode = html
  const [pendingDevices] = useState([
    {
      id: 1,
      name: "DTECH-02",
      model: "IoT Hub V2",
      macAddress: "00:1A:2B:3C:4D:5E",
      rssi: -65,
    },
    {
      id: 2,
      name: "DTECH-03",
      model: "Sensor Module",
      macAddress: "00:1A:2B:3C:4D:5F",
      rssi: -72,
    },
    {
      id: 3,
      name: "DTECH-04",
      model: "Temperature Sensor",
      macAddress: "00:1A:2B:3C:4D:60",
      rssi: -58,
    },
    {
      id: 4,
      name: "DTECH-05",
      model: "Humidity Sensor",
      macAddress: "00:1A:2B:3C:4D:61",
      rssi: -68,
    },
  ]);

  const handleConnect = (deviceId, deviceName) => {
    console.log(`Connecting to device: ${deviceName} (ID: ${deviceId})`);
    // TODO: Call connectDevice API
  };

  const signalStrength = (rssi) => {
    if (rssi > -50) return "Excellent";
    if (rssi > -60) return "Good";
    if (rssi > -70) return "Fair";
    return "Weak";
  };

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
        <div
          style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#38bdf8" }}
        >
          {pendingDevices.length}
        </div>
      </div>

      <section className="user-device-panel user-glass-panel">
        {pendingDevices.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 20px",
              color: "var(--user-muted)",
            }}
          >
            <FaMicrochip
              size={48}
              style={{ opacity: 0.5, marginBottom: "16px" }}
            />
            <p>{t("waiting_connection.no_devices")}</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "12px" }}>
            {pendingDevices.map((device) => (
              <div
                key={device.id}
                className="user-glass-panel"
                style={{
                  padding: "16px",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "8px",
                      background: "rgba(56, 189, 248, 0.2)",
                      border: "1px solid rgba(56, 189, 248, 0.4)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#38bdf8",
                    }}
                  >
                    <FaMicrochip size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: "600", marginBottom: "4px" }}>
                      {device.name}
                    </div>
                    <div
                      style={{
                        fontSize: "0.85rem",
                        color: "var(--user-muted)",
                        marginBottom: "4px",
                      }}
                    >
                      {t("waiting_connection.model")}: {device.model}
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--user-muted)",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {t("waiting_connection.mac_address")}: {device.macAddress}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                  }}
                >
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--user-muted)",
                        textTransform: "uppercase",
                        marginBottom: "4px",
                      }}
                    >
                      {t("waiting_connection.status")}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <span
                        style={{
                          display: "inline-block",
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: "#fbbf24",
                        }}
                      ></span>
                      <span style={{ fontWeight: "500" }}>
                        {signalStrength(device.rssi)}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: "0.7rem",
                        color: "var(--user-muted)",
                        marginTop: "4px",
                      }}
                    >
                      RSSI: {device.rssi} dBm
                    </div>
                  </div>

                  <button
                    type="button"
                    className="user-action-btn connect"
                    onClick={() => handleConnect(device.id, device.name)}
                    style={{
                      padding: "10px 16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      whiteSpace: "nowrap",
                    }}
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
