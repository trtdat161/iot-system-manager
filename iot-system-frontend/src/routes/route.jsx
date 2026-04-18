import { Route, Routes } from "react-router-dom";
import { LandingPage } from "../pages/public/Landingpage";
import { Login } from "../pages/auth/Login";
import { Register } from "../pages/auth/Register";

export function CreateRouter() {
  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />}></Route>
        <Route path="/login" element={<Login />}></Route>
        <Route path="/register" element={<Register />}></Route>
      </Routes>
    </>
  );
}
