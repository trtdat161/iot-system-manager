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

const summaryCards = [
  {
    label: "Nguoi dung hoat dong",
    value: "20",
    note: "+12% trong 7 ngay",
    icon: <FaUserCheck />,
    tone: "success",
  },
  {
    label: "Nguoi dung bi khoa",
    value: "10",
    note: "Can kiem tra",
    icon: <FaUserLock />,
    tone: "warning",
  },
  {
    label: "Thiet bi hoat dong",
    value: "10",
    note: "Online realtime",
    icon: <FaMicrochip />,
    tone: "cyan",
  },
  {
    label: "Thiet bi offline",
    value: "20",
    note: "-4% so voi hom qua",
    icon: <FaServer />,
    tone: "danger",
  },
];

const deviceBars = [
  { day: "T2", value: 44 },
  { day: "T3", value: 62 },
  { day: "T4", value: 54 },
  { day: "T5", value: 78 },
  { day: "T6", value: 68 },
  { day: "T7", value: 88 },
  { day: "CN", value: 74 },
];

export function DashboardAdmin() {
  return (
    <main className="admin-dashboard">
      <section className="dashboard-hero glass-panel">
        <div>
          <span className="dashboard-kicker">
            <span className="live-dot"></span>
            Live overview
          </span>
          <h1>Dashboard Admin</h1>
          <p>
            Tong quan he thong IoT voi du lieu mau. Cac vung so lieu nay co the
            gan API sau ma khong can doi lai layout.
          </p>
        </div>

        <div className="weather-card">
          <FaCloudSun />
          <div>
            <span>Thoi tiet</span>
            <strong>29 deg C</strong>
            <small>Ho Chi Minh - Cloudy</small>
          </div>
        </div>
      </section>

      <header className="overview-strip glass-panel">
        <div className="overview-info">
          <span>
            <FaUsers /> Tong so nguoi dung: <strong>100</strong>
          </span>
          <span>
            <FaMicrochip /> Tong so thiet bi: <strong>100</strong>
          </span>
        </div>
        <span className="overview-weather">
          Thoi tiet hien dang dung fake data, sau nay goi API thoi tiet tai day.
        </span>
      </header>

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
              <span>7 ngay qua</span>
              <h2>Thiet bi hoat dong</h2>
            </div>
            <button className="btn btn-sm dashboard-pill">Fake data</button>
          </div>

          <div
            className="bar-chart"
            aria-label="Bieu do cot thiet bi hoat dong"
          >
            {deviceBars.map((item) => (
              <div className="bar-item" key={item.day}>
                <div className="bar-track">
                  <span style={{ height: `${item.value}%` }}></span>
                </div>
                <small>{item.day}</small>
              </div>
            ))}
          </div>
        </article>

        <aside className="side-stack">
          <article className="donut-card glass-panel">
            <div className="section-heading compact">
              <div>
                <span>User growth</span>
                <h2>Nguoi dung moi</h2>
              </div>
              <FaBolt />
            </div>
            <div className="donut-wrap">
              <div className="donut-chart">
                <div>
                  <strong>+34</strong>
                  <span>7 ngay</span>
                </div>
              </div>
              <ul>
                <li>
                  <span className="legend-dot cyan"></span>Moi dang ky
                  <strong>34</strong>
                </li>
                <li>
                  <span className="legend-dot green"></span>Da kich hoat
                  <strong>28</strong>
                </li>
                <li>
                  <span className="legend-dot amber"></span>Cho duyet
                  <strong>6</strong>
                </li>
              </ul>
            </div>
          </article>

          <article className="status-card glass-panel">
            <FaShieldAlt />
            <div>
              <span>System health</span>
              <strong>Stable</strong>
              <p>Server, user va device dang hien thi bang HTML fake data.</p>
            </div>
          </article>
        </aside>
      </section>
    </main>
  );
}
