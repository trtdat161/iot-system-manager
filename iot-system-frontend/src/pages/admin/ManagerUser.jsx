import { useEffect, useState, useTransition } from "react";
import { DeleteAccount, GetAccounts } from "../../api/accountApi";
import {
  FaTrash,
  FaLock,
  FaUnlock,
  FaEdit,
  FaCrown,
  FaUser,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LogoutAccount } from "../../api/authApi";
import dayjs from "dayjs";
import "../../css/admin/ManagerUser.css";
import { Sidebar } from "../../components/admin/Sidebar";
import { MdManageAccounts } from "react-icons/md";

export function ManagerUser() {
  const [errorAccount, setErrorAccount] = useState("");
  const [deleteUser, setDeleteUser] = useState(null); // null nhận object
  const [accounts, setAccounts] = useState([]);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("admin_manager_user");

  const fetchAccounts = async () => {
    try {
      const response = await GetAccounts();
      // i18n.changeLanguage(localStorage.getItem("lang") || "vi-VN");
      setAccounts(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.log("error:", err?.message || err);
      setAccounts([]);
    }
  };

  const removeAccount = async (id) => {
    try {
      const response = await DeleteAccount(id);
      if (response.data) {
        setDeleteUser(null); //set lại là null tức ko có id nào đc chọn nữa => dialog ẩn
        fetchAccounts(); // cập nhật UI
      } else {
        setDeleteUser(null);
      }
    } catch (err) {
      console.log("error:", err?.message || err);
      setDeleteUser(null);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  return (
    <div>
      <h5 className="mb-3 fw-semibold parent">
        <span className="bg-white text-dark px-3 py-2 rounded d-inline-flex align-items-center shadow-sm border">
          {t("manage_users")}

          <span className="ms-2">
            <MdManageAccounts />
          </span>
        </span>
      </h5>
      {/* demo in tạm */}
      {errorAccount && <span className="text-danger">{errorAccount}</span>}
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th style={{ width: 50 }}>#</th>
              <th>{t("name")}</th>
              <th>{t("email")}</th>
              <th>{t("role")}</th>
              <th>{t("created_at")}</th>
              <th>{t("status")}</th>
              <th colSpan={2}>{t("actions")}</th>
            </tr>
          </thead>

          <tbody>
            {accounts.map((account, index) => (
              <tr key={account.id}>
                <td className="text-muted">{index + 1}</td>

                {/* fullname */}
                <td>
                  {account.role === "admin" ? (
                    <span
                      className="d-inline-flex align-items-center gap-1 px-2 py-1 rounded-2 fw-semibold"
                      style={{
                        background: "linear-gradient(135deg, #f59e0b, #d97706)",
                        color: "#fff",
                        fontSize: "0.78rem",
                      }}
                    >
                      <FaCrown size={13} />
                      {account.fullname}
                    </span>
                  ) : (
                    <span className="d-inline-flex align-items-center gap-1 text-muted">
                      <FaUser size={12} />
                      <span>{account.fullname}</span>
                    </span>
                  )}
                </td>

                {/* email */}
                <td className="text-muted">{account.email}</td>

                {/* role */}
                <td className="text-muted">
                  {account.role === "admin" ? (
                    <span
                      style={{
                        fontWeight: "bold",
                        color: "#e9a112",
                      }}
                    >
                      {t("admin")}
                    </span>
                  ) : (
                    t("user")
                  )}
                </td>

                {/* created at */}
                <td className="text-muted">
                  {dayjs(account.createdAt).format("DD/MM/YYYY HH:mm")}
                </td>

                {/* status */}
                <td className="text-muted">
                  {account.status === true ? (
                    <span className="badge text-bg-success">{t("active")}</span>
                  ) : (
                    <span className="badge text-bg-danger">{t("locked")}</span>
                  )}
                </td>

                {/* actions */}
                <td>
                  {/* nếu role là admin thì xử lý sẽ có nút edit thay vì khoá và xoá */}
                  {account.role === "admin" ? (
                    <button className="btn btn-sm btn-outline-warning admin-edit d-inline-flex align-items-center gap-1">
                      <FaEdit size={12} />
                      <span>{t("edit_account_admin")}</span>
                    </button>
                  ) : (
                    <div className="d-flex gap-2">
                      {/* lock / unlock */}
                      <button
                        onClick={() =>
                          navigate(`/frame-layout/lock-account/${account.id}`)
                        }
                        className={`btn btn-sm d-inline-flex align-items-center gap-1 ${
                          account.status === true
                            ? "btn-outline-primary"
                            : "btn-outline-warning"
                        }`}
                        title={
                          account.status === false ? t("unlock") : t("lock")
                        }
                      >
                        {account.status === false ? (
                          <>
                            <FaUnlock size={12} />
                            <span>{t("unlock")}</span>
                          </>
                        ) : (
                          <>
                            <FaLock size={12} />
                            <span>{t("lock")}</span>
                          </>
                        )}
                      </button>

                      {/* delete */}
                      <button
                        onClick={() => setDeleteUser(account.id)} // lưu id để dialog hiện đúng row
                        className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1"
                        title={t("delete_account")}
                      >
                        <FaTrash size={12} />
                        <span>{t("delete")}</span>
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Dialog xác nhận xoá — đặt ngoài table */}
        {deleteUser && (
          <div
            className="sure-delete-overlay"
            onClick={() => setDeleteUser(null)}
          >
            <div className="sure-delete" onClick={(e) => e.stopPropagation()}>
              <span>Xác nhận xoá tài khoản này?</span>
              <div className="sure-delete-actions">
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => removeAccount(deleteUser)}
                >
                  Xoá
                </button>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => setDeleteUser(null)}
                >
                  Huỷ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
