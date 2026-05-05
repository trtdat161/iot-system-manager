import { useNavigate } from "react-router-dom";

export function DashboardAdmin() {
  const navigate = useNavigate();
  alert("Chào mừng bạn đến với Dashboard Admin!");
  return (
    <>
      <h1>Dashboard Admin</h1>
      <button onClick={() => navigate("/manager-user")}>Manager User</button>
    </>
  );
}
