import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { getValidAuthSession } from "../utils/authSession";

export default function ProtectedRouteAdmin({ children }) {
  const { user, role, loading } = useAuth();
  const session = getValidAuthSession();

  if (loading) return null;
  if (!session) return <Navigate to="/" replace />;

  const effectiveRole = role || session?.role;
  if (effectiveRole !== "admin") {
    return <Navigate to="/employee/dashboard" replace />;
  }

  return children;
}
