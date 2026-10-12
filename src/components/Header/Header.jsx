import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Header.css";
import { FaBars, FaTimes } from "react-icons/fa";
import gearsLogo from "../../assets/images/gears-logo.png";
import { useSiteSettings } from "../../context/SiteSettingsContext";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scroll, setScroll] = useState(false);

  /* Registration link visibility is controlled from Admin > Settings. */
  const { registrationEnabled } = useSiteSettings();

  useEffect(() => {
    const handleScroll = () => {
      setScroll(window.scrollY > 40);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "auto";

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [menuOpen]);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <header className={`header ${scroll ? "active" : ""}`}>
      <div className="container">
        {/* Logo */}
        <Link to="/" className="logo" onClick={closeMenu}>
          <img
            src={gearsLogo}
            alt="GEARS Logo"
            className="header-logo-img"
          />
        </Link>

        {/* Navigation */}
        <nav className={menuOpen ? "nav active" : "nav"}>
          <Link to="/" onClick={closeMenu}>
            Home
          </Link>

          <Link to="/about" onClick={closeMenu}>
            About Us
          </Link>

          <Link to="/team" onClick={closeMenu}>
            Our Team
          </Link>

          <Link to="/gallery" onClick={closeMenu}>
            Gallery
          </Link>


          {/* Shown only while registration is switched ON in the admin. */}

          {registrationEnabled && (
            <Link to="/registration" onClick={closeMenu}>
              Registration
            </Link>
          )}

          <Link to="/contact" onClick={closeMenu}>
            Contact Us  
          </Link>
        </nav>

        {/* Mobile Menu Button */}
        <button
          type="button"
          className="menu-btn"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>
    </header>
  );
};

export default Header;