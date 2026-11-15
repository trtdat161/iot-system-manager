import {
  FaBolt,
  FaBell,
  FaCloudSun,
  FaExclamationTriangle,
  FaMicrochip,
  FaShieldAlt,
  FaUserCheck,
  FaUserLock,
  FaUsers,
} from "react-icons/fa";
import { Link, useOutletContext } from "react-router-dom";
import "../../css/admin/Dashboard.css";
import {
  DashboardSummary,
  GetAlertTrend,
  Weather,
} from "../../api/admin/dashboardApi";
import { GetStatusDevice } from "../../api/admin/deviceApi";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";

const RECENT_ACTIVITY_WINDOW_MINUTES = 24 * 60;
const alertTypeOptions = [
  "gas",
  "gas_danger",
  "temp_high",
  "humid_low",
  "humid_high",
];

export function DashboardAdmin() {
  const { t } = useTranslation("admin_dashboard");
  const { connection } = useOutletContext() || {};
  const [healthData, setHealthData] = useState("");
  const [dataOverview, setDataOverview] = useState(null);
  const [alertType, setAlertType] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(
    dayjs().startOf("month").format("YYYY-MM-DD"),
  );
  const [alertTrend, setAlertTrend] = useState(null);
  const [alertTrendLoading, setAlertTrendLoading] = useState(true);
  const [alertTrendError, setAlertTrendError] = useState(false);
  const [deviceActivity, setDeviceActivity] = useState(null);
  const [deviceActivityError, setDeviceActivityError] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true); // thêm
  const [error, setError] = useState(false);
  const alertMonths = alertTrend?.months ?? [];
  const alertDays = alertTrend?.days ?? [];
  const maxMonthlyAlerts = Math.max(
    ...alertMonths.map((item) => item.count),
    1,
  );
  const maxDailyAlerts = Math.max(...alertDays.map((item) => item.count), 1);
  const peakAlertDay = alertDays.reduce(
    (peak, item) => (item.count > (peak?.count ?? 0) ? item : peak),
    null,
  );

  const summaryCards = dataOverview
    ? [
        {
          label: t("summary.active_users"),
          value: dataOverview.userActive ?? 0,
          note: t("summary.active_users_note"),
          icon: <FaUserCheck />,
          tone: "success",
          to: "/admin-frame-layout/manager-user",
        },
        {
          label: t("summary.locked_users"),
          value: dataOverview.userLock ?? 0,
          note: t("summary.locked_users_note"),
          icon: <FaUserLock />,
          tone: "warning",
          to: "/admin-frame-layout/manager-user",
        },
        {
          label: t("summary.online_devices"),
          value: deviceActivityError
            ? "--"
            : (deviceActivity?.onlineCount ?? "--"),
          note: deviceActivityError
            ? t("device_activity_unavailable")
            : deviceActivity
              ? deviceActivity.featuredDevice
                ? deviceActivity.isOnline
                  ? t("device_online_now", {
                      name:
                        deviceActivity.featuredDevice.name ||
                        deviceActivity.featuredDevice.macAddress,
                    })
                  : t("device_online_recently", {
                      name:
                        deviceActivity.featuredDevice.name ||
                        deviceActivity.featuredDevice.macAddress,
                      time: formatElapsedTime(
                        deviceActivity.featuredDevice.lastSeenAt,
                        t,
                      ),
                    })
                : t("device_no_recent_activity")
              : t("device_activity_loading"),
          icon: <FaMicrochip />,
          tone: "cyan",
          to: "/admin-frame-layout/status-device",
        },
        {
          label: t("summary.total_alerts"),
          value: dataOverview.totalAlerts ?? 0,
          note: t("summary.total_alerts_note"),
          icon: <FaBell />,
          tone: "danger",
          to: "/admin-frame-layout/admin-history",
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
        setError(true);
      } finally {
        setLoading(false); // dù lỗi hay ok đều tắt loading
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

  useEffect(() => {
    let isCurrentRequest = true;

    const fetchAlertTrend = async () => {
      setAlertTrendLoading(true);
      setAlertTrendError(false);

      try {
        const response = await GetAlertTrend(alertType, selectedMonth);
        if (
          !Array.isArray(response.data?.months) ||
          !Array.isArray(response.data?.days)
        ) {
          throw new Error("Alert trend response has an invalid shape.");
        }

        if (isCurrentRequest) {
          setAlertTrend(response.data);
        }
      } catch (err) {
        console.error("Failed to load dashboard alert trend:", err);
        if (isCurrentRequest) {
          setAlertTrend(null);
          setAlertTrendError(true);
        }
      } finally {
        if (isCurrentRequest) {
          setAlertTrendLoading(false);
        }
      }
    };

    fetchAlertTrend();
    return () => {
      isCurrentRequest = false;
    };
  }, [alertType, selectedMonth]);

  useEffect(() => {
    let isMounted = true;
    let isLoading = false;

    const fetchDeviceActivity = async () => {
      if (isLoading) return;
      isLoading = true;

      try {
        const onlineResponse = await GetStatusDevice(1, 1, "online");
        const onlinePage = onlineResponse.data;
        const onlineCount = onlinePage.totalItems ?? 0;
        let featuredDevice = onlinePage.data?.[0] ?? null;
        const isOnline = onlineCount > 0;

        if (!featuredDevice && onlineCount === 0) {
          const offlineResponse = await GetStatusDevice(1, 1, "offline");
          const lastSeenDevice = offlineResponse.data.data?.[0] ?? null;
          const minutesSinceLastSeen = lastSeenDevice?.lastSeenAt
            ? dayjs().diff(lastSeenDevice.lastSeenAt, "minute")
            : null;

          if (
            minutesSinceLastSeen !== null &&
            minutesSinceLastSeen >= 0 &&
            minutesSinceLastSeen < RECENT_ACTIVITY_WINDOW_MINUTES
          ) {
            featuredDevice = lastSeenDevice;
          }
        }

        if (isMounted) {
          setDeviceActivity({ onlineCount, featuredDevice, isOnline });
          setDeviceActivityError(false);
        }
      } catch (err) {
        console.error("Failed to load dashboard device activity:", err);
        if (isMounted) {
          setDeviceActivity(null);
          setDeviceActivityError(true);
        }
      } finally {
        isLoading = false;
      }
    };

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        fetchDeviceActivity();
      }
    };

    fetchDeviceActivity();
    connection?.on("ReceiveDeviceStatus", fetchDeviceActivity);
    const intervalId = window.setInterval(refreshWhenVisible, 30_000);

    return () => {
      isMounted = false;
      connection?.off("ReceiveDeviceStatus", fetchDeviceActivity);
      window.clearInterval(intervalId);
    };
  }, [connection]);

  return (
    <main className="admin-dashboard">
      {/* loading ban đầu là true nên sẽ luôn chạy */}
      {loading && (
        <p className="alert alert-info text-center">{t("loading")}</p>
      )}

      {/* error banner — vẫn render dashboard bên dưới */}
      {!loading && error && (
        <p className="alert alert-warning text-center mb-2">
          {t("errors.unavailable")} <br />
          {t("errors.cannot_access")}
        </p>
      )}
      <section className="dashboard-hero glass-panel">
        <div>
          <div className="dashboard-kicker">
            <span className="live-dot"></span>
            {/* Live overview */}
            <strong className="fs-6">
              <FaUsers size={19} />{" "}
              {t("total_users", { count: dataOverview?.accountTotal || 0 })}
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
      <section className="dashboard-grid">
        {summaryCards.map((card) => (
          <Link
            to={card.to}
            className={`metric-card glass-panel ${card.tone}`}
            key={card.label}
          >
            <div className="metric-icon">{card.icon}</div>
            <div>
              <p>{card.label}</p>
              <strong>{card.value}</strong>
              <span>{card.note}</span>
            </div>
          </Link>
        ))}
      </section>
      <section className="dashboard-content">
        <article className="chart-card glass-panel">
          <div className="section-heading alert-chart-header">
            <div>
              <span>{t("last_12_months")}</span>
              <h2>{t("alert_frequency")}</h2>
            </div>
            <label className="alert-type-filter" htmlFor="alert-type-filter">
              <span>{t("alert_type_filter")}</span>
              <select
                id="alert-type-filter"
                value={alertType}
                onChange={(event) => setAlertType(event.target.value)}
              >
                <option value="">{t("all_alert_types")}</option>
                {alertTypeOptions.map((type) => (
                  <option value={type} key={type}>
                    {t(`alert_types.${type}`)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div
            className="alert-chart-legend"
            role="list"
            aria-label={t("alert_legend")}
          >
            {["none", "warning", "danger"].map((level) => (
              <span className="alert-legend-item" role="listitem" key={level}>
                <span className={`alert-legend-dot ${level}`} />
                {t(`alert_levels.${level}`)}
              </span>
            ))}
            <span className="alert-legend-note" role="listitem">
              {t("bar_height_legend")}
            </span>
          </div>

          {alertTrendError ? (
            <div className="bar-chart-empty alert-trend-error" role="alert">
              {t("alert_trend_error")}
            </div>
          ) : alertTrendLoading ? (
            <div className="bar-chart-empty">{t("alert_trend_loading")}</div>
          ) : (
            <>
              <div className="alert-chart-scroll">
                <div
                  className="bar-chart month-bar-chart"
                  aria-label={t("alert_frequency_chart")}
                >
                  {alertMonths.map((item) => {
                    const monthLabel = dayjs(item.month).format("MM/YY");
                    const selected =
                      dayjs(item.month).format("YYYY-MM") ===
                      dayjs(selectedMonth).format("YYYY-MM");

                    return (
                      <button
                        type="button"
                        className={`bar-item chart-bar-button${selected ? " selected" : ""}`}
                        key={item.month}
                        onClick={() =>
                          setSelectedMonth(
                            dayjs(item.month).format("YYYY-MM-DD"),
                          )
                        }
                        aria-pressed={selected}
                        aria-label={t("month_bar_aria", {
                          month: monthLabel,
                          count: item.count,
                        })}
                        title={t("month_bar_aria", {
                          month: monthLabel,
                          count: item.count,
                        })}
                      >
                        <small className="bar-value">{item.count}</small>
                        <div className="bar-track">
                          <span
                            style={{
                              height: getBarHeight(item, maxMonthlyAlerts),
                              background: getAlertBarColor(
                                item,
                                maxMonthlyAlerts,
                              ),
                            }}
                          />
                        </div>
                        <small className="bar-label">
                          {t("month_label", {
                            month: dayjs(item.month).format("MM"),
                            year: dayjs(item.month).format("YY"),
                          })}
                        </small>
                      </button>
                    );
                  })}
                </div>
              </div>

              <section className="alert-month-details">
                <div className="alert-month-details-heading">
                  <div>
                    <span>{t("daily_alerts")}</span>
                    <h3>
                      {t("month_detail_title", {
                        month: dayjs(selectedMonth).format("MM/YYYY"),
                      })}
                    </h3>
                  </div>
                  {peakAlertDay?.count > 0 ? (
                    <p className="alert-peak-day">
                      {t("peak_alert_day", {
                        date: dayjs(peakAlertDay.date).format("DD/MM/YYYY"),
                        count: peakAlertDay.count,
                      })}
                    </p>
                  ) : (
                    <p className="alert-peak-day">
                      {t("no_alerts_in_month")}
                    </p>
                  )}
                </div>
                <div className="alert-chart-scroll">
                  <div
                    className="bar-chart daily-bar-chart"
                    style={{
                      gridTemplateColumns: `repeat(${alertDays.length}, minmax(24px, 1fr))`,
                      minWidth: `${alertDays.length * 38}px`,
                    }}
                    aria-label={t("daily_alerts_chart")}
                  >
                    {alertDays.map((item) => (
                      <div className="bar-item" key={item.date}>
                        <small className="bar-value">{item.count}</small>
                        <div className="bar-track">
                          <span
                            style={{
                              height: getBarHeight(item, maxDailyAlerts),
                              background: getAlertBarColor(item, maxDailyAlerts),
                            }}
                          />
                        </div>
                        <small className="bar-label">
                          {dayjs(item.date).format("DD")}
                        </small>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </>
          )}
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
                  background: dataOverview
                    ? (() => {
                        const newU = dataOverview.countUserOneMonth ?? 0;
                        const active = dataOverview.userActive ?? 0;
                        const locked = dataOverview.userLock ?? 0;

                        // Tính tổng 3 nhóm này để vẽ tỷ lệ rõ ràng hơn
                        const totalShown = newU + active + locked || 1;

                        const newPct = (newU / totalShown) * 100;
                        const activePct = (active / totalShown) * 100;
                        const lockedPct = (locked / totalShown) * 100;

                        return `conic-gradient(
            #06b6d4 0% ${newPct}%,
            #22c55e ${newPct}% ${newPct + activePct}%,
            #facc15 ${newPct + activePct}% ${newPct + activePct + lockedPct}%,
            #1e293b ${newPct + activePct + lockedPct}% 100%
          )`;
                      })()
                    : "#1e293b",
                }}
              >
                <div>
                  <strong>{dataOverview?.countUserOneMonth ?? 0}</strong>
                  <span>{t("one_month")}</span>
                </div>
              </div>
              <ul>
                <li>
                  <span className="legend-dot cyan"></span>
                  {t("new_registrations")}
                  <strong>{dataOverview?.countUserOneMonth ?? 0}</strong>
                </li>
                <li>
                  <span className="legend-dot green"></span>
                  {t("activated")}
                  <strong>{dataOverview?.userActive ?? 0}</strong>
                </li>
                <li>
                  <span className="legend-dot amber"></span>
                  {t("locked")}
                  <strong>{dataOverview?.userLock ?? 0}</strong>
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

function formatElapsedTime(lastSeenAt, t) {
  const minutes = Math.max(1, dayjs().diff(lastSeenAt, "minute"));

  if (minutes < 60) {
    return t("time_minutes", { count: minutes });
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return t("time_hours", { count: hours });
  }

  return t("time_days", { count: Math.floor(hours / 24) });
}

function getBarHeight(item, maximum) {
  return item.count === 0
    ? "2%"
    : `${Math.max((item.count / maximum) * 100, 4)}%`;
}

function getAlertBarColor(item, maximum) {
  const hue =
    item.count === 0 ? 142 : item.hasDanger ? 0 : 45;
  const intensity = item.count === 0 ? 0 : item.count / maximum;
  const lightness = Math.round(66 - intensity * 25);
  return `hsl(${hue} 78% ${lightness}%)`;
}
