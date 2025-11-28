import { Navigate } from "react-router-dom";

export default function InstructorRoute({ user, children }) {
  if (!user) return <Navigate to="/login" replace />;
  if (user?.role !== "instructor") {
    return <Navigate to="/courses" replace />;
  }

  return children;
}