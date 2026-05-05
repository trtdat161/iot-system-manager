import { useEffect, useState } from "react";
import { GetAccounts } from "../../api/accountApi";
import { FaTrash, FaLock, FaUnlock } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export function ManagerUser() {
  const [accounts, setAccounts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await GetAccounts();
        setAccounts(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.log("error:", err?.message || err);
        setAccounts([]);
      }
    };
    fetchAccounts();
  }, []);

  return (
    <div className="container-fluid py-3">
      <h5 className="mb-3 fw-semibold">Quản lý người dùng</h5>

      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th style={{ width: 50 }}>#</th>
              <th>Tên</th>
              <th>Email</th>
              <th>Trạng thái</th>
              <th colSpan={2}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account, index) => (
              <tr key={account.id}>
                <td className="text-muted">{index + 1}</td>
                <td className="fw-medium">{account.fullname}</td>
                <td className="text-muted">{account.email}</td>
                <td className="text-muted">
                  {account.status === true ? (
                    <span className="badge text-bg-success">Hoạt động</span>
                  ) : (
                    <span className="badge text-bg-danger">Đã khoá</span>
                  )}
                </td>

                {/* Cột hành động */}
                <td>
                  <div className="d-flex gap-2">
                    {/* Nút khoá / mở khoá — đổi icon + màu theo trạng thái */}
                    <button
                      onClick={() => navigate(`/lock-account/${account.id}`)}
                      className={`btn btn-sm d-inline-flex align-items-center gap-1 ${
                        account.isLocked
                          ? "btn-outline-success"
                          : "btn-outline-primary"
                      }`}
                      title={account.isLocked ? "Mở khoá" : "Khoá tài khoản"}
                    >
                      {account.isLocked ? (
                        <>
                          <FaUnlock size={12} />
                          <span>Mở khoá</span>
                        </>
                      ) : (
                        <>
                          <FaLock size={12} />
                          <span>Khoá</span>
                        </>
                      )}
                    </button>

                    {/* Nút xoá — luôn đỏ để cảnh báo người dùng */}
                    <button
                      className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1"
                      title="Xoá tài khoản"
                    >
                      <FaTrash size={12} />
                      <span>Xoá</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
