import "./AboutUs.css";

const AboutUs = () => {
  return (
    <main className="about-page">

      {/* ===========================
          DECORATIVE BACKGROUND
      =========================== */}

      <div
        className="about-bg-word about-bg-word-one"
        aria-hidden="true"
      >
        GEARS
      </div>

      <div
        className="about-bg-word about-bg-word-two"
        aria-hidden="true"
      >
        26
      </div>


      {/* ===========================
          ABOUT INTRO
      =========================== */}

      <section className="about-hero">

        <div className="about-container">

          <div className="about-intro">

            <span className="about-eyebrow">
              WHO WE ARE
            </span>

            <h1 className="about-title">
              ABOUT <span>US</span>
            </h1>

            <p className="about-description">
              GEARS is built around curiosity, teamwork, creativity, and the
              drive to turn ideas into meaningful achievements. We believe the
              best results come from people who are willing to learn, challenge
              themselves, and work together toward something bigger. Every
              project, competition, and milestone becomes part of our journey
              to grow stronger, think smarter, and create with purpose.
            </p>

          </div>


          {/* ===========================
              MISSION & VISION
          =========================== */}

          <div className="about-purpose-grid">

            {/* MISSION */}

            <article className="purpose-card mission-card">

              <div className="purpose-card-top">

                <span className="purpose-number">
                  01
                </span>

                <span className="purpose-label">
                  OUR MISSION
                </span>

              </div>

              <h2>
                Build. Learn.
                <br />
                <span>Achieve Together.</span>
              </h2>

              <p>
                Our mission is to create an environment where ideas become
                action. Through collaboration, continuous learning, and
                practical challenges, we aim to develop skills, confidence,
                discipline, and a strong team spirit that helps us perform at
                our best.
              </p>

              <div
                className="purpose-line"
                aria-hidden="true"
              />

            </article>


            {/* VISION */}

            <article className="purpose-card vision-card">

              <div className="purpose-card-top">

                <span className="purpose-number">
                  02
                </span>

                <span className="purpose-label">
                  OUR VISION
                </span>

              </div>

              <h2>
                Imagine More.
                <br />
                <span>Create the Future.</span>
              </h2>

              <p>
                Our vision is to become a team recognized for innovation,
                creativity, and meaningful achievement. We want to inspire
                people to think beyond limitations, explore new possibilities,
                and use knowledge and teamwork to create a positive impact.
              </p>

              <div
                className="purpose-line"
                aria-hidden="true"
              />

            </article>

          </div>

        </div>

      </section>

    </main>
  );
};

export default AboutUs;