import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { getValidAuthSession } from "../utils/authSession";

export default function ProtectedRouteEmployee({ children }) {
  const { user, role, loading } = useAuth();
  const session = getValidAuthSession();

  if (loading) return null;
  if (!session) return <Navigate to="/" replace />;

  const effectiveRole = role || session?.role;
  if (effectiveRole === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
}
