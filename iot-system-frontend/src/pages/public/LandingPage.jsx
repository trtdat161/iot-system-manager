import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowDownRight,
  ArrowRight,
  Activity,
  BellRing,
  ChartNoAxesCombined,
  Check,
  Cpu,
  Flame,
  Gauge,
  ShieldCheck,
  Sparkles,
  Waves,
} from "lucide-react";
import { LanguageSwitcher } from "../../components/switchLanguage/LanguageSwitch";
import "../../css/LandingPage.css";

const featureIcons = {
  IoT: Cpu,
  Alert: BellRing,
  Chart: ChartNoAxesCombined,
  Role: ShieldCheck,
  AI: Sparkles,
};

export function LandingPage() {
  const { t } = useTranslation("landing_page");
  const year = new Date().getFullYear();
  const stats = t("stats", { returnObjects: true });
  const features = t("features.items", { returnObjects: true });

  return (
    <div className="landing-page">
      <div className="landing-atmosphere" aria-hidden="true">
        <div className="landing-orb landing-orb-one" />
        <div className="landing-orb landing-orb-two" />
        <div className="landing-grid" />
      </div>

      <header className="landing-header">
        <nav className="landing-nav" aria-label={t("nav.aria")}>
          <Link
            to="/"
            className="landing-brand"
            aria-label={t("nav.home_aria")}
          >
            <span className="landing-brand-mark">
              <Waves size={20} strokeWidth={2.4} />
            </span>
            <span>DTECH<span className="landing-brand-period">.</span></span>
          </Link>

          <div className="landing-nav-actions">
            <a className="landing-nav-link" href="#features">
              {t("nav.features")}
            </a>
            <LanguageSwitcher />
            <Link className="landing-login-link" to="/login">
              {t("nav.login")}
            </Link>
            <Link className="landing-nav-cta" to="/register">
              {t("nav.register")}
              <ArrowRight size={16} />
            </Link>
          </div>
        </nav>
      </header>

      <main>
        <section
          id="home"
          aria-label={t("hero.aria")}
          className="landing-hero landing-container"
        >
          <div className="landing-hero-copy">
            <div className="landing-eyebrow">
              <span className="landing-live-dot" />
              <span>{t("hero.badge")}</span>
              <span className="landing-eyebrow-line" />
            </div>

            <h1 className="landing-title">
              <span className="landing-title-brand">DTECH</span>
              <span className="landing-title-sub">{t("hero.subtitle")}</span>
            </h1>

            <p className="landing-description">{t("hero.description")}</p>

            <div className="landing-hero-actions">
              <Link className="landing-button landing-button-primary" to="/register">
                {t("hero.create_account")}
                <ArrowRight size={18} />
              </Link>
              <Link className="landing-button landing-button-secondary" to="/login">
                {t("hero.login")}
                <ArrowDownRight size={17} />
              </Link>
            </div>

            <div className="landing-stats" aria-label={t("hero.aria")}>
              {Array.isArray(stats) &&
                stats.map(({ num, label }) => (
                  <div className="landing-stat" key={label}>
                    <span className="landing-stat-value">{num}</span>
                    <span className="landing-stat-label">{label}</span>
                  </div>
                ))}
            </div>
          </div>

          <div className="landing-visual">
            <div className="landing-visual-caption">
              <span className="landing-caption-icon"><Activity size={15} /></span>
              {t("mockup.live_overview")}
              <span className="landing-caption-status">{t("mockup.system_online")}</span>
            </div>
            <DashboardMockup t={t} />
            <div className="landing-float-card">
              <span className="landing-float-icon"><BellRing size={17} /></span>
              <span>
                <strong>{t("mockup.alert_title")}</strong>
                <small>{t("mockup.alert_description")}</small>
              </span>
              <span className="landing-float-check"><Check size={13} /></span>
            </div>
          </div>
        </section>

        <section
          id="features"
          aria-labelledby="landing-features-title"
          className="landing-features"
        >
          <div className="landing-container">
            <div className="landing-section-heading">
              <div>
                <p className="landing-section-kicker">
                  <span className="landing-heading-line" />
                  {t("features.tag")}
                </p>
                <h2 id="landing-features-title">
                  {t("features.title")}{" "}
                  <span>{t("features.highlight")}</span>
                </h2>
              </div>
              <p className="landing-section-note">
                {t("features.note")}
              </p>
            </div>

            <div className="landing-feature-grid">
              {Array.isArray(features) &&
                features.map(({ icon, title, desc }, index) => {
                  const Icon = featureIcons[icon] || Cpu;
                  return (
                    <article className="landing-feature-card" key={title}>
                      <div className="landing-feature-topline">
                        <span className="landing-feature-icon">
                          <Icon size={20} strokeWidth={1.8} />
                        </span>
                        <span className="landing-feature-index">
                          0{index + 1}
                        </span>
                      </div>
                      <h3>{title}</h3>
                      <p>{desc}</p>
                      <ArrowRight className="landing-feature-arrow" size={17} />
                    </article>
                  );
                })}
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-container landing-footer-inner">
          <div className="landing-footer-brand">
            <span className="landing-brand-mark">
              <Waves size={18} strokeWidth={2.4} />
            </span>
            <span>
              <strong>DTECH</strong>
              <small>{t("footer.description")}</small>
            </span>
          </div>
          <div className="landing-footer-meta">
            <a href="mailto:trtdat161@gmail.com">trtdat161@gmail.com</a>
            <a href="tel:0374757256">0374 757 256</a>
            <span>{t("footer.copy", { year })}</span>
          </div>
        </div>
      </footer>

      <div className="landing-mobile-dock" aria-label={t("nav.aria")}>
        <Link className="landing-dock-login" to="/login">
          {t("nav.login")}
        </Link>
        <Link className="landing-dock-register" to="/register">
          {t("nav.register")}
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}

function DashboardMockup({ t }) {
  return (
    <div className="landing-dashboard" role="img" aria-label={t("mockup.aria")}>
      <div className="landing-dashboard-topbar">
        <div className="landing-window-controls" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <span className="landing-dashboard-name">{t("mockup.dashboard_title")}</span>
        <span className="landing-dashboard-live">
          <span className="landing-live-dot" />
          LIVE
        </span>
      </div>

      <div className="landing-dashboard-content">
        <div className="landing-dashboard-heading">
          <div>
            <span className="landing-dashboard-overline">{t("mockup.environment")}</span>
            <strong>{t("mockup.overview")}</strong>
          </div>
          <span className="landing-dashboard-date">{t("mockup.today")} <span>·</span> 09:41</span>
        </div>

        <div className="landing-metric-grid">
          <div className="landing-metric-card landing-metric-warning">
            <div className="landing-metric-label">
              <Gauge size={14} /> {t("mockup.gas")}
            </div>
            <strong>0.85<span>%</span></strong>
            <small><span /> {t("mockup.gas_note")}</small>
          </div>
          <div className="landing-metric-card">
            <div className="landing-metric-label">
              <Activity size={14} /> {t("mockup.temperature")}
            </div>
            <strong>31.4<span>°C</span></strong>
            <small className="landing-metric-ok"><span /> {t("mockup.temperature_note")}</small>
          </div>
        </div>

        <div className="landing-chart-card">
          <div className="landing-chart-heading">
            <span>{t("mockup.sensor_activity")}</span>
            <span className="landing-chart-range">{t("mockup.last_12_hours")}</span>
          </div>
          <div className="landing-chart">
            <div className="landing-chart-lines"><i /><i /><i /></div>
            <svg viewBox="0 0 520 88" preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <linearGradient id="landing-chart-fill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#4ee5c1" stopOpacity=".25" />
                  <stop offset="100%" stopColor="#4ee5c1" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0 65 C32 63 35 42 65 47 S100 72 130 58 S165 38 195 45 S230 65 260 48 S295 30 325 42 S360 60 390 37 S425 45 455 24 S490 34 520 15 V88 H0Z" fill="url(#landing-chart-fill)" />
              <path d="M0 65 C32 63 35 42 65 47 S100 72 130 58 S165 38 195 45 S230 65 260 48 S295 30 325 42 S360 60 390 37 S425 45 455 24 S490 34 520 15" fill="none" stroke="#4ee5c1" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            </svg>
          </div>
          <div className="landing-chart-times">
            <span>00:00</span><span>04:00</span><span>08:00</span><span>12:00</span>
          </div>
        </div>

        <div className="landing-devices-card">
          <div className="landing-devices-heading">
            <span>{t("mockup.recent_devices")}</span>
            <span className="landing-device-count">{t("mockup.devices_value")}</span>
          </div>
          <div className="landing-device-row">
            <span className="landing-device-symbol"><Gauge size={15} /></span>
            <span>{t("mockup.gas_module")}</span>
            <span className="landing-device-status"><i /> {t("mockup.online")}</span>
          </div>
          <div className="landing-device-row">
            <span className="landing-device-symbol"><Activity size={15} /></span>
            <span>{t("mockup.temperature_sensor")}</span>
            <span className="landing-device-status"><i /> {t("mockup.online")}</span>
          </div>
          <div className="landing-device-row">
            <span className="landing-device-symbol"><Flame size={15} /></span>
            <span>{t("mockup.fire_module")}</span>
            <span className="landing-device-status"><i /> {t("mockup.online")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
