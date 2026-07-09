import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../../css/LandingPage.css";

export function LandingPage() {
  const year = new Date().getFullYear();
  const navigate = useNavigate();
  const { t } = useTranslation("landing_page");
  const stats = t("stats", { returnObjects: true });
  const features = t("features.items", { returnObjects: true });

  useEffect(() => {
    const container = document.getElementById("dtech-particles");
    if (!container) return;

    for (let i = 0; i < 18; i++) {
      const dot = document.createElement("div");
      dot.className = "dtech-dot";
      dot.style.cssText = [
        `left:${Math.random() * 100}%`,
        `animation-duration:${8 + Math.random() * 12}s`,
        `animation-delay:${Math.random() * 10}s`,
        `width:${2 + Math.random() * 3}px`,
        `height:${2 + Math.random() * 3}px`,
        `opacity:${0.3 + Math.random() * 0.5}`,
      ].join(";");
      container.appendChild(dot);
    }

    return () => {
      container.innerHTML = "";
    };
  }, []);

  return (
    <>
      <div className="dt-circuit-bg" aria-hidden="true">
        <svg
          viewBox="0 0 1400 800"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
        >
          <g stroke="#00e5ff" strokeWidth="1" fill="none">
            <line x1="0" y1="200" x2="400" y2="200" />
            <line x1="400" y1="200" x2="400" y2="100" />
            <line x1="400" y1="100" x2="700" y2="100" />
            <line x1="700" y1="100" x2="700" y2="300" />
            <line x1="700" y1="300" x2="1000" y2="300" />
            <line x1="1000" y1="300" x2="1000" y2="150" />
            <line x1="1000" y1="150" x2="1400" y2="150" />
            <line x1="200" y1="0" x2="200" y2="400" />
            <line x1="200" y1="400" x2="500" y2="400" />
            <line x1="500" y1="400" x2="500" y2="600" />
            <line x1="500" y1="600" x2="900" y2="600" />
            <line x1="900" y1="600" x2="900" y2="450" />
            <line x1="900" y1="450" x2="1400" y2="450" />
            <line x1="800" y1="0" x2="800" y2="200" />
            <line x1="1200" y1="0" x2="1200" y2="300" />
            <line x1="1200" y1="300" x2="1400" y2="300" />
            <line x1="0" y1="650" x2="300" y2="650" />
            <line x1="300" y1="650" x2="300" y2="800" />
            <circle cx="400" cy="200" r="5" />
            <circle cx="700" cy="100" r="5" />
            <circle cx="1000" cy="300" r="5" />
            <circle cx="200" cy="400" r="5" />
            <circle cx="500" cy="600" r="5" />
            <circle cx="900" cy="450" r="5" />
            <rect x="393" y="193" width="14" height="14" />
            <rect x="693" y="93" width="14" height="14" />
            <rect x="993" y="293" width="14" height="14" />
            <rect x="493" y="593" width="14" height="14" />
          </g>
        </svg>
      </div>

      <div className="dt-particles" id="dtech-particles" aria-hidden="true" />

      <header>
        <nav className="dt-navbar" aria-label={t("nav.aria")}>
          <div className="container">
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
              <a href="#home" aria-label={t("nav.home_aria")} className="dt-brand">
                DTECH
                <span className="dt-blink dt-brand-dot" />
              </a>

              <div className="d-flex align-items-center gap-2">
                <button
                  className="dt-btn dt-btn-outline"
                  onClick={() => navigate("/login")}
                >
                  {t("nav.login")}
                </button>
                <button
                  className="dt-btn dt-btn-solid"
                  onClick={() => navigate("/register")}
                >
                  {t("nav.register")}
                </button>
              </div>
            </div>
          </div>
        </nav>
      </header>

      <main>
        <section
          id="home"
          aria-label={t("hero.aria")}
          className="dt-hero-section"
        >
          <div className="container">
            <div className="row align-items-center">
              <div className="col-lg-6">
                <div className="dt-badge">
                  <span className="dt-badge-dot" />
                  {t("hero.badge")}
                </div>

                <h1 className="dt-hero-title">
                  <span className="dt-hero-title-main">DTECH</span>
                  <span className="dt-hero-title-sub">{t("hero.subtitle")}</span>
                </h1>

                <p className="dt-hero-desc">{t("hero.description")}</p>

                <div className="d-flex flex-wrap gap-3 mb-5">
                  <HeroBtn href="/register" variant="primary">
                    {t("hero.create_account")}
                  </HeroBtn>
                  <HeroBtn href="/login" variant="secondary">
                    {t("hero.login")}
                  </HeroBtn>
                </div>

                <div className="dt-stats">
                  {stats.map(({ num, label }) => (
                    <div key={label} className="dt-stat">
                      <span className="dt-stat-num">{num}</span>
                      <span className="dt-stat-label">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="col-lg-6 mt-5 mt-lg-0">
                <DashboardMockup t={t} />
              </div>
            </div>
          </div>
        </section>

        <section
          id="features"
          aria-labelledby="features-heading"
          className="dt-features-section"
        >
          <div className="container">
            <div className="row mb-5">
              <div className="col-lg-8">
                <p className="dt-section-tag">{t("features.tag")}</p>
                <h2 id="features-heading" className="dt-section-title">
                  {t("features.title")}{" "}
                  <span className="dt-section-title-highlight">
                    {t("features.highlight")}
                  </span>
                </h2>
              </div>
            </div>

            <div className="row g-4">
              {features.map(({ icon, title, desc }) => (
                <div key={title} className="col-md-6 col-lg-4">
                  <article className="dt-feature-card">
                    <div className="dt-feature-icon">{icon}</div>
                    <h3 className="dt-feature-title">{title}</h3>
                    <p className="dt-feature-desc">{desc}</p>
                  </article>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="dt-footer">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-4 mb-3 mb-md-0">
              <div className="dt-footer-brand">
                DTECH<span className="dt-footer-brand-dot">.</span>
              </div>
              <p className="dt-footer-desc">{t("footer.description")}</p>
            </div>

            <div className="col-md-4 text-md-end">
              <p className="dt-footer-copy">{t("footer.copy", { year })}</p>

              <div className="d-flex flex-column flex-sm-row justify-content-md-end gap-3 gap-sm-4 text-muted small">
                <a
                  href="tel:0374757256"
                  className="dtech-contact-link d-flex align-items-center gap-2 text-decoration-none"
                >
                  <i className="bi bi-telephone-fill"></i>
                  0374 757 256
                </a>
                <a
                  href="mailto:trtdat161@gmail.com"
                  className="dtech-contact-link d-flex align-items-center gap-2 text-decoration-none"
                >
                  <i className="bi bi-envelope-fill"></i>
                  trtdat161@gmail.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

function HeroBtn({ href, variant, children }) {
  const isPrimary = variant === "primary";
  const className = isPrimary
    ? "dt-hero-btn dt-hero-btn-primary"
    : "dt-hero-btn dt-hero-btn-secondary";

  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

function DashboardMockup({ t }) {
  return (
    <div className="dt-dashboard" role="img" aria-label={t("mockup.aria")}>
      <div className="dt-dashboard-header">
        {["#ff5f57", "#febc2e", "#28c840"].map((color) => (
          <span
            key={color}
            className="dt-dashboard-dot"
            style={{ background: color }}
          />
        ))}
        <span className="dt-dashboard-title">DTECH IoT Dashboard</span>
      </div>

      <div className="dt-dashboard-body">
        <div className="dt-metric">
          <div className="dt-metric-label">{t("mockup.gas")}</div>
          <div className="dt-metric-value" style={{ color: "#ff5f57" }}>
            0.85%
          </div>
          <div className="dt-metric-change warning">{t("mockup.gas_note")}</div>
        </div>
        <div className="dt-metric">
          <div className="dt-metric-label">{t("mockup.temperature")}</div>
          <div className="dt-metric-value">31.4 C</div>
          <div className="dt-metric-change positive">
            {t("mockup.temperature_note")}
          </div>
        </div>
        <div className="dt-metric">
          <div className="dt-metric-label">{t("mockup.devices")}</div>
          <div className="dt-metric-value">{t("mockup.devices_value")}</div>
          <div className="dt-metric-change positive">
            {t("mockup.devices_note")}
          </div>
        </div>

        <div className="dt-devices mt-3">
          <div className="dt-metric-label">{t("mockup.recent_devices")}</div>
          <div className="dt-device-item">
            <span className="dt-device-dot online" /> {t("mockup.gas_module")}
          </div>
          <div className="dt-device-item">
            <span className="dt-device-dot online" />{" "}
            {t("mockup.temperature_sensor")}
          </div>
          <div className="dt-device-item">
            <span className="dt-device-dot idle" /> {t("mockup.fire_module")}
          </div>
        </div>
      </div>
    </div>
  );
}
