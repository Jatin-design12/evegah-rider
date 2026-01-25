import { useEffect, useState } from "react";
import { auth } from "../config/firebase";
import { onAuthStateChanged, getIdTokenResult, signOut } from "firebase/auth";
import {
  clearAuthSession,
  getAuthSession,
  getValidAuthSession,
  setAuthSession,
  SESSION_DURATION_MS,
} from "../utils/authSession";

export default function useAuth() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const adminEmail = "adminev@gmail.com";

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        const validSession = getValidAuthSession();
        setUser(null);
        setRole(validSession?.role || null);
        setLoading(false);
        return;
      }

      const session = getAuthSession();
      if (session && typeof session.expiresAt === "number" && session.expiresAt <= Date.now()) {
        clearAuthSession();
        try {
          await signOut(auth);
        } catch {
          // ignore
        }
        setUser(null);
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        const token = await getIdTokenResult(firebaseUser);
        const email = String(firebaseUser.email || "").toLowerCase();
        const derivedRole = email === adminEmail ? "admin" : (token.claims.role || "employee");

        const validSession = getValidAuthSession();
        setAuthSession({
          token: token.token,
          role: derivedRole,
          expiresAt: validSession?.expiresAt || Date.now() + SESSION_DURATION_MS,
        });

        setUser(firebaseUser);
        setRole(derivedRole);
      } catch {
        const email = String(firebaseUser.email || "").toLowerCase();
        setUser(firebaseUser);
        setRole(email === adminEmail ? "admin" : "employee");
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  return { user, role, loading };
}
