import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import TimedRedirectNotice from "./TimedRedirectNotice";

const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user || user.role !== "admin") {
    const msg = !user
      ? "Admin access required. Please sign in. You will be redirected to admin login."
      : "This account isn't an admin. You will be redirected to admin login.";

    return (
      <TimedRedirectNotice
        message={msg}
        to="/admin-login"
        seconds={5}
      />
    );
  }

  return children;
};

export default AdminRoute;
