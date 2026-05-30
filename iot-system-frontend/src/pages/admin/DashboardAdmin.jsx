import {
  FaBolt,
  FaCloudSun,
  FaMicrochip,
  FaServer,
  FaShieldAlt,
  FaUserCheck,
  FaUserLock,
  FaUsers,
} from "react-icons/fa";
import "../../css/admin/Dashboard.css";
import { DashboardSummary, Weather } from "../../api/admin/dashboardApi";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const deviceBars = [
  { day: "monday", value: 44 },
  { day: "tuesday", value: 62 },
  { day: "wednesday", value: 54 },
  { day: "thursday", value: 78 },
  { day: "friday", value: 68 },
  { day: "saturday", value: 88 },
  { day: "sunday", value: 74 },
];

export function DashboardAdmin() {
  const { t } = useTranslation("admin_dashboard");
  const [healthData, setHealthData] = useState("");
  const [dataOverview, setDataOverview] = useState(null);
  const [weatherData, setWeatherData] = useState(null);

  const summaryCards = dataOverview
    ? [
        {
          label: t("summary.active_users"),
          value: dataOverview.userActive ?? 0,
          note: t("summary.active_users_note"),
          icon: <FaUserCheck />,
          tone: "success",
        },
        {
          label: t("summary.locked_users"),
          value: dataOverview.userLock ?? 0,
          note: t("summary.locked_users_note"),
          icon: <FaUserLock />,
          tone: "warning",
        },
        {
          label: t("summary.online_devices"),
          value: dataOverview.deviceOnline ?? 0,
          note: t("summary.online_devices_note"),
          icon: <FaMicrochip />,
          tone: "cyan",
        },
        {
          label: t("summary.offline_devices"),
          value: dataOverview.deviceOffline ?? 0,
          note: t("summary.offline_devices_note"),
          icon: <FaServer />,
          tone: "danger",
        },
      ]
    : [];

  useEffect(() => {
    // data overview
    const fetchSummary = async () => {
      try {
        const response = await DashboardSummary();
        setHealthData(response.data ? "Stable" : "Unstable");
        setDataOverview(response.data);
      } catch (err) {
        console.error("Loi khi goi API dashboard:", err.message);
      }
    };

    // weather
    const fetchWeather = async () => {
      try {
        const response = await Weather();
        setWeatherData(response);
        console.log("Weather API response:", response);
      } catch (err) {
        console.error("Loi khi goi API thoi tiet:", err.message);
      }
    };

    // call functions
    fetchSummary();
    fetchWeather();
  }, []);

  if (!dataOverview)
    return (
      <p>
        {t("errors.unavailable")} <br />
        {t("errors.cannot_access")}
      </p>
    );

  return (
    <main className="admin-dashboard">
      <section className="dashboard-hero glass-panel">
        <div>
          <div className="dashboard-kicker">
            <span className="live-dot"></span>
            {/* Live overview */}
            <strong className="fs-6">
              <FaUsers size={19} />{" "}
              {t("total_users", { count: dataOverview.accountTotal || 0 })}
            </strong>
          </div>
          <h1>{t("title")}</h1>
          <p>{t("subtitle")}</p>
        </div>

        <div className="weather-card">
          <FaCloudSun />
          <div>
            <span>{t("weather")}</span>
            {weatherData ? (
              <>
                <strong>{weatherData.main.temp.toFixed(1)}°C</strong>
                <small>
                  {weatherData.name} - {weatherData.weather[0].description}
                </small>
              </>
            ) : (
              <>
                <strong>--°C</strong>
                <small>{t("loading")}</small>
              </>
            )}
          </div>
        </div>
      </section>

      {/* <header className="overview-strip glass-panel">
        <div className="overview-info">
          <span>
            <FaUsers /> Tong so nguoi dung:{" "}
            <strong>{dataOverview.accountTotal || 0}</strong>
          </span>
          <span>
            <FaMicrochip /> Tong so thiet bi: <strong>0</strong>
          </span>
        </div>
        <span className="overview-weather">
          {weatherData.weather[1].description}
        </span>
      </header> */}

      <section className="dashboard-grid">
        {summaryCards.map((card) => (
          <article
            className={`metric-card glass-panel ${card.tone}`}
            key={card.label}
          >
            <div className="metric-icon">{card.icon}</div>
            <div>
              <p>{card.label}</p>
              <strong>{card.value}</strong>
              <span>{card.note}</span>
            </div>
          </article>
        ))}
      </section>

      <section className="dashboard-content">
        <article className="chart-card glass-panel">
          <div className="section-heading">
            <div>
              <span>{t("last_7_days")}</span>
              <h2>{t("active_devices")}</h2>
            </div>
            <button className="btn btn-sm dashboard-pill">
              {t("fake_data")}
            </button>
          </div>

          <div
            className="bar-chart"
            aria-label={t("active_devices_chart")}
          >
            {deviceBars.map((item) => (
              <div className="bar-item" key={item.day}>
                <div className="bar-track">
                  <span style={{ height: `${item.value}%` }}></span>
                </div>
                <small>{t(`days.${item.day}`)}</small>
              </div>
            ))}
          </div>
        </article>

        <aside className="side-stack">
          <article className="donut-card glass-panel">
            <div className="section-heading compact">
              <div>
                <span>{t("user_growth")}</span>
                <h2>{t("new_users")}</h2>
              </div>
              <FaBolt />
            </div>
            <div className="donut-wrap">
              <div
                className="donut-chart"
                style={{
                  background: (() => {
                    const total = dataOverview.accountTotal || 1; // tránh chia 0
                    const newU = dataOverview.countUserOneMonth ?? 0;
                    const active = dataOverview.userActive ?? 0;
                    const locked = dataOverview.userLock ?? 0;

                    const newPct = (newU / total) * 100;
                    const activePct = (active / total) * 100;
                    const lockedPct = (locked / total) * 100;

                    return `conic-gradient(
            #06b6d4 0% ${newPct}%,
            #22c55e ${newPct}% ${newPct + activePct}%,
            #f59e0b ${newPct + activePct}% ${newPct + activePct + lockedPct}%,
            #1e293b ${newPct + activePct + lockedPct}% 100%
          )`;
                  })(),
                }}
              >
                <div>
                  <strong>{dataOverview.countUserOneMonth ?? 0}</strong>
                  <span>{t("one_month")}</span>
                </div>
              </div>
              <ul>
                <li>
                  <span className="legend-dot cyan"></span>
                  {t("new_registrations")}
                  <strong>{dataOverview.countUserOneMonth ?? 0}</strong>
                </li>
                <li>
                  <span className="legend-dot green"></span>
                  {t("activated")}
                  <strong>{dataOverview.userActive ?? 0}</strong>
                </li>
                <li>
                  <span className="legend-dot amber"></span>
                  {t("locked")}
                  <strong>{dataOverview.userLock ?? 0}</strong>
                </li>
              </ul>
            </div>
          </article>

          <article className="status-card glass-panel">
            <FaShieldAlt />
            <div>
              <span>{t("system_health")}</span>
              <strong>{t(`health.${healthData.toLowerCase()}`)}</strong>
              <p>{t("owner")}</p>
            </div>
          </article>
        </aside>
      </section>
    </main>
  );
}
