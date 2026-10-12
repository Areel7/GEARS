import "./Footer.css";
import gearsLogo from "../../assets/images/gears-logo.png";
import { useSiteSettings } from "../../context/SiteSettingsContext";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  /* Registration link visibility is controlled from Admin > Settings. */
  const { registrationEnabled } = useSiteSettings();

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <footer className="site-footer">
      {/* =========================================
          BACKGROUND DECORATIONS
      ========================================= */}

      <div className="footer-glow footer-glow-left"></div>

      <div className="footer-glow footer-glow-right"></div>

      <div className="footer-bg-text">
        GEARS
      </div>


      {/* =========================================
          MAIN FOOTER
      ========================================= */}

      <div className="footer-main">

        {/* ================= BRAND ================= */}

        <div className="footer-brand">

          <a
            href="/"
            className="footer-logo"
            aria-label="GEARS Home"
          >
            <img
              src={gearsLogo}
              alt="GEARS Logo"
            />
          </a>


          <p className="footer-description">
            A student-driven community fostering
            innovation, collaboration and technical
            excellence through robotics, artificial
            intelligence and intelligent engineering.
          </p>


          <div className="footer-university">

            <span className="footer-location-icon">
              ●
            </span>

            <div>

              <small>
                BASED AT
              </small>

              <strong>
                Lahore Garrison University
              </strong>

              <p>
                DHA Phase 6, Lahore, Pakistan
              </p>

            </div>

          </div>

        </div>


        {/* ================= LINKS ================= */}

        <div className="footer-links-column">

          <span className="footer-column-label">
            NAVIGATION
          </span>

          <h3>
            Explore
          </h3>


          <nav className="footer-links">

            <a href="/">
              <span>01</span>
              Home
            </a>

            <a href="/about">
              <span>02</span>
              About Us
            </a>

            <a href="/team">
              <span>03</span>
              Our Team
            </a>

            <a href="/gallery">
              <span>04</span>
              Gallery
            </a>

            <a href="/achievements">
              <span>05</span>
              Achievements
            </a>

            {registrationEnabled && (
              <a href="/registration">
                <span>06</span>
                Registration
              </a>
            )}

            <a href="/contact">
              <span>07</span>
              Contact
            </a>

          </nav>

        </div>


        {/* ================= MAP ================= */}

        <div className="footer-map-column">

          <div className="map-heading">

            <div>

              <span className="footer-column-label">
                FIND US
              </span>

              <h3>
                LGU Location
              </h3>

            </div>


            <span className="live-location">
              <i></i>
              LIVE MAP
            </span>

          </div>


          <div className="footer-map">

            <iframe
              title="Lahore Garrison University Location"
              src="https://www.google.com/maps?q=Lahore%20Garrison%20University%20DHA%20Phase%206%20Lahore&output=embed"
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>


            <div className="map-overlay-info">

              <div>

                <span>
                  LOCATION
                </span>

                <strong>
                  Lahore Garrison University
                </strong>

                <p>
                  DHA Phase 6, Lahore
                </p>

              </div>


              <a
                href="https://www.google.com/maps/search/?api=1&query=Lahore+Garrison+University+DHA+Phase+6+Lahore"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open Lahore Garrison University in Google Maps"
              >
                ↗
              </a>

            </div>

          </div>

        </div>

      </div>


      {/* =========================================
          BOTTOM BAR
      ========================================= */}

      <div className="footer-bottom">

        <p>
          © {currentYear}{" "}
          <strong>
            GEARS
          </strong>.
          All rights reserved.
        </p>


        <div className="footer-bottom-center">

          <span></span>

          Built with passion at

          <strong>
            Lahore Garrison University
          </strong>

          <span></span>

        </div>


        <button
          type="button"
          className="back-to-top"
          onClick={scrollToTop}
          aria-label="Back to top"
        >
          ↑
        </button>

      </div>

    </footer>
  );
};

export default Footer;