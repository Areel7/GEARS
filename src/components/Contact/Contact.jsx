
import { useState } from "react";
import emailjs from "@emailjs/browser";

import "./Contact.css";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [status, setStatus] = useState({
    type: "",
    message: "",
  });

  const [isSending, setIsSending] = useState(false);

  /* =========================================================
     HANDLE INPUT
  ========================================================= */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Remove previous status when user starts typing again
    if (status.message) {
      setStatus({
        type: "",
        message: "",
      });
    }
  };


  /* =========================================================
     HANDLE SUBMIT
  ========================================================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSending) return;

    setIsSending(true);

    setStatus({
      type: "",
      message: "",
    });

    try {
      const templateParams = {
        from_name: formData.name,
        from_email: formData.email,
        message: formData.message,
      };

      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        templateParams,
        {
          publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
        }
      );

      setStatus({
        type: "success",
        message: "Your message has been sent successfully.",
      });

      setFormData({
        name: "",
        email: "",
        message: "",
      });
    } catch (error) {
      console.error("EmailJS Error:", error);

      setStatus({
        type: "error",
        message:
          "Something went wrong. Please try again in a moment.",
      });
    } finally {
      setIsSending(false);
    }
  };


  return (
    <section className="contact-page">

      {/* =====================================================
          HERO
      ===================================================== */}

      <div className="contact-hero">

        <div className="contact-hero-content">

          <div className="contact-eyebrow">
            CONTACT US
          </div>

          <h1>
            GET IN <span>TOUCH</span>
          </h1>

          <p>
            Have a question, suggestion, or simply want to connect
            with GEARS? Send us a message and our team will get back
            to you as soon as possible.
          </p>

        </div>

      </div>


      {/* =====================================================
          CONTACT CONTENT
      ===================================================== */}

      <div className="contact-container">

        {/* ===================================================
            CONTACT DETAILS
        =================================================== */}

        <div className="contact-info">

          <span className="contact-section-label">
            CONTACT DETAILS
          </span>

          <h2>
            LET'S <span>TALK.</span>
          </h2>

          <p className="contact-description">
            Whether you have a question about GEARS, want to learn
            more about our activities, or simply want to reach out,
            we would love to hear from you.
          </p>


          <div className="contact-details">

            {/* EMAIL */}

            <div className="contact-detail">

              <span className="detail-number">
                01
              </span>

              <div>

                <span className="detail-title">
                  EMAIL
                </span>

                <a href="mailto:info@gears.com">
                  gears@lgu.edu.pk
                </a>

              </div>

            </div>


            {/* PHONE */}

            <div className="contact-detail">

              <span className="detail-number">
                02
              </span>

              <div>

                <span className="detail-title">
                  PHONE
                </span>

                <a href="tel:+000000000000">
                  +00 000 0000000
                </a>

              </div>

            </div>


            {/* LOCATION */}

            <div className="contact-detail">

              <span className="detail-number">
                03
              </span>

              <div>

                <span className="detail-title">
                  LOCATION
                </span>

                <span className="detail-value">
                  Lahore Garrison University, DHA Phase 6, Lahore, Pakistan
                </span>

              </div>

            </div>

          </div>

        </div>


        {/* ===================================================
            SEND MESSAGE
        =================================================== */}

        <div className="contact-form-wrapper">

          <form
            className="contact-form"
            onSubmit={handleSubmit}
          >

            {/* NAME + EMAIL */}

            <div className="contact-form-row">

              <div className="contact-field">

                <label htmlFor="contact-name">
                  Name
                </label>

                <input
                  id="contact-name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  required
                />

              </div>


              <div className="contact-field">

                <label htmlFor="contact-email">
                  Email
                </label>

                <input
                  id="contact-email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Your email"
                  required
                />

              </div>

            </div>


            {/* MESSAGE */}

            <div className="contact-field">

              <label htmlFor="contact-message">
                Message
              </label>

              <textarea
                id="contact-message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Write your message..."
                rows="5"
                required
              />

            </div>


            {/* STATUS */}

            {status.message && (
              <div
                className={`contact-status ${status.type}`}
                role="alert"
              >
                {status.message}
              </div>
            )}


            {/* SUBMIT */}

            <button
              type="submit"
              className="contact-submit"
              disabled={isSending}
            >

              <span>
                {isSending
                  ? "SENDING..."
                  : "SEND MESSAGE"}
              </span>

              {!isSending && (
                <span className="contact-submit-arrow">
                  →
                </span>
              )}

            </button>

          </form>

        </div>

      </div>


      {/* =====================================================
          BOTTOM
      ===================================================== */}

      <div className="contact-bottom">

        <span>
          GEARS
        </span>

        <span>
          WE WOULD LOVE TO HEAR FROM YOU
        </span>

      </div>

    </section>
  );
};

export default Contact;
