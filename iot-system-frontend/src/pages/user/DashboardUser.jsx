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
import "../../css/user/Dashboard.css";

export function DashboardUser() {
  const { t } = useTranslation("user_dashboard");

  return (
    <main className="user-dashboard">
      <div className="user-dashboard-top user-glass-panel">
        <div>
          <span className="user-live-status">
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

      <section className="user-device-panel user-glass-panel">
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
