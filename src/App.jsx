import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import ScrollToTop from "./components/ScrollToTop";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";

import Home from "./pages/Home";
import AboutUs from "./pages/About";
import OurGalleryPage from "./pages/OurGallery";
import AllTeam from "./pages/AllTeam";
import Contact from "./pages/Contact";
import Registration from "./pages/Registration";


function PageWrapper({ children }) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 30,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      exit={{
        opacity: 0,
        y: -30,
      }}
      transition={{
        duration: 0.55,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}


function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">

      <Routes
        location={location}
        key={location.pathname}
      >

        {/* HOME */}
        <Route
          path="/"
          element={
            <PageWrapper>
              <Home />
            </PageWrapper>
          }
        />


        {/* ABOUT */}
        <Route
          path="/about"
          element={
            <PageWrapper>
              <AboutUs />
            </PageWrapper>
          }
        />


        {/* GALLERY */}
        <Route
          path="/gallery"
          element={
            <PageWrapper>
              <OurGalleryPage />
            </PageWrapper>
          }
        />


        {/* TEAM */}
        <Route
          path="/team"
          element={
            <PageWrapper>
              <AllTeam />
            </PageWrapper>
          }
        />


        {/* CONTACT */}
        <Route
          path="/contact"
          element={
            <PageWrapper>
              <Contact />
            </PageWrapper>
          }
        />


        {/* REGISTRATION */}
        <Route
          path="/registration"
          element={
            <PageWrapper>
              <Registration />
            </PageWrapper>
          }
        />

      </Routes>

    </AnimatePresence>
  );
}


function App() {
  return (
    <>
      <ScrollToTop />

      <Header />

      <main>
        <AnimatedRoutes />
      </main>

      <Footer />
    </>
  );
}


export default App;