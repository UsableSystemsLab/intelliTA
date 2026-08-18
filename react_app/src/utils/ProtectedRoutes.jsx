import { Outlet, Navigate } from "react-router-dom";

const ProtectedRoutes = ({ user }) => {
  if (!user) return <Navigate to="/login" replace />;
  if (!user.emailVerified) return <Navigate to="/verify-email" replace />;
  return <Outlet />;
};

export default ProtectedRoutes;
