import { Navigate, Route, Routes } from "react-router-dom";
import { LandingPage } from "../pages/public/Landingpage";
import { Login } from "../pages/auth/Login";
import { Register } from "../pages/auth/Register";
import { DashboardAdmin } from "../pages/admin/DashboardAdmin";
import { ManagerUser } from "../pages/admin/ManagerUser";
import { DashboardUser } from "../pages/user/DashboardUser";
import { LockAccount } from "../pages/admin/LockAccount";
import { FrameLayout } from "../components/admin/FrameLayout";
import { FrameLayoutUser } from "../components/user/FrameLayout";
import { DeviceNotificationHistory } from "../pages/user/DeviceNotificationHistory";
import { Help } from "../pages/user/Help";
import { Profile } from "../pages/user/Profile";

export function CreateRouter() {
  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />}></Route>
        <Route path="/login" element={<Login />}></Route>
        <Route path="/register" element={<Register />}></Route>

        {/* outlet sidebar admin */}
        {/* thằng outlet có / rồi nên mấy thằng con ko cần / nữa */}
        {/* admin */}
        <Route path="/frame-layout" element={<FrameLayout />}>
          <Route path="dashboard-admin" element={<DashboardAdmin />}></Route>
          <Route path="manager-user" element={<ManagerUser />}></Route>
          <Route path="lock-account/:id" element={<LockAccount />}></Route>
        </Route>

        {/* user */}
        <Route
          path="/dashboard-user"
          element={<Navigate to="/user-frame-layout/dashboard-user" replace />}
        ></Route>
        <Route path="/user-frame-layout" element={<FrameLayoutUser />}>
          <Route
            index
            element={<Navigate to="dashboard-user" replace />}
          ></Route>
          <Route path="dashboard-user" element={<DashboardUser />}></Route>
          <Route
            path="device-notifications"
            element={<DeviceNotificationHistory />}
          ></Route>
          <Route path="help" element={<Help />}></Route>
          <Route path="profile" element={<Profile />}></Route>
        </Route>

        {/*  */}
      </Routes>
    </>
  );
}
