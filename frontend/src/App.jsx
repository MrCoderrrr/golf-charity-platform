import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Layout from "./components/Layout";
import Hero from "./components/Hero";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Scores from "./pages/Scores";
import Charities from "./pages/Charities";
import Draws from "./pages/Draws";
import Winnings from "./pages/Winnings";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import Pricing from "./pages/Pricing";

const App = () => {
  const location = useLocation();

  const pageVariants = {
    initial: { opacity: 0, y: 20, scale: 1.02 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, scale: 0.96 },
  };

  const pageTransition = { type: "spring", stiffness: 100, damping: 20 };

  const Page = ({ children }) => (
    <motion.div
      key={location.pathname}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
      onAnimationStart={() =>
        window.scrollTo({ top: 0, behavior: "smooth" })
      }
    >
      {children}
    </motion.div>
  );

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <Layout>
              <Page>
                <Hero />
                <Dashboard />
              </Page>
            </Layout>
          }
        />
        <Route
          path="/scores"
          element={
            <Layout>
              <Page>
                <Scores />
              </Page>
            </Layout>
          }
        />
        <Route
          path="/charities"
          element={
            <Layout>
              <Page>
                <Charities />
              </Page>
            </Layout>
          }
        />
        <Route
          path="/draws"
          element={
            <Layout>
              <Page>
                <Draws />
              </Page>
            </Layout>
          }
        />
        <Route
          path="/winnings"
          element={
            <Layout>
              <Page>
                <Winnings />
              </Page>
            </Layout>
          }
        />
        <Route
          path="/admin"
          element={
            <Layout>
              <Page>
                <Admin />
              </Page>
            </Layout>
          }
        />
        <Route
          path="/profile"
          element={
            <Layout>
              <Page>
                <Profile />
              </Page>
            </Layout>
          }
        />
        <Route
          path="/pricing"
          element={
            <Layout>
              <Page>
                <Pricing />
              </Page>
            </Layout>
          }
        />
        <Route path="/login" element={<Layout><Page><Login /></Page></Layout>} />
        <Route path="/signup" element={<Layout><Page><Signup /></Page></Layout>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

export default App;
