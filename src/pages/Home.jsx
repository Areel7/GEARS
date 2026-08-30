import Hero from "../components/Hero/Hero";
import AboutContent from "../components/AboutContent/AboutContent";
import Team from "../components/Team/Team";
import MemberTeam from "../components/MemberTeam/MemberTeam";
import UpcomingSection from "../components/UpcomingSection/UpcomingSection";
import Gallery from "../components/Gallery/Gallery";
import TopCta from "../components/TopCta/TopCta";
import Popup from "../components/RegistrationPopup/RegistrationPopup";

const Home = () => {
  return (
    <>
      <Popup />

      <Hero />

      <AboutContent />

      <Team />

      <MemberTeam />

      <UpcomingSection />

      <Gallery />

      <TopCta />
    </>
  );
};

export default Home;