import "./TopCta.css";

const TopCta = () => {
  return (
    <section className="top-cta-section">

      <div className="footer-cta">

        {/* ================= CONTENT ================= */}

        <div className="footer-cta-content">

          <span className="footer-cta-label">
            BUILD • INNOVATE • ACHIEVE
          </span>

          <h2>
            READY TO BECOME
            <span> PART OF GEARS?</span>
          </h2>

          <p>
            Join a community driven by robotics,
            artificial intelligence, engineering
            and innovation.
          </p>

        </div>


        {/* ================= BUTTON ================= */}

        <a
          href="/registration"
          className="footer-register-btn"
        >
          <span>
            STUDENT REGISTRATION
          </span>

          <b>
            ↗
          </b>
        </a>

      </div>

    </section>
  );
};

export default TopCta;