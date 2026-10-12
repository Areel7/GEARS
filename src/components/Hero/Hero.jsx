import { Link } from "react-router-dom";

import "./Hero.css";

const Hero = () => {
  return (
    <section className="hero">

      {/* Decorative Tech Grid */}
      <div className="hero-grid" />

      {/* Decorative Glow */}
      <div className="hero-glow hero-glow-one" />
      <div className="hero-glow hero-glow-two" />

      {/* Top Tech Label */}
      <div className="hero-system-label">
        <span className="system-dot" />
        GEARS SYSTEM // 01
      </div>

      {/* LEFT SIDE */}
      <div className="hero-left">

        <div className="hero-kicker-wrap">
          <span className="hero-kicker-line" />
          <span className="hero-kicker">
            ROBOTICS • AI • ENGINEERING
          </span>
        </div>

        <h1 className="hero-title">
          <span className="title-line">Engineering</span>

          <span className="title-line title-outline">
            Tomorrow
          </span>

          <span className="title-line hero-highlight">
            Beyond Limits
          </span>
        </h1>

        <p className="hero-mobile-text">
          Turning bold ideas into intelligent systems,
          innovative solutions and technologies for tomorrow.
        </p>

        {/* Buttons */}
        <div className="hero-actions">

          <Link to="/contact" className="hero-btn hero-btn-primary">
            <span>CONTACT NOW</span>
            <span className="btn-arrow">↗</span>
          </Link>

          <Link to="/about" className="hero-btn hero-btn-secondary">
            <span>ABOUT GEARS</span>
          </Link>

        </div>

      </div>


      {/* RIGHT SIDE */}
      <div className="hero-right">

        <div className="hero-info-card">

          <div className="info-card-top">
            <span>WHAT WE BUILD</span>
            <span>01 / 03</span>
          </div>

          <p className="hero-text">
            GEARS brings together passionate minds in robotics,
            artificial intelligence and engineering to build,
            experiment and shape the technologies of tomorrow.
          </p>

          <div className="hero-mini-tags">
            <span>ROBOTICS</span>
            <span>AI</span>
            <span>R&D</span>
          </div>

        </div>

      </div>


      {/* Bottom Stats */}
      <div className="hero-bottom">

        <div className="hero-stat">
          <span className="stat-number">01</span>
          <span className="stat-label">BUILD</span>
        </div>

        <div className="hero-stat">
          <span className="stat-number">02</span>
          <span className="stat-label">INNOVATE</span>
        </div>

        <div className="hero-stat">
          <span className="stat-number">03</span>
          <span className="stat-label">EVOLVE</span>
        </div>

      </div>


      {/* Scroll */}
      <a href="#about" className="hero-scroll">
        <span>SCROLL</span>

        <div className="scroll-line">
          <span />
        </div>
      </a>

    </section>
  );
};

export default Hero;