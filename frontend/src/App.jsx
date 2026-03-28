import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Layout from "./components/Layout";
import AdminLayout from "./components/AdminLayout";
import AdminRoute from "./components/AdminRoute";
import Hero from "./components/Hero";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Scores from "./pages/Scores";
import Charities from "./pages/Charities";
import Draws from "./pages/Draws";
import Winnings from "./pages/Winnings";
import AdminPortal from "./pages/admin/AdminPortal";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminCharity from "./pages/admin/AdminCharity";
import AdminDraw from "./pages/admin/AdminDraw";
import AdminDocuments from "./pages/admin/AdminDocuments";
import AdminLogin from "./pages/AdminLogin";
import AdminCreate from "./pages/AdminCreate";
import Profile from "./pages/Profile";
import Pricing from "./pages/Pricing";
import { useAuth } from "./context/AuthContext";

const App = () => {
  const location = useLocation();
  const { user } = useAuth();

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
          path="/admin-login"
          element={
            <AdminLayout showNav={false}>
              <Page>
                {user?.role === "admin" ? (
                  <Navigate to="/admin/dashboard" replace />
                ) : (
                  <AdminLogin />
                )}
              </Page>
            </AdminLayout>
          }
        />
        <Route
          path="/admin-create"
          element={
            <AdminLayout showNav={false}>
              <Page>
                {user?.role === "admin" ? (
                  <Navigate to="/admin/dashboard" replace />
                ) : (
                  <AdminCreate />
                )}
              </Page>
            </AdminLayout>
          }
        />
        <Route
          path="/admin/*"
          element={
            <AdminRoute>
              <AdminLayout>
                <Page>
                  <AdminPortal />
                </Page>
              </AdminLayout>
            </AdminRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="charity" element={<AdminCharity />} />
          <Route path="draw" element={<AdminDraw />} />
          <Route path="documents" element={<AdminDocuments />} />
        </Route>
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
