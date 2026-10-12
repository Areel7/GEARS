import "./Team.css";
import teamImage1 from "../../assets/images/Sir-Hassan.png";
import teamImage2 from "../../assets/images/Sir-Umer.png";
import teamImage3 from "../../assets/images/Sir-Umair.png";
import teamImage4 from "../../assets/images/Sir-Suhaib.png";

import { publicApi } from "../../services/api";
import { useRemoteData } from "../../hooks/useRemoteData";

/* Shipped with the site; used until the backend responds, and kept
   as the fallback if it cannot be reached. */
const fallbackMembers = [
    {
        id: 1,
        name: "Hassan Sultan",
        designation: "Founder & Ex Supervisor",
        image: teamImage1,
    },
    {
        id: 2,
        name: "Umer Ahmad",
        designation: "Supervisor",
        image: teamImage2,
    },
    {
        id: 3,
        name: "Umair Bin Ahmad",
        designation: "Supervisor",
        image: teamImage3,
    },
    {
        id: 4,
        name: "Suhaib Ahmed",
        designation: "Co Supervisor",
        image: teamImage4,
    },
];

const Team = () => {
    const { data: members } = useRemoteData(
        publicApi.home,
        (response) => response?.supervisors,
        fallbackMembers
    );

    return (
        <section className="team" id="team">

            <div className="team-title">
                <h2>OUR TEAM</h2>

                <p>
                    Meet the visionary leaders driving innovation and shaping the future of GEARS.
                </p>
            </div>

            <div className="team-container">

                {members.map((member) => (
                    <div className="team-card" key={member.id}>

                        <img
                            src={member.image}
                            alt={member.name}
                        />

                        <div className="team-overlay">

                            <h3>{member.name}</h3>

                            <p>{member.designation}</p>

                            <div className="line"></div>

                        </div>

                    </div>
                ))}

            </div>

        </section>
    );
};

export default Team;