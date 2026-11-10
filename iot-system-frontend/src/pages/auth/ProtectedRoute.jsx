import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { CheckAuth } from "../../api/common/authApi";

const homeByRole = {
  admin: "/admin-frame-layout/dashboard-admin",
  user: "/user-frame-layout/dashboard-user",
};

export function ProtectedRoute({ allowedRoles }) {
  const [status, setStatus] = useState("checking");
  const [role, setRole] = useState(null);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const response = await CheckAuth();
        setStatus("authenticated");
        setRole(response.data.role);
      } catch (error) {
        if (error.response?.status === 401) {
          setStatus("unauthenticated");
        } else {
          setStatus("error");
        }
      }
    };

    verifyAuth();
  }, []);

  if (status === "checking") {
    return <div>Loading...</div>;
  }

  // "un"
  if (status === "unauthenticated") {
    return <Navigate to="/login" replace />;
  }

  if (status === "error") {
    return <div>Cannot verify authentication status.</div>;
  }

  // Đã đăng nhập nhưng sai khu vực (vd: User gõ URL của Admin)
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={homeByRole[role] ?? "/login"} replace />;
  }

  return <Outlet />;
}
