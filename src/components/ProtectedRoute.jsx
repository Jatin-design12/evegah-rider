import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export default function ProtectedRoute({ children }) {
  const { user } = useAuth();

  // If NOT logged in → redirect to login
  if (!user) return <Navigate to="/admin-login" replace />;

  return children;
}
