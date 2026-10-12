import { Routes, Route, Navigate, useLocation } from "react-router-dom";
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

import { SiteSettingsProvider } from "./context/SiteSettingsContext";
import AdminApp from "./admin/AdminApp";
import { isAdminPath } from "./admin/routes";


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
  const location = useLocation();

  /*
    The old public sign-in address no longer exists. Catch it before
    the admin shell loads so nothing of the dashboard is rendered.
  */
  if (location.pathname === "/admin/login") {
    return <Navigate to="/" replace />;
  }

  /*
    The admin dashboard is a separate application with its own shell
    and theme. It deliberately renders outside the public header and
    footer, and is not linked from the public navigation. Its sign-in
    page sits on its own unguessable path - see admin/routes.js.
  */
  if (isAdminPath(location.pathname)) {
    return <AdminApp />;
  }

  return (
    <SiteSettingsProvider>
      <ScrollToTop />

      <Header />

      <main>
        <AnimatedRoutes />
      </main>

      <Footer />
    </SiteSettingsProvider>
  );
}


export default App;