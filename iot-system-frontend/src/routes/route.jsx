import { Route, Routes } from "react-router-dom";
import { LandingPage } from "../pages/public/Landingpage";
import { Login } from "../pages/auth/Login";
import { Register } from "../pages/auth/Register";
import { DashboardAdmin } from "../pages/admin/DashboardAdmin";
import { ManagerUser } from "../pages/admin/ManagerUser";
import { DashboardUser } from "../pages/user/DashboardUser";
import { LockAccount } from "../pages/admin/LockAccount";

export function CreateRouter() {
  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />}></Route>
        <Route path="/login" element={<Login />}></Route>
        <Route path="/register" element={<Register />}></Route>

        {/* admin */}
        <Route path="/dashboard-admin" element={<DashboardAdmin />}></Route>
        <Route path="/manager-user" element={<ManagerUser />}></Route>
        <Route path="/lock-account/:id" element={<LockAccount />}></Route>

        {/* user */}
        <Route path="/dashboard-user" element={<DashboardUser />}></Route>
      </Routes>
    </>
  );
}
