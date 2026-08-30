import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import "./RegistrationPopup.css";

const RegistrationPopup = () => {
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const hasSeenPopup = localStorage.getItem(
      "gears_registration_popup_seen"
    );

    if (!hasSeenPopup) {
      setShowPopup(true);

      localStorage.setItem(
        "gears_registration_popup_seen",
        "true"
      );
    }
  }, []);

  const closePopup = () => {
    setShowPopup(false);
  };

  return (
    <AnimatePresence>
      {showPopup && (
        <motion.div
          className="registration-popup-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={closePopup}
        >
          <motion.div
            className="registration-popup"
            initial={{
              opacity: 0,
              scale: 0.92,
              y: 30,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.92,
              y: 20,
            }}
            transition={{
              duration: 0.45,
              ease: [0.22, 1, 0.36, 1],
            }}
            onClick={(e) => e.stopPropagation()}
          >

            {/* Decorative Corners */}
            <span className="registration-popup-corner top-left" />
            <span className="registration-popup-corner bottom-right" />

            {/* Close Button */}
            <button
              type="button"
              className="registration-popup-close"
              onClick={closePopup}
              aria-label="Close registration popup"
            >
              ×
            </button>

            {/* Red Line */}
            <div className="registration-popup-line" />

            {/* Small Label */}
            <span className="registration-popup-small">
              GEARS REGISTRATION
            </span>

            {/* Heading */}
            <h2>
              REGISTRATION IS{" "}
              <span>OPEN.</span>
            </h2>

            {/* Description */}
            <p>
              Registration for GEARS is now open. Join us and
              become a part of our community. Complete your
              registration to get started.
            </p>

            {/* Buttons */}
            <div className="registration-popup-actions">

              <Link
                to="/registration"
                className="registration-popup-button"
                onClick={closePopup}
              >
                REGISTER NOW
              </Link>

              <button
                type="button"
                className="registration-popup-later"
                onClick={closePopup}
              >
                MAYBE LATER
              </button>

            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RegistrationPopup;
