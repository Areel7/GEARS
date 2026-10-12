import "./AllTeam.css";

import {
  leadershipTeam,
  coreTeam,
  alumniOfYear,
  allPresidents,
} from "./AllTeamData";

import { publicApi } from "../../services/api";
import { useRemoteData } from "../../hooks/useRemoteData";


/* =========================================================
   IMAGE FALLBACK
========================================================= */

const ImageBox = ({
  image,
  name,
  className,
}) => {
  return (
    <div className={className}>
      {image ? (
        <img
          src={image}
          alt={name}
          loading="lazy"
        />
      ) : (
        <div className="all-team-image-placeholder">
          <span>
            {name
              ?.split(" ")
              .map((word) => word[0])
              .slice(0, 2)
              .join("")}
          </span>
        </div>
      )}
    </div>
  );
};


/* =========================================================
   SECTION HEADING
========================================================= */

const SectionHeading = ({
  eyebrow,
  title,
  highlight,
  description,
}) => {
  return (
    <div className="all-team-section-heading">

      <span className="all-team-section-label">
        {eyebrow}
      </span>

      <h2>
        {title}{" "}
        <span>
          {highlight}
        </span>
      </h2>

      {description && (
        <p>
          {description}
        </p>
      )}

    </div>
  );
};


/* =========================================================
   MAIN COMPONENT
========================================================= */

const AllTeam = () => {
  /*
    One request feeds all four sections. Each falls back to the
    content that shipped with the site, so the page is never blank
    and looks identical if the backend is unavailable.
  */
  const { data: team } = useRemoteData(
    publicApi.team,
    (response) =>
      response?.leadership
        ? {
            leadership: response.leadership,
            coreTeam: response.coreTeam,
            alumni: response.alumni,
            presidents: response.presidents,
          }
        : null,
    {
      leadership: leadershipTeam,
      coreTeam,
      alumni: alumniOfYear,
      presidents: allPresidents,
    }
  );

  const leadershipList = team.leadership?.length
    ? team.leadership
    : leadershipTeam;

  const coreTeamList = team.coreTeam?.length ? team.coreTeam : coreTeam;

  const alumniList = team.alumni?.length ? team.alumni : alumniOfYear;

  const presidentList = team.presidents?.length
    ? team.presidents
    : allPresidents;

  return (
    <main className="all-team">


      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="all-team-hero">

        <div className="all-team-container">

          <div className="all-team-hero-content">

            <span className="all-team-eyebrow">
              THE PEOPLE BEHIND GEARS
            </span>

            <h1>
              OUR{" "}
              <span>
                TEAM
              </span>
            </h1>

            <p>
              Meet the people who lead, build, organize,
              and carry the vision of Garrison Engineering
              &amp; Robotic Society forward.
            </p>

          </div>

        </div>

      </section>


      {/* =====================================================
          LEADERSHIP
      ===================================================== */}

      <section className="all-team-section leadership-section">

        <div className="all-team-container">

          <SectionHeading
            eyebrow="LEADERSHIP"
            title="LEADING WITH"
            highlight="PURPOSE"
            description="Meet the leaders responsible for guiding the society, building its culture, and creating opportunities for every member."
          />


          <div className="leadership-list">

            {leadershipList.map(
              (member, index) => (

                <article
                  className={`leadership-member ${
                    index % 2 === 1
                      ? "leadership-member-reverse"
                      : ""
                  }`}
                  key={member.id}
                >

                  {/* IMAGE */}

                  <ImageBox
                    image={member.image}
                    name={member.name}
                    className="leadership-member-image"
                  />


                  {/* CONTENT */}

                  <div className="leadership-member-content">

                    <span className="team-designation">
                      {member.designation}
                    </span>

                    <h3>
                      {member.name}
                    </h3>

                    <div className="team-red-line" />

                    <p className="leadership-member-message">
                      “{member.message}”
                    </p>

                    {member.session && (
                      <span className="team-session">
                        {member.session}
                      </span>
                    )}

                  </div>

                </article>

              )
            )}

          </div>

        </div>

      </section>


      {/* =====================================================
          CORE TEAM
      ===================================================== */}

      <section className="all-team-section core-team-section">

        <div className="all-team-container">

          <SectionHeading
            eyebrow="CORE TEAM"
            title="THE PEOPLE WHO"
            highlight="MAKE IT HAPPEN"
            description="The team working behind our projects, competitions, events, media, research, and day-to-day operations."
          />


          <div className="core-team-grid">

            {coreTeamList.map(
              (member, index) => (

                <article
                  className="core-team-card"
                  key={member.id}
                >

                  {/* IMAGE */}

                  <div className="core-team-image-wrapper">

                    <ImageBox
                      image={member.image}
                      name={member.name}
                      className="core-team-image"
                    />

                    <span className="core-team-number">
                      {String(index + 1).padStart(
                        2,
                        "0"
                      )}
                    </span>

                  </div>


                  {/* CONTENT */}

                  <div className="core-team-content">

                    <span className="team-designation">
                      {member.designation}
                    </span>

                    <h3>
                      {member.name}
                    </h3>

                    <p>
                      {member.text}
                    </p>

                  </div>

                </article>

              )
            )}

          </div>

        </div>

      </section>


      {/* =====================================================
          ALUMNI OF THE YEAR
      ===================================================== */}

      <section className="alumni-section">

        <div className="all-team-container">

          <div className="alumni-heading">

            <span>
              OUR ACHIEVERS
            </span>

            <h2>
              ALUMNI OF THE{" "}
              <strong>
                YEAR
              </strong>
            </h2>

            <p>
              Celebrating the outstanding alumni whose dedication,
              achievements, and contribution continue to represent
              the spirit and legacy of GEARS.
            </p>

          </div>


          <div className="alumni-grid">

            {alumniList.map(
              (alumni, index) => (

                <article
                  className="alumni-card"
                  key={alumni.id}
                >

                  {/* IMAGE */}

                  <div className="alumni-image-wrapper">

                    <img
                      src={alumni.image}
                      alt={alumni.name}
                      loading="lazy"
                    />

                    <span className="alumni-index">
                      {String(index + 1).padStart(
                        2,
                        "0"
                      )}
                    </span>

                  </div>


                  {/* CONTENT */}

                  <div className="alumni-content">

                    <span className="alumni-year">
                      {alumni.year}
                    </span>

                    <h3>
                      {alumni.name}
                    </h3>

                    {alumni.designation && (
                      <p>
                        {alumni.designation}
                      </p>
                    )}

                  </div>

                </article>

              )
            )}

          </div>

        </div>

      </section>


      {/* =====================================================
          PAST PRESIDENTS
      ===================================================== */}

      <section className="all-team-section presidents-section">

        <div className="all-team-container">

          <SectionHeading
            eyebrow="OUR LEGACY"
            title="PAST"
            highlight="PRESIDENTS"
            description="Honoring the leaders who helped shape the identity, progress, and legacy of GEARS."
          />


          <div className="presidents-grid">

            {presidentList.map(
              (president) => (

                <article
                  className="president-card"
                  key={president.id}
                >

                  <ImageBox
                    image={president.image}
                    name={president.name}
                    className="president-image"
                  />

                  <div className="president-content">

                    <h3>
                      {president.name}
                    </h3>

                    {president.session && (
                      <span>
                        {president.session}
                      </span>
                    )}

                  </div>

                </article>

              )
            )}

          </div>

        </div>

      </section>

    </main>
  );
};


export default AllTeam;