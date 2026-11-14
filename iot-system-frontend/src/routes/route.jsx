import { Navigate, Route, Routes } from "react-router-dom";
import { LandingPage } from "../pages/public/LandingPage";
import { Login } from "../pages/auth/Login";
import { Register } from "../pages/auth/Register";
import { DashboardAdmin } from "../pages/admin/DashboardAdmin";
import { ManagerUser } from "../pages/admin/ManagerUser";
import { DashboardUser } from "../pages/user/DashboardUser";
import { LockAccount } from "../pages/admin/LockAccount";
import { FrameLayout } from "../components/admin/FrameLayout";
import { FrameLayoutUser } from "../components/user/FrameLayout";
import { DeviceNotificationHistory } from "../pages/user/DeviceNotificationHistory";
import { ProfileUser } from "../pages/user/ProfileUser";
import { ProfileAdmin } from "../pages/admin/ProfileAdmin";
import { WaitingConnection } from "../pages/user/WaitingConnection";
import { AdminGetHistory } from "../pages/admin/AdminGetHistory";
import { HistoryDetail } from "../pages/admin/HistoryDetail";
import { ProtectedRoute } from "../pages/auth/ProtectedRoute";
import { StatusDevice } from "../pages/admin/StatusDevice";

export function CreateRouter() {
  return (
    <>
      <Routes>
        {/* ===== Public: không bọc ===== */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ===== Admin ===== */}
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin-frame-layout" element={<FrameLayout />}>
            <Route path="dashboard-admin" element={<DashboardAdmin />} />
            <Route path="manager-user" element={<ManagerUser />} />
            <Route path="status-device" element={<StatusDevice />} />
            <Route path="lock-account/:id" element={<LockAccount />} />
            <Route path="profile" element={<ProfileAdmin />} />
            <Route path="admin-history" element={<AdminGetHistory />} />
            <Route path="history-detail/:id" element={<HistoryDetail />} />
          </Route>
        </Route>

        {/* ===== User ===== */}
        <Route element={<ProtectedRoute allowedRoles={["user"]} />}>
          <Route
            path="/dashboard-user"
            element={
              <Navigate to="/user-frame-layout/dashboard-user" replace />
            }
          />
          <Route path="/user-frame-layout" element={<FrameLayoutUser />}>
            <Route index element={<Navigate to="dashboard-user" replace />} />
            <Route path="dashboard-user" element={<DashboardUser />} />
            <Route
              path="device-notifications"
              element={<DeviceNotificationHistory />}
            />
            <Route
              path="help"
              element={
                <Navigate to="/user-frame-layout/dashboard-user" replace />
              }
            />
            <Route path="profile" element={<ProfileUser />} />
            <Route path="waiting-connection" element={<WaitingConnection />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}
