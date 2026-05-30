import { Route, Routes } from "react-router-dom";
import { LandingPage } from "../pages/public/Landingpage";
import { Login } from "../pages/auth/Login";
import { Register } from "../pages/auth/Register";
import { DashboardAdmin } from "../pages/admin/DashboardAdmin";
import { ManagerUser } from "../pages/admin/ManagerUser";
import { DashboardUser } from "../pages/user/DashboardUser";
import { LockAccount } from "../pages/admin/LockAccount";
import { FrameLayout } from "../components/admin/FrameLayout";

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
        <Route path="/dashboard-user" element={<DashboardUser />}></Route>
      </Routes>
    </>
  );
}
