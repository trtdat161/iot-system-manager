import { useEffect, useState, useTransition } from "react";
import { GetAccounts } from "../../api/accountApi";
import { FaTrash, FaLock, FaUnlock } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { LanguageSwitcher } from "../../components/switchLanguage/LanguageSwitch";
import { useTranslation } from "react-i18next";

export function ManagerUser() {
  const [accounts, setAccounts] = useState([]);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("admin_manager_user");

  useEffect(() => {
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
    fetchAccounts();
  }, []);

  return (
    <div className="container-fluid py-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-3 fw-semibold">{t("manage_users")}</h5>
        <LanguageSwitcher />
      </div>

      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th style={{ width: 50 }}>#</th>
              <th>{t("name")}</th>
              <th>{t("email")}</th>
              <th>{t("created_at")}</th>
              <th>{t("status")}</th>
              <th colSpan={2}>{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account, index) => (
              <tr key={account.id}>
                <td className="text-muted">{index + 1}</td>
                <td className="fw-medium">{account.fullname}</td>
                <td className="text-muted">{account.email}</td>
                <td className="text-muted">{account.createdAt}</td>
                <td className="text-muted">
                  {account.status === true ? (
                    <span className="badge text-bg-success">{t("active")}</span>
                  ) : (
                    <span className="badge text-bg-danger">{t("locked")}</span>
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
                      title={account.isLocked ? t("unlock") : t("lock")}
                    >
                      {account.isLocked ? (
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

                    {/* Nút xoá — luôn đỏ để cảnh báo người dùng */}
                    <button
                      className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1"
                      title={t("delete_account")}
                    >
                      <FaTrash size={12} />
                      <span>{t("delete")}</span>
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
