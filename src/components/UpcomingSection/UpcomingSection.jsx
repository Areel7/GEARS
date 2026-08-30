import "./UpcomingSection.css";
import upcomingData from "./UpcomingData";

const UpcomingSection = () => {
  return (
    <section className="upcoming">

      {/* ===========================
          SECTION HEADING
      =========================== */}

      <div className="upcoming-heading">

        <span>WHAT'S COMING NEXT</span>

        <h2>
          Future <span>Projects</span>
        </h2>

        <p>
          Explore the upcoming innovations, robotics projects and AI
          technologies that GEARS is preparing for the future.
        </p>

      </div>


      {/* ===========================
          PROJECT CARDS
      =========================== */}

      <div className="upcoming-grid">

        {upcomingData.map((item) => (

          <div
            className="future-card"
            key={item.id}
          >

            <img
              src={item.image}
              alt={item.title}
            />

            <div className="future-overlay">

              <h3>
                {item.title}
              </h3>

              <p>
                {item.subtitle}
              </p>

            </div>

          </div>

        ))}

      </div>

    </section>
  );
};

export default UpcomingSection;